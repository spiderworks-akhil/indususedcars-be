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
    }]
}