'use strict';

/**
 * outlet service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::outlet.outlet');
