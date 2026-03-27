"use strict";

/**
 * Generates the top HTML content (description) for a car detail page.
 * @param {Object} data - Car details (make, model, location, variant, yom, fuelType, kilometers, colour, outlet, status, vehicleCategory, psp)
 * @returns {string} - Formatted HTML content
 */
function generateTopContent(data) {
  return `
<h1>
  Used ${data.make} ${data.model} in ${data.location}
</h1>

<p>
  This <strong>${data.make}</strong> <strong>${data.model}</strong> <strong>${data.variant}</strong>, manufactured in <strong>${data.yom}</strong>, is a stylish <strong>${data.fuelType}</strong> vehicle designed for both city drives and long journeys. 
  With <strong>${data.kilometers}</strong> km driven, the car remains in excellent condition and delivers a smooth driving experience. 
  Finished in an attractive <strong>${data.colour}</strong> colour, it offers a premium look along with reliable performance.
</p>
<br>
<br>
<p>
  Available at <strong>${data.outlet}</strong>, this used car is currently in <strong>${data.status}</strong> and falls under the <strong>${data.vehicleCategory}</strong> category. 
  Priced at ₹<strong>${data.psp}</strong>, this <strong>${data.make}</strong> <strong>${data.model}</strong> <strong>${data.yom}</strong> is a great option for buyers looking for a well-maintained SUV under ₹<strong>${data.psp}</strong>.
</p>
`;
}

/**
 * Generates SEO meta details (Meta Title, Description, and OG tags) for a car detail page.
 * @param {Object} data - Car details (make, model, location)
 * @returns {Object} - Meta title and description
 */
function generateMetaDetails(data) {
  const meta_title = `Used ${data.make} ${data.model} in ${data.location} - Indus Used Cars`;
  const meta_description = `Buy used ${data.make} ${data.model} in ${data.location} from Indus Used Cars. Find great deals on second hand ${data.make} cars at best prices. Visit the website.`;

  return {
    meta_title,
    meta_description
  };
}

module.exports = {
  generateTopContent,
  generateMetaDetails,
};
