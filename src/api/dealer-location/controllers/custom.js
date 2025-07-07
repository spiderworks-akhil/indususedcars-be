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
          populate:['SEO','SEO.Meta_Image']
        });

      if (!findLocation) {
        ctx.status = 404;
        ctx.body = {
          err: "Location Not Found",
        };
      }
      ctx.status = 200;
      ctx.body = findLocation;
    } catch (err) {
      ctx.body = err;
    }
  },
};
