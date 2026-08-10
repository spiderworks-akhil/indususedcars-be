import React, { lazy, Suspense } from "react";
import Logo from "./extensions/logo.png";
import favicon from "./extensions/favicon.ico";

const config = {
  auth: {
    logo: Logo,
  },
  head: {
    favicon: favicon,
  },
  menu: {
    logo: Logo,
  },
  tutorials: false,
  notifications: {
    releases: false,
  },
  translations: {
    en: {
      "app.components.LeftMenu.navbrand.title": "Indus Motors Dashboard",
      "app.components.LeftMenu.navbrand.workplace": "Administration",
      "Auth.form.welcome.title": "Welcome to Indus Motors",
      "Auth.form.register.subtitle":
        "Credentials are only used for secure login to Indus Motors Dashboard. All your personal details and vehicle information will be securely stored in our database.",
      "Auth.form.welcome.subtitle": "Login to your account",
      "Settings.profile.form.section.experience.interfaceLanguageHelp":
        "Preference changes will apply only to you",
    },
  },
};

const bootstrap = (app) => {
  const cm = app.getPlugin("content-manager");
 
  
  if (cm && cm.injectComponent) {
    const DownloadExcel = lazy(() => import("./components/DowloadExcel.jsx"));
    cm.injectComponent("listView", "actions", {
      name: "download-excel",
      Component: (props) => {
        // Only show for leads collection type
       
          return (
            <Suspense fallback={null}>
              <DownloadExcel/>
            </Suspense>
          );
        
        return null;
      },
    });
  } else {
    console.warn(
      "Content Manager plugin not found or injectComponent not available"
    );
  }
};

export default {
  config,
  bootstrap,
};
