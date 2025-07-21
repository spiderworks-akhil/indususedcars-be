'use strict';

/**
 * `sanitize-filters` middleware
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const isAdminAPI = ctx.request.path.startsWith('/content-manager/collection-types');

    if (!isAdminAPI) {
      return await next();
    }

    const filters = ctx.query?.filters;
    let hasInvalidFilter = false;

    const isValidNumber = (val) => {
      if (typeof val === 'number') return true;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed !== '' && !isNaN(Number(trimmed));
      }
      return false;
    };

    // Recursively check for invalid Kilometers filter at any depth
    const sanitizeRecursive = (obj) => {
      if (typeof obj !== 'object' || obj === null) return;
      for (const key in obj) {
        if (key === 'Kilometers') {
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            // Operator object: { $gte: "abc" }
            for (const opKey in value) {
              if (!isValidNumber(value[opKey])) {
                hasInvalidFilter = true;
                return;
              }
            }
          } else {
            if (!isValidNumber(value)) {
              hasInvalidFilter = true;
              return;
            }
          }
        } else if (Array.isArray(obj[key])) {
          // If value is an array (e.g., $and, $or)
          for (const item of obj[key]) {
            sanitizeRecursive(item);
            if (hasInvalidFilter) return;
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeRecursive(obj[key]);
          if (hasInvalidFilter) return;
        }
      }
    };

    if (filters) {
      sanitizeRecursive(filters);
    }

    if (hasInvalidFilter) {
      ctx.body = {
        results: [],
        pagination: {
          page: 1,
          pageSize: 25,
          pageCount: 1,
          total: 0
        }
      };
      ctx.status = 200;
      return;
    }

    await next();
  };
};
