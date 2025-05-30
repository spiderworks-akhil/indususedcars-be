const axios = require("axios");
module.exports = {
  /**
   * Simple example.
   * Every monday at 1am.
   */

  myJob: {
    task: async ({ strapi }) => {
      // Add your own logic here (e.g. send a queue of email, create a database backup, etc.).
      try {
        console.log("fetching cars details");
        const response = await axios.get(
          `${process.env.BACKEND_URL}/api/getCars`
        );
        console.log(response.data);
      } catch (error) {
        console.log(error);
      }
    },
    options: {
      rule: "0 */4 * * *",
    },
  },

  storeLead: {
    task: async ({ strapi }) => {
      try {
        console.log("Store Leads to the External API");
        const response = await axios.get(
          `${process.env.BACKEND_URL}/api/leads/send-leads`
        );
        console.log(response.data);
      } catch (error) {
        console.log(error?.message);
      }
    },
    options: {
      rule: "0 */4 * * *",
    },
  },

  combinationPage: {
    task: async ({ strapi }) => {
      try {
        console.log("Generating combination page");
        const response = await axios.get(
          `${process.env.BACKEND_URL}/api/combination-page/add`
        );
        console.log(response.data);
      } catch (error) {
        console.log(error?.message);
      }
    },
    options: {
      rule: "@once", // This will run only once when the server starts
    },
  },
};
