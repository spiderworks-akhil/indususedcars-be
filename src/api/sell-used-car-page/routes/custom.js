

module.exports={
    routes:[{
        method:'GET',
        path:'/sell-used-car-page',
        handler:'custom.sellUsedCarPage',
        config:{
            auth:false,
            middlewares:[],
            policies:[]
        }
    }]
}