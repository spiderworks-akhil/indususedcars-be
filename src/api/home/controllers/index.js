"use strict";

/**
 * A set of functions called "actions" for `index`
 */

module.exports = {
  index: async (ctx, next) => {
    try {
      // 1. Prepare all main queries for parallel execution
      const queries = [
        // Minimum Price
        strapi.documents('api::car.car').findMany({
          filters: { Vehicle_Status: "STOCK" },
          sort: "PSP:asc",
          limit: 1,
          status: 'published'
        }),
        // Maximum Price
        strapi.documents('api::car.car').findMany({
          filters: { Vehicle_Status: "STOCK" },
          sort: "PSP:desc",
          limit: 1,
          status: 'published'
        }),
        // Featured Cars
        strapi.documents("api::car.car").findMany({
          filters: { Featured: true, Vehicle_Status: "STOCK" },
          populate: ['Brand', 'Model', 'Outlet', 'Fuel_Type', 'Image'],
          limit: 20
        }),
        // Recommended Cars
        strapi.documents("api::car.car").findMany({
          filters: { Recommended: true, Vehicle_Status: "STOCK" },
          populate: ['Brand', 'Model', 'Outlet', 'Fuel_Type', 'Image'],
          limit: 20
        }),
        // Newly Added
        strapi.documents("api::car.car").findMany({
          filters: { Vehicle_Status: "STOCK", Newly_Added: true },
          sort: { createdAt: 'desc' },
          populate: ['Brand', 'Model', 'Outlet', 'Fuel_Type', 'Image'],
          status: 'published',
          limit: 20
        }),
        // Choose Your Next Cars
        strapi.documents("api::car.car").findMany({
          filters: { Choose_Next: true, Vehicle_Status: "STOCK" },
          populate: ['Brand', 'Model', 'Outlet', 'Fuel_Type', 'Image'],
          limit: 20
        }),
        // Featured Outlets (for calculating car counts later)
        strapi.documents('api::dealer-location.dealer-location').findMany({
          populate: { Image: { populate: '*' } }
        }),
        // Featured Brands
        strapi.documents("api::brand.brand").findMany({
          filters: { Featured: true },
          populate: '*'
        }),
        // Featured Locations
        strapi.documents("api::location.location").findMany({
          filters: { Featured: true },
          populate: '*'
        }),
        // Featured Fuel Types
        strapi.documents("api::fuel-type.fuel-type").findMany({
          filters: { Featured: true },
          populate: '*'
        }),
        // Static Index Page Content
        strapi.documents("api::home.home").findMany({
          populate: {
            Banner_Section: { populate: "*" },
            Journey: { populate: { Journey: { populate: "*" } } },
            Buy_Sell: { populate: "*" },
            Insight: {
              populate: {
                Features: { populate: { Image: { populate: '*' } } },
                Button: { populate: "*" },
              }
            },
            Brands: {
              populate: {
                Brands: { populate: { Image: { populate: '*' } } }
              }
            },
            Testimonials: { populate: { Author: { populate: '*' } } },
            FAQ: { populate: "*" },
            SEO: { populate: { Meta_Image: { populate: "*" } } },
          },
        })
      ];

      // 2. Execute queries in parallel
      const [
        minPriceRes,
        maxPriceRes,
        featuredCars,
        recommendedCars,
        newlyAdded,
        chooseNextCars,
        featuredOutlets,
        featuredBrands,
        featuredLocation,
        featuredFuelType,
        indexPageRes
      ] = await Promise.all(queries);

      const minimun_price = minPriceRes[0]?.PSP;
      const maximum_price = maxPriceRes[0]?.PSP;

      console.log(`Counts - Featured: ${featuredCars?.length}, Recommended: ${recommendedCars?.length}, ChooseNext: ${chooseNextCars?.length}, NewlyAdded: ${newlyAdded?.length}`);

      // 3. Calculate car counts for outlets in parallel (after we have the featuredOutlets)
      const outletCarCounts = await Promise.all(
        (featuredOutlets || []).map(async (outlet) => {
          const count = await strapi.documents('api::car.car').count({
            filters: {
              Outlet: { Name: outlet.Place },
              Vehicle_Status: "STOCK",
            }
          });
          return {
            ...outlet,
            carCount: count,
            Name: outlet.Place
          };
        })
      );

      // 4. Return the combined data
      ctx.body = {
        data: {
          ...indexPageRes[0],
          Price: {
            Minimum: minimun_price,
            Maximum: maximum_price
          },
          related_sections: {
            brands: featuredBrands,
            locations: featuredLocation,
            fuel_types: featuredFuelType,
            featured: featuredCars,
            choose_next: chooseNextCars,
            recommended: recommendedCars,
            newlyadded: newlyAdded,
            featuredOutlets: outletCarCounts
          }
        }
      };
    } catch (err) {
      console.error("Home API Index Error:", err);
      ctx.status = 500;
      ctx.body = { error: "Failed to load home page data", details: err.message };
    }
  },
};
