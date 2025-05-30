"use strict";

/**
 * A set of functions called "actions" for `car-filter`
 */

module.exports = {
  filters: async (ctx, next) => {
    let minimumPrice;
    let maximumPrice;
    let minYear;
    let maxYear;
    let minKilometers;
    let maxKilometers;
    let Fuels;
    try {
      console.log(ctx.query); 
      
      if (ctx?.query?.location) {
        const manimum_price = await strapi.documents("api::car.car").findMany({
          Location: {
            Slug: {
              $eq: ctx?.query?.location,
            },
          },
          sort: "PSP:asc",
          limit: 1,
        });
        minimumPrice = manimum_price[0]?.PSP;

        const maximum_price = await strapi.documents("api::car.car").findMany({
          filters:{
            Location: {
              Slug: {
                $eq: ctx?.query?.location,
              },
            },
          },
          
          sort: "PSP:desc",
          limit: 1,
        });
        maximumPrice = maximum_price[0]?.PSP;

        const max_year = await strapi.documents("api::car.car").findMany({
          filters:{
            Location: {
              Slug: {
                $eq: ctx?.query?.location,
              },
            },
          },
         
          sort: "Year_Of_Month:desc",
          limit: 1,
        });
        maxYear = max_year[0]?.Year_Of_Month;

        const min_year = await strapi.documents("api::car.car").findMany({
          filters:{
            Location: {
              Slug: {
                $eq: ctx?.query?.location,
              },
            }, 
          },
          
          sort: "Year_Of_Month:asc",
          limit: 1,
        });
        minYear = min_year[0]?.Year_Of_Month;

        const min_kilometers = await strapi.documents("api::car.car").findMany({
          filters:{
            Location: {
              Slug: {
                $eq: ctx?.query?.location,
              },
            },
          },
          
          sort: "Kilometers:asc",
          limit: 1,
        });
        minKilometers = min_kilometers[0]?.Kilometers;

        const max_kilometers = await strapi.documents("api::car.car").findMany({
          filters:{
            Location: {
              Slug: {
                $eq: ctx?.query?.location,
              },
            },
          },
          
          sort: "Kilometers:desc",
          limit: 1,
        });
        maxKilometers = max_kilometers[0]?.Kilometers;

        Fuels = await strapi.documents("api::fuel-type.fuel-type").findMany({
          Location: {
            Slug: {
              $eq: ctx?.query?.location, 
            },
          },
          populate: "*",
        });
      } else {
        const manimum_price = await strapi.documents("api::car.car").findMany({
          sort: "PSP:asc",
          limit: 1,
        });
        minimumPrice = manimum_price[0]?.PSP;

        const maximum_price = await strapi.documents("api::car.car").findMany({
          sort: "PSP:desc",
          limit: 1,
        });
        maximumPrice = maximum_price[0]?.PSP;

        const max_year = await strapi.documents("api::car.car").findMany({
          sort: "Year_Of_Month:desc",
          limit: 1,
        });
        maxYear = max_year[0]?.Year_Of_Month;

        const min_year = await strapi.documents("api::car.car").findMany({
          sort: "Year_Of_Month:asc",
          limit: 1,
        });
        minYear = min_year[0]?.Year_Of_Month;

        const min_kilometers = await strapi.documents("api::car.car").findMany({
          sort: "Kilometers:asc",
          limit: 1,
        });
        minKilometers = min_kilometers[0]?.Kilometers;

        const max_kilometers = await strapi.documents("api::car.car").findMany({
          sort: "Kilometers:desc",
          limit: 1,
        });
        maxKilometers = max_kilometers[0]?.Kilometers;

        Fuels = await strapi.documents("api::fuel-type.fuel-type").findMany({
          populate: "*",
        });
      }

      // const brands = await strapi.documents("api::brand.brand").findMany({
      //   populate: "*",
      // });

      // const models = await strapi.documents("api::model.model").findMany({
      //   populate: "*",
      // });

      ctx.status = 200;
      ctx.body = {
        data: {
          Price: {
            Minimum: minimumPrice,
            Maximum: maximumPrice,
          },
          Year: {
            Maximum: maxYear,
            Minimum: minYear,
          },
          Kilometers: {
            Maximum: maxKilometers,
            Minimum: minKilometers,
          },
          Transmission: [
            {
              id: 1,
              name: "Automatic",
            },
            {
              id: 2,
              name: "Manual",
            },
          ],
          Fuel_Type: Fuels || [],
          // Brands: brands || [],
          // Models: models?.data || [],
        },
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = err;
    }
  },
  searchBrand: async (ctx, next) => {
    try {
      const { search, page = 1, limit = 10 } = ctx.query;
      const pagination = {
        page: parseInt(page),
        pageSize: parseInt(limit),
        start: (page - 1) * limit,
        limit: parseInt(limit),
      };
      let count = await strapi.documents("api::brand.brand").count();

      let brand; 
      if (!search) {
        brand = await strapi.documents("api::brand.brand").findMany({
          populate: "*",
          limit: pagination.limit,
          start: pagination.start,
        });
        console.log(brand);

        ctx.status = 200;
        ctx.body = {
          data: brand || [],
          meta: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPage: Math.ceil(count / pagination.limit),
            pageCount: count || 0,
          },
        };
        return;
      }

      brand = await strapi.documents("api::brand.brand").findMany({
        filters: {
          Name: {
            $containsi: search,
          },
        },
        limit: pagination.limit,
        start: pagination.start,
      });
      count = await strapi.documents("api::brand.brand").count({
        filters: {
          Name: {
            $containsi: search,
          },
        },
      });
      ctx.status = 200;
      ctx.body = {
        data: brand || [],
        meta: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPage: Math.ceil(count / pagination.limit),
          pageCount: count || 0,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  searchModel: async (ctx, next) => {
    try {
      const { search, page = 1, limit = 10, brand } = ctx.query;
      const pagination = {
        page: parseInt(page),
        pageSize: parseInt(limit),
        start: (page - 1) * limit,
        limit: parseInt(limit),
      };

      if(brand && brand !== '[]') {
        try {
          // Remove brackets and split by comma
          const cleanedBrand = brand.replace(/[\[\]{}]/g, "");
          const brandArray = cleanedBrand.split(",").map(b => b.trim());

          if (brandArray.length > 0 && brandArray[0] !== '') {
            console.log(
              'yes'
            );
            
            const [models, count] = await Promise.all([
              strapi.documents('api::model.model').findMany({
                filters: {
                  Brand: {
                    Name: {
                      $in: brandArray
                    }
                  }
                },
                limit: pagination.limit,
                start: pagination.start,
                populate: ['Brand']
              }),
              strapi.documents('api::model.model').count({
                filters: {
                  Brand: {
                    Name: {
                      $in: brandArray
                    }
                  }
                }
              })
            ]);

            ctx.status = 200;
            ctx.body = {
              data: models || [],
              meta: {
                page: pagination.page,
                pageSize: pagination.pageSize,
                totalPage: Math.ceil(count / pagination.limit),
                pageCount: count || 0,
              },
            };
            return;
          }
        } catch (error) {
          console.error("Error parsing brand filter:", error);
        }
      }

      let count = await strapi.documents("api::model.model").count();

      let model; 
      if (!search) {
        model = await strapi.documents("api::model.model").findMany({
          populate: "*",
          limit: pagination.limit,
          start: pagination.start,
        });
        console.log(model);

        ctx.status = 200;
        ctx.body = {
          data: model || [],
          meta: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPage: Math.ceil(count / pagination.limit),
            pageCount: count || 0,
          },
        };
        return;
      }

      model = await strapi.documents("api::model.model").findMany({
        filters: {
          Name: {
            $containsi: search,
          },
        },
        limit: pagination.limit,
        start: pagination.start,
        populate:['Brand']
      });
      count = await strapi.documents("api::model.model").count({
        filters: {
          Name: {
            $containsi: search,
          },
        },
      });
      ctx.status = 200;
      ctx.body = {
        data: model || [],
        meta: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPage: Math.ceil(count / pagination.limit),
          pageCount: count || 0,
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  allStaticContent:async(ctx,next)=>{
    try{
      const static_content = await strapi.documents('api::cars-listing.cars-listing').findFirst({
        populate: {
          Offer_Section: {
            populate: "*",
          },
          Exclusive_Section: {
            populate: "*",
          },
          Assurance_Section: {
            populate: "*",
          },
          Benefit_Section: {
            populate: "*",
          },
          FAQ: {
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
      })


      ctx.status=200;
      ctx.body={
        data:static_content
      }
    }catch(error){
      ctx.status = 500;
      ctx.body = error;
    }
  },
  staticContent: async (ctx, next) => {
    try {
      const { location } = ctx.params;
      const static_content = await strapi
        .documents("api::location.location")
        .findFirst({
          filters: {
            Slug: location,
          },
          populate: {
            Offer_Section: {
              populate: "*",
            },
            Exclusive_Section: {
              populate: "*",
            },
            Assurance_Section: {
              populate: "*",
            },
            Benefit_Section: {
              populate: "*",
            },
            FAQ: {
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

      ctx.status = 200;
      ctx.body = {
        data: static_content,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  filterCars: async (ctx, next) => {
    try {
      // const { location } = ctx.params;
      const {
        model,
        location, 
        fuel,
        brand,
        transmission,
        year,
        kilometers,
        price,
        page = 1,
        pageSize = 10,
        high
      } = ctx.query;
      console.log(ctx.query);
      console.log({fuel:fuel?.length,brand:brand?.length,transmission:transmission?.length,year:year?.length,kilometers:kilometers?.length,price:price?.length});
      
 
      // Calculate pagination values
      const limit = parseInt(pageSize);
      const start = (parseInt(page) - 1) * limit;

      // Build filters dynamically based on provided query parameters
      const filters = {};

      // Add location filter based on slug
      if (location) {
        filters.Outlet = {
          Location:{
            Slug: location,
          }
          
        };
      }

      if (model && model!== '[]') {
        try {
          // Remove brackets and split by comma
          const cleanedModel = model.replace(/[\[\]{}]/g, "");
          const modelArray = cleanedModel.split(",").map((m) => m.trim());

          if (modelArray.length > 0 && modelArray[0]!== '') {
            filters.Model = {
              Name: {
                $in: modelArray,
              },
            };
          }
        } catch (error) {
          console.error("Error parsing model filter:", error);
        }
      }

      if (fuel && fuel !== '[]') {
        try {
          // Remove brackets and split by comma
          const cleanedFuel = fuel.replace(/[\[\]{}]/g, "");
          const fuelArray = cleanedFuel.split(",").map((f) => f.trim());  
          console.log(fuelArray);

          if (fuelArray.length > 0 && fuelArray[0] !== '') {
            filters.Fuel_Type = {
              Name: {
                $in: fuelArray,
              },
            };
          }
        } catch (error) {
          console.error("Error parsing fuel filter:", error);
        }
      }

      if (brand && brand !== '[]') {
        try {
          // Remove brackets and split by comma
          const cleanedBrand = brand.replace(/[\[\]{}]/g, "");
          const brandArray = cleanedBrand.split(",").map((b) => b.trim());

          if (brandArray.length > 0 && brandArray[0] !== '') {
            filters.Brand = {
              Name: {
                $in: brandArray,
              },
            };
          }
        } catch (error) {
          console.error("Error parsing brand filter:", error);
        }
      }

      if (transmission && transmission !== '[]') { 
        try {
          // Remove brackets and split by comma
          const cleanedTransmission = transmission.replace(/[\[\]{}]/g, "");
          const transmissionArray = cleanedTransmission
            .split(",")
            .map((t) => t.trim());
          console.log(transmissionArray);

          if (transmissionArray.length > 0 && transmissionArray[0] !== '') {
            filters.Transmission_Type = {
              $in: transmissionArray,
            };
          }
        } catch (error) {
          console.error("Error parsing transmission filter:", error);
        }
      }

      if (year && year !== '[]') {
        console.log(year);
        const years = JSON.parse(year);
        if (years.length > 0) {
          filters.Year_Of_Month = {
            $between: [years[0], years[1]],
          };
        }
      }
      if (kilometers && kilometers !== '[]') {
        const km = JSON.parse(kilometers);
        if (km.length > 0) {
          filters.Kilometers = {
            $between: [km[0], km[1]],
          };
        }
      }
      if (price && price !== '[]') {
        const prices = JSON.parse(price);
        if (prices.length > 0) {
          console.log(
            typeof prices[0].toString(),
            prices[1].toFixed(2).toString()
          );

          filters.PSP = {
            $between: [prices[0], prices[1]],
          };
        }
      }
      let locationPage;
      if(locationPage){
        locationPage = await strapi
        .documents("api::location.location")
        .findFirst({
          filters: {
            Slug: location,
          },
        });
      }else{
        locationPage = await strapi
        .documents("api::location.location")
        .findFirst({});
      }
       
      if (!locationPage) {
        ctx.status = 404;
        ctx.body = { error: "Location not found" };
        return;
      }
      // Fetch cars with dynamic filters and pagination
      const [cars, count] = await Promise.all([
        strapi.documents("api::car.car").findMany({
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          populate: ["Brand", "Model", "Outlet", "Fuel_Type", "Image"],
          sort:`PSP:${high? 'desc':'asc'}`,
          limit,
          start,
        }),
        strapi.documents("api::car.car").count({
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        }),
      ]);

      ctx.status = 200;
      ctx.body = {
        data: cars,
        meta: {
          filtersApplied: Object.keys(filters),
          pagination: {
            page: parseInt(page),
            pageSize: limit,
            total: count,
            pageCount: Math.ceil(count / limit),
          },
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
  updateamount: async (ctx, next) => {
    try {
      const { id, amount } = ctx.params;
      const cars = await strapi.documents("api::car.car").findMany({});
      for (const car of cars) {
        const carUpdate = await strapi.documents("api::car.car").update({
          documentId: car.documentId,
          data: { Amount: car.PSP },
          status: "published",
        });
        console.log(carUpdate);
      } 

      ctx.status = 200;
      ctx.body = {
        data: {
          success: true,
          msg: "Updated Successfully",
        },
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = error;
    }
  },
};
