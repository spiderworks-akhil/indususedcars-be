'use strict'

module.exports={
    routes:[{
        method:'GET',
        path:'/widgets/moments',
        handler:'widgets.moments',
        config:{
            auth:false,
            policies:[],
            middlewares:[]
        }
    },{
        method:'GET',
        path:'/widgets/cta',
        handler:'widgets.cta',
        config:{
            auth:false,
            policies:[],
            middlewares:[]
        }
    }]
}