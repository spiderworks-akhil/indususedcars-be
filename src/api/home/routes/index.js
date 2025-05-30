'use strict'

module.exports={
    routes: [
        {
            method: 'GET',
            path: '/homes/index',
            handler:'index.index',
            config:{
                auth:false,
                policies:[],
                middleware:[]
            }
        }
    ],
    
}