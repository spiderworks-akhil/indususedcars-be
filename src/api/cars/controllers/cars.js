"use strict";
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
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

      if (!fetchCars?.data?.getUsedCarDetailsResult) {
        throw new Error("Invalid response from cars API");
      }

      let i = 0;

      // Initially, set all cars' Vehicle_Status to 'SOLD' and Newly_Added to false
      await strapi.db.query('api::car.car').updateMany({
        data: {
          Vehicle_Status: 'SOLD',
          Newly_Added: false
        }
      });

      for (const carData of fetchCars.data.getUsedCarDetailsResult) {
        console.log({ car: carData });
        console.log({ Running: (i += 1) });

        // Try to find an existing car by Vehicle_Reg_No
        const checkVehicleRegistration = await strapi
          .documents("api::car.car")
          .findFirst({
            filters: {
              Vehicle_Reg_No: carData?.veh_Reg_no,
            },
          });

        let imageUrls = {
          LeftSide_Image: carData?.LeftSide_Img,
          RightSide_Image: carData?.Rightside_Img,
          Front_Image: carData?.Front_Img,
          Back_Image: carData?.Back_Img,
        };

        // ---------- BRAND LOGIC REWRITE START ----------
        // If the car's brand is 'MARUTI' (case-insensitive), assign or create 'Maruti Suzuki'
        let carMakeNormalized = carData?.Make?.trim()?.toLowerCase();
        let isMaruti = carMakeNormalized === "maruti";

        let brand;
        if (isMaruti) {
          // Try to get 'Maruti Suzuki' by its slug ('maruti-suzuki')
          brand = await strapi.documents("api::brand.brand").findFirst({
            filters: {
              Slug: "maruti-suzuki",
            }
          });

          if (!brand) {
            // If 'Maruti Suzuki' does not exist, create it.
            brand = await strapi.documents("api::brand.brand").create({
              data: {
                Name: "Maruti Suzuki",
                Slug: "maruti-suzuki"
              },
              status: "published"
            });
          }
        } else {
          // Not MARUTI - normal logic
          brand = await strapi.documents("api::brand.brand").findFirst({
            filters: {
              $or: [
                { Name: carData?.Make },
                {
                  Slug: carData?.Make?.toLowerCase()
                    ?.trim()
                    ?.replace(/\s+/g, "-")
                    ?.replace(/[^a-z0-9-]/g, "")
                }
              ]
            },
          });

          // If brand doesn't exist, create it using provided name
          if (!brand && carData?.Make) {
            brand = await strapi.documents("api::brand.brand").create({
              data: {
                Name: carData.Make,
                Slug: carData?.Make?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-")
                  ?.replace(/[^a-z0-9-]/g, ""),
              },
              status: "published",
            });
          }
        }
        // ---------- BRAND LOGIC REWRITE END ----------

        // Find or create the model linked to the car
        let model = await strapi.documents("api::model.model").findFirst({
          filters: {
            $or: [
              { Name: carData?.Model },
              {
                Slug: carData?.Model?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-")
                  ?.replace(/[^a-z0-9-]/g, "")
              }
            ]
          },
        });

        if (!model && carData?.Model) {
          model = await strapi.documents("api::model.model").create({
            data: {
              Name: carData.Model,
              Slug: carData.Model?.toLowerCase()
                ?.trim()
                ?.replace(/\s+/g, "-")
                ?.replace(/[^a-z0-9-]/g, ""),
            },
            status: "published",
          });
        }

        // Find or create Fuel Type
        let fuel = await strapi.documents("api::fuel-type.fuel-type").findFirst({
          filters: {
            $or: [
              { Name: carData?.Fuel_Type },
              {
                Slug: carData?.Fuel_Type?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-")
                  ?.replace(/[^a-z0-9-]/g, "")
              }
            ]
          },
        });
        if (!fuel && carData?.Fuel_Type) {
          fuel = await strapi.documents("api::fuel-type.fuel-type").create({
            data: {
              Name: carData.Fuel_Type,
              Slug: carData.Fuel_Type?.toLowerCase()
                ?.trim()
                ?.replace(/\s+/g, "-")
                ?.replace(/[^a-z0-9-]/g, ""),
            },
            status: "published",
          });
        }

        // Find or create Outlet
        let outlet = await strapi.documents("api::outlet.outlet").findFirst({
          filters: {
            $or: [
              { Name: carData?.Outlet },
              {
                Slug: carData?.Outlet?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-")
                  ?.replace(/[^a-z0-9-]/g, "")
              }
            ]
          },
        });
        if (!outlet && carData?.Outlet) {
          outlet = await strapi.documents("api::outlet.outlet").create({
            data: {
              Name: carData.Outlet,
              Slug: carData.Outlet?.toLowerCase()
                ?.trim()
                ?.replace(/\s+/g, "-")
                ?.replace(/[^a-z0-9-]/g, ""),
            },
            status: "published",
          });
        }

        // Find or create Vehicle Category
        let vehicle_category = await strapi
          .documents("api::vehicle-category.vehicle-category")
          .findFirst({
            filters: {
              $or: [
                { Name: carData?.Vehicle_Category },
                {
                  Slug: carData?.Vehicle_Category?.toLowerCase()
                    ?.trim()
                    ?.replace(/\s+/g, "-")
                    ?.replace(/[^a-z0-9-]/g, "")
                }
              ]
            },
          });
        if (!vehicle_category && carData?.Vehicle_Category) {
          vehicle_category = await strapi
            .documents("api::vehicle-category.vehicle-category")
            .create({
              data: {
                Name: carData.Vehicle_Category,
                Slug: carData.Vehicle_Category?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-")
                  ?.replace(/[^a-z0-9-]/g, ""),
              },
              status: "published",
            });
        }

        if (!checkVehicleRegistration?.documentId) {
          // CREATE NEW CAR
          const car = await strapi.documents("api::car.car").create({
            data: {
              Brand: brand,
              Model: model,
              Outlet: outlet,
              Fuel_Type: fuel,
              Color: carData?.Colour,
              Kilometers: carData?.Kilometers,
              PSP: carData?.PSP,
              Year_Of_Month: carData?.YOM,
              Vehicle_Reg_No: carData?.veh_Reg_no,
              Vehicle_Status: carData?.Status,
              Variant: carData?.variant,
              Vehicle_Category: vehicle_category,
              Image_URL: JSON.stringify(imageUrls),
              Name: `${brand?.Name} ${model?.Name} ${carData?.YOM}`,
              Newly_Added: true,
            },
            status: "published",
            populate: [
              "Brand",
              "Fuel_Type",
              "Model",
              "Vehicle_Category",
              "Outlet",
            ],
          });
          console.log({ car });
        } else {
          // UPDATE EXISTING CAR
          // Extra logic: If MARUTI, also update Brand to 'Maruti Suzuki'
          let updatedData = {
            Vehicle_Status: 'STOCK',
            Image_URL: JSON.stringify(imageUrls),
          };

          if (isMaruti) {
            updatedData.Brand = brand;
          }

          const existingCar = await strapi.documents("api::car.car").update({
            documentId: checkVehicleRegistration.documentId,
            data: updatedData,
            status: "published",
          });
          console.log({ updatedCar: existingCar });
        }
      }

      // Fix newly_added flag: set true ONLY for cars created within the last month, others to false
      try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Set false for older cars, true for recent
        await strapi.db.query('api::car.car').updateMany({
          where: {
            createdAt: { $lt: oneMonthAgo.toISOString() }
          },
          data: {
            Newly_Added: false
          }
        });

        await strapi.db.query('api::car.car').updateMany({
          where: {
            createdAt: { $gte: oneMonthAgo.toISOString() }
          },
          data: {
            Newly_Added: true
          }
        });
        console.log('Newly_Added status updated.');
      } catch (error) {
        console.error('Error updating Newly_Added status:', error);
      }

      // Clean up slugs for all cars
      const cars = await strapi.documents("api::car.car").findMany({});
      for (let car of cars) {
        const slug = `${car?.Name}-${car.documentId}`
          .toLowerCase()
          .replace(/\s+/g, '-')       // Replace spaces with -
          .replace(/[^\w\-~._]+/g, '') // Remove all non-word chars except -~._
          .replace(/\-\-+/g, '-')      // Replace multiple - with single -
          .replace(/^-+/, '')          // Trim - from start of text
          .replace(/-+$/, '');         // Trim - from end of text

        if (slug !== car.Slug) {
          await strapi.documents("api::car.car").update({
            documentId: car.documentId,
            data: {
              Slug: slug,
            },
            status: "published",
          });
          console.log(`Slug updated for car ${car.documentId}: ${slug}`);
        }
      }

      // Optionally, run updateSlug function
      await strapi.controller('api::cars.cars').updateSlug(ctx, next);

      ctx.body = {
        success: true,
        message: "Cars imported successfully",
      };
    } catch (err) {
      console.error(err)
      ctx.body = {
        success: false,
        message: "Failed to import cars",
        error: err.stack,
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
