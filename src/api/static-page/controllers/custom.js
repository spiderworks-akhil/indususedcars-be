'use strict';

const axios = require("axios");

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  fetchStaticPages: async (ctx, next) => {
    try {

      const fetchPages = await axios.get(`${process.env.OLD_BACKEND_URL}/api/pages`);
      let pages = [];
      for (let i = 1; i <= fetchPages?.data?.last_page; i++) {

        const pageList = await axios.get(`${process.env.OLD_BACKEND_URL}/api/pages?page=${i}`);
        for (const page of pageList?.data?.data) {

          if (page?.type == "Page") {
            const static_page_exist = await strapi.documents('api::static-page.static-page').findFirst({
              filters: {
                Slug: page?.slug
              }
            })

            if (!static_page_exist) {
              const fetch_static_page = await axios.get(`${process.env.OLD_BACKEND_URL}/api/pages/${page?.slug}`);

              const static_page = await strapi.documents('api::static-page.static-page').create({
                data: {
                  Name: fetch_static_page?.data?.name,
                  Page_Heading: fetch_static_page?.data?.primary_heading,
                  Slug: fetch_static_page?.data?.slug,
                  Short_Description: fetch_static_page?.data?.short_description,
                  Content: fetch_static_page?.data?.content,

                },

                status: 'published'
              });

            }

            pages.push(page)
          }
        }
      }
      ctx.status = 200;
      ctx.body = pages;
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  staticPageList: async (ctx, next) => {
    try {
      const { page=1, limit=10 } = ctx.query;
      const [static_page, count] = await Promise.all([
        strapi.documents('api::static-page.static-page').findMany({
          filters:{},
          Populate: {
            SEO: {
              Meta_Image: {
                populate: '*'
              }
            }
          },
          start: (page - 1) * limit,
          limit: limit,
          status:'published'  
        }),
        strapi.documents('api::static-page.static-page').count()
      ]);
      ctx.status = 200;
      ctx.body = {
        data: static_page, meta: {
          pagination: {
            page: page,
            currentPage: page + 1,
            lastPage: Math.ceil(count / limit),
            pageSize: limit,
            total: count
          }
        }
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  staticPageDetail:async(ctx,next)=>{
    const {slug}=ctx.params;
    try {
      const find_static_page=await strapi.documents('api::static-page.static-page').findFirst({
        filters:{
          Slug:slug
        },
        populate:{
          SEO:{
              populate:'*'
          }
        },
        status:'published'  
      })

      if(!find_static_page){
        ctx.status=404;
        ctx.body={
          message:"Page Not found"
        }
        return;
      }
      ctx.status=200;
      ctx.body=find_static_page;
    } catch (error) {
      ctx.status=500;
      ctx.body=error;
    }
  }
}
