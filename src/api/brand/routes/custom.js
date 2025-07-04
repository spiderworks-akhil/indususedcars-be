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
      path: "/brands/:slug",
      handler: "custom.getBySlug",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
