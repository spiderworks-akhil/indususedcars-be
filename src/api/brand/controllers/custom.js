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
};
