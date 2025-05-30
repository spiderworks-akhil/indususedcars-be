'use strict';

const axios = require("axios");

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  fetchStaticPages: async (ctx, next) => {
    try {
      console.log("fetchStaticPages");

      const fetchPages = await axios.get('https://indususedcars.com/api/pages');
      let pages = [];
      for (let i = 1; i <= fetchPages?.data?.last_page; i++) {
        console.log("fetchPages", i);

        const pageList = await axios.get(`https://indususedcars.com/api/pages?page=${i}`);
        for (const page of pageList?.data?.data) {

          if (page?.type == "Page") {
            const static_page_exist = await strapi.documents('api::static-page.static-page').findFirst({
              filters: {
                Slug: page?.slug
              }
            })

            if (!static_page_exist) {
              const fetch_static_page = await axios.get(`https://indususedcars.com/api/pages/${page?.slug}`);
              console.log(fetch_static_page?.data);

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
              console.log({ static_page });

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
      console.log("staticPageList");
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
        }
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
