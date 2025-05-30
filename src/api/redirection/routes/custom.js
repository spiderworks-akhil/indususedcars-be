'use strict';

module.exports={
    routes:[{
        method:'GET',
        path:'/redirections/list',
        handler:'custom.list',
        config:{
            auth:false,
            middlewares:[],
            policies:[]
        }
    }]
}