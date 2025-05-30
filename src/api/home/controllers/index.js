"use strict";

/**
 * A set of functions called "actions" for `index`
 */

module.exports = {
  index: async (ctx, next) => {
    try {

      const price=await strapi.documents('api::car.car').findMany({
        sort: "PSP:asc",
        limit:1
      })
      const minimun_price=price[0]?.PSP;

      const maximumPrice=await strapi.documents('api::car.car').findMany({
        sort: "PSP:desc",
        limit:1
      })
      const maximum_price=maximumPrice[0]?.PSP;

      console.log({minimun_price,maximum_price});
      

      const featuredCars=await strapi.documents("api::car.car").findMany({
        filters: {
          Featured: true,
        },
        populate:{
          Brand:{
            populate:"*"
          },
          Model:{
            populate:"*"
          },
          Outlet:{
            populate:"*"
          },
          Fuel_Type:{
            populate:"*"
          },
         Image:{
          populate:'*'
         }
        }
      })
      const featuredOutlets = await strapi.documents('api::outlet.outlet').findMany({
        filters: {
          Featured: true
        },
        populate: {
          Image: {
            populate: '*'
          },
        }
      });

      // Get car counts for each featured outlet
      const outletCarCounts = await Promise.all(
        featuredOutlets.map(async outlet => {
          const count = await strapi.documents('api::car.car').count({
            filters: {
              Outlet: {
                Name: outlet.Name
              }
            }
          });
          return {
            ...outlet,
            carCount: count
          };
        })
      );

      const featuredBrands=await strapi.documents("api::brand.brand").findMany({
        filters: {
          Featured: true,
        },
        populate:'*',
      })

      const featuredLocation=await strapi.documents("api::location.location").findMany({
        filters: {
          Featured: true,
        },
        populate:'*',
      })

      const featuredFuelType=await strapi.documents("api::fuel-type.fuel-type").findMany({
        filters: {
          Featured: true,
        },
        populate:'*',
      })

      const recommendedCars=await strapi.documents("api::car.car").findMany({
        filters: {
          Recommended: true,
        },
        populate:['Brand','Model','Outlet','Fuel_Type','Image'],
      })

      const newlyadded=await strapi.documents("api::car.car").findMany({
        filters:{},
        sort: { createdAt: 'desc' },
        populate:['Brand','Model','Outlet','Fuel_Type','Image'],
        limit: 20
      })

      const chooseNextCars=await strapi.documents("api::car.car").findMany({
        filters: {
          Choose_Next: true,
        },
        populate:['Brand','Model','Outlet','Fuel_Type','Image'],
      })

      const indexPage = await strapi.documents("api::home.home").findMany({
        populate: {
          Banner_Section: {
            populate: "*",
          },
          Journey: {
            populate: {
              Journey: {
                populate: "*",
              },
            },
          },
          Buy_Sell: {
            populate: "*",
          },
          Insight: {
            populate:{
              Features: {
                populate: {
                  Image:{
                    populate:'*'
                  }
                },
              },
              Button: {
                populate: "*",
              },
            }
          },
          Brands:{
            populate:{
              Brands:{
                populate:{
                  Image:{
                    populate:'*'
                  }
                }
              }
            } 
          },
          Testimonials: {
            populate:{
              Author:{
                populate:'*'
              }
            }
          },
          FAQ: {
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
      ctx.body = {
        data:{
          ...indexPage[0],
          Price:{
            Minimum:minimun_price,
            Maximum:maximum_price
          },
          related_sections: {
            brands: featuredBrands,
            locations: featuredLocation,
            fuel_types: featuredFuelType,
            featured: featuredCars,
            choose_next: chooseNextCars,
            recommended: recommendedCars,
            newlyadded: newlyadded,
            featuredOutlets:outletCarCounts
          }
        }
        
      };
    } catch (err) {
      ctx.body = err;
    }
  },
};
