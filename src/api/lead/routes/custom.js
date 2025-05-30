"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/leads/generate-lead",
      handler: "leads.createLead",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/leads/send-leads",
      handler: "leads.sendLeads",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/leads/export",
      handler: "leads.exportLeads",
      config: {
        auth: false, // Change to true if authentication is required
      },
    },
  ],
};
