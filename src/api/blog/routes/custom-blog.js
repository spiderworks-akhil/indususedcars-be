"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/blogs",
      handler: "slug.blogStaticPage",
      config: {
        auth: false,
        policies: [],
        middleware: [],
      },
    },
    {
        method: "GET",
        path: "/blogs/list",
        handler: "slug.blogsList",
        config: {
          auth: false,
          policies: [],
          middleware: [],
        },
      },
      {
        method: "GET",
        path: "/blogs/update",
        handler: "slug.updateBlogStatus",
        config: {
          auth: false,
          policies: [], 
          middleware: [],
        },
      },
    {
      method: "GET",
      path: "/blogs/fetchBlogs",
      handler: "slug.fetchBlog",
      config: {
        auth: false,
        policies: [],
        middleware: [],
      },
    },
    {
      method: "GET",
      path: "/blogs/updateContent",
      handler: "slug.updateBlogContent",
      config: {
        auth: false,
        policies: [],
        middleware: [],
      },
    },
    {
      method: "GET",
      path: "/blogs/update-date",
      handler: "slug.updateBlogDates",
      config: {
        auth: false,
        policies: [],
        middleware: [],
      },
    },
    {
      method: "GET",
      path: "/blogs/:slug",
      handler: "slug.getBlog",
      config: {
        auth: false,
        policies: [],
        middleware: [],
      },
    },
   

  ],
};
