"use strict";

const axios = require("axios");
const ExcelJS = require("exceljs");

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {
  fetchCombinationPage: async (ctx, next) => {
    try {
      console.log("models");
      const nonDetailSlugs = [];

      const verifySlug = (slug) => {
        if (!slug) {
          return "Slug is empty";
        }
        if (typeof slug !== "string") {
          return "Slug is not a string";
        }

        // Generate a clean slug if invalid
        if (slug.length > 100 || !/^[a-z0-9-]+$/.test(slug)) {
          return slug
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-") // Replace invalid chars with -
            .replace(/-+/g, "-") // Replace multiple - with single -
            .replace(/^-|-$/g, "") // Remove leading/trailing -
            .substring(0, 100); // Truncate to max length
        }

        return null; // Slug is valid
      };

      const data = await axios.get(
        "https://indususedcars.com/api/combination-pages"
      );
      console.log(data);

      // Process pages from 1 to 40
      for (let page = 1; page <= data?.data?.last_page; page++) {
        console.log(`processing page ${page}`);

        try {
          const pageData = await axios.get(
            `https://indususedcars.com/api/combination-pages?page=${page}`
          );

          for (const model of pageData.data?.data) {
            try {
              let slug = model.slug;
              const slugError = verifySlug(slug);
              if (slugError) {
                slug = slugError;
                nonDetailSlugs.push({
                  slug: model.slug,
                  problem: "Invalid slug, generated new one",
                });
              }

              const existingModel = await strapi
                .documents("api::combination-page.combination-page")
                .findFirst({
                  filters: { Slug: slug },
                });

              if (!existingModel) {
                try {
                  const modelData = await axios.get(
                    `https://indususedcars.com/api/combination-pages/${model.slug}`
                  );

                  if ([200, 201].includes(modelData.status)) {
                    let uploadedImage = null;
                    if (modelData?.data?.og_image?.file_path) {
                      const imageResponse = await axios.get(
                        `https://indususedcars.com/${modelData.data.og_image.file_path}`,
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

                    const createdCombinationPage = await strapi
                      .documents("api::combination-page.combination-page")
                      .create({
                        data: {
                          Slug: slug,
                          Page_Heading: modelData?.data?.page_heading,
                          Top_Description: modelData?.data?.top_description,
                          Bottom_Description:
                            modelData?.data?.bottom_description,
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

                    console.log(createdCombinationPage);
                  }
                } catch (error) {
                  if (error.response?.status === 404) {
                    console.log(`No detail page found for slug: ${slug}`);
                    nonDetailSlugs.push({
                      slug: model.slug,
                      problem: "No detail page found",
                    });
                  } else {
                    throw error;
                  }
                }
              } else {
                // Update the Slug if the model already exists
                // await strapi
                //   .documents("api::combination-page.combination-page")
                //   .update({
                //     documentId: existingModel.documentId,
                //     data: {
                //       Slug: slug,
                //     },
                //   });
                const extractSlug = model?.slug?.startsWith("used")
                  ? model?.slug?.split("-")
                  : null;
                if (extractSlug?.length == 3) {
                  const locationSlug = model?.slug?.split("-")[2];
                  const locationExist = await strapi
                    .documents("api::location.location")
                    .findFirst({
                      filters: {
                        Slug: locationSlug,
                      },
                    });

                  // let brandSlug = model?.slug?.split('-')[1];

                  // const brandExist = await strapi.documents('api::brand.brand').findFirst({
                  //   filters: {
                  //     Slug: brandSlug
                  //   }
                  // })

                  // if (!brandExist) {
                  //   await strapi.documents('api::brand.brand').create({
                  //     data: {
                  //       Slug: brandSlug,
                  //       Name: brandSlug?.charAt(0).toUpperCase() + brandSlug?.slice(1),
                  //     }
                  //   })
                  // }

                  if (!locationExist) {
                    await strapi.documents("api::location.location").create({
                      data: {
                        Slug: locationSlug,
                        Name:
                          locationSlug?.charAt(0).toUpperCase() +
                          locationSlug?.slice(1),
                      },
                    });
                  } else {
                    await strapi.documents("api::location.location").update({
                      documentId: locationExist.documentId,
                      data: {
                        Place:
                          locationSlug?.charAt(0).toUpperCase() +
                          locationSlug?.slice(1),
                        Slug: locationSlug?.toLowerCase(),
                      },
                      status: "published",
                    });
                    console.log("updated location");
                  }
                  console.log(
                    `Updated Slug for existing model: ${slug},location:${locationSlug}`
                  );
                }
              }
            } catch (error) {
              // Log error for this specific item and continue with next
              console.log(
                `Error processing item with slug ${model.slug}:`,
                error.message
              );
              nonDetailSlugs.push({ slug: model.slug, problem: error.message });
              continue; // Skip to next item instead of breaking the entire page
            }
          }
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
  list: async (ctx, next) => {
    try {
      const { page = 1, limit = 10 } = ctx.query;

      const data = await strapi
        .documents("api::combination-page.combination-page")
        .findMany({
          start: (page - 1) * limit,
          limit: limit,
        });
      ctx.status = 200;
      ctx.body = data;
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  detail: async (ctx, next) => {
    const { slug } = ctx.params;
    try {
      const data = await strapi
        .documents("api::combination-page.combination-page")
        .findFirst({
          filters: {
            Slug: slug,
          },
          populate: {
            FAQ: { populate: "*" },
            Brand: {
              populate: "*",
            },
            Model: {
              populate: "*",
            },
            Location: {
              populate: "*",
            },
            SEO: {
              populate: {
                Meta_Image: {
                  populate: "*",
                },
              },
            },
          },
        });

      if (!data) {
        ctx.status = 404;
        ctx.body = {
          error: "Not Found",
        };
        return;
      }

      ctx.status = 200;
      ctx.body = data;
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  carsList: async (ctx, next) => {
    try {
      const { slug } = ctx.params;
      const { page = 1, limit = 10, high } = ctx.query;
      console.log("yes", slug);

      //slug=used-maruti-kochi
      const extract = slug.split("-");
      let brand, location;
      if (extract?.length == 3) {
        brand = extract[1];
        location = extract[2];
      } else if (extract?.length == 1) {
        brand = extract[0];
      }
      console.log(extract);

      const fetchPage = await strapi
        .documents("api::combination-page.combination-page")
        .findFirst({
          filters: {
            Slug: slug,
          },
          populate: {
            Brand: {
              populate: "*",
            },
            Location: {
              populate: "*",
            },
            Model: {
              populate: "*",
            },
          },
          
        });

      console.log(fetchPage);

      if (!fetchPage) {
        ctx.status = 404;
        ctx.body = {
          err: "Not Found",
        };
        return;
      }

      switch (fetchPage?.Related_Type) {
        case `App\\Models\\Indus\\Model`:
          console.log(fetchPage?.Slug);

          const [data, count] = await Promise.all([
            strapi.documents("api::car.car").findMany({
              filters: {
                Model: {
                  Slug: fetchPage?.Slug,
                },
              },
              start: (page - 1) * limit,
              limit: limit,
              populate: ["Model", "Brand"],
            }),
            strapi.documents("api::car.car").count({
              filters: {
                Model: {
                  Slug: fetchPage?.Slug,
                },
              },
              populate: ["Model"],
            }),
          ]);

          console.log({ data, count });

          ctx.status = 200;
          ctx.body = {
            data: data,
            meta: {
              pagination: {
                total: count,
                page: page,
                pageSize: limit,
                pageCount: Math.ceil(data.length / limit),
                last_page: Math.ceil(data.length / limit),
              },
            },
          };

          return;

        case `App\\Models\\Indus\\Brand`:
          console.log("yes");

          const [data1, count1] = await Promise.all([
            strapi.documents("api::car.car").findMany({
              filters: {
                Brand: {
                  Slug: fetchPage?.Slug,
                },
              },
              start: (page - 1) * limit,
              limit: limit,
              populate: {
                Model: {
                  populate: "*",
                },
                Brand: {
                  populate: "*",
                },
                Location: {
                  populate: "*",
                },
              },
            }),
            strapi.documents("api::car.car").count({
              filters: {
                Brand: {
                  Slug: fetchPage?.Slug,
                },
              },
              populate: ["Brand"],
            }),
          ]);

          console.log({ data1, count1 });

          ctx.status = 200;
          ctx.body = {
            data: data1,
            meta: {
              pagination: {
                total: count1,
                page: page,
                pageSize: limit,
                pageCount: Math.ceil(data1.length / limit),
                last_page: Math.ceil(data1.length / limit),
              },
            },
          };

          return;

        case `App\\Models\\Indus\\Variant`:
          const [data2, count2] = await Promise.all([
            strapi.documents("api::car.car").findMany({
              filters: {
                Variant: fetchPage?.Slug,
              },
              start: (page - 1) * limit,
              limit: limit,
              populate: {
                Model: {
                  populate: "*",
                },
                Brand: {
                  populate: "*",
                },
                Location: {
                  populate: "*",
                },
                Fuel_Type: {
                  populate: "*",
                },
              },
            }),
            strapi.documents("api::car.car").count({
              filters: {
                Brand: {
                  Slug: fetchPage?.Slug,
                },
              },
              populate: ["Brand"],
            }),
          ]);

          console.log({ data2, count2 });

          ctx.status = 200;
          ctx.body = {
            data: data2,
            meta: {
              pagination: {
                total: count2,
                page: page,
                pageSize: limit,
                pageCount: Math.ceil(data2.length / limit),
                last_page: Math.ceil(data2.length / limit),
              },
            },
          };
          return;

        case `App\\Models\\BrandDistrict`:
          if (fetchPage?.Brand != null && fetchPage?.Location != null) {
            const [data3, count3] = await Promise.all([
              strapi.documents("api::car.car").findMany({
                filters: {
                  Brand: {
                    Slug: fetchPage?.Brand?.Slug,
                  },
                  Location: {
                    Slug: fetchPage?.Location?.Slug,
                  },
                },
                start: (page - 1) * limit,
                limit: limit,
                populate: {
                  Model: {
                    populate: "*",
                  },
                  Brand: {
                    populate: "*",
                  },
                  Location: {
                    populate: "*",
                  },
                  Fuel_Type: {
                    populate: "*",
                  },
                },
              }),
              strapi.documents("api::car.car").count({
                filters: {
                  Brand: {
                    Slug: fetchPage?.Brand?.Slug,
                  },
                  Location: {
                    Slug: fetchPage?.Location?.Slug,
                  },
                },
                populate: ["Brand"],
              }),
            ]);

            console.log({ data3, count3 });

            ctx.status = 200;
            ctx.body = {
              data: data3,
              meta: {
                pagination: {
                  total: count3,
                  page: page,
                  pageSize: limit,
                  pageCount: Math.ceil(data3.length / limit),
                  last_page: Math.ceil(data3.length / limit),
                },
              },
            };
          } else if (fetchPage?.Brand != null && fetchPage?.Location == null) {
            const [data3, count3] = await Promise.all([
              strapi.documents("api::car.car").findMany({
                filters: {
                  Brand: {
                    Slug: fetchPage?.Brand?.Slug,
                  },
                },
                start: (page - 1) * limit,
                limit: limit,
                populate: {
                  Model: {
                    populate: "*",
                  },
                  Brand: {
                    populate: "*",
                  },
                  Location: {
                    populate: "*",
                  },
                  Fuel_Type: {
                    populate: "*",
                  },
                },
              }),
              strapi.documents("api::car.car").count({
                filters: {
                  Brand: {
                    Slug: fetchPage?.Brand?.Slug,
                  },
                },
                populate: ["Brand"],
              }),
            ]);

            console.log({ data3, count3 });

            ctx.status = 200;
            ctx.body = {
              data: data3,
              meta: {
                pagination: {
                  total: count3,
                  page: page,
                  pageSize: limit,
                  pageCount: Math.ceil(data3.length / limit),
                  last_page: Math.ceil(data3.length / limit),
                },
              },
            };
          } else if (fetchPage?.Brand == null && fetchPage?.Location != null) {
            const [data3, count3] = await Promise.all([
              strapi.documents("api::car.car").findMany({
                filters: {
                  Location: {
                    Slug: fetchPage?.Location?.Slug,
                  },
                },
                start: (page - 1) * limit,
                limit: limit,
                populate: {
                  Model: {
                    populate: "*",
                  },
                  Brand: {
                    populate: "*",
                  },
                  Location: {
                    populate: "*",
                  },
                  Fuel_Type: {
                    populate: "*",
                  },
                },
              }),
              strapi.documents("api::car.car").count({
                filters: {
                  Location: {
                    Slug: fetchPage?.Location?.Slug,
                  },
                },
                populate: ["Brand"],
              }),
            ]);

            console.log({ data3, count3 });

            ctx.status = 200;
            ctx.body = {
              data: data3,
              meta: {
                pagination: {
                  total: count3,
                  page: page,
                  pageSize: limit,
                  pageCount: Math.ceil(data3.length / limit),
                  last_page: Math.ceil(data3.length / limit),
                },
              },
            };
          }

          return;

        case "App\\Models\\BrandLocation":
          if (fetchPage?.Outlet != null && fetchPage?.Brand != null) {
            const [data3, count3] = await Promise.all([
              strapi.documents("api::car.car").findMany({
                filters: {
                  Outlet: {
                    Slug: fetchPage?.Outlet?.Slug,
                  },
                  Brand: {
                    Slug: fetchPage?.Brand?.Slug,
                  },
                },
                start: (page - 1) * limit,
                limit: limit,
                populate: {
                  Model: {
                    populate: "*",
                  },
                  Brand: {
                    populate: "*",
                  },
                  Location: {
                    populate: "*",
                  },
                  Fuel_Type: {
                    populate: "*",
                  },
                  Outlet: {
                    populate: "*",
                  },
                },
              }),
              strapi.documents("api::car.car").count({
                filters: {
                  Outlet: {
                    Slug: fetchPage?.Outlet?.Slug,
                  },
                  Brand: {
                    Slug: fetchPage?.Brand?.Slug,
                  },
                },
                populate: ["Brand", "Outlet"],
              }),
            ]);

            console.log({ data3, count3 });

            ctx.status = 200;
            ctx.body = {
              data: data3,
              meta: {
                pagination: {
                  total: count3,
                  page: page,
                  pageSize: limit,
                  pageCount: Math.ceil(data3.length / limit),
                  last_page: Math.ceil(data3.length / limit),
                },
              },
            };
          } else if (fetchPage?.Outlet == null && fetchPage?.Brand != null) {
            const [data3, count3] = await Promise.all([
              strapi.documents("api::car.car").findMany({
                filters: {
                  Brand: {
                    Slug: fetchPage?.Brand?.Slug,
                  },
                },
                start: (page - 1) * limit,
                limit: limit,
                populate: {
                  Model: {
                    populate: "*",
                  },
                  Brand: {
                    populate: "*",
                  },
                  Location: {
                    populate: "*",
                  },
                  Fuel_Type: {
                    populate: "*",
                  },
                  Outlet: {
                    populate: "*",
                  },
                },
              }),
              strapi.documents("api::car.car").count({
                filters: {
                  Brand: {
                    Slug: fetchPage?.Brand?.Slug,
                  },
                },
                populate: ["Brand"],
              }),
            ]);

            console.log({ data3, count3 });

            ctx.status = 200;
            ctx.body = {
              data: data3,
              meta: {
                pagination: {
                  total: count3,
                  page: page,
                  pageSize: limit,
                  pageCount: Math.ceil(data3.length / limit),
                  last_page: Math.ceil(data3.length / limit),
                },
              },
            };
          } else if (fetchPage?.Outlet != null && fetchPage?.Brand == null) {
            const [data3, count3] = await Promise.all([
              strapi.documents("api::car.car").findMany({
                filters: {
                  Outlet: {
                    Slug: fetchPage?.Outlet?.Slug,
                  },
                },
                start: (page - 1) * limit,
                limit: limit,
                populate: {
                  Model: {
                    populate: "*",
                  },
                  Brand: {
                    populate: "*",
                  },
                  Location: {
                    populate: "*",
                  },
                  Fuel_Type: {
                    populate: "*",
                  },
                  Outlet: {
                    populate: "*",
                  },
                },
              }),
              strapi.documents("api::car.car").count({
                filters: {
                  Outlet: {
                    Slug: fetchPage?.Outlet?.Slug,
                  },
                },
                populate: ["Outlet"],
              }),
            ]);

            console.log({ data3, count3 });

            ctx.status = 200;
            ctx.body = {
              data: data3,
              meta: {
                pagination: {
                  total: count3,
                  page: page,
                  pageSize: limit,
                  pageCount: Math.ceil(data3.length / limit),
                  last_page: Math.ceil(data3.length / limit),
                },
              },
            };
          }

          return;

        default:
          break;
      }
      const [data, count] = await Promise.all([
        strapi.documents("api::car.car").findMany({
          filters: {
            Brand: {
              Slug: fetchPage?.Brand?.Slug,
            },
            Location: {
              Slug: fetchPage?.Location?.Slug,
            },
          },
          start: (page - 1) * limit,
          limit: limit,
          populate: {
            Brand: {
              populate: "*",
            },
            Location: {
              populate: "*",
            },
            Image: {
              populate: "*",
            },
          },
        }),
        strapi.documents("api::car.car").count({
          filters: {
            Brand: {
              Slug: fetchPage?.Brand?.Slug,
            },
            Location: {
              Slug: fetchPage?.Location?.Slug,
            },
          },
        }),
      ]);
      ctx.status = 200;
      ctx.body = {
        data: data,
        meta: {
          pagination: {
            total: count,
            page: page,
            pageSize: limit,
            pageCount: Math.ceil(data.length / limit),
            last_page: Math.ceil(data.length / limit),
          },
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
};
