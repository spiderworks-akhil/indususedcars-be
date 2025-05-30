"use strict";

/**
 * A set of functions called "actions" for `menus`
 */

module.exports = {
  menus: async (ctx, next) => {
    try {
      const general = await strapi.documents("api::general.general").findFirst({
        populate: "*",
      });
      const location = await strapi
        .documents("api::location.location")
        .findMany({});
      console.log(location);

      const menu = await strapi.documents("api::menu.menu").findFirst({
        populate: {
          Header: {
            populate: "*",
          },
          Footer: {
            populate: {
              Page: {
                populate:{
                  Links:{
                    populate: "*"
                  }
                }
                
              },
              Location_Showrooms:{
                populate:'*'
              },
              Brand:{
                populate:"*"
              },
              Customer_Support:{
                populate:'*'
              }
            },
          },
        },
      });
      ctx.status = 200;
      ctx.body = { data: { ...menu, ...general, location: location } };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  searchCar: async (ctx, next) => {
    try {
      console.log('inside',ctx.query);
      
      const { query } = ctx.query;
      let carsList;
      if (query) {
        carsList = await strapi.documents("api::car.car").findMany({
          filters: {
            Name: {
              $containsi: query,
            },
          },
          populate: {
            Outlet: {
              populate: "*",
            },
          },
          limit: 6,
        });
      } else {
        console.log('yes');
        
        carsList = await strapi.documents("api::car.car").findMany({
          populate: {
            Outlet: {
              populate: "*",
            },
          },
          limit:6 
        });
      }
      console.log('finish');
      
      ctx.status = 200;
      ctx.body = {
        data: carsList,
      };
    } catch (error) { 
      console.log(error);
      
      ctx.status = 500;
      ctx.body = {
        error: error?.message,
      };
    }
  },
};
