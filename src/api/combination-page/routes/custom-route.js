"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/combination-page/add",
      handler: "custom.fetchCombinationPage",
      config: {
        auth: false,
        policies: [],
        middlwares: [],
      },
    },
    {
      method: "GET",
      path: "/combination-page/list",
      handler: "custom.list",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/combination-page/:slug",
      handler: "custom.detail",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/combination-page/cars/:slug",
      handler: "custom.carsList",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
