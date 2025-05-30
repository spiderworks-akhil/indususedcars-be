import type { Schema, Struct } from '@strapi/strapi';

export interface BlogBlogAuthor extends Struct.ComponentSchema {
  collectionName: 'components_blog_blog_authors';
  info: {
    displayName: 'Blog Author';
  };
  attributes: {
    Banner_At: Schema.Attribute.Date;
    Email: Schema.Attribute.Email;
    Email_Verified_At: Schema.Attribute.Date;
    Name: Schema.Attribute.String;
  };
}

export interface ButtonButton extends Struct.ComponentSchema {
  collectionName: 'components_button_buttons';
  info: {
    description: '';
    displayName: 'Button';
  };
  attributes: {
    Label: Schema.Attribute.String;
    URL: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'#'>;
  };
}

export interface ButtonSection extends Struct.ComponentSchema {
  collectionName: 'components_button_sections';
  info: {
    description: '';
    displayName: 'Section';
  };
  attributes: {
    Content: Schema.Attribute.String;
    Icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface CarAdditionalSections extends Struct.ComponentSchema {
  collectionName: 'components_car_additional_sections';
  info: {
    displayName: 'Additional Sections';
  };
  attributes: {
    Find_More: Schema.Attribute.Component<'car.find-more-section', true>;
  };
}

export interface CarAvailabilityAndFeatures extends Struct.ComponentSchema {
  collectionName: 'components_car_availability_and_features';
  info: {
    displayName: 'Availability and Features';
  };
  attributes: {
    Home_Test_Drive: Schema.Attribute.Enumeration<
      ['Available', 'Not Available']
    >;
    Location: Schema.Attribute.Relation<'oneToOne', 'api::location.location'>;
    Outlet: Schema.Attribute.Relation<'oneToOne', 'api::outlet.outlet'>;
  };
}

export interface CarBasicInformation extends Struct.ComponentSchema {
  collectionName: 'components_car_basic_informations';
  info: {
    description: '';
    displayName: 'Basic Information';
  };
  attributes: {
    Brand: Schema.Attribute.Relation<'oneToOne', 'api::brand.brand'>;
    Color: Schema.Attribute.String;
    Model: Schema.Attribute.Relation<'oneToOne', 'api::model.model'>;
    Variant: Schema.Attribute.String;
    Vehicle_Category: Schema.Attribute.Relation<
      'oneToOne',
      'api::vehicle-category.vehicle-category'
    >;
  };
}

export interface CarFindMoreSection extends Struct.ComponentSchema {
  collectionName: 'components_car_find_more_sections';
  info: {
    description: '';
    displayName: 'Find More Section';
  };
  attributes: {
    Content: Schema.Attribute.String;
    Icon: Schema.Attribute.Media<'images' | 'files'>;
    Link: Schema.Attribute.Relation<
      'oneToOne',
      'api::combination-page.combination-page'
    >;
    Title: Schema.Attribute.String;
  };
}

export interface CarHighlightingAndRecommendations
  extends Struct.ComponentSchema {
  collectionName: 'components_car_highlighting_and_recommendations';
  info: {
    displayName: 'Highlighting and Recommendations';
  };
  attributes: {
    Choose_Next: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    Featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    Recommended: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface CarImage extends Struct.ComponentSchema {
  collectionName: 'components_car_images';
  info: {
    description: '';
    displayName: 'Image';
  };
  attributes: {
    Back_Image: Schema.Attribute.Media<'images' | 'files'>;
    Front_Image: Schema.Attribute.Media<'images' | 'files'>;
    LeftSide_Image: Schema.Attribute.Media<'images' | 'files'>;
    RightSide_Image: Schema.Attribute.Media<'images' | 'files'>;
  };
}

export interface CarInspectionReportSection extends Struct.ComponentSchema {
  collectionName: 'components_car_inspection_report_sections';
  info: {
    displayName: 'Inspection Report Section';
  };
  attributes: {
    Icon: Schema.Attribute.Media<'images' | 'files'>;
    Report_Status: Schema.Attribute.Enumeration<['Pass', 'Fail']>;
    Title: Schema.Attribute.String;
  };
}

export interface CarInsuranceAndInspection extends Struct.ComponentSchema {
  collectionName: 'components_car_insurance_and_inspections';
  info: {
    displayName: 'Insurance and Inspection';
  };
  attributes: {
    Inspection_Report: Schema.Attribute.Component<
      'car.inspection-report-section',
      true
    >;
    Insurance_Type: Schema.Attribute.Enumeration<['Third Party']>;
    Insurance_Validity: Schema.Attribute.Date;
  };
}

export interface CarMedia extends Struct.ComponentSchema {
  collectionName: 'components_car_media';
  info: {
    displayName: 'Media';
  };
  attributes: {
    Image: Schema.Attribute.Component<'car.image', false>;
    Image_URL: Schema.Attribute.JSON;
  };
}

export interface CarRegistrationAndStatus extends Struct.ComponentSchema {
  collectionName: 'components_car_registration_and_statuses';
  info: {
    displayName: 'Registration and Status';
  };
  attributes: {
    Kilometers: Schema.Attribute.BigInteger;
    Owner_Type: Schema.Attribute.String;
    Registration_Year: Schema.Attribute.Date;
    Vehicle_Reg_No: Schema.Attribute.String & Schema.Attribute.Unique;
    Vehicle_Status: Schema.Attribute.Enumeration<['SOLD', 'STOCK']>;
    Year_Of_Month: Schema.Attribute.Integer;
  };
}

export interface CarTechnicalAndPerformance extends Struct.ComponentSchema {
  collectionName: 'components_car_technical_and_performances';
  info: {
    displayName: 'Technical and Performance';
  };
  attributes: {
    Fuel_Type: Schema.Attribute.Relation<
      'oneToOne',
      'api::fuel-type.fuel-type'
    >;
    PSP: Schema.Attribute.BigInteger;
    Transmission_Type: Schema.Attribute.Enumeration<['Manual', 'Automatic']> &
      Schema.Attribute.DefaultTo<'Manual'>;
  };
}

export interface CommonAuthor extends Struct.ComponentSchema {
  collectionName: 'components_common_authors';
  info: {
    displayName: 'Author';
  };
  attributes: {
    Name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Anonymous'>;
    Profile: Schema.Attribute.Media<'images' | 'files'>;
    Rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
  };
}

export interface CommonBenefitSection extends Struct.ComponentSchema {
  collectionName: 'components_common_benefit_sections';
  info: {
    displayName: 'Benefit Section';
  };
  attributes: {
    Button: Schema.Attribute.Component<'button.button', false>;
    Icon: Schema.Attribute.Media<'images' | 'files'>;
    Image: Schema.Attribute.Media<'images' | 'files'>;
    Points: Schema.Attribute.Component<'common.points', true>;
    Title: Schema.Attribute.String;
    URL: Schema.Attribute.String;
  };
}

export interface CommonBenefitsAndAdvantagesSection
  extends Struct.ComponentSchema {
  collectionName: 'components_common_benefits_and_advantages_sections';
  info: {
    displayName: 'Benefits and Advantages Section';
  };
  attributes: {
    Icon: Schema.Attribute.Media<'images' | 'files'>;
    Image: Schema.Attribute.Media<'images' | 'files'>;
    Points: Schema.Attribute.Component<'common.points', true>;
    Title: Schema.Attribute.String;
    URL: Schema.Attribute.String;
  };
}

export interface CommonFaq extends Struct.ComponentSchema {
  collectionName: 'components_common_faqs';
  info: {
    description: '';
    displayName: 'FAQ';
  };
  attributes: {
    Button: Schema.Attribute.Component<'button.button', false>;
    Questions: Schema.Attribute.Component<'common.questions', true>;
    Title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Frequently Asked Questions'>;
  };
}

export interface CommonPoints extends Struct.ComponentSchema {
  collectionName: 'components_common_points';
  info: {
    displayName: 'Points';
  };
  attributes: {
    Icon: Schema.Attribute.Media<'images' | 'files'>;
    Title: Schema.Attribute.String;
  };
}

export interface CommonQuestions extends Struct.ComponentSchema {
  collectionName: 'components_common_questions';
  info: {
    description: '';
    displayName: 'Questions';
  };
  attributes: {
    Answer: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'defaultHtml';
        }
      >;
    Question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactCertifiedExcellence extends Struct.ComponentSchema {
  collectionName: 'components_contact_certified_excellences';
  info: {
    description: '';
    displayName: 'Certified Excellence';
  };
  attributes: {
    Button: Schema.Attribute.Component<'button.button', true>;
    Image: Schema.Attribute.Media<'images' | 'files'>;
    Image_Section: Schema.Attribute.Component<'contact.image-section', true>;
    Short_Description: Schema.Attribute.Text;
    Short_Title: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface ContactImageSection extends Struct.ComponentSchema {
  collectionName: 'components_contact_image_sections';
  info: {
    displayName: 'Image Section';
  };
  attributes: {
    Image: Schema.Attribute.Media<'images' | 'files'>;
  };
}

export interface ContactModalForm extends Struct.ComponentSchema {
  collectionName: 'components_contact_modal_forms';
  info: {
    description: '';
    displayName: 'Modal Form';
  };
  attributes: {
    Image: Schema.Attribute.Media<'images' | 'files'>;
    Title: Schema.Attribute.String;
  };
}

export interface DealerAdditionalDetails extends Struct.ComponentSchema {
  collectionName: 'components_dealer_additional_details';
  info: {
    displayName: 'Additional Details';
  };
  attributes: {
    Emails: Schema.Attribute.Component<'dealer.emails', true>;
    Public_Number: Schema.Attribute.String;
  };
}

export interface DealerDealer extends Struct.ComponentSchema {
  collectionName: 'components_dealer_dealers';
  info: {
    description: '';
    displayName: 'Dealer';
  };
  attributes: {
    Address: Schema.Attribute.Text;
    Email: Schema.Attribute.Email;
    Landline: Schema.Attribute.String;
    Latitude_Longitude: Schema.Attribute.String;
    Location_Map: Schema.Attribute.Text;
    Name: Schema.Attribute.String;
  };
}

export interface DealerEmails extends Struct.ComponentSchema {
  collectionName: 'components_dealer_emails';
  info: {
    displayName: 'Emails';
  };
  attributes: {
    Email: Schema.Attribute.Email;
  };
}

export interface DealerHead extends Struct.ComponentSchema {
  collectionName: 'components_dealer_heads';
  info: {
    displayName: 'Head';
  };
  attributes: {
    Email: Schema.Attribute.Email;
    Mobile_Number: Schema.Attribute.String;
    Name: Schema.Attribute.String;
  };
}

export interface DealerManager extends Struct.ComponentSchema {
  collectionName: 'components_dealer_managers';
  info: {
    displayName: 'Manager';
  };
  attributes: {
    Email: Schema.Attribute.Email;
    Mobile_Number: Schema.Attribute.String;
    Name: Schema.Attribute.String;
  };
}

export interface FooterBrand extends Struct.ComponentSchema {
  collectionName: 'components_footer_brands';
  info: {
    displayName: 'Brand';
  };
  attributes: {
    Brands: Schema.Attribute.Relation<'oneToMany', 'api::brand.brand'>;
    Title: Schema.Attribute.String;
  };
}

export interface FooterCustomerSupport extends Struct.ComponentSchema {
  collectionName: 'components_footer_customer_supports';
  info: {
    displayName: 'Customer Support';
  };
  attributes: {
    Static_Pages: Schema.Attribute.Relation<
      'oneToMany',
      'api::static-page.static-page'
    >;
    Title: Schema.Attribute.String;
  };
}

export interface FooterShowroom extends Struct.ComponentSchema {
  collectionName: 'components_footer_showrooms';
  info: {
    displayName: 'Showroom';
  };
  attributes: {
    Locations: Schema.Attribute.Relation<'oneToMany', 'api::location.location'>;
    Title: Schema.Attribute.String;
  };
}

export interface HomeBannerSection extends Struct.ComponentSchema {
  collectionName: 'components_home_banner_sections';
  info: {
    displayName: 'Banner Section';
  };
  attributes: {
    Cover_Image: Schema.Attribute.Media<'images' | 'files'>;
    Title: Schema.Attribute.String;
  };
}

export interface HomeBuyAndSellSection extends Struct.ComponentSchema {
  collectionName: 'components_home_buy_and_sell_sections';
  info: {
    description: '';
    displayName: 'Buy And Sell Section';
  };
  attributes: {
    Button: Schema.Attribute.Component<'button.button', false>;
    Content: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<'images' | 'files'>;
    Navigation_Link: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#'>;
    Title: Schema.Attribute.String;
  };
}

export interface HomeCarJourney extends Struct.ComponentSchema {
  collectionName: 'components_home_car_journeys';
  info: {
    displayName: 'Car Journey';
  };
  attributes: {
    Description: Schema.Attribute.Text;
    Journey: Schema.Attribute.Component<'home.journey-list', true>;
    Title: Schema.Attribute.String;
  };
}

export interface HomeJourneyList extends Struct.ComponentSchema {
  collectionName: 'components_home_journey_lists';
  info: {
    displayName: 'Journey List';
  };
  attributes: {
    Description: Schema.Attribute.Text;
    Image: Schema.Attribute.Media<'images' | 'files'>;
    Title: Schema.Attribute.String;
  };
}

export interface InsightsFeatures extends Struct.ComponentSchema {
  collectionName: 'components_insights_features';
  info: {
    displayName: 'Features';
  };
  attributes: {
    Content: Schema.Attribute.String;
    Count: Schema.Attribute.String;
    Image: Schema.Attribute.Media<'images' | 'files'>;
  };
}

export interface MenuFooter extends Struct.ComponentSchema {
  collectionName: 'components_menu_footers';
  info: {
    description: '';
    displayName: 'Footer';
  };
  attributes: {
    Brand: Schema.Attribute.Component<'footer.brand', false>;
    Customer_Support: Schema.Attribute.Component<
      'footer.customer-support',
      false
    >;
    Location_Showrooms: Schema.Attribute.Component<'footer.showroom', false>;
    Page: Schema.Attribute.Component<'menu.page', true>;
  };
}

export interface MenuHeader extends Struct.ComponentSchema {
  collectionName: 'components_menu_headers';
  info: {
    displayName: 'Header';
  };
  attributes: {
    Label: Schema.Attribute.String & Schema.Attribute.Required;
    Link: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'#'>;
  };
}

export interface MenuLinks extends Struct.ComponentSchema {
  collectionName: 'components_menu_links';
  info: {
    description: '';
    displayName: 'Links';
  };
  attributes: {
    Label: Schema.Attribute.String;
    URL: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#'>;
  };
}

export interface MenuLocation extends Struct.ComponentSchema {
  collectionName: 'components_menu_locations';
  info: {
    displayName: 'Location';
  };
  attributes: {
    Label: Schema.Attribute.String;
    URL: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#'>;
  };
}

export interface MenuMenuLinks extends Struct.ComponentSchema {
  collectionName: 'components_menu_menu_links';
  info: {
    displayName: 'Menu Links';
  };
  attributes: {};
}

export interface MenuPage extends Struct.ComponentSchema {
  collectionName: 'components_menu_pages';
  info: {
    description: '';
    displayName: 'Page';
  };
  attributes: {
    Links: Schema.Attribute.Component<'menu.links', true>;
    Type: Schema.Attribute.String;
  };
}

export interface OfferExclusiveDealsSection extends Struct.ComponentSchema {
  collectionName: 'components_offer_exclusive_deals_sections';
  info: {
    displayName: 'Exclusive Deals Section';
  };
  attributes: {
    Image: Schema.Attribute.Media<'images' | 'files'>;
  };
}

export interface OfferOfferSection extends Struct.ComponentSchema {
  collectionName: 'components_offer_offer_sections';
  info: {
    displayName: 'Offer Section';
  };
  attributes: {
    Image: Schema.Attribute.Media<'images' | 'files'>;
  };
}

export interface OtherVideos extends Struct.ComponentSchema {
  collectionName: 'components_other_videos';
  info: {
    displayName: 'Videos';
  };
  attributes: {};
}

export interface PricePrice extends Struct.ComponentSchema {
  collectionName: 'components_price_prices';
  info: {
    description: '';
    displayName: 'Price';
  };
  attributes: {
    Maximum: Schema.Attribute.BigInteger;
    Minimum: Schema.Attribute.BigInteger;
  };
}

export interface SeoGoogleTagManager extends Struct.ComponentSchema {
  collectionName: 'components_seo_google_tag_managers';
  info: {
    description: '';
    displayName: 'Google Tag Manager';
  };
  attributes: {
    Body: Schema.Attribute.Text;
    Head: Schema.Attribute.Text;
    Other: Schema.Attribute.Text;
  };
}

export interface SettingsContact extends Struct.ComponentSchema {
  collectionName: 'components_settings_contacts';
  info: {
    displayName: 'Contact';
  };
  attributes: {
    Address1: Schema.Attribute.Text & Schema.Attribute.Required;
    Address2: Schema.Attribute.Text;
    Email: Schema.Attribute.Email & Schema.Attribute.Required;
    Google_Map_Embed_Code: Schema.Attribute.String;
    Google_Map_URL: Schema.Attribute.String;
    Phone_Number: Schema.Attribute.String & Schema.Attribute.Required;
    WhatsApp_Number: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SettingsSmtp extends Struct.ComponentSchema {
  collectionName: 'components_settings_smtps';
  info: {
    description: '';
    displayName: 'SMTP';
  };
  attributes: {
    From_Mail_Address: Schema.Attribute.Email & Schema.Attribute.Required;
    From_Name: Schema.Attribute.String & Schema.Attribute.Required;
    Host: Schema.Attribute.String & Schema.Attribute.Required;
    Password: Schema.Attribute.Password;
    Port: Schema.Attribute.Integer & Schema.Attribute.Required;
    User: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SettingsSocialMediaLinks extends Struct.ComponentSchema {
  collectionName: 'components_settings_social_media_links';
  info: {
    displayName: 'Social Media Links';
  };
  attributes: {
    Facebook_URL: Schema.Attribute.String;
    Instagram_URL: Schema.Attribute.String;
    Linkedin_URL: Schema.Attribute.String;
    Twitter_URL: Schema.Attribute.String;
    Youtube_URL: Schema.Attribute.String;
  };
}

export interface SharedMetaSocial extends Struct.ComponentSchema {
  collectionName: 'components_shared_meta_socials';
  info: {
    description: '';
    displayName: 'metaSocial';
    icon: 'project-diagram';
  };
  attributes: {
    Description: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 65;
      }>;
    Image: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    Social_Network: Schema.Attribute.Enumeration<['Facebook', 'Twitter']> &
      Schema.Attribute.Required;
    Title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    CanonicalURL: Schema.Attribute.String;
    Keywords: Schema.Attribute.Text;
    Meta_Description: Schema.Attribute.Text;
    Meta_Image: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
    Meta_Robots: Schema.Attribute.String;
    Meta_Title: Schema.Attribute.Text;
    Meta_Viewport: Schema.Attribute.String;
    OG_Description: Schema.Attribute.Text;
    OG_Title: Schema.Attribute.String;
    Script: Schema.Attribute.Text;
    Structured_Data: Schema.Attribute.JSON;
  };
}

export interface WidgetBrandSection extends Struct.ComponentSchema {
  collectionName: 'components_widget_brand_sections';
  info: {
    description: '';
    displayName: 'Brand Section';
  };
  attributes: {
    Brands: Schema.Attribute.Relation<'oneToMany', 'api::brand.brand'>;
    Button: Schema.Attribute.Component<'button.button', false>;
    Description: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'defaultHtml';
        }
      >;
    Title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface WidgetCallToAction extends Struct.ComponentSchema {
  collectionName: 'components_widget_call_to_actions';
  info: {
    displayName: 'Call To Action';
  };
  attributes: {
    Button: Schema.Attribute.Component<'button.button', true>;
    Content1: Schema.Attribute.String & Schema.Attribute.Required;
    Content2: Schema.Attribute.String;
    Cover_Image: Schema.Attribute.Media<'images' | 'files'>;
  };
}

export interface WidgetInsights extends Struct.ComponentSchema {
  collectionName: 'components_widget_insights';
  info: {
    description: '';
    displayName: 'Insights';
  };
  attributes: {
    Button: Schema.Attribute.Component<'button.button', false>;
    Content: Schema.Attribute.Text;
    Features: Schema.Attribute.Component<'insights.features', true>;
    Heading: Schema.Attribute.String;
    Image: Schema.Attribute.Media<'images' | 'files'>;
  };
}

export interface WidgetMoments extends Struct.ComponentSchema {
  collectionName: 'components_widget_moments';
  info: {
    description: '';
    displayName: 'Moments';
  };
  attributes: {
    Company_Name: Schema.Attribute.String & Schema.Attribute.Required;
    Content: Schema.Attribute.Text & Schema.Attribute.Required;
    Heading: Schema.Attribute.String & Schema.Attribute.Required;
    Shorts: Schema.Attribute.Component<'widget.shorts', true>;
  };
}

export interface WidgetShorts extends Struct.ComponentSchema {
  collectionName: 'components_widget_shorts';
  info: {
    description: '';
    displayName: 'Shorts';
  };
  attributes: {
    Instagram_Link: Schema.Attribute.String & Schema.Attribute.DefaultTo<'/'>;
    Instagram_Shorts: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blog.blog-author': BlogBlogAuthor;
      'button.button': ButtonButton;
      'button.section': ButtonSection;
      'car.additional-sections': CarAdditionalSections;
      'car.availability-and-features': CarAvailabilityAndFeatures;
      'car.basic-information': CarBasicInformation;
      'car.find-more-section': CarFindMoreSection;
      'car.highlighting-and-recommendations': CarHighlightingAndRecommendations;
      'car.image': CarImage;
      'car.inspection-report-section': CarInspectionReportSection;
      'car.insurance-and-inspection': CarInsuranceAndInspection;
      'car.media': CarMedia;
      'car.registration-and-status': CarRegistrationAndStatus;
      'car.technical-and-performance': CarTechnicalAndPerformance;
      'common.author': CommonAuthor;
      'common.benefit-section': CommonBenefitSection;
      'common.benefits-and-advantages-section': CommonBenefitsAndAdvantagesSection;
      'common.faq': CommonFaq;
      'common.points': CommonPoints;
      'common.questions': CommonQuestions;
      'contact.certified-excellence': ContactCertifiedExcellence;
      'contact.image-section': ContactImageSection;
      'contact.modal-form': ContactModalForm;
      'dealer.additional-details': DealerAdditionalDetails;
      'dealer.dealer': DealerDealer;
      'dealer.emails': DealerEmails;
      'dealer.head': DealerHead;
      'dealer.manager': DealerManager;
      'footer.brand': FooterBrand;
      'footer.customer-support': FooterCustomerSupport;
      'footer.showroom': FooterShowroom;
      'home.banner-section': HomeBannerSection;
      'home.buy-and-sell-section': HomeBuyAndSellSection;
      'home.car-journey': HomeCarJourney;
      'home.journey-list': HomeJourneyList;
      'insights.features': InsightsFeatures;
      'menu.footer': MenuFooter;
      'menu.header': MenuHeader;
      'menu.links': MenuLinks;
      'menu.location': MenuLocation;
      'menu.menu-links': MenuMenuLinks;
      'menu.page': MenuPage;
      'offer.exclusive-deals-section': OfferExclusiveDealsSection;
      'offer.offer-section': OfferOfferSection;
      'other.videos': OtherVideos;
      'price.price': PricePrice;
      'seo.google-tag-manager': SeoGoogleTagManager;
      'settings.contact': SettingsContact;
      'settings.smtp': SettingsSmtp;
      'settings.social-media-links': SettingsSocialMediaLinks;
      'shared.meta-social': SharedMetaSocial;
      'shared.seo': SharedSeo;
      'widget.brand-section': WidgetBrandSection;
      'widget.call-to-action': WidgetCallToAction;
      'widget.insights': WidgetInsights;
      'widget.moments': WidgetMoments;
      'widget.shorts': WidgetShorts;
    }
  }
}
