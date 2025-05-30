'use strict';

module.exports={
    routes: [
        {
            method: 'GET',
            path: '/models/fetch-models',
            handler: 'custom.fetchModels',
            config: {
                auth:false,
                policies: [],
                middlewares: [],
            }
        },
        {
            method: 'GET',
            path: '/models/addbrand',
            handler: 'custom.addBrand',
            config: {
                auth:false,
                policies: [],
                middlewares: [],
            }
        },
    ],
}