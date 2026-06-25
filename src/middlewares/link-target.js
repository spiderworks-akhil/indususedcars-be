// src/middlewares/link-target/index.js

const INTERNAL_DOMAINS = [
  "indususedcars.com",
  "www.indususedcars.com",
];

const isInternalUrl = (url) => {
  try {
    // Relative URLs
    if (
      url.startsWith("/") ||
      url.startsWith("#")
    ) {
      return true;
    }

    const parsed = new URL(url);

    return INTERNAL_DOMAINS.includes(
      parsed.hostname
    );
  } catch {
    return true;
  }
};

const processHtml = (html) => {
  let result = html.replace(
    /<a\b([^>]*)href=["']([^"']+)["']([^>]*)>/gi,
    (fullMatch, before, href, after) => {
      // Ignore special links
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return fullMatch;
      }

      const internal = isInternalUrl(href);

      /**
       * Merge attributes
       */
      let attributes = `${before} ${after}`;

      /**
       * Remove old target + rel
       */
      attributes = attributes
        .replace(/\s*target=["'][^"']*["']/gi, "")
        .replace(/\s*rel=["'][^"']*["']/gi, "")
        .trim();

      /**
       * Clean multiple spaces
       */
      attributes = attributes.replace(/\s+/g, " ");

      /**
       * Internal Links
       */
      if (internal) {
        return `<a ${attributes} href="${href}" target="_self" rel="internal">`;
      }

      /**
       * External Links
       */
      return `<a ${attributes} href="${href}" target="_blank" rel="noopener noreferrer external nofollow">`;
    }
  );

  // Strip <a> tags without href (orphaned wrappers), keep inner content
  while (/<a\b(?![^>]*href=)[^>]*>/i.test(result)) {
    result = result.replace(/<a\b(?![^>]*href=)[^>]*>(.*?)<\/a>/gi, '$1');
  }

  return result;
};

const traverse = (data) => {
  if (!data) return;

  /**
   * Arrays
   */
  if (Array.isArray(data)) {
    data.forEach((item) => traverse(item));
    return;
  }

  /**
   * Objects
   */
  if (typeof data === "object") {
    Object.keys(data).forEach((key) => {
      const value = data[key];

      /**
       * Process ANY HTML string
       */
      if (
        typeof value === "string" &&
        value.includes("<a")
      ) {
        data[key] = processHtml(value);
      }

      /**
       * Recursive traversal
       */
      if (
        value &&
        typeof value === "object"
      ) {
        traverse(value);
      }
    });
  }
};

module.exports = () => {
  return async (ctx, next) => {
    await next();

    if (ctx.response?.body && !ctx.path.startsWith("/admin")) {
      traverse(ctx.response.body);
    }
  };
};