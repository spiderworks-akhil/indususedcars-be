"use strict";
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const { generateTopContent, generateMetaDetails } = require("../../../utils/car-content-generator");
/**
 * A set of functions called "actions" for `cars`
 */

// Add this helper function at the top level
async function downloadImage(url, fileName) {
  if (!url) return null;

  try {
    const response = await axios({
      url,
      responseType: "arraybuffer",
    });

    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, response.data);

    return `/uploads/${fileName}`;
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error.message);
    return null;
  }
}

module.exports = {
getCars: async (ctx, next) => {
  try {
    console.time("importCars");

    const fetchCars = await axios.post(
      "http://tvapp.indusmis.in/ServiceTV.svc/getUsedCarDetails",
      {
        outlet: "",
        pageNumber: "1",
        pageSize: "2000",
      },
      {
        auth: {
          username: process.env.API_USERNAME,
          password: process.env.API_PASSWORD,
        },
      }
    );

    const externalCars = fetchCars?.data?.getUsedCarDetailsResult;

    if (!Array.isArray(externalCars)) {
      throw new Error("Invalid response from external cars API");
    }

    // =====================================================
    // 🛑 CHECK: API RETURNED EMPTY → NO UPDATES AT ALL
    // =====================================================
    if (externalCars.length === 0) {
      console.warn(
        "API returned 0 cars → skipping all updates (no SOLD / featured / recently-added changes)"
      );
      console.timeEnd("importCars");

      ctx.body = {
        success: true,
        message: "API returned 0 cars. No updates performed.",
      };
      return;
    }

    // =====================================================
    // CASE 2: NORMAL SYNC FLOW
    // =====================================================
    console.log(`Fetched ${externalCars.length} cars from external API.`);

    const fetchAll = (uid, populate = []) =>
      strapi.documents(uid).findMany({ limit: -1, populate });

    const [brands, models, fuels, outlets, categories, existingCars] =
      await Promise.all([
        fetchAll("api::brand.brand"),
        fetchAll("api::model.model"),
        fetchAll("api::fuel-type.fuel-type"),
        fetchAll("api::outlet.outlet", ["Location"]),
        fetchAll("api::vehicle-category.vehicle-category"),
        strapi.documents("api::car.car").findMany({
          fields: ["Vehicle_Reg_No", "Slug", "documentId"],
          limit: -1,
        }),
      ]);

    const brandMap = new Map(brands.map(b => [b.Name?.toLowerCase()?.trim(), b]));
    const modelMap = new Map(models.map(m => [m.Name?.toLowerCase()?.trim(), m]));
    const fuelMap = new Map(fuels.map(f => [f.Name?.toLowerCase()?.trim(), f]));
    const outletMap = new Map(outlets.map(o => [o.Name?.toLowerCase()?.trim(), o]));
    const catMap = new Map(categories.map(c => [c.Name?.toLowerCase()?.trim(), c]));
    const carMap = new Map(existingCars.map(c => [c.Vehicle_Reg_No, c]));

    // =====================================================
    // STEP 1: SET ALL CURRENT STOCK CARS TO SOLD (BULK UPDATE)
    // (API list is the source of truth — cars not in it must be SOLD)
    // =====================================================
    const soldResult = await strapi.db.query("api::car.car").updateMany({
      where: { Vehicle_Status: "STOCK" },
      data: {
        Vehicle_Status: "SOLD",
        Featured: false,
        Recommended: false,
        Choose_Next: false,
        updatedAt: new Date(),
      },
    });
    console.log(
      `Bulk SOLD update done → ${soldResult.count} rows updated (STOCK → SOLD, includes draft copies)`
    );

    // =====================================================
    // STEP 2: LOOP API CARS → STOCK (update existing / create new)
    // =====================================================
    let processed = 0;
    for (const carData of externalCars) {
      const regNo = carData?.veh_Reg_no;
      if (!regNo) continue;

      processed++;
      const existingCar = carMap.get(regNo);

      const isMaruti =
        carData?.Make?.toLowerCase()?.trim() === "maruti";

      const brand = isMaruti
        ? brandMap.get("maruti suzuki")
        : brandMap.get(carData?.Make?.toLowerCase()?.trim());

      const model = modelMap.get(carData?.Model?.toLowerCase()?.trim());
      const fuel = fuelMap.get(carData?.Fuel_Type?.toLowerCase()?.trim());
      const outlet = outletMap.get(carData?.Outlet?.toLowerCase()?.trim());
      const category = catMap.get(carData?.Vehicle_Category?.toLowerCase()?.trim());

      const carName = `${brand?.Name || ""} ${model?.Name || ""} ${carData?.YOM || ""}`.trim();

      const payload = {
        Brand: brand,
        Model: model,
        Outlet: outlet,
        Fuel_Type: fuel,
        Color: carData?.Colour,
        Kilometers: carData?.Kilometers,
        PSP: carData?.PSP,
        Year_Of_Month: carData?.YOM,
        Vehicle_Reg_No: regNo,
        Vehicle_Status: "STOCK",
        Variant: carData?.variant,
        Vehicle_Category: category,
        Name: carName,
        Newly_Added: true,
      };

      if (!existingCar) {
        await strapi.documents("api::car.car").create({
          data: payload,
          status: "published",
        });
        console.log(`[${processed}/${externalCars.length}] ${carName || regNo} (${regNo}) -> New`);
      } else {
        await strapi.documents("api::car.car").update({
          documentId: existingCar.documentId,
          data: payload,
          status: "published",
        });
        console.log(`[${processed}/${externalCars.length}] ${carName || regNo} (${regNo}) -> Old (SOLD → STOCK)`);
      }
    }

    // =====================================================
    // STEP 3: HOME PAGE ASSIGNMENT (top 30 of current stock)
    // =====================================================
    const stockCars = await strapi.documents("api::car.car").findMany({
      filters: { Vehicle_Status: "STOCK" },
      sort: { updatedAt: "desc" },
      limit: 5000,
    });

    const topCars = stockCars.slice(0, 30);

    for (const c of topCars.slice(0, 10)) {
      await strapi.documents("api::car.car").update({
        documentId: c.documentId,
        data: { Featured: true },
        status: "published",
      });
    }

    for (const c of topCars.slice(10, 20)) {
      await strapi.documents("api::car.car").update({
        documentId: c.documentId,
        data: { Recommended: true },
        status: "published",
      });
    }

    for (const c of topCars.slice(20, 30)) {
      await strapi.documents("api::car.car").update({
        documentId: c.documentId,
        data: { Choose_Next: true },
        status: "published",
      });
    }

    console.timeEnd("importCars");

    ctx.body = {
      success: true,
      message: "Cars synced successfully",
    };
  } catch (err) {
    console.error(
      "Sync failed. NOTE: if this happened after the SOLD pass, some cars may have been marked SOLD already:",
      err.message
    );
    ctx.body = {
      success: false,
      message: "Sync failed. If the SOLD pass already ran, stock status may be partially updated.",
      error: err.message,
    };
  }
},
  updateSlug: async (ctx, next) => {
    try {
      console.log("running");

      const cars = await strapi.documents("api::car.car").findMany({});
      for (let car of cars) {
        console.log(car);

        const slug = `${car?.Name}-${car.documentId}`
          .toLowerCase()
          .replace(/\s+/g, '-')       // Replace spaces with -
          .replace(/[^\w\-~._]+/g, '') // Remove all non-word chars except -~._
          .replace(/\-\-+/g, '-')      // Replace multiple - with single -
          .replace(/^-+/, '')          // Trim - from start of text
          .replace(/-+$/, '');         // Trim - from end of text

        if (slug == car.Slug) {
          continue;
        }
        console.log(slug);

        await strapi.documents("api::car.car").update({
          documentId: car.documentId,
          data: {
            Slug: slug, // Use the generated slug here
          },
          status: "published",
        });
        console.log("updated");
      }
      ctx.body = {
        data: {
          msg: "updated",
        },
      };
    } catch (err) {
      ctx.body = {
        success: false,
        message: "Failed to update slug",
        error: err.stack,
      };
    }
  },
  updateStucture: async (ctx, next) => {
    try {
      const cars = await strapi.documents("api::car.car").findMany({
        populate: {
          Outlet: { populate: "*" },
          Brand: { populate: "*" },
          Model: { populate: "*" },
          Fuel_Type: { populate: "*" },
          Location: { populate: "*" },
          Inspection_Report: { populate: "*" },
          Image: { populate: "*" },
          Find_More: { populate: "*" },
          Vehicle_Category: { populate: "*" },
          Basic_Information: { populate: "*" }
        },
      });

      const count = await strapi.documents("api::car.car").count();
      let i = 1;

      for (let car of cars) {
        console.log(`Processing Cars: ${count - i++} left`);
        if (!car?.Basic_Information) {


          // Generate clean slug
          const slug = slugify(`${car.Name}-${car.Vehicle_Reg_No}`, {
            replacement: "-",
            remove: /[*+~.()'"!:@]/g,
            lower: true,
            strict: true,
            locale: "en",
            trim: true,
          });

          const updateData = {
            Slug: slug,
            ...(!car?.Basic_Information && {
              Basic_Information: {
                Brand: car?.Brand,
                Model: car?.Model,
                Variant: car?.Variant,
                Color: car?.Color,
                Vehicle_Category: car?.Vehicle_Category,
              },
              Registration_Status: {
                Vehicle_Reg_No: car?.Vehicle_Reg_No,
                Registration_Year: car?.Registration_Year,
                Year_Of_Month: car?.Year_Of_Month,
                Owner_Type: car?.Owner_Type,
                Kilometers: car?.Kilometers,
                Vehicle_Status: car?.Vehicle_Status,
              },
              Technical_Performance: {
                Fuel_Type: car?.Fuel_Type,
                PSP: car?.PSP,
                Transmission_Type: car?.Transmission_Type,
              },
              Insurance_Inspection: {
                Insurance_Type: car?.Insurance_Type,
                Insurance_Validity: car?.Insurance_Validity,
                Inspection_Report: car?.Inspection_Report ?
                  (Array.isArray(car?.Inspection_Report) ? car?.Inspection_Report : [car?.Inspection_Report]) : [],
              },
              Availability_Features: {
                Outlet: car?.Outlet,
                Location: car?.Location,
                Home_Test_Drive: car?.Home_Test_Drive,
              },
              Media: {
                Image_URL: car?.Image_URL,
                Image: car?.Image,
              },
              Highlight_Recommendation: {
                Recommended: car?.Recommended,
                Featured: car?.Featured,
                Choose_Next: car?.Choose_Next,
              },
              Additional_Sections: {
                Find_More: car?.Find_More ?
                  (Array.isArray(car?.Find_More) ? car?.Find_More : [car?.Find_More]) : [],
              },
            })
          };

          await strapi.documents("api::car.car").update({
            documentId: car?.documentId,
            data: updateData,
            status: "published",
            populate: {
              Basic_Information: { populate: "*" },
              Registration_Status: { populate: "*" },
              Technical_Performance: { populate: "*" },
              Insurance_Inspection: { populate: "*" },
              Availability_Features: {
                populate: {
                  Outlet: { populate: "*" },
                  Location: { populate: "*" },
                },
              },
              Media: {
                populate: {
                  Image: { populate: "*" },
                },
              },
              Highlight_Recommendation: { populate: "*" },
              Additional_Sections: {
                populate: {
                  Find_More: { populate: "*" },
                },
              },
            },
          });
        }
      }
      ctx.status = 200;
      ctx.body = { data: { msg: "updated" } };

    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Failed to update structure",
        error: err.stack,
      };
    }
  },


  // update brand id from maruti to maruti suzuki

  updateBrand: async (ctx, next) => {
    console.log('yes inside');

    try {
      // Use document service to find all cars where Brand is 1
      const carsToUpdate = await strapi.documents('api::car.car').findMany({
        filters: {
          Brand: {
            id: 3
          },
        },
        populate: {
          Brand: {
            populate: '*'
          }
        }
      });
      const cars= await strapi.documents('api::car.car').count()
      console.log({maruti:carsToUpdate?.length,cars});
      
      let i=1;
      for (const car of carsToUpdate) {
        try {
          
          console.log(i);
          
          await strapi.documents('api::car.car').update({
            documentId: car?.documentId,
            data: { Brand: 'r3jxevnjbfkytcxwe20pewax' }, 
            status: "published",
            populate:'*'
          });
          i++
        } catch (error) {
          throw new Error(error)
        }
        
      }

      ctx.status = 200;
      ctx.body = {
        success: true,
        updated: carsToUpdate.length,
        message: `Updated Brand from Maruti to Maruti Suzuki for ${carsToUpdate.length} cars`,
      };

      ctx.status = 200;
      ctx.body = {
        data: carsToUpdate
      }
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Error updating brand ids",
        error: err.stack,
      };
    }
  }
};
