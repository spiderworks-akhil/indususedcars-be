'use strict';

/**
 * A set of functions called "actions" for `sitemap`
 */

module.exports = {
  siteMap: async (ctx, next) => {
    try {
      ctx.body = [{
        Slug: `/static-pages`
      }, {
        Slug: '/blog'
      }, {
        Slug: '/company'
      }];
    } catch (err) {
      ctx.body = err;
    }
  },
  siteMapDetail: async (ctx, next) => {
    try {

      const { slug } = ctx.params;

      switch (slug) {
        case 'static-pages':

          ctx.body = [
            { url: '/' },
            // { url: '/about' },
            { url: '/contact' },
            { url: '/cars' }
          ];
          break;

        case 'blog':

          const blogList = await strapi.documents('api::blog.blog').findMany({
            fields:['Slug'],
            status: 'published',
          })

          console.log(blogList);


          ctx.status = 200;
          ctx.body = blogList

          break;

        case 'company':
          const companyList = await strapi.documents('api::static-page.static-page').findMany({

            status: 'published',
            fields: ['Slug']
          })

          ctx.status = 200;
          ctx.body = companyList;

        default:
          break;
      }

    } catch (error) {
      ctx.body = error;
    }
  }
};
