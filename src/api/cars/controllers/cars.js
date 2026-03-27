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
      if (!externalCars || !Array.isArray(externalCars)) {
        throw new Error("Invalid response from external cars API");
      }

      console.log(`Fetched ${externalCars.length} cars from external API.`);

      // 1. PRE-CACHE EVERYTHING (To avoid N+1 queries)
      const fetchAll = async (uid, populate = []) => {
        return strapi.documents(uid).findMany({ limit: -1, populate });
      };

      const [
        brands,
        models,
        fuels,
        outlets,
        categories,
        existingCars
      ] = await Promise.all([
        fetchAll("api::brand.brand"),
        fetchAll("api::model.model"),
        fetchAll("api::fuel-type.fuel-type"),
        fetchAll("api::outlet.outlet", ["Location"]),
        fetchAll("api::vehicle-category.vehicle-category"),
        strapi.documents("api::car.car").findMany({ fields: ["Vehicle_Reg_No", "Slug", "documentId"], limit: -1 })
      ]);

      const brandMap = new Map(brands.map(b => [b.Name.toLowerCase().trim(), b]));
      const modelMap = new Map(models.map(m => [m.Name.toLowerCase().trim(), m]));
      const fuelMap = new Map(fuels.map(f => [f.Name.toLowerCase().trim(), f]));
      const outletMap = new Map(outlets.map(o => [o.Name.toLowerCase().trim(), o]));
      const catMap = new Map(categories.map(c => [c.Name.toLowerCase().trim(), c]));
      const carMap = new Map(existingCars.map(c => [c.Vehicle_Reg_No, c]));

      // Special case: Ensure Maruti Suzuki exists
      let marutiSuzuki = brands.find(b => b.Slug === "maruti-suzuki");
      if (!marutiSuzuki) {
        marutiSuzuki = await strapi.documents("api::brand.brand").create({
          data: { Name: "Maruti Suzuki", Slug: "maruti-suzuki" },
          status: "published"
        });
        brandMap.set("maruti suzuki", marutiSuzuki);
        brandMap.set("maruti", marutiSuzuki);
      } else {
        brandMap.set("maruti", marutiSuzuki);
      }

      // Mark all existing cars as SOLD safely
      await strapi.db.query('api::car.car').updateMany({
        data: { Vehicle_Status: 'SOLD', Newly_Added: false }
      });

      let iteration = 0;
      for (const carData of externalCars) {
        try {
          if (++iteration % 100 === 0) console.log(`Processing car ${iteration}/${externalCars.length}`);

          const regNo = carData?.veh_Reg_no;
          if (!regNo) continue;

        // Relation Lookups from Cache
        const getOrCreate = async (uid, name, cache, field = "Name") => {
          if (!name) return null;
          const nameKey = name.toLowerCase().trim();
          if (cache.has(nameKey)) return cache.get(nameKey);

          // Second level of caching by slug to prevent DB unique constraint failures
          const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
          const slugKey = `slug:${slug}`;
          if (cache.has(slugKey)) return cache.get(slugKey);

          try {
            const record = await strapi.documents(uid).create({
              data: { [field]: name, Slug: slug },
              status: "published"
            });
            cache.set(nameKey, record);
            cache.set(slugKey, record);
            return record;
          } catch (err) {
            console.error(`Failed to create ${uid} for "${name}":`, err.message);
            // If creation fails due to uniqueness (name or slug), try to find the existing one once more
            const existing = await strapi.documents(uid).findFirst({
              filters: { $or: [{ [field]: name }, { Slug: slug }] }
            });
            if (existing) {
              cache.set(nameKey, existing);
              cache.set(slugKey, existing);
              return existing;
            }
            return null;
          }
        };

        const isMaruti = carData?.Make?.toLowerCase()?.trim() === "maruti";
        const brand = isMaruti ? marutiSuzuki : await getOrCreate("api::brand.brand", carData?.Make, brandMap);
        const model = await getOrCreate("api::model.model", carData?.Model, modelMap);
        const fuel = await getOrCreate("api::fuel-type.fuel-type", carData?.Fuel_Type, fuelMap);
        const outlet = await getOrCreate("api::outlet.outlet", carData?.Outlet, outletMap);
        const category = await getOrCreate("api::vehicle-category.vehicle-category", carData?.Vehicle_Category, catMap);

        // Prep Car Data
        const carName = `${brand?.Name || ""} ${model?.Name || ""} ${carData?.YOM || ""}`.trim();
        const carGenData = {
          make: brand?.Name || "",
          model: model?.Name || "",
          variant: carData?.variant || "",
          yom: carData?.YOM || "",
          fuelType: fuel?.Name || "",
          kilometers: carData?.Kilometers || "",
          colour: carData?.Colour || "",
          outlet: outlet?.Name || "",
          status: carData?.Status || "",
          vehicleCategory: category?.Name || "",
          psp: carData?.PSP || "",
          location: outlet?.Location?.Place || "Kerala"
        };

        const topContent = generateTopContent(carGenData);
        const metaDetails = generateMetaDetails(carGenData);
        const seoData = {
          Meta_Title: metaDetails.meta_title,
          Meta_Description: metaDetails.meta_description,
          OG_Title: metaDetails.meta_title,
          OG_Description: metaDetails.meta_description,
          Top_Description: topContent
        };

        const imageUrls = JSON.stringify({
          LeftSide_Image: carData?.LeftSide_Img,
          RightSide_Image: carData?.Rightside_Img,
          Front_Image: carData?.Front_Img,
          Back_Image: carData?.Back_Img,
        });

        const carPayload = {
          Brand: brand,
          Model: model,
          Outlet: outlet,
          Fuel_Type: fuel,
          Color: carData?.Colour,
          Kilometers: carData?.Kilometers,
          PSP: carData?.PSP,
          Year_Of_Month: carData?.YOM,
          Vehicle_Reg_No: regNo,
          Vehicle_Status: carData?.Status || "STOCK",
          Variant: carData?.variant,
          Vehicle_Category: category,
          Image_URL: imageUrls,
          Name: carName,
          SEO: seoData,
          Location: outlet?.Location,
          Newly_Added: true // Will be fixed in batch at the end
        };

          const existingCar = carMap.get(regNo);
          if (!existingCar) {
            // CREATE
            const newCar = await strapi.documents("api::car.car").create({
              data: carPayload,
              status: "published",
            });
            // Slug calculation (requires ID)
            const slug = slugify(`${carName}-${newCar.documentId}`, { lower: true, strict: true });
            const finalCar = await strapi.documents("api::car.car").update({
              documentId: newCar.documentId,
              data: { Slug: slug },
              status: "published"
            });
            carMap.set(regNo, finalCar);
          } else {
            // UPDATE
            const slug = slugify(`${carName}-${existingCar.documentId}`, { lower: true, strict: true });
            const updatedCar = await strapi.documents("api::car.car").update({
              documentId: existingCar.documentId,
              data: { ...carPayload, Slug: slug, Vehicle_Status: "STOCK" },
              status: "published",
            });
            carMap.set(regNo, updatedCar);
          }
        } catch (carErr) {
          console.error(`Error processing car ${carData?.veh_Reg_no || iteration}:`, carErr.message);
          if (carErr.details?.errors) {
            console.error("Detail Error:", carErr.details.errors);
          }
        }
      }

      // 4. BATCH UPDATE FLAGS (Newly_Added)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const oneMonthIso = oneMonthAgo.toISOString();

      await Promise.all([
        strapi.db.query('api::car.car').updateMany({
          where: { createdAt: { $lt: oneMonthIso } },
          data: { Newly_Added: false }
        }),
        strapi.db.query('api::car.car').updateMany({
          where: { createdAt: { $gte: oneMonthIso } },
          data: { Newly_Added: true }
        })
      ]);

      console.timeEnd("importCars");
      ctx.body = { success: true, message: "Cars imported successfully" };
    } catch (err) {
      console.error(err);
      ctx.body = { success: false, message: "Failed to import cars", error: err.message };
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
                  (Array.isArray(car.Inspection_Report) ? car.Inspection_Report : [car.Inspection_Report]) : [],
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
                  (Array.isArray(car.Find_More) ? car.Find_More : [car.Find_More]) : [],
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
            documentId: car.documentId,
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
