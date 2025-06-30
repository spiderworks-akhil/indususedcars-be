"use strict";

const axios = require("axios");

/**
 * A set of functions called "actions" for `outletslist`
 */

module.exports = {
  outletList: async (ctx, next) => {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;

      // Calculate pagination values
      const limit = parseInt(pageSize);
      const start = (parseInt(page) - 1) * limit;

      // Fetch outlets with pagination and car counts
      const [outlets, count] = await Promise.all([
        strapi.documents("api::outlet.outlet").findMany({
          populate: {
            Location: {
              populate: "*",
            },
            Image: {
              populate: "*",
            },
          },
          limit,
          start,
        }),
        strapi.documents("api::outlet.outlet").count(),
      ]);

      // Get car counts for each outlet
      const outletsWithCarCounts = await Promise.all(
        outlets.map(async (outlet) => {
          const carCount = await strapi.documents("api::car.car").count({
            filters: {
              Outlet: {
                Name: outlet?.Name,
              },
            },
            pagination: {
              start: page,
              limit: pageSize,
            },
            populate: ["Outlet"],
          });
          return {
            ...outlet,
            carCount,
          };
        })
      );

      ctx.status = 200;
      ctx.body = {
        data: outletsWithCarCounts,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: limit,
            total: count,
            pageCount: Math.ceil(count / limit),
          },
        },
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  featuredOutletList: async (ctx, next) => {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;

      // Calculate pagination values
      const limit = parseInt(pageSize);
      const start = (parseInt(page) - 1) * limit;

      // Fetch outlets with pagination and car counts
      const [outlets, count] = await Promise.all([
        strapi.documents("api::outlet.outlet").findMany({
          filters: {
            Featured: true,
          },
          populate: {
            Location: {
              populate: "*",
            },
            Image: {
              populate: "*",
            },
          },
          limit,
          start,
        }),
        strapi.documents("api::outlet.outlet").count(),
      ]);

      // Get car counts for each outlet
      const outletsWithCarCounts = await Promise.all(
        outlets.map(async (outlet) => {
          const carCount = await strapi.documents("api::car.car").count({
            filters: {
              Outlet: {
                Name: outlet?.Name,
              },
            },
            pagination: {
              start: page,
              limit: pageSize,
            },
            populate: ["Outlet"],
          });
          return {
            ...outlet,
            carCount,
          };
        })
      );

      ctx.status = 200;
      ctx.body = {
        data: outletsWithCarCounts,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: limit,
            total: count,
            pageCount: Math.ceil(count / limit),
          },
        },
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  outletDetail: async (ctx, next) => {
    try {
      const { slug } = ctx.params;

      const findOutlet = await strapi
        .documents("api::outlet.outlet")
        .findFirst({
          filters: {
            Slug: slug,
          },
          populate:{
            SEO:{
              populate:'*'
            }
          }
        });

      if (!findOutlet) {
        ctx.status = 404;
        ctx.body = {
          err: "Outlet Not Found",
        };
      }

      ctx.status = 200;
      ctx.body = {
        data: findOutlet,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  fetchDetails:async(ctx,next)=>{
    try {
      const fetchOuletList= await axios.get('https://indususedcars.com/locations_all');

      console.log({outlet:fetchOuletList?.data});

      // Helper function to upload image to Strapi
      const uploadImage = async (imageUrl) => {
        if (!imageUrl) return null;
        
        try {
          // Generate unique filename
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const fileName = `og_image_${uniqueId}.jpg`;

          // Fetch image
          const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
          });

          // Create FormData for upload
          const formData = new FormData();
          const blob = new Blob([response.data], {
            type: response.headers['content-type']
          });
          formData.append('files', blob, fileName);

          // Upload to Strapi
          const uploadResponse = await axios.post(
            `${process.env.STRAPI_URL || 'http://localhost:1337'}/api/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );

          return uploadResponse.data[0]?.id || null;
        } catch (error) {
          console.error('Error uploading image:', error);
          return null;
        }
      };

      for(const outlet of fetchOuletList?.data || []){
        // Upload OG image if available
        let ogImageId = null;
        if (outlet.og_image) {
          const imageUrl = `https://www.indususedcars.com/${outlet.og_image?.file_path}`;
          ogImageId = await uploadImage(imageUrl);
        }

        const findOutlet = await strapi.documents('api::outlet.outlet').findFirst({
          filters:{
            Slug:outlet?.slug
          }
        });

        const findLocation = await strapi.documents('api::location.location').findFirst({
          filters:{
            Slug:outlet?.indus_district?.slug
          }
        })

        if(!findOutlet){
          const createOutlet = await strapi.documents('api::outlet.outlet').create({
            data:{
              Title:outlet?.page_title,
              Name:outlet?.name,
              Slug:outlet?.slug,
              Top_Description:outlet?.top_description,
              Location:findLocation?.documentId,
              SEO:{
                Meta_Title:outlet?.browser_title,
                Meta_Description:outlet?.meta_description,
                Keywords:outlet?.meta_keywords,
                Bottom_Description:outlet?.bottom_description,
                OG_Title:outlet?.og_title,
                OG_Description: outlet?.og_description,
                Script: outlet?.script,
                Extra_JS: outlet?.extra_js,
                Meta_Image: ogImageId ?  ogImageId  : null
              }
            },
            status:'published'
          });
          continue;
        }

        const updateData = {
          Title: outlet?.page_title,
          Location:findLocation?.documentId,
          SEO: {
            Meta_Title: outlet?.browser_title,
            Meta_Description: outlet?.meta_description,
            Keywords: outlet?.meta_keywords,
            Bottom_Description: outlet?.bottom_description,
            OG_Title: outlet?.og_title,
            OG_Description: outlet?.og_description,
            Script: outlet?.script,
            Extra_JS: outlet?.extra_js
          }
        };

        // Only update Meta_Image if we have a new one
        if (ogImageId) {
          updateData.SEO.Meta_Image =  ogImageId ;
        }

        const updateOutlet = await strapi.documents('api::outlet.outlet').update({
          documentId:findOutlet?.documentId,
          data: updateData,
          status: 'published',
          populate:['SEO','SEO.Meta_Image']
        });
      }

      ctx.status = 200;
      ctx.body={
        data:'Data Insertion Completed'
      }
      
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  }
};
