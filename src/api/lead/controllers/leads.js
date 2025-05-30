"use strict";
const axios = require("axios");
const XLSX = require("xlsx");
/**
 * A set of functions called "actions" for `generateLead`
 */

module.exports = {
  createLead: async (ctx, next) => {
    try {
      const {
        name,
        email,
        utmsource,
        source_type,
        lead_type,
        phone_number,
        city,
        recaptcha_token,
        source_url,
        car_id,
        message
      } = ctx.request.body;

      console.log(ctx.request.body);

      // Validate required fields
      if (!name || !lead_type || !phone_number) {
        ctx.status = 400;
        ctx.body = {
          message: "All fields including recaptcha are required",
        };
        return;
      }

      // Verify reCAPTCHA token
      // const recaptchaSecret = process.env.RECAPTCHA_SECRECT_KEY;
      // const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptcha_token}`;

      // const recaptchaResponse = await axios.post(verificationUrl);
      // if (!recaptchaResponse.data.success) {
      //   ctx.status = 400;
      //   ctx.body = {
      //     message: "reCAPTCHA verification failed",
      //   };
      //   return;
      // }

      let car;

      if (car_id) {
        console.log('yes');

        car = await strapi.documents('api::car.car').findOne({
          documentId: car_id,
          populate: {
            Brand: {
              populate: '*'
            },
            Model: {
              populate: '*'
            },
            Location: {
              populate: '*'
            },
            Outlet: {
              populate: {
                Location: {
                  populate: '*'
                }
              }
            }
          }
        });

        console.log({ car });

      }

      // Create lead based on type
      let leadData = {
        CustomerName: name,
        MobileNumber: phone_number,
        City: city,
        Lead_Type: lead_type,
        utmSource: utmsource,
        SourceType: source_type,
        SourceURL: source_url,
        CustomerEmail: email
      };

      if (message) {
        leadData.Notes = message
      }

      if (lead_type == 'Test Drive') {
        console.log('yes');
        console.log({ car });

        leadData.Car = {
          Name: car?.Name,
          Model: car?.Model?.Name,
          Brand: car?.Brand?.Name,
          Variant: car?.Variant,
          Registration: car?.Vehicle_Reg_No,
          Outlet: car?.Outlet?.Name,
          Color: car?.Color,
          Location: car?.Outlet?.Location?.Name,
        }
        console.log(leadData);
        const data = await strapi.documents("api::lead.lead").create({
          data: leadData,
          status: "published",
        });
        console.log({ data });

        ctx.status = 200;
        ctx.body = {
          message: "Form Submitted Successfully",
          success: true,
        };

        return;

      }

      if (lead_type === "Book") {
        leadData.Date = new Date().toISOString().slice(0, 10);
      }

      await strapi.documents("api::lead.lead").create({
        data: leadData,
        status: "published",
      });

      // Send email notifications
      try {
        const admin = await strapi.query('admin::user').findMany({
          where: {
            roles: {
              code: 'strapi-super-admin'
            }
          },
          select: ['email']
        });

        console.log({ admin });

        // Define email templates based on lead type
        const emailTemplates = {
          'Test Drive': {
            admin: {
              subject: 'New Test Drive Request',
              text: 'New test drive request received',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>New Test Drive Request</title>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background-color: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
                    .content { background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h2 { color: #1a73e8; margin-bottom: 25px; font-size: 24px; font-weight: 600; }
                    h3 { color: #34495e; margin-bottom: 15px; font-size: 18px; font-weight: 500; }
                    .details { margin-bottom: 30px; }
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    th { background: #f8f9fa; text-align: left; padding: 12px 15px; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; }
                    td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; background: #ffffff; }
                    tr:last-child td { border-bottom: none; }
                    tr:hover td { background-color: #f8f9fa; transition: background-color 0.2s ease; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="content">
                      <h2>New Test Drive Request</h2>
                      <div class="details">
                        <h3>Customer Details</h3>
                        <table>
                          <tr><th>Name</th><td><%= data.name  %></td></tr>
                          <tr><th>Phone</th><td><%= data.phone_number  %></td></tr>
                          <tr><th>Email</th><td><%= data.email  %></td></tr>
                          <tr><th>City</th><td><%= data.city  %></td></tr>
                          <tr><th>Source Type</th><td><%= data.source_type  %></td></tr>
                          <tr><th>UTM Source</th><td><%= data.utmsource  %></td></tr>
                          <tr><th>Source URL</th><td><%= data.source_url  %></td></tr>
                        </table>
                      </div>
                      <div class="details">
                        <h3>Car Details</h3>
                        <table>
                          <tr><th>Brand</th><td><%= data.car.Brand.Name  %></td></tr>
                          <tr><th>Model</th><td><%= data.car.Model.Name  %></td></tr>
                          <tr><th>Variant</th><td><%= data.car.Variant  %></td></tr>
                          <tr><th>Color</th><td><%= data.car.Color  %></td></tr>
                          <tr><th>Location</th><td><%= data.car.Outlet.Location.Name  %></td></tr>
                          <tr><th>Registration</th><td><%= data.car.Vehicle_Reg_No  %></td></tr>
                        </table>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `
            },
            user: {
              subject: 'Test Drive Request Confirmation',
              text: 'Thank you for requesting a test drive',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Test Drive Request Confirmation</title>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .content { background: #f9f9f9; border-radius: 8px; padding: 25px; }
                    h2 { color: #1a73e8; margin-bottom: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="content">
                      <h2>Test Drive Request Confirmation</h2>
                      <div class="message">
                        <p>Dear Mr/Ms. <%= data.name %>,</p>
                        <p>Thank you for requesting a test drive with Indus Motors. We have received your request for a <%= data.car?.Brand?.Name || '' %> <%= data.car?.Model?.Name || '' %> at our <%= data.car?.Outlet?.Location?.Name || '' %> location.</p>
                        <p>Our team is currently reviewing your request and will contact you soon to schedule your test drive at a convenient time.</p>
                        <p>We appreciate your interest in our vehicles and look forward to providing you with an exceptional test drive experience.</p>
                      </div>
                      <div class="footer">
                        <p>Best regards,<br>Team Indus Motors</p>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `
            }
          },
          'Book': {
            admin: {
              subject: 'New Car Booking Request',
              text: 'New car booking request received',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background-color: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
                    .content { background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h2 { color: #1a73e8; margin-bottom: 25px; font-size: 24px; font-weight: 600; }
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    th { background: #f8f9fa; text-align: left; padding: 12px 15px; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; }
                    td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; background: #ffffff; }
                    tr:last-child td { border-bottom: none; }
                    tr:hover td { background-color: #f8f9fa; transition: background-color 0.2s ease; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>New Car Booking Request</h2>
                    <table>
                      <tr><th>Name</th><td><%= data.name  %></td></tr>
                      <tr><th>Email</th><td><%= data.email  %></td></tr>
                      <tr><th>Phone</th><td><%= data.phone_number  %></td></tr>
                      <tr><th>City</th><td><%= data.city  %></td></tr>
                      <tr><th>Lead Type</th><td><%= data.lead_type  %></td></tr>
                      <tr><th>Source Type</th><td><%= data.source_type  %></td></tr>
                      <tr><th>UTM Source</th><td><%= data.utmsource  %></td></tr>
                      <tr><th>Source URL</th><td><%= data.source_url  %></td></tr>
                    </table>
                  </div>
                </body> 
                </html>
              `
            },
            user: {
              subject: 'Booking Request Confirmation',
              text: 'Thank you for your booking request',
              html: `
                <div style="max-width: 600px; margin: 0 auto;">
                  <h2>Booking Request Confirmation</h2>
                  <p>Dear Mr/Ms. <%= data.name %>,</p>
                  <p>Thank you for your booking request with Indus Motors. We have received your request and our team is currently reviewing the details.</p>
                  <p>We appreciate your interest in our services and will be in touch with you soon to proceed with the next steps.</p>
                  <p>Best regards,<br>Team Indus Motors</p>
                </div>
              `
            }
          },
          'Buy': {
            admin: {
              subject: 'New Car Purchase Inquiry',
              text: 'New car purchase inquiry received',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background-color: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
                    .content { background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h2 { color: #1a73e8; margin-bottom: 25px; font-size: 24px; font-weight: 600; }
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    th { background: #f8f9fa; text-align: left; padding: 12px 15px; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; }
                    td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; background: #ffffff; }
                    tr:last-child td { border-bottom: none; }
                    tr:hover td { background-color: #f8f9fa; transition: background-color 0.2s ease; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>New Car Purchase Inquiry</h2>
                    <table>
                      <tr><th>Name</th><td><%= data.name %></td></tr>
                      <tr><th>Email</th><td><%= data.email  %></td></tr>
                      <tr><th>Phone</th><td><%= data.phone_number %></td></tr>
                      <tr><th>City</th><td><%= data.city %></td></tr>
                      <tr><th>Source Type</th><td><%= data.source_type  %></td></tr>
                      <tr><th>UTM Source</th><td><%= data.utmsource  %></td></tr>
                      <tr><th>Source URL</th><td><%= data.source_url  %></td></tr>
                    </table>
                  </div>
                </body>
                </html>
              `
            },
            user: {
              subject: 'Purchase Inquiry Confirmation',
              text: 'Thank you for your purchase inquiry',
              html: `
                <h2>Purchase Inquiry Confirmation</h2>
                <p>Dear Mr/Ms. <%= data.name %>,</p>
                <p>Thank you for your interest in purchasing a car from Indus Motors. We have received your inquiry and our team is currently reviewing the details.</p>
                <p>We look forward to assisting you in finding the perfect vehicle that meets your requirements.</p>
                <p>Best regards,<br>Team Indus Motors</p>
              `
            }
          },
          'Sell': {
            admin: {
              subject: 'New Car Sell Request',
              text: 'New car sell request received',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background-color: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
                    .content { background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h2 { color: #1a73e8; margin-bottom: 25px; font-size: 24px; font-weight: 600; }
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    th { background: #f8f9fa; text-align: left; padding: 12px 15px; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; }
                    td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; background: #ffffff; }
                    tr:last-child td { border-bottom: none; }
                    tr:hover td { background-color: #f8f9fa; transition: background-color 0.2s ease; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>New Car Sell Request</h2>
                    <table>
                      <tr><th>Name</th><td><%= data.name %></td></tr>
                      <tr><th>Email</th><td><%= data.email  %></td></tr>
                      <tr><th>Phone</th><td><%= data.phone_number %></td></tr>
                      <tr><th>City</th><td><%= data.city %></td></tr>
                      <tr><th>Source Type</th><td><%= data.source_type  %></td></tr>
                      <tr><th>UTM Source</th><td><%= data.utmsource  %></td></tr>
                      <tr><th>Source URL</th><td><%= data.source_url  %></td></tr>
                    </table>
                  </div>
                </body>
                </html>
              `
            },
            user: {
              subject: 'Car Sell Request Confirmation',
              text: 'Thank you for your car sell request',
              html: `
                <h2>Car Sell Request Confirmation</h2>
                <p>Dear Mr/Ms. <%= data.name %>,</p>
                <p>Thank you for considering Indus Motors to sell your car. We have received your request and our team is currently reviewing the details.</p>
                <p>We look forward to assisting you with the sale of your vehicle and will be in touch soon to discuss the next steps.</p>
                <p>Best regards,<br>Team Indus Motors</p>
              `
            }
          },
          'Request Callback': {
            admin: {
              subject: 'New Callback Request',
              text: 'New callback request received',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background-color: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
                    .content { background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h2 { color: #1a73e8; margin-bottom: 25px; font-size: 24px; font-weight: 600; }
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    th { background: #f8f9fa; text-align: left; padding: 12px 15px; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; }
                    td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; background: #ffffff; }
                    tr:last-child td { border-bottom: none; }
                    tr:hover td { background-color: #f8f9fa; transition: background-color 0.2s ease; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>New Callback Request</h2>
                    <table>
                      <tr><th>Name</th><td><%= data.name %></td></tr>
                      <tr><th>Email</th><td><%= data.email  %></td></tr>
                      <tr><th>Phone</th><td><%= data.phone_number %></td></tr>
                      <tr><th>City</th><td><%= data.city %></td></tr>
                      <tr><th>Source Type</th><td><%= data.source_type  %></td></tr>
                      <tr><th>UTM Source</th><td><%= data.utmsource  %></td></tr>
                      <tr><th>Source URL</th><td><%= data.source_url  %></td></tr>
                    </table>
                  </div>
                </body>
                </html>
              `
            },
            user: {
              subject: 'Callback Request Confirmation',
              text: 'Thank you for your callback request',
              html: `
                <h2>Callback Request Confirmation</h2>
                <p>Dear Mr/Ms. <%= data.name %>,</p>
                <p>Thank you for requesting a callback from Indus Motors. We have received your request and our team is currently reviewing the details.</p>
                <p>We appreciate your interest and look forward to connecting with you soon.</p>
                <p>Best regards,<br>Team Indus Motors</p>
              `
            }
          },
          'default': {
            admin: {
              subject: 'New Lead Generated',
              text: 'New lead generated',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2c3e50; background-color: #f8f9fa; }
                    .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
                    .content { background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    h2 { color: #1a73e8; margin-bottom: 25px; font-size: 24px; font-weight: 600; }
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 25px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    th { background: #f8f9fa; text-align: left; padding: 12px 15px; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e9ecef; }
                    td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; background: #ffffff; }
                    tr:last-child td { border-bottom: none; }
                    tr:hover td { background-color: #f8f9fa; transition: background-color 0.2s ease; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>New Lead Details</h2>
                    <table>
                      <tr><th>Name</th><td><%= data.name  %></td></tr>
                      <tr><th>Email</th><td><%= data.email  %></td></tr>
                      <tr><th>Phone</th><td><%= data.phone_number  %></td></tr>
                      <tr><th>City</th><td><%= data.city  %></td></tr>
                      <tr><th>Lead Type</th><td><%= data.lead_type  %></td></tr>
                      <tr><th>Source Type</th><td><%= data.source_type  %></td></tr>
                      <tr><th>UTM Source</th><td><%= data.utmsource  %></td></tr>
                      <tr><th>Source URL</th><td><%= data.source_url  %></td></tr>
                    </table>
                  </div>
                </body>
                </html>
              `
            },
            user: {
              subject: 'Thank You for Contacting Us',
              text: 'Thank you for contacting us',
              html: `
                <h2>Thank You for Contacting Us</h2>
                <p>Dear Mr/Ms. <%= data.name %>,</p>
                <p>Thank you for reaching out to Indus Motors. We have received your message and our team is currently reviewing the details.</p>
                <p>We look forward to assisting you and will be in touch soon.</p>
                <p>Best regards,<br>Team Indus Motors</p>
              `
            }
          }
        };

        const template = emailTemplates[lead_type] || emailTemplates['default'];
        const templateData = {
          name,
          email,
          phone_number,
          city,
          lead_type,
          source_type,
          utmsource,
          source_url,
          car,
          date: new Date().toISOString().slice(0, 10)
        };

        // Send email to admin
        try {
          if (Array.isArray(admin) && admin.length > 0) {
            const adminEmails = admin.filter(user => user?.email).map(user => user.email);
            if (adminEmails.length > 0) {
              try {
                await strapi.plugins['email'].services.email.sendTemplatedEmail(
                  {
                    to: adminEmails,
                    from: `${process.env.SMTP_DEFAULT_NAME} <${process.env.SMTP_USERNAME}>`
                  },
                  template.admin,
                  {
                    data: templateData
                  }
                );
                console.log(`Admin emails sent successfully to ${adminEmails.length} recipients`);
              } catch (error) {
                console.error('Failed to send admin emails:', error);
                throw error;
              }
            } else {
              console.warn('No valid admin email addresses found');
            }
          } else {
            console.warn('No admin users found');
          }

          // Send email to user if email is provided
          if (email) {
            await strapi.plugins['email'].services.email.sendTemplatedEmail(
              {
                to: email,
                from: `${process.env.SMTP_DEFAULT_NAME} <${process.env.SMTP_USERNAME}>`
              },
              template.user,
              {
                data: templateData
              }
            );
            console.log('User email sent successfully');
          }
        } catch (sendError) {
          console.error('Email sending error:', sendError?.response?.data || sendError.message);
          // Continue execution as email sending is not critical
        }

      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't throw error as lead is already created
      }

      ctx.status = 200;
      ctx.body = {
        message: "Form Submitted Successfully",
        success: true,
      };
    } catch (err) {
      console.log(err);
      console.log(err?.message);
      ctx.status = 500;
      ctx.body = {
        success: false,
        error: err.message,
      };
    }
  },

  sendLeads: async (ctx, next) => {
    try {
      const leads = await strapi.documents("api::lead.lead").findMany({
        filters: {
          API_Status: false,
        },
      });
      console.log(leads);
      for (let lead of leads) {
        const curlCommand = `curl -X POST http://vt_web.indusmis.in/Api/SaveWebsiteEnquiryDetails \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "CustomerName=${encodeURIComponent(lead.CustomerName)}" \
        -d "CustomerEmail=${encodeURIComponent(lead.CustomerEmail || "")}" \
        -d "MobileNumber=${encodeURIComponent(lead.MobileNumber)}" \
        -d "City=${encodeURIComponent(lead.City)}" \
        -d "Lead_Type=${encodeURIComponent(lead.Lead_Type)}" \
        -d "Date=${encodeURIComponent(lead.Date ? lead.Date : new Date().toISOString().slice(0, 10))}" \
        -d "Notes=${encodeURIComponent(lead.Notes)}" \
        -d "utmSource=${encodeURIComponent(lead.utmSource)}" \
        -d "SourceType=${encodeURIComponent(lead.SourceType)}"`;

        try {
          const { exec } = require("child_process");
          exec(curlCommand, async (error, stdout, stderr) => {
            if (!error) {
              await strapi.documents("api::lead.lead").update({
                documentId: lead.documentId,
                data: { API_Status: true },
              });
            } else {
              ctx.body = {
                sucess: false,
                message: `Failed to update lead in external system `,
              };
              console.error(
                "cURL error:",
                error.message || "Failed to update lead in external system"
              );
            }
          });
        } catch (err) {
          ctx.body = {
            sucess: false,
            message: `Failed to update lead in external system`,
          };
        }
      }
      if (leads?.length > 0) {
        ctx.body = {
          success: true,
          message: "The lead was successfully updated in the external system.",
          leads: leads,
        };
      } else {
        ctx.body = {
          success: true,
          message: "Latest Leads Not Found",
          leads: leads,
        }
      }

    } catch (error) {
      console.log(error?.message);
    }
  },
  exportLeads: async (ctx) => {
    try {
      // Fetch all leads from the database
      const leads = await strapi.db.query("api::leads.leads").findMany({
        populate: true, // Include related fields if needed
      });

      if (!leads || leads.length === 0) {
        return ctx.send({ message: "No leads found." }, 404);
      }

      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(leads);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

      // Generate buffer and send response
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      ctx.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      ctx.set("Content-Disposition", 'attachment; filename="leads.xlsx"');
      return ctx.send(buffer);
    } catch (err) {
      ctx.throw(500, err);
    }
  },
};



