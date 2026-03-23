module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true, // deprecated in v4.25.8
      headers: '*',
      origin: '*'
    }
  },
  {
    name: 'global::sanitize-filters',
    config: {},
  },
  {
    name: 'global::sanitize-users-response',
    config: {},
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
