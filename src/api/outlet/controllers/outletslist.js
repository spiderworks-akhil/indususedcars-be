'use strict';

/**
 * A set of functions called "actions" for `outletslist`
 */

module.exports = {
  outletList: async (ctx, next) => {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      
      // Calculate pagination values
      const limit = parseInt(pageSize);
      const start = (parseInt(page) - 1) * limit;

      // Fetch outlets with pagination and car counts
      const [outlets, count] = await Promise.all([
        strapi.documents("api::outlet.outlet").findMany({
          populate: {
            Location: {
              populate: '*'
            },
            Image: {
              populate: '*'
            }
          },
          limit,
          start,
        }),
        strapi.documents("api::outlet.outlet").count(),
      ]);

      // Get car counts for each outlet
      const outletsWithCarCounts = await Promise.all(outlets.map(async (outlet) => {
        const carCount = await strapi.documents("api::car.car").count({
          filters: {
            Outlet: {
              Name:outlet?.Name 
            }
          },
          pagination:{
            start:page,
            limit:pageSize
          },
          populate:['Outlet'] 
        });
        return {
          ...outlet,
          carCount
        };
      }));

      ctx.status = 200;
      ctx.body = {
        data: outletsWithCarCounts,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: limit,
            total: count,
            pageCount: Math.ceil(count / limit),
          },
        },
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  featuredOutletList: async (ctx, next) => {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      
      // Calculate pagination values
      const limit = parseInt(pageSize);
      const start = (parseInt(page) - 1) * limit;

      // Fetch outlets with pagination and car counts
      const [outlets, count] = await Promise.all([
        strapi.documents("api::outlet.outlet").findMany({
          filters:{
            Featured:true
          },
          populate: {
            Location: {
              populate: '*'
            },
            Image: {
              populate: '*'
            }
          },
          limit,
          start,
        }),
        strapi.documents("api::outlet.outlet").count(),
      ]);

      // Get car counts for each outlet
      const outletsWithCarCounts = await Promise.all(outlets.map(async (outlet) => {
        const carCount = await strapi.documents("api::car.car").count({
          filters: {
            Outlet: {
              Name:outlet?.Name 
            }
          },
          pagination:{
            start:page,
            limit:pageSize
          },
          populate:['Outlet'] 
        });
        return {
          ...outlet,
          carCount
        };
      }));

      ctx.status = 200;
      ctx.body = {
        data: outletsWithCarCounts,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: limit,
            total: count,
            pageCount: Math.ceil(count / limit),
          },
        },
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  }
};
