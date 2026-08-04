"use strict";

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  getBySlug: async (ctx, next) => {
    try {
      const { slug } = ctx.params;
      
      const static_content = await strapi
        .documents("api::car-detail.car-detail")
        .findFirst({
          populate:{
            Button:{
              populate:'*'
            },
            Section:{
              populate:'*'
            }
          }
        });
      const car = await strapi.documents("api::car.car").findFirst({
        filters: {
          Slug: slug,
        },
        populate: {
          Brand: {
            populate: {
              Image: true,
            },
          },
          Model: true,
          Outlet: {
            populate: {
              Location: true,
            },
          },
          Fuel_Type: true,
          Vehicle_Category: true,
          Image: {
            populate: "*",
          },
          Inspection_Report: {
            populate: "*",
          },
          Find_More: {
            populate: {
              Icon: true,
              Link: true,
            },
          },
          Location: {
            populate: {
              Outlets: true,
            },
          },
          SEO: {
            populate: {
              Meta_Image: true,
            },
          },
        },
      });

      console.log({car})

      // Check if car data exists
      if (!car) {
        ctx.status = 404;
        ctx.body = { error: 'Car not found' };
        return;
      }

      // Fetch similar cars based on brand and model
      const similarCars = await strapi.documents("api::car.car").findMany({
        filters: {
          Brand: car.Brand?.id,
          Slug: {
            $ne: slug // Exclude the current car
          },
          Vehicle_Status: "STOCK",
        },
        populate: {
          Brand: true,
          Model: true,
          Fuel_Type: true,
          Image: {
            populate: "*",
          },
        },
        limit: 4 // Limit to 4 similar cars
      });

      ctx.status = 200;
      ctx.body = {
        data: {
          content: static_content,
          ...car,
          similarCars: similarCars
        },
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  updateName: async (ctx, next) => {
    try {
      const cars = await strapi.documents("api::car.car").findMany({
        populate: {
          Brand: true,
          Model: true,
        },
      });

      let updated = 0;

      for (const car of cars) {
        const brandName = car.Brand?.Name;
        const modelName = car.Model?.Name;
        const yom = car.Year_Of_Month;

        const newName = [brandName, modelName, yom]
          .filter((part) => part !== null && part !== undefined && part !== "")
          .join(" ");

        if (!car.Name || car.Name !== newName) {
          await strapi.documents("api::car.car").update({
            documentId: car.documentId,
            status: "published",
            data: {
              Name: newName,
            },
          });
          updated++;
        }
      }

      ctx.status = 200;
      ctx.body = { data: { message: `updateName completed`, updated } };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  updateSEO: async (ctx, next) => {
    try {
      const cars = await strapi.documents("api::car.car").findMany({
        populate: {
          Brand: true,
          Model: true,
          Outlet: true,
          Fuel_Type: true,
          Vehicle_Category: true,
          SEO: true,
        },
      });

      const {
        generateTopContent,
        generateMetaDetails,
      } = require("../../../utils/car-content-generator");

      let updated = 0;

      for (const car of cars) {
        if (car.SEO && car.SEO.Meta_Title) continue;

        const meta = generateMetaDetails({
          make: car.Brand?.Name || "",
          model: car.Model?.Name || "",
          location: car.Outlet?.Name || "",
        });

        const topContent = generateTopContent({
          make: car.Brand?.Name || "",
          model: car.Model?.Name || "",
          location: car.Outlet?.Name || "",
          variant: car.Variant,
          yom: car.Year_Of_Month,
          fuelType: car.Fuel_Type?.Name || "",
          kilometers: car.Kilometers,
          colour: car.Color,
          outlet: car.Outlet?.Name || "",
          status: car.Vehicle_Status || "STOCK",
          vehicleCategory: car.Vehicle_Category?.Name || "",
          psp: car.PSP,
        });

        await strapi.documents("api::car.car").update({
          documentId: car.documentId,
          status: "published",
          data: {
            Description: topContent,
            SEO: {
              Meta_Title: meta.meta_title,
              Meta_Description: meta.meta_description,
              OG_Title: meta.meta_title,
              OG_Description: meta.meta_description,
              Top_Description: topContent,
              Bottom_Description: topContent,
            },
          },
        });
        updated++;
      }

      ctx.status = 200;
      ctx.body = { data: { message: `updateSEO completed`, updated } };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
};
