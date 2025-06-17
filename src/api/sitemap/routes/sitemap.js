module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/sitemap',
      handler: 'sitemap.siteMap',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/sitemap/:slug',
      handler: 'sitemap.siteMapDetail',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
