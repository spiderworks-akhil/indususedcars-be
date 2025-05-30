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
      // Process each car in the response
      for (const carData of fetchCars.data.getUsedCarDetailsResult) {
        console.log({ car: carData });

        console.log({ Running: (i += 1) });

        const checkVehicleRegistration = await strapi
          .documents("api::car.car")
          .findFirst({
            filters: {
              Vehicle_Reg_No: carData?.veh_Reg_no,
            },
          });

        if (!checkVehicleRegistration?.documentId) {
          console.log("inside vehicle");

          // Check if brand exists
          let brand = await strapi.documents("api::brand.brand").findFirst({
            filters: {
              Name: carData?.Make,
            },
          });

          console.log({ brand });

          // If brand doesn't exist, create it
          if (!brand) {
            brand = await strapi.documents("api::brand.brand").create({
              data: {
                Name: carData.Make,
                Slug: carData?.Make?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-") // Replace spaces with hyphens
                  ?.replace(/[^a-z0-9-]/g, ""), // Remove all non-alphanumeric characters except hyphens
              },
              status: "published",
            });
            // await strapi.documents('api::brand.brand').publish({ documentId: brand.documentId });
          }
          //check model exist
          let model = await strapi.documents("api::model.model").findFirst({
            filters: {
              Name: carData?.Model,
            },
          });
          console.log({ model });

          //if not create new model
          if (!model) {
            model = await strapi.documents("api::model.model").create({
              data: {
                Name:
                  carData?.Model ||
                  String.fromCharCode(
                    ...Array.from(
                      { length: 10 },
                      () => Math.floor(Math.random() * 26) + 97
                    )
                  ),
                Slug: carData?.Model?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-") // Replace spaces with hyphens
                  ?.replace(/[^a-z0-9-]/g, ""), // Remove all non-alphanumeric characters except hyphens
              },
              status: "published",
            });
            // await strapi.documents('api::model.model').publish({ documentId: model.documentId });
          }

          let fuel = await strapi
            .documents("api::fuel-type.fuel-type")
            .findFirst({
              filters: {
                Name: carData?.Fuel_Type,
              },
            });

          console.log({ fuel });

          if (!fuel) {
            fuel = await strapi.documents("api::fuel-type.fuel-type").create({
              data: {
                Name: carData?.Fuel_Type,
                Slug: carData?.Fuel_Type?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-") // Replace spaces with hyphens
                  ?.replace(/[^a-z0-9-]/g, ""), // Remove all non-alphanumeric characters except hyphens
              },
              status: "published",
            });
            // await strapi.documents('api::fuel-type.fuel-type').publish({ documentId: fuel.documentId });
          }

          let outlet = await strapi.documents("api::outlet.outlet").findFirst({
            filters: {
              Name: carData?.Outlet,
            },
          });

          console.log({ outlet });

          if (!outlet) {
            outlet = await strapi.documents("api::outlet.outlet").create({
              data: {
                Name: carData?.Outlet,
                Slug: carData?.Outlet?.toLowerCase()
                  ?.trim()
                  ?.replace(/\s+/g, "-") // Replace spaces with hyphens
                  ?.replace(/[^a-z0-9-]/g, ""), // Remove all non-alphanumeric characters except hyphens
              },
              status: "published",
            });
            // await strapi.documents('api::outlet.outlet').publish({ documentId: outlet.documentId });
          }

          let vehicle_category = await strapi
            .documents("api::vehicle-category.vehicle-category")
            .findFirst({
              filters: {
                Name: carData?.Vehicle_Category,
              },
            });

          console.log({ vehicle_category });

          // Add missing vehicle category creation
          if (!vehicle_category && carData?.Vehicle_Category) {
            vehicle_category = await strapi
              .documents("api::vehicle-category.vehicle-category")
              .create({
                data: {
                  Name: carData.Vehicle_Category,
                  Slug: carData.Vehicle_Category?.toLowerCase()
                    ?.trim()
                    ?.replace(/\s+/g, "-") // Replace spaces with hyphens
                    ?.replace(/[^a-z0-9-]/g, ""), // Remove all non-alphanumeric characters except hyphens
                },
                status: "published",
              });
            // await strapi.documents('api::vehicle-category.vehicle-category').publish({ documentId: vehicle_category.documentId });
          }

          // Download and store images
          // const imageUrls = {
          //   LeftSide_Image: carData?.LeftSide_Img ?
          //     await downloadImage(carData.LeftSide_Img, `${carData.veh_Reg_no}-left.jpg`) : null,
          //   RightSide_Image: carData?.Rightside_Img ?
          //     await downloadImage(carData.Rightside_Img, `${carData.veh_Reg_no}-right.jpg`) : null,
          //   Front_Image: carData?.Front_Img ?
          //     await downloadImage(carData.Front_Img, `${carData.veh_Reg_no}-front.jpg`) : null,
          //   Back_Image: carData?.Back_Img ?
          //     await downloadImage(carData.Back_Img, `${carData.veh_Reg_no}-back.jpg`) : null
          // };

          const imageUrls = {
            LeftSide_Image: carData?.LeftSide_Img,
            RightSide_Image: carData?.Rightside_Img,
            Front_Image: carData?.Front_Img,
            Back_Image: carData?.Back_Img,
          };

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
              Variant: carData?.Variant,
              Vehicle_Category: vehicle_category,
              Image_URL: JSON.stringify(imageUrls),
              Name: `${brand?.Name} ${model?.Name} ${carData?.YOM}`,
              // Slug: `${brand?.Name?.toLowerCase()
              //   ?.trim()
              //   ?.replace(/\s+/g, "-") // Replace spaces with hyphens
              //   ?.replace(/[^a-z0-9-]/g, "")}-${model?.Name?.toLowerCase()
              //   ?.trim()
              //   ?.replace(/\s+/g, "-") // Replace spaces with hyphens
              //   ?.replace(/[^a-z0-9-]/g, "")}`,
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
          // await strapi.documents('api::car.car').publish({
          //   documentId: car.documentId
          // });
          // const updatedCars = [...(outlet.Cars || []), car];
          // await strapi.documents("api::outlet.outlet").update({
          //   documentId: outlet.documentId,
          //   data: {
          //     Cars: updatedCars,
          //   },
          //   status: "published",
          //   populate: ["Cars"],
          // });

          console.log({ car });
        }
      }

      ctx.body = {
        success: true,
        message: "Cars imported successfully",
      };
    } catch (err) {
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

        const slug = slugify(`${car?.Name}-${car.documentId}`, {
          replacement: "-",
          remove: undefined,
          lower: true,
          strict: false,
          locale: "vi",
          trim: true,
        });

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
        if(!car?.Basic_Information){

        
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
};
