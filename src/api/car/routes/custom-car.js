'use strict'

module.exports={
    routes:[{
        method:'GET',
        path:'/cars/:slug',
        handler:'custom.getBySlug',
        config:{
            auth:false,
            policies:[],
            middleware:[]
        }
    }]
}