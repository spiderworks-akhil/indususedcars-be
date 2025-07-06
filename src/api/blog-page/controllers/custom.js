'use strict';

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  blogStaticPage: async (ctx, next) => {
    try {
      const blogPage = await strapi.documents('api::blog-page.blog-page').findFirst({
        filters:{},
        populate:['SEO','SEO.Meta_Image','Brand','Brand.Brands','Brand.Brands.Image','FAQ','FAQ.Questions','FAQ.Button']  
      })  


      ctx.status =200;
      ctx.body ={
        data:blogPage
      }
    } catch (err) {
      ctx.body = err;
    }
  }
};
