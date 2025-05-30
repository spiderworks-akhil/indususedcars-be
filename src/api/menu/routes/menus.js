"use strict";

module.exports = {
  routes: [
    {
        method: "GET",
        path: "/menu/search",
        handler: "menus.searchCar",
        config: {
          auth: false,
          policies: [], 
          middleware: [],
        },
      },
    {
      method: "GET",
      path: "/menu/main",
      handler: "menus.menus",
      config: {
        auth: false,
        policies: [],
        middleware: [],
      },
    },
    
  ],
};
