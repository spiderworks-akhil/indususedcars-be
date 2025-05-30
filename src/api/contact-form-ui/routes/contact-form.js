'use strict';

module.exports={
    routes:[{
        method:'GET',
        path:'/contact-form-ui/excellence',
        handler:'contact-form.excellence',
        config:{
            auth:false,
            policies:[],
            middleware:[]
        }
    },{
        method:'GET',
        path:'/contact-form-ui/modal',
        handler:'contact-form.modalForm',
        config:{
            auth:false,
            policies:[],
            middleware:[]
        }
    }]
}