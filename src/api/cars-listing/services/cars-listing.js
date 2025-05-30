'use strict';

/**
 * cars-listing service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::cars-listing.cars-listing');
