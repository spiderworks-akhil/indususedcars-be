module.exports = {
  routes: [
    {
     method: 'GET',
     path: '/car-filter',
     handler: 'car-filter.filters',
     config: {
       auth:false,
       policies: [],
       middlewares: [],
     },
    },
    {
      method: 'GET',
      path: '/car-filter/search-brand',
      handler: 'car-filter.searchBrand',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/car-filter/search-model',
      handler: 'car-filter.searchModel',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/car-filter/static-content',
      handler: 'car-filter.allStaticContent',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/car-filter/static-content/:location',
      handler: 'car-filter.staticContent',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/car-filter/filter',
      handler: 'car-filter.filterCars',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/car-filter/amount',
      handler: 'car-filter.updateamount',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    }
  ],
};
