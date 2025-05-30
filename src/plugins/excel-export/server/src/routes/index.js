const ExcelJS = require('exceljs');
export default [
  {
    method: 'GET',
    path: '/',
    // name of the controller file & the method.
    handler: 'controller.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/msg',
    handler: 'controller.msg',
    config: {
      policies: [],
    },
  },

  {
    method: 'GET',
    path: '/excel-export',
    handler: 'controller.exportLeads',
    config: {
      auth: false,
    },
  },
];
