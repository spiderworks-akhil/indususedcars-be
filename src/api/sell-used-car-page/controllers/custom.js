'use strict';

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  sellUsedCarPage: async (ctx, next) => {
    try {

      const data = await strapi.documents('api::sell-used-car-page.sell-used-car-page').findFirst({
        populate: ['image', 'SEO', 'SEO.Meta_Image', 'FAQ', 'FAQ.Questions', 'FAQ.Button']
      })

      ctx.status = 200;
      ctx.body = data;
 
    } catch (err) {
      ctx.status=500
      ctx.body = err;
    }
  }
};
