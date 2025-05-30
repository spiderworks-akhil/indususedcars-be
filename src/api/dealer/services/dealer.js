'use strict';

/**
 * dealer service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::dealer.dealer');
