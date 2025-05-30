'use strict';

/**
 * redirection router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::redirection.redirection');
