'use strict';

const USER_RELATION_KEYS = new Set([
  'createdBy',
  'updatedBy',
  'publishedBy',
  'created_by',
  'updated_by',
  'published_by',
]);

const SENSITIVE_USER_FIELDS = new Set([
  'email',
  'password',
  'resetPasswordToken',
  'registrationToken',
  'confirmPassword',
]);

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

const sanitizeUserRelation = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeUserRelation);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitized = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (SENSITIVE_USER_FIELDS.has(key)) {
      continue;
    }

    sanitized[key] = sanitizeUserRelation(nestedValue);
  }

  return sanitized;
};

const sanitizeResponseBody = (value, currentKey = null) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResponseBody(item, currentKey));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  if (currentKey && USER_RELATION_KEYS.has(currentKey)) {
    return sanitizeUserRelation(value);
  }

  const sanitized = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    sanitized[key] = sanitizeResponseBody(nestedValue, key);
  }

  return sanitized;
};

module.exports = () => {
  return async (ctx, next) => {
    await next();

    if (ctx.body == null) {
      return;
    }

    ctx.body = sanitizeResponseBody(ctx.body);
  };
};
