// ./config/excel.js
module.exports = {
  config: {
    "api::lead.lead": {
      columns: [
        "createdAt",
        "CustomerName",
        "CustomerEmail",
        "MobileNumber",
        "Lead_Type",
        "Notes",
        "City",
      ],
      relation: {
        solution: {
          column: ["createdAt"],
        },
      },
      locale: false,
    },
  },
};
