'use strict'

module.exports = {
    routes: [{
        method: 'GET',
        path: '/static-page/addpages',
        handler: 'custom.fetchStaticPages',
        config: {
            auth: false,
            policies: [],
            middlewares: []
        }
    }, {
        method: 'GET',
        path: '/static-page/getpages',
        handler: 'custom.staticPageList',
        config: {
            auth: false, 
            policies: [],
            middlewares: []
        }
    }, {
        method: 'GET',
        path: '/static-page/:slug',
        handler: 'custom.staticPageDetail',
        config: {
            auth: false,
            policies: [],
            middlewares: []
        }
    }]
}