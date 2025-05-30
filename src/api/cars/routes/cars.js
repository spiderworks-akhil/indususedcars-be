module.exports = {
  routes: [
    {
     method: 'GET',
     path: '/getcars',
     handler: 'cars.getCars',
     config: {
      auth:false,
       policies: [],
       middlewares: [],
     },
    },
    {
      method:'GET',
      path:'/getcars/updateSlug',
      handler:'cars.updateSlug',
      config: {
        auth:false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method:'GET',
      path:'/getcars/updateStructure',
      handler:'cars.updateStucture',
      config: {
        auth:false,
        policies: [],
        middlewares: [],
      },
    }
  ],
};
