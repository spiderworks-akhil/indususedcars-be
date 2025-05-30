"use strict";

/**
 * A set of functions called "actions" for `contact-form`
 */

module.exports = {
  excellence: async (ctx, next) => {
    try {
      const excellenceForm = await strapi
        .documents("api::contact-form-ui.contact-form-ui")
        .findFirst({
          populate: {
            Certified_Excellence:{
              populate:{
                Image_Section:{
                  populate:{
                    Image:{
                      populate:'*'
                    }
                  }
                },
                Button:{
                  populate:'*'
                }
              }
            }
          }
        });

      ctx.status = 200;
      ctx.body = {
        data: excellenceForm,
      };
    } catch (err) {
      ctx.body = err;
    }
  },
  modalForm:async(ctx, next) => {
    try {
      const modalForm = await strapi.documents("api::contact-form-ui.contact-form-ui").findFirst({
        populate: {
          Modal_Form: {
            populate: "*",
          },
        },
      });

      ctx.status = 200;
      ctx.body = {
        data: modalForm
      };
    } catch (err) {
      ctx.body = err;
    }
  }
};
