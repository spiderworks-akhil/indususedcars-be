'use strict';

const axios = require("axios");

/**
 * A set of functions called "actions" for `custom`
 */

module.exports = {

  fetchDealers: async (ctx, next) => {
    const verifyAndTransformSlug = (slug) => {
      if (!slug) return "";
      let transformedSlug = String(slug).toLowerCase();
      transformedSlug = transformedSlug
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return transformedSlug.substring(0, 100);
    };

    try {
      const fetchDealerAPI = await axios.get('https://indususedcars.com/api/dealers');
      const dealerList = fetchDealerAPI.data;
      
      console.log('Total dealers to process:', dealerList.length);

      for (const dealer of dealerList) {
        try {
          console.log('Processing dealer:', dealer?.location?.slug);
          const findDealer = await strapi.documents('api::dealer-list.dealer-list').findFirst({
            filters: {
              Slug: dealer?.meta_data?.slug
            },
            populate: {
              Outlet: {
                populate: '*'
              },
              Dealer_Detail: {
                populate: '*'
              },
              Head: {
                populate: '*'
              },
              Manager: {
                populate: '*'
              },
              Additional: {
                populate: '*'
              },
              SEO: {
                populate: '*'
              }
            }
          });

          if (!findDealer) {
            let outletData = null;
            console.log({slug:dealer?.location?.slug});
            
            if (dealer?.location?.slug) {
              
              const findOutlet = await strapi.documents('api::outlet.outlet').findFirst({
                filters: {
                  Slug: {
                    containsi:dealer?.meta_data?.slug
                  }
                },
                populate: {
                  Location: {
                    populate: '*'
                  }
                }
              });

              console.log({findOutlet,slug:dealer}); 
              
              if (findOutlet) {
                outletData = findOutlet;
              }
            }

            const transformedSlug = verifyAndTransformSlug(dealer?.meta_data?.slug || dealer?.dealership_name);
            const createDealer = await strapi.documents('api::dealer-list.dealer-list').create({
              data: {
                Page_Heading: dealer?.meta_data?.page_heading,
                Slug: transformedSlug,
                Top_Description: dealer?.meta_data?.top_description,
                Bottom_Description: dealer?.meta_data?.bottom_description,
                Related_Type: dealer?.meta_data?.related_type,
                Outlet: outletData, // Will be null if no outlet found
                Dealer_Detail: {
                  Name: dealer?.dealership_name,
                  Address: dealer?.address,
                  Location_Map: dealer?.location_map,
                  Landline: dealer?.landline,
                  Branch_Email: dealer?.branch_email,
                },
                Head: {
                  Name: dealer?.head,
                  Mobile_Number: dealer?.head_no,
                  Email: dealer?.head_mail,
                },
                Manager: {
                  Name: dealer?.manager,
                  Mobile_Number: dealer?.manager_no,
                  Email: dealer?.manager_mail,
                },
                Additional: {
                  Mobile_Number: dealer?.public_no,
                },
                SEO: {
                  Meta_Title: dealer?.meta_data?.meta_title?.toString(),
                  Meta_Description: dealer?.meta_data?.meta_description?.toString(),
                  OG_Title: dealer?.meta_data?.og_title?.toString(),
                  OG_Description: dealer?.meta_data?.og_description?.toString(),
                  Keywords: dealer?.meta_data?.meta_keywords?.toString(),

                }

              },
              populate: ['Dealer_Detail', 'Head', 'Manager', 'Additional', 'SEO'],
              status: 'published'
            });
            console.log('Created dealer:', transformedSlug);
          }
        } catch (dealerError) {
          console.error('Error processing dealer:', dealer?.dealership_name, dealerError);
          // Continue with next dealer even if one fails
          continue;
        }
      }

      ctx.status = 200;
      ctx.body = {
        data: 'Dealer List Created Successfully'
      };
    } catch (err) {
      console.error('Main error:', err);
      ctx.status = 500;
      ctx.body = err;
    }
  },


  // Get All Dealer List
  list: async (ctx, next) => {
    try {
      const { page = 1, limit = 12, location } = ctx.query;

      if (location) {
        const [dealersList, count] = await Promise.all([
          strapi.documents('api::dealer-list.dealer-list').findMany({
            filters: {
              Outlet: {
                Location: {
                  Slug: {
                    $containsi: location
                  }

                }
              }
            },
            populate: {
              Dealer_Detail: {
                populate: '*'
              },
              Head: {
                populate: '*'
              },
              Manager: {
                populate: '*'
              },
              Additional: {
                populate: '*'
              },
              Outlet: {
                populate: {
                  Location: {
                    populate: '*'
                  }
                }
              },
              SEO: {
                populate: {
                  Meta_Image: {
                    populate: '*'
                  }
                }
              }
            },
            start: (page - 1) * limit,
            limit: limit
          }),
          strapi.documents('api::dealer-list.dealer-list').count({
            filters: {
              Outlet: {
                Location: {
                  Slug: {
                    $containsi: location
                  }

                }
              }
            }
          })
        ])

        ctx.status = 200;
        ctx.body = {
          data: dealersList,
          meta: {
            page: page,
            limit: limit,
            last_Page: Math.ceil(count / limit),
            total: count
          }
        }
        return;

      }

      const [dealersList, count] = await Promise.all([
        strapi.documents('api::dealer-list.dealer-list').findMany({
          filters: {},
          populate: {
            Dealer_Detail: {
              populate: '*'
            },
            Head: {
              populate: '*'
            },
            Manager: {
              populate: '*'
            },
            Additional: {
              populate: '*'
            },
            Outlet: {
              populate: '*'
            },
            SEO: {
              populate: {
                Meta_Image: {
                  populate: '*'
                }
              }
            }
          },
          start: (page - 1) * limit,
          limit: limit
        }),
        strapi.documents('api::dealer-list.dealer-list').count({})
      ])

      ctx.status = 200;
      ctx.body = {
        data: dealersList,
        meta: {
          page: page,
          limit: limit,
          last_Page: Math.ceil(count / limit),
          total: count
        }
      }

    } catch (err) {
      ctx.status = 500;
      ctx.body = err?.message;
    }
  },
  detail: async (ctx, next) => {
    try {

      const { slug } = ctx.params;
      console.log(slug);
      const dealer = await strapi.documents('api::dealer-list.dealer-list').findFirst({
        filters: {
          Slug: slug
        },
        populate: {
          Dealer_Detail: {
            populate: '*'
          },
          Head: {
            populate: '*'
          },
          Manager: {
            populate: '*'
          },
          Additional: {
            populate: '*'
          },
          Outlet: {
            populate: '*'
          },
          SEO: {
            populate: {
              Meta_Image: {
                populate: '*'
              }
            }
          }
        }
      })
      ctx.status = 200;
      ctx.body = {
        data: dealer
      }
    } catch (err) {
      ctx.status = 500;
    }
  }
};
