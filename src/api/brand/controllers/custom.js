"use strict";

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  getBySlug: async (ctx, next) => {
    try {
      const { slug } = ctx.params;

      const findBrand = await strapi.documents("api::brand.brand").findFirst({
        filters: {
          Slug: slug,
        },
        populate: {
          SEO: {
            populate: {
              Meta_Image: {
                populate: "*",
              },
            },
          },
        },
      });

      console.log({ findBrand });

      if (!findBrand) {
        ctx.status = 404;
        ctx.body = {
          err: "Brand Not Found",
        };

        return;
      }

      ctx.status = 200;
      ctx.body = {
        data: findBrand,
      };
    } catch (err) {
      ctx.body = err;
    }
  },

  fetchBrand:async(ctx,next)=>{
    try {
      const fetchBrabdCombinationPage = await strapi.documents('api::combination-page.combination-page').findMany({
        filters:{
          Related_Type: "App\\Models\\Indus\\Brand"
        },
        populate:['SEO','SEO.Meta_Image']
      })

      console.log({length:fetchBrabdCombinationPage.length});

      ctx.status = 200;
      ctx.body ={
        sample:fetchBrabdCombinationPage,
        len:fetchBrabdCombinationPage.length
      }

    } catch (error) {
      ctx.status =500;
      ctx.body={
        err:error
      }
    }
  }
};
