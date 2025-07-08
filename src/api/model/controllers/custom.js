const axios = require("axios");
const { Blob } = require("buffer");
const ExcelJS = require("exceljs");
("use strict");

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  fetchModels: async (ctx, next) => {
    try {
      console.log("models");
      const nonDetailSlugs = [];
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Issues");

      worksheet.columns = [
        { header: "Slug", key: "slug", width: 50 },
        { header: "Problem", key: "problem", width: 100 },
      ];

      const verifySlug = (slug) => {
        if (!slug) return "Slug is empty";
        if (typeof slug !== "string") return "Slug is not a string";
        if (slug.length > 100) return "Slug is too long (max 100 characters)";
        if (!/^[a-z0-9-]+$/.test(slug))
          return "Slug contains invalid characters";
        return null;
      };

      const data = await axios.get(
        `${process.env.OLD_BACKEND_URL}/api/combination-pages`
      );

      // Process pages from 1 to 40
      for (let page = 1; page <= data?.data?.meta?.last_page; page++) {
        console.log(`processing page ${page}`);

        try {
          const pageData = await axios.get(
            `${process.env.OLD_BACKEND_URL}/api/combination-pages?page=${page}`
          );

          for (const model of pageData.data?.data) {
            const slugError = verifySlug(model.slug);
            if (slugError) {
              worksheet.addRow({ slug: model.slug, problem: slugError });
              continue;
            }

            const existingModel = await strapi
              .documents("api::model.model")
              .findFirst({
                filters: { Slug: model.slug },
              });

            if (!existingModel) {
              try {
                const modelData = await axios.get(
                  `${process.env.OLD_BACKEND_URL}/api/combination-pages/${model.slug}`
                );

                if ([200, 201].includes(modelData.status)) {
                  let uploadedImage = null;
                  if (modelData?.data?.og_image?.file_path) {
                    const imageResponse = await axios.get(
                      `${process.env.OLD_BACKEND_URL}/${modelData.data.og_image.file_path}`,
                      { responseType: "arraybuffer" }
                    );

                    const formData = new FormData();
                    const imageBlob = new Blob(
                      [Buffer.from(imageResponse.data)],
                      { type: imageResponse.headers["content-type"] }
                    );
                    formData.append(
                      "files",
                      imageBlob,
                      modelData.data.og_image.file_path.split("/").pop()
                    );

                    const uploadResponse =
                      await strapi.plugins.upload.services.upload.upload({
                        data: {},
                        files: formData,
                      });

                    if (uploadResponse?.length > 0) {
                      uploadedImage = uploadResponse[0].id;
                    }
                  }

                  const createdModel = await strapi
                    .documents("api::model.model")
                    .create({
                      data: {
                        Name: modelData?.data?.page_heading,
                        Slug: modelData?.data?.slug,
                        Page_Heading: modelData?.data?.page_heading,
                        Top_Description: modelData?.data?.top_description,
                        Bottom_Description: modelData?.data?.bottom_description,
                        Extra_JS: modelData?.data?.extra_js,
                        Related_Type: modelData?.data?.related_type,
                        FAQ: {
                          Title: modelData?.data?.faq?.name,
                        },
                        SEO: {
                          Meta_Title: modelData?.data?.browser_title,
                          Meta_Description: modelData?.data?.meta_description,
                          Meta_Keywords: modelData?.data?.meta_keywords,
                          Meta_Image:
                            uploadedImage || modelData?.data?.og_image_id,
                          OG_Title: modelData?.data?.og_title,
                          OG_Description: modelData?.data?.og_description,
                        },
                      },
                      status: "published",
                      populate: ["SEO", "FAQ"],
                    });

                  console.log(createdModel);
                }
              } catch (error) {
                if (error.response?.status === 404) {
                  console.log(`No detail page found for slug: ${model.slug}`);
                  worksheet.addRow({
                    slug: model.slug,
                    problem: "No detail page found",
                  });
                } else {
                  throw error;
                }
              }
            }
          }
        } catch (error) {
          worksheet.addRow({ slug: `Page ${page}`, problem: error.message });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      ctx.set(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      ctx.set("Content-Disposition", `attachment; filename="issues.xlsx"`);
      ctx.body = { success: true, data: buffer, msg: "uploaded Successfully" };
    } catch (err) {
      ctx.body = err;
    }
  },
  addBrand: async (ctx, next) => {
    console.log("brand");

    try {
      const models = await strapi.documents("api::model.model").findMany({
        filters: {},
        populate: "*",
      });
      console.log(models);

      for (const model of models) {
        const findModel = await strapi.documents("api::car.car").findFirst({
          filters: {
            Model: {
              Slug: {
                $eq: model.Slug,
              },
            },
          },
          populate: "*",
        });
        console.log({ model: findModel });

        if (findModel?.Brand) {
          console.log("yes");
          console.log({ Brand_Detail: findModel?.Brand });

          await strapi.documents("api::model.model").update({
            documentId: model.documentId,
            data: {
              Brand: findModel?.Brand?.documentId,
            },
            status: "published",
          });
        }
      }
      console.log("completed");

      ctx.status = 200;
      ctx.body = {
        msg: "success",
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  fetchBySlug: async (ctx, next) => {
    try {
      const { slug } = ctx.params;

      const findModel = await strapi.documents("api::model.model").findFirst({
        filters: {
          Slug: slug,
        },
        populate: {
          SEO: {
            populate: {
              Meta_Image: {
                populate: '*',
              },
            },
          },
        },
      });

      if (!findModel) {
        ctx.status = 404;
        ctx.body = {
          err: "Not Found",
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        data: findModel,
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
      console.log("models");
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

          for (const model of pageData.data?.data) {
            try {

              if (model.related_type === 'App\\Models\\Indus\\Model') {

                const fetchData = await fetchWithRetry(
                  `${process.env.OLD_BACKEND_URL}/api/combination-pages/${model?.slug}`
                );

                const exist = await strapi.documents('api::model.model').findFirst({
                  filters: {
                    Slug: model.slug
                  }
                })

                if (exist) {
                  await strapi.documents('api::model.model').update({
                    documentId: exist.documentId,
                    filters: {
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
                  await strapi.documents('api::model.model').create({
                    data: {
                      Slug: model.slug,
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

              // Log error for this specific item and continue with next
              console.log(
                `Error processing item with slug ${model.slug}:`,
                error.message
              );
              nonDetailSlugs.push({ slug: model.slug, problem: error.message });
              continue; // Skip to next item instead of breaking the entire page
            }
          }
          console.log('COMPLETED');

        } catch (error) {
          // Only log page-level errors (like network issues) but continue processing
          console.log(`Error fetching page ${page}:`, error.message);
          nonDetailSlugs.push({ slug: `Page ${page}`, problem: error.message });
          continue; // Continue to next page
        }
      }

      console.log("Non-detail pages:", nonDetailSlugs);
      ctx.body = { success: true, msg: "Process completed", nonDetailSlugs };
    } catch (err) {
      ctx.body = err;
    }
  },
};
