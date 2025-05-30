'use strict';

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  list: async (ctx, next) => {
    try {
      const redirections=await strapi.documents('api::redirection.redirection').findMany({
        filters:{},
        status:'published'
      })

      ctx.status=200;
      ctx.body=redirections;

    } catch (err) {
      ctx.status=500;
      ctx.body = err;
    }
  }
};
