"use strict";

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
  }
};
