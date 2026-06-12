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
      console.log('inside outlet detail');

      const { slug } = ctx.params;
      console.log({ slug });
      const findOutlet = await strapi
        .documents("api::outlet.outlet")
        .findFirst({
          filters: {
            Slug: slug,
          },
          populate: {
            SEO: {
              populate: '*'
            }
          }
        });

      console.log({ findOutlet });


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
  fetchDetails: async (ctx, next) => {
    try {
      const fetchOuletList = await axios.get(`${process.env.OLD_BACKEND_URL}/locations_all`);



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

      for (const outlet of fetchOuletList?.data || []) {
        // Upload OG image if available
        let ogImageId = null;
        if (outlet.og_image) {
          const imageUrl = `${process.env.OLD_BACKEND_URL}/${outlet.og_image?.file_path}`;
          ogImageId = await uploadImage(imageUrl);
        }

        const findOutlet = await strapi.documents('api::outlet.outlet').findFirst({
          filters: {
            Slug: outlet?.slug
          }
        });

        const findLocation = await strapi.documents('api::location.location').findFirst({
          filters: {
            Slug: outlet?.indus_district?.slug
          }
        })

        if (!findOutlet) {
          const createOutlet = await strapi.documents('api::outlet.outlet').create({
            data: {
              Title: outlet?.page_title,
              Name: outlet?.name,
              Slug: outlet?.slug,
              Top_Description: outlet?.top_description,
              Location: findLocation?.documentId,
              SEO: {
                Meta_Title: outlet?.browser_title,
                Meta_Description: outlet?.meta_description,
                Keywords: outlet?.meta_keywords,
                Bottom_Description: outlet?.bottom_description,
                OG_Title: outlet?.og_title,
                OG_Description: outlet?.og_description,
                Script: outlet?.script,
                Extra_JS: outlet?.extra_js,
                Meta_Image: ogImageId ? ogImageId : null
              }
            },
            status: 'published'
          });
          continue;
        }

        const updateData = {
          Title: outlet?.page_title,
          Location: findLocation?.documentId,
          Top_Description: outlet?.top_description,
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
          updateData.SEO.Meta_Image = ogImageId;
        }

        const updateOutlet = await strapi.documents('api::outlet.outlet').update({
          documentId: findOutlet?.documentId,
          data: updateData,
          status: 'published',
          populate: ['SEO', 'SEO.Meta_Image']
        });
      }

      ctx.status = 200;
      ctx.body = {
        data: 'Data Insertion Completed'
      }

    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  extractDetails: async (ctx, next) => {
    // Helper to sleep for ms milliseconds
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Helper to fetch with retry on 429
    const fetchWithRetry = async (url, retries = 3) => {
      let attempt = 0;
      while (attempt < retries) {
        try {
          return await axios.get(url);
        } catch (error) {
          if (error.response && error.response.status === 429) {
            attempt++;
            if (attempt < retries) {
              console.log(`429 Too Many Requests for ${url}. Waiting 20 seconds before retrying (attempt ${attempt + 1}/${retries})...`);
              await sleep(20000); // 20 seconds
              continue;
            }
          }
          throw error;
        }
      }
    };

    // Helper function to upload image to Strapi
    const uploadImage = async (imageUrl) => {
      console.log({ imageUrl });

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

    try {
      console.log("models");
      const nonDetailSlugs = [];

      const data = await fetchWithRetry(
        `${process.env.OLD_BACKEND_URL}/api/combination-pages?page=1&limit=1000`
      );
      console.log(data);

      try {
        const pageData = await fetchWithRetry(
          `${process.env.OLD_BACKEND_URL}/locations_all`
        );

        for (const outlet of pageData.data) {
          try {
            console.log({ outlet });

            const exist = await strapi.documents('api::outlet.outlet').findFirst({
              filters: {
                Slug: outlet.slug
              },
              populate: ['SEO', 'SEO.Meta_Image']
            });

            // Check if outlet has OG image and upload if needed
            let ogImageId = null;

            if (outlet.og_image && !exist?.SEO?.Meta_Image) {
              const imageUrl = `${process.env.OLD_BACKEND_URL}/${outlet.og_image?.file_path}`;
              ogImageId = await uploadImage(imageUrl);
            }



            const updateData = {
              Title: outlet?.page_title,
              SEO: {
                Meta_Title: outlet?.browser_title,
                Meta_Description: outlet?.meta_description,
                Keywords: outlet?.meta_keywords,
                OG_Title: outlet?.browser_title,
                OG_Description: outlet?.meta_description,
                Bottom_Description: outlet?.bottom_description == null ? outlet?.top_description : outlet?.bottom_description,
                Top_Description: outlet?.top_description == null ? null : outlet?.bottom_description,
                Extra_JS: outlet?.extra_js
              }
            };

            // Only update Meta_Image if we have a new one and existing doesn't have one
            if (ogImageId && !exist?.SEO?.Meta_Image) {
              updateData.SEO.Meta_Image = ogImageId;
            }

            if (exist) {
              await strapi.documents('api::outlet.outlet').update({
                documentId: exist.documentId,
                data: updateData,
                populate: ['SEO', 'SEO.Meta_Image'],
                status: 'published',
              });
            } else {
              await strapi.documents('api::outlet.outlet').create({
                data: {
                  Slug: outlet.slug,
                  Title: outlet?.page_heading,
                  SEO: {
                    ...updateData.SEO,
                    Meta_Image: ogImageId
                  }
                },
                populate: ['SEO', 'SEO.Meta_Image'],
                status: 'published'
              });
            }

            console.log('SUCCESS');
          } catch (error) {
            console.log('FAILED');
            console.log(`Error processing item with slug ${outlet.slug}:`, error.message);
            nonDetailSlugs.push({ slug: outlet.slug, problem: error.message });
            continue;
          }
        }
        console.log('COMPLETED');
      } catch (error) {
        console.log(`Error fetching page :`, error.message);
        nonDetailSlugs.push({ slug: `Page `, problem: error.message });
      }

      console.log("Non-detail pages:", nonDetailSlugs);
      ctx.body = { success: true, msg: "Process completed", nonDetailSlugs };
    } catch (err) {
      ctx.body = err;
    }
  },
};
