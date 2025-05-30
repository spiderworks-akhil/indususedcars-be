const axios = require("axios");
("use strict");

/**
 * A set of functions called "actions" for `slug`
 */

module.exports = {
  getBlog: async (ctx, next) => {
    try {
      const { slug } = ctx.params;
      const blog = await strapi.documents("api::blog.blog").findFirst({
        filters: {
          Slug: slug,
        },
        populate: {
          Featured_Image: {
            populate: "*",
          },
          Banner_Image: {
            populate: "*",
          },
          SEO: {
            populate: {
              Meta_Image: {
                populate: "*",
              },
            },
          },
          Author: {
            populate: "*",
          },
        },
      });

      if (!blog) {
        ctx.status = 404;
        ctx.body = { error: "Blog not found" };
        return;
      }

      ctx.status = 200;
      ctx.body = { data: blog };
    } catch (err) {
      ctx.body = err;
    }
  },
  fetchBlog: async (ctx, next) => {
    try {
      console.log("blog running");
      // Helper function to upload image using Strapi's upload API
      const uploadImage = async (filePath) => {
        console.log({imagePath:filePath});
        
        
        try {
          // Trim and encode file path
          const cleanedPath = filePath?.trim().replaceAll(/ /g, '%20');
          if (!cleanedPath) return null;

          // Generate a unique filename with timestamp and random string
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const fileName = `image_${uniqueId}.jpg`;

          // Check if file with same name exists in Strapi media library
          const existingFiles = await strapi.plugins.upload.services.upload.findMany({
            filters: { name: fileName }
          });
          if (existingFiles.length > 0) {
            return existingFiles[0].id;
          }

          // Fetch image with retry mechanism
          const fetchWithRetry = async (retries = 1) => {
            console.log('yes inside');
            
            try {
              return await axios.get(
                `https://indususedcars.com/${cleanedPath}`,
                { responseType: "arraybuffer", timeout: 30000 }
              );
            } catch (error) {
              // if (retries > 0) {
              //   await new Promise(resolve => setTimeout(resolve, 2000));
              //   return fetchWithRetry(retries - 1);
              // }
              console.error(`Failed to download image from ${cleanedPath}:`, error.message);
              return null;
            }
          };

          const response = await fetchWithRetry();

          // Create FormData for Strapi upload
          const formData = new FormData();
          const blob = new Blob([response.data], {
            type: response.headers["content-type"],
          });
          formData.append("files", blob, fileName);

          // Upload to Strapi with timeout and retry on EBUSY
          const uploadWithRetry = async (retries = 3) => {
            try {
              const uploadResponse = await axios.post(
                `${process.env.STRAPI_URL || "http://localhost:1337"}/api/upload`,
                formData,
                {
                  headers: { "Content-Type": "multipart/form-data" },
                  timeout: 30000
                }
              );
              return uploadResponse.data[0]?.id || null;
            } catch (error) {
              if ((error.code === 'EBUSY' || error.code === 'ENOENT') && retries > 0) {
                // await new Promise(resolve => setTimeout(resolve, 10000));
                // return uploadWithRetry(retries - 1);
                return null;
              }
              // throw error;
            }
          };

          // Add delay before upload to ensure temp file is ready
          await new Promise(resolve => setTimeout(resolve, 500));
          const result = await uploadWithRetry();

          // Cleanup any temporary files
          if (global.gc) global.gc();

          return result;
        } catch (error) {
          console.error("Error uploading image:", error);
          return { error: true, message: error.message, filePath };
        }
      };

      // Track failed uploads
      const failedUploads = [];

      // Upload images with retry logic
      const uploadWithRetry = async (filePath, blog, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          console.log({filePath});
          
          const result = await uploadImage(filePath);
          if (result && !result.error) return result;
          // Increase delay between retries
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        failedUploads.push({ filePath, slug: blog?.slug });
        return null;
      };
      // Helper function to check if blog exists
      const checkBlogExists = async (slug) => {
        const existingBlog = await strapi.documents("api::blog.blog").findFirst({
          filters: { Slug: slug },
          populate: ['Featured_Image', 'Banner_Image', 'SEO.Meta_Image']
        });
        return existingBlog;
      };

      // Track failed blogs for reporting
      const failedBlogs = [];

      const blogsCount = await axios.get(`https://indususedcars.com/api/pages`);
      let blogList;
      for (let i = 1; i <= blogsCount?.data?.last_page; i++) {
        blogList = await axios.get(
          `https://indususedcars.com/api/pages?page=${i}`
        );

        for (const blog of blogList?.data?.data) {
          if (blog?.type == "Blog") {
            // Check if blog already exists before proceeding
            const existingBlog = await strapi.documents("api::blog.blog").findFirst({
              filters: { Slug: blog?.slug },
              populate: ['Featured_Image', 'Banner_Image', 'SEO.Meta_Image']
            });
            
            if (existingBlog) {
              // Check if featured or banner images are null
              if (!existingBlog.Featured_Image || !existingBlog.Banner_Image) {
                try {
                  const blogDetail = await axios.get(`https://indususedcars.com/api/pages/${blog?.slug}`);
                  const updateData = {};

                  if (!existingBlog.Featured_Image) {
                    try {
                      const featuredImageId = await uploadWithRetry(blogDetail?.data?.featured_image?.file_path, blog);
                      if (featuredImageId) {
                        updateData.Featured_Image = { id: featuredImageId };
                      }
                    } catch (error) {
                      console.log(error?.message);
                      
                    }
                   
                  }

                  if (!existingBlog.Banner_Image) {
                    try {
                      const bannerImageId = await uploadWithRetry(blogDetail?.data?.banner_image?.file_path || blogDetail?.data?.featured_image?.file_path, blog);
                      if (bannerImageId) {
                        updateData.Banner_Image = { id: bannerImageId };
                      }
                    } catch (error) {
                        console.log(error?.message);
                        
                    }
                   
                  }

                  if (Object.keys(updateData).length > 0) {
                    await strapi.documents("api::blog.blog").update({
                      where: { id: existingBlog.id },
                      data: updateData
                    });
                    console.log(`Updated images for blog: ${blog?.slug}`);
                  }
                } catch (error) {
                  console.error(`Error updating images for blog ${blog?.slug}:`, error);
                  failedBlogs.push({
                    slug: blog?.slug,
                    error: error.message,
                    stage: 'image_update'
                  });
                }
              }
              continue;
            }
            const findBlog = await strapi
              .documents("api::blog.blog")
              .findFirst({
                filters: {
                  Slug: blog?.slug,
                },
                populate: ['Featured_Image', 'Banner_Image', 'SEO.Meta_Image']
              });
            if (!findBlog) {
              console.log("yes");

              const blogDetail = (
                await axios.get(
                  `https://indususedcars.com/api/pages/${blog?.slug}`
                )
              ).data;

              const featuredImageId = await uploadWithRetry(
                blogDetail?.featured_image?.file_path
                , blog
              );
              
              const bannerImageId = await uploadWithRetry(
                blogDetail?.banner_image?.file_path ?? blogDetail?.featured_image?.file_path
                , blog
              );
              const metaImageId = await uploadWithRetry(
                blogDetail?.og_image?.file_path ?? blogDetail?.featured_image?.file_path
                , blog
              );

              // Truncate long text fields to 255 characters
              const truncate = (str, maxLength = 255) =>
                str && str.length > maxLength
                  ? str.substring(0, maxLength)
                  : str;

              // Create blog data
              const blogData = {
                Title: truncate(blogDetail?.name),
                Slug: truncate(blogDetail?.slug),
                Primary_Heading: truncate(blogDetail?.primary_heading),
                Short_Description: blogDetail?.short_description || "",
                Content: blogDetail?.content || "",
                Top_Description: blogDetail?.top_description || "",
                Bottom_Description: blogDetail?.bottom_description || "",
                Featured_Image: featuredImageId
                  ? { id: featuredImageId }
                  : null,
                Banner_Image: bannerImageId ? { id: bannerImageId } : null,
                SEO: {
                  Meta_Title: truncate(blogDetail?.browser_title),
                  Meta_Description: truncate(blogDetail?.meta_description),
                  Meta_Image: metaImageId ? { id: metaImageId } : null,
                  OG_Title: truncate(blogDetail?.og_title),
                  OG_Description: blogDetail?.og_description || "",
                  Keywords: truncate(blogDetail?.keywords),
                  Meta_Robots: truncate(blogDetail?.meta_robots),
                  Structured_Data: blogDetail?.structured_data
                    ? JSON.parse(blogDetail.structured_data)
                    : null,
                  Meta_Viewport: truncate(blogDetail?.meta_viewport),
                  Canonical_URL: truncate(blogDetail?.canonical_url),
                },
                Author: {
                  Name: truncate(blogDetail?.author_details?.name),
                  Email: truncate(blogDetail?.author_details?.email),
                  Email_Verified_At:
                    blogDetail?.author_details?.email_verified_at || null,
                  Banner_At: blogDetail?.author_details?.banner_at || null,
                },
                publishedAt: blogDetail?.created_at || new Date(),
              };

              // Create and publish the blog
              try {
                const createdBlog = await strapi
                  .documents("api::blog.blog")
                  .create({
                    data: blogData,
                    status: 'published',
                    populate: [
                      "Featured_Image",
                      "Banner_Image",
                      "SEO.Meta_Image",
                      "Author",
                    ],
                  });

                console.log({ createdBlog });

                await strapi.documents("api::blog.blog").update({
                  where: { id: createdBlog.id },
                  data: { publishedAt: blogDetail?.created_at },
                });
              } catch (error) {
                console.error("Error creating blog:", error);
                failedBlogs.push({
                  slug: blog?.slug,
                  error: error.message,
                  stage: 'creation'
                });
                continue; // Skip to next blog on any error
              }
            } else {
              console.log(findBlog);

              // Check and update images if needed 
              const updateData = {};

              // Check and handle Featured_Image
              if (!findBlog.Featured_Image) {
                console.log('yes');
                console.log(blog?.featured_image?.file_path);


                const blogDetail = (
                  await axios.get(
                    `https://indususedcars.com/api/pages/${blog?.slug}`
                  )
                ).data;
                
                updateData.Content=blogDetail?.content || '';

                const featuredImageId = await uploadWithRetry(
                  blogDetail?.featured_image?.file_path
                  , blog
                );
                console.log({ featuredImageId, id: blogDetail?.id });

                if (featuredImageId) {
                  console.log('yes insider');

                  updateData.Featured_Image = { id: featuredImageId };
                }
                console.log('end');

              }

              // Check and handle Banner_Image
              if (!findBlog.Banner_Image) {
                console.log('yes');
                console.log(blog?.banner_image?.file_path);

                const blogDetail = (
                  await axios.get(
                    `https://indususedcars.com/api/pages/${blog?.slug}`
                  )
                ).data;

                updateData.Content=blogDetail?.content || '';

                const bannerImageId = await uploadWithRetry(
                  blogDetail?.banner_image?.file_path
                  , blog
                );
                console.log(bannerImageId);


                if (bannerImageId) {
                  console.log('yes insider');
                  updateData.Banner_Image = { id: bannerImageId };
                }
                console.log('end');
              }
              
              // Check and handle SEO.Meta_Image
              if (!findBlog.SEO?.Meta_Image) {

                console.log(blog?.og_image?.file_path);
                const blogDetail = (
                  await axios.get(
                    `https://indususedcars.com/api/pages/${blog?.slug}`
                  )
                ).data;
                updateData.Content=blogDetail?.content || '';
                const metaImageId = await uploadWithRetry(
                  blogDetail?.og_image?.file_path
                  , blog
                );
                console.log(metaImageId);

                if (metaImageId) {

                  updateData.SEO = {
                    ...findBlog.SEO,
                    Meta_Image: { id: metaImageId }
                  };
                }

              }

              // Update blog if any images were missing
              console.log(Object.keys(updateData).length > 0, Object.keys(updateData));

              if (Object.keys(updateData).length > 0) {
                try {
                  const updatedBlog = await strapi.documents("api::blog.blog").update({
                    documentId: findBlog.documentId,
                    data: {
                ...updateData,
                Slug: await generateUniqueSlug(blog.Slug)
              },
                    status: 'published'
                  });
                  console.log({ updatedBlog });
                } catch (error) {
                  console.error("Error updating blog:", error);
                  failedBlogs.push({
                    slug: blog?.slug,
                    error: error.message,
                    stage: 'update'
                  });
                  continue; // Skip to next blog on any error
                }
              }

              //update blog date
              const blogDetail = (
                await axios.get(
                  `https://indususedcars.com/api/pages/${blog?.slug}`
                )
              ).data;

              await strapi.documents('api::blog.blog').update({
                documentId: findBlog.documentId,
                data: {
                  publishedAt: blogDetail?.created_at,
                  createdAt: blogDetail?.created_at
                },
                status: 'published'
              })





              console.log("done");
            }
          }
        }
      }

      // After all processing, log failed uploads and blogs
      if (failedUploads.length > 0) {
        console.log("Failed to upload these images:");
        console.table(failedUploads);
      }

      if (failedBlogs.length > 0) {
        console.log("Failed to process these blogs:");
        console.table(failedBlogs);
      }

      ctx.status = 200;
      ctx.body = {
        data: {
          success: true,
          msg: "Uploaded Successfully",
        },
      };
    } catch (err) {
      console.error("Error in fetchBlog:", err);
      ctx.status = 500;
      ctx.body = {
        error: "Internal Server Error",
        details: err.message,
      };
    }
  },

  blogsList: async (ctx, next) => {
    try {
      console.log('working');

      const { start = 1, limit = 10 } = ctx.query;

      // Get total count of blogs
      const total = await strapi.documents("api::blog.blog").count();

      // Fetch paginated results
      const results = await strapi.documents("api::blog.blog").findMany({
        start: (Number(start)-1)*Number(limit),
        limit: Number(limit),
        status: "published",
        populate: {
          Featured_Image: {
            populate: "*",
          },
          Banner_Image: {
            populate: "*",
          },
          SEO: {
            populate: {
              Meta_Image: {
                populate: "*",
              },
            },
          },
          Author: {
            populate: "*",
          },
        },
      });

      ctx.status = 200;
      ctx.body = {
        data: results,
        meta: {
          pagination: {
            firstPage: 1,
            current_page: Number(start),
            limit: Number(limit),
            total: total,
            lastPage: Math.ceil(total / Number(limit)),
          },
        },
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        error: "Internal Server Error",
        details: err.message,
      };
    }
  },
  updateBlogStatus: async (ctx, next) => {
    try {
      const generateUniqueSlug = async (baseSlug) => {
        let slug = baseSlug;
        let counter = 1;
        let existingBlog;
        
        do {
          existingBlog = await strapi.documents('api::blog.blog').findFirst({
            filters: { Slug: slug }
          });
          
          if (existingBlog) {
            slug = `${baseSlug}-${Date.now()}-${counter}`;
            counter++;
          }
        } while (existingBlog);
        
        return slug;
      };

      // First, fetch and update from external API
      // Helper function to check if blog exists
      const checkBlogExists = async (slug) => {
        const existingBlog = await strapi.documents("api::blog.blog").findFirst({
          filters: { Slug: slug },
          populate: ['Featured_Image', 'Banner_Image', 'SEO.Meta_Image']
        });
        return existingBlog;
      };

      // Track failed blogs for reporting
      const failedBlogs = [];

      const blogsCount = await axios.get(`https://indususedcars.com/api/pages`);
      for (let i = 1; i <= blogsCount?.data?.last_page; i++) {
        const blogList = await axios.get(
          `https://indususedcars.com/api/pages?page=${i}`
        );

        for (const blog of blogList?.data?.data) {
          if (blog?.type === "Blog") {
            const blogDetail = (await axios.get(
              `https://indususedcars.com/api/pages/${blog?.slug}`
            )).data;

            const existingBlog = await strapi.documents('api::blog.blog').findFirst({
              filters: { Slug: blog?.slug },
              populate: ['Featured_Image', 'Banner_Image', 'SEO.Meta_Image']
            });

            if (existingBlog) {
              await strapi.documents('api::blog.blog').update({
                documentId: existingBlog.documentId,
                data: {
                  Slug: await generateUniqueSlug(blog?.slug),
                  Content: blogDetail?.content || '',
                  Top_Description: blogDetail?.top_description || '',
                  Bottom_Description: blogDetail?.bottom_description || '',
                  publishedAt: blogDetail?.created_at,
                  createdAt: blogDetail?.created_at
                },
                status: 'published'
              });
            }
          }
        }
      }

      // Then process local blog entries
      const blogs = await strapi.documents('api::blog.blog').findMany({
        status: 'draft',
        populate: ['Featured_Image', 'Banner_Image', 'SEO.Meta_Image']
      });

      const uploadImage = async (filePath) => {
        try {
          if (!filePath) return null;
          
          const response = await axios.get(
            filePath.startsWith('http') ? filePath : `https://indususedcars.com/${filePath}`,
            { responseType: 'arraybuffer' }
          );

          const formData = new FormData();
          const blob = new Blob([response.data], {
            type: response.headers['content-type']
          });
          formData.append('files', blob, `image_${Date.now()}.jpg`);

          const uploadResponse = await axios.post(
            `${process.env.STRAPI_URL || 'http://localhost:1337'}/api/upload`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );

          return uploadResponse.data[0];
        } catch (error) {
          console.error('Error uploading image:', error);
          return null;
        }
      };

      const processContent = async (content) => {
        if (!content) return '';
        
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match;
        let processedContent = content;

        while ((match = imgRegex.exec(content)) !== null) {
          const originalUrl = match[1];
          const uploadedImage = await uploadImage(originalUrl);

          if (uploadedImage) {
            const newUrl = `${process.env.STRAPI_URL || 'http://localhost:1337'}${uploadedImage.url}`;
            processedContent = processedContent.replace(originalUrl, newUrl);
          }
        }

        return processedContent;
      };

      for (const blog of blogs) {
        console.log('Processing blog:', blog.Title);
        
        const updateData = {};

        if (blog.Content) {
          const processedContent = await processContent(blog.Content);
          if (processedContent !== blog.Content) {
            updateData.Content = processedContent;
          }
        }

        if (!blog.Featured_Image) {
          const featuredImageId = await uploadImage(blog.featured_image?.file_path);
          if (featuredImageId) {
            updateData.Featured_Image = { id: featuredImageId.id };
          }
        }

        if (!blog.Banner_Image) {
          const bannerImageId = await uploadImage(blog.banner_image?.file_path);
          if (bannerImageId) {
            updateData.Banner_Image = { id: bannerImageId.id };
          }
        }

        if (!blog.SEO?.Meta_Image) {
          const metaImageId = await uploadImage(blog.og_image?.file_path);
          if (metaImageId) {
            updateData.SEO = {
              ...blog.SEO,
              Meta_Image: { id: metaImageId.id }
            };
          }
        }

        if (Object.keys(updateData).length > 0) {
          try {
            await strapi.documents('api::blog.blog').update({
              documentId: blog.documentId,
              data: {
                ...updateData,
                Slug: await generateUniqueSlug(blog.Slug)
              },
              status: 'published'
            });
          } catch (error) {
            console.error('Error updating blog:', error);
          }
        }
      }

      ctx.body = {
        data: {
          success: true,
          msg: 'Blogs updated and published successfully'
        }
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        error: 'Internal Server Error',
        details: err.message
      };
    }
  }
}
