"use strict";

/**
 * A set of functions called "actions" for `sitemap`
 */

module.exports = {
  siteMap: async (ctx, next) => {
    try {
      const currentDate = new Date().toISOString();
      console.log('yes');
      
      ctx.body = [
        { Slug: "/static_pages", Lastmod: currentDate },
        { Slug: "/sitemap-cars", Lastmod: currentDate },
        { Slug: "/sitemap-dealers", Lastmod: currentDate },
        { Slug: "/sitemap-brands", Lastmod: currentDate },
        { Slug: "/sitemap-models", Lastmod: currentDate },
        { Slug: "/sitemap-locations", Lastmod: currentDate },
        { Slug: "/sitemap-blogs", Lastmod: currentDate },
        { Slug: "/sitemap-brand-districts", Lastmod: currentDate },
        { Slug: "/sitemap-model-districts", Lastmod: currentDate },
      ];
    } catch (err) {
      ctx.body = err;
    }
  },
  siteMapDetail: async (ctx, next) => {
    try {
      const { slug } = ctx.params;

      switch (slug) {
        case "static_pages":
          ctx.body = [
            { Slug: "/" },
            { Slug: "/blog" },
            { Slug: "/cars" },
            { Slug: "/contact" },
            { Slug: "/dealers" },
            { Slug: "/two-wheelers" },
          ];
          break;

        case "sitemap-blogs":
          const blogList = await strapi.documents("api::blog.blog").findMany({
            fields: ["Slug"],
            status: "published",
          });

          // Format the response to include /blog/ before blog slug
          const formattedBlogs = blogList.map(blog => ({
            Slug: `/blog/${blog.Slug}`
          }));

          ctx.status = 200;
          ctx.body = formattedBlogs;

          break;

        case "sitemap-cars":
          const carList = await strapi.documents("api::car.car").findMany({
            fields: ["Slug"],
            status: "published",
          });

          ctx.status = 200;
          ctx.body = carList;

          break;

        case "sitemap-dealers":
          const dealerList = await strapi
            .documents("api::dealer-list.dealer-list")
            .findMany({
              fields: ["Slug"],
              status: "published",
            });

          // Format the response to include /dealers/ before dealer slug
          const formattedDealers = dealerList.map(dealer => ({
            Slug: `/dealers/${dealer.Slug}`
          }));

          ctx.status = 200;
          ctx.body = formattedDealers;

          break;

        case "sitemap-brands":
          const brandList = await strapi
            .documents("api::brand.brand")
            .findMany({
              fields: ["Slug"],
              status: "published",
            });

          // Format the response to include /cars/ before brand slug
          const formattedBrands = brandList.map(brand => ({
            Slug: `/cars/${brand.Slug}`
          }));

          ctx.status = 200;
          ctx.body = formattedBrands;

          break;

        case "sitemap-models":
          const modelList = await strapi
            .documents("api::model.model")
            .findMany({
              fields: ["Slug"],
              status: "published",
              populate: {
                Brand: {
                  fields: ["Slug"],
                }
              },
              filters: {
                Brand: { $notNull: true } // Only include models that have a brand
              }
            });

          // Format the response to include brand slug before model slug
          const formattedModels = modelList.map(model => ({
            Slug: `cars/${model.Brand.Slug}/${model.Slug}` // No need for null check since we filtered
          }));

          ctx.status = 200;
          ctx.body = formattedModels;

          break;

        case "sitemap-locations":
          const locationList = await strapi
            .documents("api::outlet.outlet")
            .findMany({
              fields: ["Slug"],
              status: "published",
              populate: {
                Location: {
                  fields: ["Slug"],
                }
              },
              filters: {
                Location: { $notNull: true } // Only include outlets that have a location
              }
            });

          // Format the response to include location slug before outlet slug
          const formattedLocations = locationList.map(outlet => ({
            Slug: `/${outlet.Location.Slug}/${outlet.Slug}` // No need for null check since we filtered
          }));

          ctx.status = 200;
          ctx.body = formattedLocations;

          break;

        case "sitemap-brand-districts":
          const brandDistrictList = await strapi
            .documents("api::combination-page.combination-page")
            .findMany({
              fields: ["Slug"],
              status: "published",
              populate: {
                Brand: {
                  fields: ["Slug"],
                },
                Location: {
                  fields: ["Slug"],
                }
              },
              filters: {
                Brand: { $notNull: true },
                Location: { $notNull: true }
              }
            });

          // Format the response to include /buy/ before the slug
          const formattedBrandDistricts = brandDistrictList.map(page => ({
            Slug: `/buy/${page.Slug}`
          }));

          ctx.status = 200;
          ctx.body = formattedBrandDistricts;

          break;

        case "sitemap-model-districts":
          const modelDistrictList = await strapi
            .documents("api::combination-page.combination-page")
            .findMany({
              fields: ["Slug"],
              status: "published",
            });

          // Format the response to include /buy/ before the slug
          const formattedModelDistricts = modelDistrictList.map(page => ({
            Slug: `/buy/${page.Slug}`
          }));

          ctx.status = 200;
          ctx.body = formattedModelDistricts;

          break;

        case "company":
          const companyList = await strapi
            .documents("api::static-page.static-page")
            .findMany({
              status: "published",
              fields: ["Slug"],
            });

          ctx.status = 200;
          ctx.body = companyList;

        default:
          break;
      }
    } catch (error) {
      ctx.body = error;
    }
  },
};
