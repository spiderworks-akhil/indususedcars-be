module.exports = {
  routes: [
    {
      method: "GET",
      handler: "custom.List",
      path: "/dealer-location",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }, {
      method: "GET",
      handler: "custom.featuredDealers",
      path: "/dealer-location/featured",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    } ,
    {
      method: "GET",
      handler: "custom.getBySlug",
      path: "/dealer-location/:slug",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
