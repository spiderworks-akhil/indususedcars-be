"use strict";

const axios = require("axios");

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  getBySlug: async (ctx, next) => {
    try {
      const { slug } = ctx.params;

      const findBrand = await strapi.documents("api::brand.brand").findFirst({
        filters: {
          Slug: slug,
        },
        populate: {
          SEO: {
            populate: {
              Meta_Image: {
                populate: "*",
              },
            },
          },
        },
      });

      console.log({ findBrand });

      if (!findBrand) {
        ctx.status = 404;
        ctx.body = {
          err: "Brand Not Found",
        };

        return;
      }

      ctx.status = 200;
      ctx.body = {
        data: findBrand,
      };
    } catch (err) {
      ctx.body = err;
    }
  },

  fetchBrand: async (ctx, next) => {
    try {
      const brandPages = await strapi.documents('api::combination-page.combination-page').findMany({
        filters: {
          Related_Type: "App\\Models\\Indus\\Brand"
        },
        populate: ['SEO', 'SEO.Meta_Image']
      });

      const processedBrands = [];
      
      for (const page of brandPages) {
        try {
          const brandSlug = page.slug.split('-')[1]; // Assuming format is "brand-{brandSlug}"
          const existingBrand = await strapi.documents('api::brand.brand').findFirst({
            filters: {
              Slug: brandSlug
            }
          });

          const brandData = {
            Slug: brandSlug,
            Name: brandSlug?.charAt(0).toUpperCase() + brandSlug?.slice(1),
            SEO: page.SEO,
            status: 'published'
          };

          if (existingBrand) {
            // Update existing brand
            const updatedBrand = await strapi.documents('api::brand.brand').update({
              documentId: existingBrand.documentId,
              data: brandData,
              status: 'published'
            });
            processedBrands.push({ slug: brandSlug, action: 'updated', data: updatedBrand });
          } else {
            // Create new brand
            const newBrand = await strapi.documents('api::brand.brand').create({
              data: brandData,
              status: 'published'
            });
            processedBrands.push({ slug: brandSlug, action: 'created', data: newBrand });
          }
        } catch (error) {
          processedBrands.push({ 
            slug: page.slug, 
            error: error.message,
            problem: 'Failed to process brand'
          });
          continue;
        }
      }

      ctx.status = 200;
      ctx.body = {
        success: true,
        processedCount: processedBrands.length,
        details: processedBrands
      };

    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        error: error.message,
        message: 'Failed to process brands'
      };
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

    try {
      console.log("brands");
      const nonDetailSlugs = [];

      const data = await fetchWithRetry(
        `${process.env.OLD_BACKEND_URL}/api/combination-pages?page=1&limit=1000`
      );
      console.log(data);

      // Process pages from 1 to 40
      for (let page = 1; page <= data?.data?.last_page; page++) {
        console.log(`processing page ${page}`);

        try {
          const pageData = await fetchWithRetry(
            `${process.env.OLD_BACKEND_URL}/api/combination-pages?page=${page}&limit=1000`
          );

          for (const brand of pageData.data?.data) {
            try {
              if (brand.related_type === 'App\\Models\\Indus\\Brand') {
                const fetchData = await fetchWithRetry(
                  `${process.env.OLD_BACKEND_URL}/api/combination-pages/${brand?.slug}`
                );

                const exist = await strapi.documents('api::brand.brand').findFirst({
                  filters: {
                    Slug: brand.slug
                  }
                })

                if (exist) {
                  await strapi.documents('api::brand.brand').update({
                    documentId: exist.documentId,
                    data: {
                      Page_Heading: fetchData?.data?.page_heading,
                      SEO: {
                        Meta_Title: fetchData?.data?.browser_title,
                        Meta_Description: fetchData?.data?.meta_description,
                        Keywords: fetchData?.data?.meta_keywords,
                        OG_Title: fetchData?.data?.browser_title,
                        OG_Description: fetchData?.data?.meta_description,
                        Bottom_Description: fetchData?.data?.bottom_description == null ? fetchData?.data?.top_description : fetchData?.data?.bottom_description,
                        Top_Description: fetchData?.data?.top_description == null ? null : fetchData?.data?.bottom_description,
                        Extra_JS: fetchData?.data?.extra_js
                      }
                    },
                    populate: ['SEO', 'SEO.Meta_Image'],
                    status: 'published',
                  })
                } else {
                  await strapi.documents('api::brand.brand').create({
                    data: {
                      Slug: brand.slug,
                      Page_Heading: fetchData?.data?.page_heading,
                      SEO: {
                        Meta_Title: fetchData?.data?.browser_title,
                        Meta_Description: fetchData?.data?.meta_description,
                        Keywords: fetchData?.data?.meta_keywords,
                        OG_Title: fetchData?.data?.browser_title,
                        OG_Description: fetchData?.data?.meta_description,
                        Bottom_Description: fetchData?.data?.bottom_description == null ? fetchData?.data?.top_description : fetchData?.data?.bottom_description,
                        Top_Description: fetchData?.data?.top_description == null ? null : fetchData?.data?.bottom_description,
                        Extra_JS: fetchData?.data?.extra_js
                      }
                    },
                    populate: ['SEO', 'SEO.Meta_Image'],
                    status: 'published'
                  })
                }

                console.log('SUCCESS');
              }
            } catch (error) {
              console.log('FAILED');
              console.log(
                `Error processing item with slug ${brand.slug}:`,
                error.message
              );
              nonDetailSlugs.push({ slug: brand.slug, problem: error.message });
              continue;
            }
          }
          console.log('COMPLETED');
        } catch (error) {
          console.log(`Error fetching page ${page}:`, error.message);
          nonDetailSlugs.push({ slug: `Page ${page}`, problem: error.message });
          continue;
        }
      }

      console.log("Non-detail pages:", nonDetailSlugs);
      ctx.body = { success: true, msg: "Process completed", nonDetailSlugs };
    } catch (err) {
      ctx.body = err;
    }
  },
};
