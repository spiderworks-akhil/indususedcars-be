'use strict';

/**
 * redirection service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::redirection.redirection');
