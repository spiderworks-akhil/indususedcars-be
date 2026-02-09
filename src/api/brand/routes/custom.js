"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/brands/fetch",
      handler: "custom.fetchBrand",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/brands/extract",
      handler: "custom.extractDetails",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/brands/:slug",
      handler: "custom.getBySlug",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/brands-schema-list/:slug",
      handler: "custom.brandSchemaList",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
