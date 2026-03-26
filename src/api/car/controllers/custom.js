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
            populate: "*",
          },
          Model: {
            populate: "*",
          },
          Outlet: {
            populate: "*",
          },
          Fuel_Type: {
            populate: "*",
          },
          Vehicle_Category: {
            populate: "*",
          },
          Image: {
            populate: "*",
          },
          Inspection_Report: {
            populate: "*",
          },
          Find_More: {
            populate: {
              Icon:{
                populate:'*'
              },
              Link:{
                populate:'*'
              }
            },
          },
          Location: {
            populate: "*",
          },
          SEO: {
            populate: {
              Meta_Image: {
                populate: "*",
              },
            },
          },
        },
      });

      // Check if car data exists
      if (!car) {
        ctx.status = 404;
        ctx.body = { error: 'Car not found' };
        return;
      }

      // Redirect if the car is sold
      if (car.Vehicle_Status === "SOLD") {
        const brandSlug = car.Brand?.Slug;
        const modelSlug = car.Model?.Slug;
        
        if (brandSlug && modelSlug) {
          ctx.status = 301;
          return ctx.redirect(`https://indususedcars.com/cars/${brandSlug}/${modelSlug}`);
        } else if (brandSlug) {
          ctx.status = 301;
          return ctx.redirect(`https://indususedcars.com/cars/${brandSlug}`);
        }
      }

      // Fetch similar cars based on brand and model if car is in STOCK
      const similarCars = await strapi.documents("api::car.car").findMany({
        filters: {
          Brand: car.Brand?.id,
          Slug: {
            $ne: slug // Exclude the current car
          },
          Vehicle_Status: "STOCK",
        },
        populate: {
          Brand: {
            populate: "*",
          },
          Model: {
            populate: "*",
          },
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
};
