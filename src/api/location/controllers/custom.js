'use strict';

const axios = require("axios");

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
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
      console.log("locations");
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

          for (const location of pageData.data?.data) {
            try {
              if (location.related_type === 'App\\Models\\Indus\\Location') {
                const fetchData = await fetchWithRetry(
                  `${process.env.OLD_BACKEND_URL}/api/combination-pages/${location?.slug}`
                );

                const exist = await strapi.documents('api::location.location').findFirst({
                  filters: {
                    Slug: location.slug
                  }
                })

                if (exist) {
                  await strapi.documents('api::location.location').update({
                    documentId: exist.documentId,
                    data: {
                      Title: fetchData?.data?.page_heading,
                      SEO: {
                        Meta_Title: fetchData?.data?.browser_title,
                        Meta_Description: fetchData?.data?.meta_description,
                        Keywords: fetchData?.data?.meta_keywords,
                        OG_Title: fetchData?.data?.browser_title,
                        OG_Description: fetchData?.data?.meta_description,
                        Bottom_Description: fetchData?.data?.top_description,
                        Top_Description: exist?.Description,
                        Extra_JS: fetchData?.data?.extra_js
                      }
                    },
                    populate: ['SEO', 'SEO.Meta_Image'],
                    status: 'published',
                  })
                } else {
                  await strapi.documents('api::location.location').create({
                    data: {
                      Slug: location.slug,
                      Title: fetchData?.data?.page_heading,
                      SEO: {
                        Meta_Title: fetchData?.data?.browser_title,
                        Meta_Description: fetchData?.data?.meta_description,
                        Keywords: fetchData?.data?.meta_keywords,
                        OG_Title: fetchData?.data?.browser_title,
                        OG_Description: fetchData?.data?.meta_description,
                        Bottom_Description: fetchData?.data?.top_description,
                        Top_Description: fetchData?.data?.top_description == null ? null : fetchData?.data?.top_description,
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
                `Error processing item with slug ${location.slug}:`,
                error.message
              );
              nonDetailSlugs.push({ slug: location.slug, problem: error.message });
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
