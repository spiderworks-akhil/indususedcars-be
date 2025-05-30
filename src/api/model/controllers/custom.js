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
        { header: "Problem", key: "problem", width: 100 }
      ];

      const verifySlug = (slug) => {
        if (!slug) return "Slug is empty";
        if (typeof slug !== 'string') return "Slug is not a string";
        if (slug.length > 100) return "Slug is too long (max 100 characters)";
        if (!/^[a-z0-9-]+$/.test(slug)) return "Slug contains invalid characters";
        return null;
      };

      const data=await axios.get('https://indususedcars.com/api/combination-pages');


      // Process pages from 1 to 40
      for (let page = 1; page <= data?.data?.meta?.last_page; page++) {
        console.log(`processing page ${page}`);
        
        try {
          const pageData = await axios.get(
            `https://indususedcars.com/api/combination-pages?page=${page}`
          );

          for (const model of pageData.data?.data) {
            const slugError = verifySlug(model.slug);
            if (slugError) {
              worksheet.addRow({ slug: model.slug, problem: slugError });
              continue;
            }

            const existingModel = await strapi.documents("api::model.model").findFirst({
              filters: { Slug: model.slug }
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

                    const uploadResponse = await strapi.plugins.upload.services.upload.upload({
                      data: {},
                      files: formData,
                    });

                    if (uploadResponse?.length > 0) {
                      uploadedImage = uploadResponse[0].id;
                    }
                  }

                  const createdModel = await strapi.documents("api::model.model").create({
                    data: {
                      Name: modelData?.data?.page_heading,
                      Slug: modelData?.data?.slug,
                      Page_Heading: modelData?.data?.page_heading,
                      Top_Description: modelData?.data?.top_description,
                      Bottom_Description: modelData?.data?.bottom_description,
                      Extra_JS: modelData?.data?.extra_js,
                      Related_Type: modelData?.data?.related_type,
                      FAQ:{
                        Title:modelData?.data?.faq?.name
                      },
                      SEO: {
                        Meta_Title: modelData?.data?.browser_title,
                        Meta_Description: modelData?.data?.meta_description,
                        Meta_Keywords: modelData?.data?.meta_keywords,
                        Meta_Image: uploadedImage || modelData?.data?.og_image_id,
                        OG_Title: modelData?.data?.og_title,
                        OG_Description: modelData?.data?.og_description,
                      },
                    },
                    status: "published",
                    populate:['SEO','FAQ']
                  });

                  console.log(createdModel);
                }
              } catch (error) {
                if (error.response?.status === 404) {
                  console.log(`No detail page found for slug: ${model.slug}`);
                  worksheet.addRow({ slug: model.slug, problem: "No detail page found" });
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
      ctx.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      ctx.set("Content-Disposition", `attachment; filename="issues.xlsx"`);
      ctx.body = { success: true, data: buffer,msg:'uploaded Successfully' };
    } catch (err) {
      ctx.body = err;
    }
  },
  addBrand:async(ctx,next)=>{
    console.log('brand');
    
    try {
      const models=await strapi.documents('api::model.model').findMany({
        filters:{},
        populate:'*'
      })
      console.log(models);
      

      for(const model of models){
        const findModel=await strapi.documents('api::car.car').findFirst({
         filters:{
          Model:{
            Slug:{
              $eq:model.Slug
            }
          }
         },
          populate:'*' 
        })
        console.log({model:findModel});
        

        if(findModel?.Brand){
          console.log('yes');
          
          await strapi.documents('api::model.model').update({
            documentId:model.documentId,
            data:{
              Brand:findModel?.Brand
            },
            status:'published',
            populate:['Brand']
          })
        }

      }
      console.log('completed');
      
      ctx.status=200;
      ctx.body={
        msg:'success'
      };

    } catch (error) {
      ctx.status=500;
      ctx.body=error;
    }
  }
};
