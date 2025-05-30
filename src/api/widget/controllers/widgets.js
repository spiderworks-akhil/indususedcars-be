"use strict";

/**
 * A set of functions called "actions" for `widgets`
 */

module.exports = {
  moments: async (ctx, next) => {
    try {
      const moments = await strapi.documents("api::widget.widget").findFirst({
        populate: {
          Moments: {
            populate: {
              Shorts: {
                populate: {
                  Instagram_Shorts: {
                    populate: "*",
                  },
                },
              },
            },
          },
        },
      });
      ctx.status = 200;
      ctx.body = {
        data: moments,
      };
    } catch (err) {
      ctx.body = err;
    }
  },
  cta: async (ctx, next) => {
    try {
      const cta = await strapi.documents("api::widget.widget").findFirst({
        populate: {
          CTA: {
            populate: "*",
          },
        },
      });
      ctx.status = 200;
      ctx.body = {
        data: cta,
      };
    } catch (err) {
      ctx.body = err;
    }
  },
};
