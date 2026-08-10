"use strict";

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  getBySlug: async (ctx, next) => {
    try {
      const { slug } = ctx.params;
      const findLocation = await strapi
        .documents("api::dealer-location.dealer-location")
        .findFirst({
          filters: {
            Slug: slug,
          },
          populate: ['SEO', 'SEO.Meta_Image', 'Dealer_Lists']
        });

      if (!findLocation) {
        ctx.status = 404;
        ctx.body = {
          err: "Location Not Found",
        };

        return
      }
      ctx.status = 200;
      ctx.body = findLocation;
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },

  List: async (ctx, next) => {
    try {
      const locationList = await
        strapi.documents("api::dealer-location.dealer-location").findMany({
          filters: {},
          populate: {
            Image: {
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
        })

      ctx.status = 200;
      ctx.body = locationList;
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },

  featuredDealers: async (ctx, next) => {
    try {
      const locationList = await
        strapi.documents("api::dealer-location.dealer-location").findMany({
          filters: {},
          populate: {
            Image: {
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
        })

      const locationListWithCarCounts = await Promise.all(
        locationList.map(async (location) => {
          if (location) {
            const carCount = await strapi.documents("api::car.car").count({
              filters: {
                Outlet: {
                  Location: {
                    Slug: location.Slug
                  }
                },

              },
              populate: ["Outlet","Outlet.Location"]
            });


            return {
              ...location,
              carCount,
            };
          }
          return location;
        })
      );

      ctx.status = 200;
      ctx.body = locationListWithCarCounts; // Fixed to return the list with car counts
    } catch (error) {
      console.error('Error in featuredDealers:', error);
      ctx.status = 500;
      ctx.body = error;
    }
  }
};
