module.exports = {
  routes: [
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
