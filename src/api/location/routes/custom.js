module.exports = {
    routes: [{
        method: 'GET',
        path: '/location/extract',
        handler: 'custom.extractDetails',
        config: {
            auth: false,
            middlewares: [],
            policies: []
        }
    },
    {
        method: 'GET',
        path: '/location/:slug',
        handler: 'custom.getBySlug',
        config: {
            auth: false,
            middlewares: [],
            policies: []
        }
    }
    ]
}