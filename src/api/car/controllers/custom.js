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

      // Fetch similar cars based on brand and model
      const similarCars = await strapi.documents("api::car.car").findMany({
        filters: {
          Brand: car.Brand.id,
          Slug: {
            $ne: slug // Exclude the current car
          }
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
