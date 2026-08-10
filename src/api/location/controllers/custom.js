"use strict";

const axios = require("axios");

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  findAll: async (ctx, next) => {
    try {
      const { keyword = "", page = 1, limit = 10 } = ctx.query;

      // Calculate pagination values
      const start = (parseInt(page) - 1) * parseInt(limit);
      const end = start + parseInt(limit);

      // Find all locations with case-insensitive search in ascending order
      const locations = await strapi
        .documents("api::location.location")
        .findMany({
          filters: {
            $or: [{ Place: { $containsi: keyword } }],
          },
          limit: parseInt(limit),
          start: start,
          orderBy: { Place: "asc" }, // Added ascending order by Place
        });

      // Get total count for pagination
      const total = await strapi.documents("api::location.location").count({
        filters: {
          $or: [{ Place: { $containsi: keyword } }],
        },
      });

      ctx.status = 200;
      ctx.body = {
        data: locations,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(limit),
            total: total,
            pageCount: Math.ceil(total / limit),
          },
        },
      };
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
              console.log(
                `429 Too Many Requests for ${url}. Waiting 20 seconds before retrying (attempt ${attempt + 1}/${retries})...`
              );
              await sleep(20000); // 20 seconds
              continue;
            }
          }
          throw error;
        }
      }
    };

    try {
      const nonDetailSlugs = [];

      const data = await fetchWithRetry(
        `${process.env.OLD_BACKEND_URL}/api/combination-pages?page=1&limit=1000`
      );

      // Process pages from 1 to 40
      for (let page = 1; page <= data?.data?.last_page; page++) {

        try {
          const pageData = await fetchWithRetry(
            `${process.env.OLD_BACKEND_URL}/api/combination-pages?page=${page}&limit=1000`
          );

          for (const location of pageData.data?.data) {
            try {
              if (location.related_type === "App\\Models\\Indus\\Location") {
                const fetchData = await fetchWithRetry(
                  `${process.env.OLD_BACKEND_URL}/api/combination-pages/${location?.slug}`
                );

                const exist = await strapi
                  .documents("api::location.location")
                  .findFirst({
                    filters: {
                      Slug: location.slug,
                    },
                  });

                if (exist) {
                  await strapi.documents("api::location.location").update({
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
                        Extra_JS: fetchData?.data?.extra_js,
                      },
                    },
                    populate: ["SEO", "SEO.Meta_Image"],
                    status: "published",
                  });
                } else {
                  await strapi.documents("api::location.location").create({
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
                        Top_Description:
                          fetchData?.data?.top_description == null
                            ? null
                            : fetchData?.data?.top_description,
                        Extra_JS: fetchData?.data?.extra_js,
                      },
                    },
                    populate: ["SEO", "SEO.Meta_Image"],
                    status: "published",
                  });
                }

              }
            } catch (error) {
              nonDetailSlugs.push({
                slug: location.slug,
                problem: error.message,
              });
              continue;
            }
          }
        } catch (error) {
          nonDetailSlugs.push({ slug: `Page ${page}`, problem: error.message });
          continue;
        }
      }

      ctx.body = { success: true, msg: "Process completed", nonDetailSlugs };
    } catch (err) {
      ctx.body = err;
    }
  },
  getBySlug: async (ctx, next) => {
    try {
      const { slug } = ctx.params;
      const findLocation = await strapi
        .documents("api::location.location")
        .findFirst({
          filters: {
            Slug: slug,
          },
          populate: [
            "SEO",
            "SEO.Meta_Image",
            "Outlets",
            "Benefit_Section",
            "FAQ",
            "FAQ.Questions",
            "Assurance_Section",
            "Exclusive_Section",
            "Offer_Section",
          ],
        });

      if (!findLocation) {
        ctx.status = 404;
        ctx.body = {
          err: "Not Found",
        };

        return;
      }

      ctx.status = 200;
      ctx.body = {
        data: findLocation,
      };
    } catch (error) {
      ctx.status = 404;
      ctx.body = {
        err: error?.message,
      };
    }
  },
};
