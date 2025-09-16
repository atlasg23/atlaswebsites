import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getBusinessBySlug, PlumbingBusiness } from '../../lib/supabaseReader';
import { getTemplateCustomization, TemplateCustomization } from '../../lib/templateCustomizations';

interface Props {
  business: PlumbingBusiness;
  customization: TemplateCustomization | null;
}

export default function Plumbing3({ business, customization }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get device-specific value
  const getDeviceValue = (key: string, defaultValue: any) => {
    const suffix = isMobile ? '_mobile' : '_desktop';
    const deviceKey = `${key}${suffix}`;

    // Try device-specific value first
    const deviceValue = customization?.custom_images?.[deviceKey] ||
                       customization?.custom_text?.[deviceKey] ||
                       customization?.custom_colors?.[deviceKey] ||
                       customization?.custom_styles?.[deviceKey] ||
                       customization?.custom_buttons?.[deviceKey];

    // Fall back to base value if device-specific doesn't exist
    if (deviceValue !== undefined) return deviceValue;

    return customization?.custom_images?.[key] ||
           customization?.custom_text?.[key] ||
           customization?.custom_colors?.[key] ||
           customization?.custom_styles?.[key] ||
           customization?.custom_buttons?.[key] ||
           defaultValue;
  };

  // Replace placeholders with actual business data
  const replacePlaceholders = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{business_name}/gi, business.name)
      .replace(/{city}/gi, business.city)
      .replace(/{state}/gi, business.state)
      .replace(/{phone}/gi, business.phone)
      .replace(/{email}/gi, business.email_1 || '')
      .replace(/{address}/gi, business.full_address);
  };

  // Process text with HTML formatting and robust sanitization
  const renderFormattedText = (text: string) => {
    const processed = replacePlaceholders(text);
    
    // Step 1: Remove all HTML tags first
    const stripped = processed.replace(/<[^>]*>/g, '');
    
    // Step 2: Apply safe formatting only to the stripped text
    const formatted = stripped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
      .replace(/__(.*?)__/g, '<span style="text-decoration:underline">$1</span>') // __underline__
      .replace(/\n/g, '<br>'); // newlines to br
    
    return formatted;
  };

  // Hero data with all customizations
  const heroData = {
    // Section settings
    sectionHeight: getDeviceValue('hero_sectionHeight', 'large'),
    sectionAnimation: getDeviceValue('hero_sectionAnimation', 'none'),

    // Image settings
    image: getDeviceValue('hero_image', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920'),
    imagePosition: getDeviceValue('hero_imagePosition', 'center center'),
    imageSize: getDeviceValue('hero_imageSize', 'cover'),
    imageFilter: getDeviceValue('hero_imageFilter', 'none'),
    overlayOpacity: parseInt(getDeviceValue('hero_overlayOpacity', '50')),

    // Headline
    headline: getDeviceValue('hero_headline', business.name),
    headlineSize: parseInt(getDeviceValue('hero_headlineSize', '48')),
    headlineFont: getDeviceValue('hero_headlineFont', 'Inter'),
    headlineWeight: getDeviceValue('hero_headlineWeight', 'bold'),
    headlineColor: getDeviceValue('hero_headlineColor', '#FFFFFF'),
    headlineAnimation: getDeviceValue('hero_headlineAnimation', 'fade-in'),

    // Subheadline
    subheadline: getDeviceValue('hero_subheadline', `Professional Plumbing Services in ${business.city}, ${business.state}`),
    subheadlineSize: parseInt(getDeviceValue('hero_subheadlineSize', '20')),
    subheadlineFont: getDeviceValue('hero_subheadlineFont', 'Inter'),
    subheadlineWeight: getDeviceValue('hero_subheadlineWeight', 'normal'),
    subheadlineColor: getDeviceValue('hero_subheadlineColor', '#FFFFFF'),
    subheadlineAnimation: getDeviceValue('hero_subheadlineAnimation', 'fade-in'),

    // Button 1
    button1: {
      enabled: getDeviceValue('hero_button1Enabled', 'true') === 'true',
      text: getDeviceValue('hero_button1Text', 'Call Now'),
      action: getDeviceValue('hero_button1_action', 'call'),
      actionValue: getDeviceValue('hero_button1_actionValue', business.phone),
      bgColor: getDeviceValue('hero_button1BgColor', '#10B981'),
      textColor: getDeviceValue('hero_button1Color', '#FFFFFF'),
      size: getDeviceValue('hero_button1Size', 'medium'),
      animation: getDeviceValue('hero_button1Animation', 'none'),
    },

    // Button 2
    button2: {
      enabled: getDeviceValue('hero_button2Enabled', 'true') === 'true',
      text: getDeviceValue('hero_button2Text', 'Get Quote'),
      action: getDeviceValue('hero_button2_action', 'email'),
      actionValue: getDeviceValue('hero_button2_actionValue', business.email_1 || ''),
      bgColor: getDeviceValue('hero_button2BgColor', '#0066CC'),
      textColor: getDeviceValue('hero_button2Color', '#FFFFFF'),
      size: getDeviceValue('hero_button2Size', 'medium'),
      animation: getDeviceValue('hero_button2Animation', 'none'),
    }
  };

  // Get section height class
  const getSectionHeight = () => {
    switch (heroData.sectionHeight) {
      case 'small': return 'h-64';
      case 'medium': return 'h-[500px]';
      case 'large': return 'h-[700px]';
      case 'full': return 'h-screen';
      default: return 'h-96';
    }
  };

  // Get animation class
  const getAnimationClass = (animation: string) => {
    if (animation === 'none' || !animation) return '';
    return `animate-${animation}`;
  };

  // Get button size
  const getButtonSize = (size: string) => {
    switch (size) {
      case 'small': return 'px-4 py-2 text-sm';
      case 'large': return 'px-8 py-4 text-lg';
      default: return 'px-6 py-3';
    }
  };

  // Get image filter
  const getImageFilter = () => {
    switch (heroData.imageFilter) {
      case 'blur': return 'blur(2px)';
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'brightness': return 'brightness(1.2)';
      case 'contrast': return 'contrast(1.2)';
      default: return 'none';
    }
  };

  // Handle button click with URL validation
  const handleButtonClick = (button: typeof heroData.button1) => {
    switch (button.action) {
      case 'call':
        // Sanitize phone number: only allow digits, +, -, (, ), spaces
        const sanitizedPhone = button.actionValue.replace(/[^0-9+\-\(\)\s]/g, '');
        window.location.href = `tel:${sanitizedPhone}`;
        break;
      case 'email':
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(button.actionValue)) {
          window.location.href = `mailto:${button.actionValue}`;
        }
        break;
      case 'link':
        // Validate URL scheme: only allow http(s)
        const url = button.actionValue;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
          if (newWindow) newWindow.opener = null; // Defense in depth
        } else {
          console.warn('Blocked potentially unsafe URL:', url);
        }
        break;
      case 'scroll':
        // Validate element ID: only allow alphanumeric, dash, underscore
        const elementId = button.actionValue.replace(/[^a-zA-Z0-9\-_]/g, '');
        const element = document.getElementById(elementId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
        break;
    }
  };

  // About Services data with all customizations
  const aboutServicesData = {
    // Section settings
    sectionEnabled: getDeviceValue('aboutServices_sectionEnabled', 'true') === 'true',
    sectionHeight: getDeviceValue('aboutServices_sectionHeight', 'auto'),
    sectionAnimation: getDeviceValue('aboutServices_sectionAnimation', 'fade-in'),
    sectionBgColor: getDeviceValue('aboutServices_sectionBgColor', '#F8FAFC'),

    // Main headline
    headline: getDeviceValue('aboutServices_headline', `Professional Plumbing Services in ${business.city}`),
    headlineSize: parseInt(getDeviceValue('aboutServices_headlineSize', '36')),
    headlineFont: getDeviceValue('aboutServices_headlineFont', 'Inter'),
    headlineWeight: getDeviceValue('aboutServices_headlineWeight', 'bold'),
    headlineColor: getDeviceValue('aboutServices_headlineColor', '#1F2937'),
    headlineAnimation: getDeviceValue('aboutServices_headlineAnimation', 'slide-up'),

    // Subheadline
    subheadline: getDeviceValue('aboutServices_subheadline', `With ${business.rating}/5 stars from ${business.reviews} satisfied customers, we're {business_name}'s trusted plumbing experts.`),
    subheadlineSize: parseInt(getDeviceValue('aboutServices_subheadlineSize', '18')),
    subheadlineFont: getDeviceValue('aboutServices_subheadlineFont', 'Inter'),
    subheadlineWeight: getDeviceValue('aboutServices_subheadlineWeight', 'normal'),
    subheadlineColor: getDeviceValue('aboutServices_subheadlineColor', '#6B7280'),
    subheadlineAnimation: getDeviceValue('aboutServices_subheadlineAnimation', 'slide-up'),

    // About text
    aboutText: getDeviceValue('aboutServices_aboutText', `At {business_name}, we've been serving {city} and surrounding areas with reliable, professional plumbing services. Whether you need emergency repairs, routine maintenance, or complete installations, our licensed and insured team is ready to help 24/7.`),
    aboutTextSize: parseInt(getDeviceValue('aboutServices_aboutTextSize', '16')),
    aboutTextFont: getDeviceValue('aboutServices_aboutTextFont', 'Inter'),
    aboutTextWeight: getDeviceValue('aboutServices_aboutTextWeight', 'normal'),
    aboutTextColor: getDeviceValue('aboutServices_aboutTextColor', '#4B5563'),
    aboutTextAnimation: getDeviceValue('aboutServices_aboutTextAnimation', 'fade-in'),

    // Services grid
    servicesEnabled: getDeviceValue('aboutServices_servicesEnabled', 'true') === 'true',
    servicesHeadline: getDeviceValue('aboutServices_servicesHeadline', 'Our Expert Services'),
    servicesHeadlineSize: parseInt(getDeviceValue('aboutServices_servicesHeadlineSize', '28')),
    servicesHeadlineColor: getDeviceValue('aboutServices_servicesHeadlineColor', '#1F2937'),
    
    // Service items (customizable)
    service1: {
      enabled: getDeviceValue('aboutServices_service1Enabled', 'true') === 'true',
      icon: getDeviceValue('aboutServices_service1Icon', '🔧'),
      title: getDeviceValue('aboutServices_service1Title', 'Emergency Repairs'),
      description: getDeviceValue('aboutServices_service1Description', '24/7 emergency plumbing repairs for urgent issues that can\'t wait.'),
    },
    service2: {
      enabled: getDeviceValue('aboutServices_service2Enabled', 'true') === 'true',
      icon: getDeviceValue('aboutServices_service2Icon', '🚿'),
      title: getDeviceValue('aboutServices_service2Title', 'Fixture Installation'),
      description: getDeviceValue('aboutServices_service2Description', 'Professional installation of faucets, sinks, toilets, and other fixtures.'),
    },
    service3: {
      enabled: getDeviceValue('aboutServices_service3Enabled', 'true') === 'true',
      icon: getDeviceValue('aboutServices_service3Icon', '🔥'),
      title: getDeviceValue('aboutServices_service3Title', 'Water Heater Service'),
      description: getDeviceValue('aboutServices_service3Description', 'Water heater repair, maintenance, and replacement services.'),
    },
    service4: {
      enabled: getDeviceValue('aboutServices_service4Enabled', 'true') === 'true',
      icon: getDeviceValue('aboutServices_service4Icon', '🌊'),
      title: getDeviceValue('aboutServices_service4Title', 'Drain Cleaning'),
      description: getDeviceValue('aboutServices_service4Description', 'Professional drain cleaning to remove clogs and improve flow.'),
    },

    // Call-to-action button
    ctaButton: {
      enabled: getDeviceValue('aboutServices_ctaEnabled', 'true') === 'true',
      text: getDeviceValue('aboutServices_ctaText', 'Get Free Quote'),
      action: getDeviceValue('aboutServices_ctaAction', 'call'),
      actionValue: getDeviceValue('aboutServices_ctaActionValue', business.phone),
      bgColor: getDeviceValue('aboutServices_ctaBgColor', business.primary_color || '#10B981'),
      textColor: getDeviceValue('aboutServices_ctaTextColor', '#FFFFFF'),
      size: getDeviceValue('aboutServices_ctaSize', 'large'),
      animation: getDeviceValue('aboutServices_ctaAnimation', 'bounce'),
    },

    // Contact info
    showContactInfo: getDeviceValue('aboutServices_showContactInfo', 'true') === 'true',
    contactHeadline: getDeviceValue('aboutServices_contactHeadline', 'Contact Us Today'),
    contactText: getDeviceValue('aboutServices_contactText', 'Ready to solve your plumbing problems? Call us now or request a free quote.'),
  };

  return (
    <>
      <Head>
        <title>{`${replacePlaceholders(heroData.headline)} - Professional Plumbing Services`}</title>
        <meta name="description" content={replacePlaceholders(heroData.subheadline)} />
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slide-down {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slide-left {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slide-right {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes zoom-in {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-fade-in { animation: fade-in 0.6s ease-out; }
          .animate-slide-up { animation: slide-up 0.6s ease-out; }
          .animate-slide-down { animation: slide-down 0.6s ease-out; }
          .animate-slide-left { animation: slide-left 0.6s ease-out; }
          .animate-slide-right { animation: slide-right 0.6s ease-out; }
          .animate-zoom-in { animation: zoom-in 0.6s ease-out; }
          .animate-bounce { animation: bounce 0.6s ease-out; }
        `}</style>
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section - EXACTLY matching editor preview */}
        <div
          className={`relative ${getSectionHeight()} flex items-center justify-center overflow-hidden ${getAnimationClass(heroData.sectionAnimation)}`}
          style={{
            backgroundImage: `url('${heroData.image}')`,
            backgroundSize: heroData.imageSize,
            backgroundPosition: heroData.imagePosition,
            filter: getImageFilter()
          }}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#000',
              opacity: heroData.overlayOpacity / 100
            }}
          />

          <div className={`relative z-10 text-center px-8`}>
            {/* Headline */}
            <h1
              className={`mb-4 ${getAnimationClass(heroData.headlineAnimation)}`}
              style={{
                color: heroData.headlineColor,
                fontSize: `${heroData.headlineSize}px`,
                fontFamily: heroData.headlineFont,
                fontWeight: heroData.headlineWeight as any
              }}
              dangerouslySetInnerHTML={{ __html: renderFormattedText(heroData.headline) }}
            />

            {/* Subheadline */}
            <p
              className={`mb-8 ${getAnimationClass(heroData.subheadlineAnimation)}`}
              style={{
                color: heroData.subheadlineColor,
                fontSize: `${heroData.subheadlineSize}px`,
                fontFamily: heroData.subheadlineFont,
                fontWeight: heroData.subheadlineWeight as any
              }}
              dangerouslySetInnerHTML={{ __html: renderFormattedText(heroData.subheadline) }}
            />

            {/* Buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              {heroData.button1.enabled && (
                <button
                  className={`${getButtonSize(heroData.button1.size)} rounded font-semibold ${getAnimationClass(heroData.button1.animation)}`}
                  style={{
                    backgroundColor: heroData.button1.bgColor,
                    color: heroData.button1.textColor
                  }}
                  onClick={() => handleButtonClick(heroData.button1)}
                >
                  {heroData.button1.text}
                </button>
              )}

              {heroData.button2.enabled && (
                <button
                  className={`${getButtonSize(heroData.button2.size)} rounded font-semibold ${getAnimationClass(heroData.button2.animation)}`}
                  style={{
                    backgroundColor: heroData.button2.bgColor,
                    color: heroData.button2.textColor
                  }}
                  onClick={() => handleButtonClick(heroData.button2)}
                >
                  {heroData.button2.text}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* About Services Section */}
        {aboutServicesData.sectionEnabled && (
          <section
            className={`py-20 px-6 ${getAnimationClass(aboutServicesData.sectionAnimation)}`}
            style={{ backgroundColor: aboutServicesData.sectionBgColor }}
            id="about-services"
          >
            <div className="max-w-6xl mx-auto">
              {/* Main Content */}
              <div className="text-center mb-16">
                {/* Headline */}
                <h2
                  className={`mb-6 ${getAnimationClass(aboutServicesData.headlineAnimation)}`}
                  style={{
                    color: aboutServicesData.headlineColor,
                    fontSize: `${aboutServicesData.headlineSize}px`,
                    fontFamily: aboutServicesData.headlineFont,
                    fontWeight: aboutServicesData.headlineWeight as any
                  }}
                  dangerouslySetInnerHTML={{ __html: renderFormattedText(aboutServicesData.headline) }}
                />

                {/* Subheadline */}
                <p
                  className={`mb-8 max-w-4xl mx-auto ${getAnimationClass(aboutServicesData.subheadlineAnimation)}`}
                  style={{
                    color: aboutServicesData.subheadlineColor,
                    fontSize: `${aboutServicesData.subheadlineSize}px`,
                    fontFamily: aboutServicesData.subheadlineFont,
                    fontWeight: aboutServicesData.subheadlineWeight as any
                  }}
                  dangerouslySetInnerHTML={{ __html: renderFormattedText(aboutServicesData.subheadline) }}
                />

                {/* About Text */}
                <p
                  className={`mb-12 max-w-3xl mx-auto leading-relaxed ${getAnimationClass(aboutServicesData.aboutTextAnimation)}`}
                  style={{
                    color: aboutServicesData.aboutTextColor,
                    fontSize: `${aboutServicesData.aboutTextSize}px`,
                    fontFamily: aboutServicesData.aboutTextFont,
                    fontWeight: aboutServicesData.aboutTextWeight as any
                  }}
                  dangerouslySetInnerHTML={{ __html: renderFormattedText(aboutServicesData.aboutText) }}
                />

                {/* Business Info Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {/* Rating Card */}
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="text-3xl mb-2">⭐</div>
                    <div className="text-2xl font-bold" style={{ color: aboutServicesData.headlineColor }}>
                      {business.rating}/5
                    </div>
                    <div className="text-sm text-gray-600">{business.reviews} Reviews</div>
                  </div>

                  {/* Verified Badge */}
                  {business.verified === 'true' && (
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                      <div className="text-3xl mb-2">✅</div>
                      <div className="text-lg font-bold" style={{ color: aboutServicesData.headlineColor }}>
                        Verified Business
                      </div>
                      <div className="text-sm text-gray-600">Licensed & Insured</div>
                    </div>
                  )}

                  {/* Service Area */}
                  <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="text-3xl mb-2">📍</div>
                    <div className="text-lg font-bold" style={{ color: aboutServicesData.headlineColor }}>
                      {business.city}, {business.state}
                    </div>
                    <div className="text-sm text-gray-600">Service Area</div>
                  </div>
                </div>
              </div>

              {/* Services Grid */}
              {aboutServicesData.servicesEnabled && (
                <div className="mb-16">
                  <h3
                    className="text-center mb-12"
                    style={{
                      color: aboutServicesData.servicesHeadlineColor,
                      fontSize: `${aboutServicesData.servicesHeadlineSize}px`,
                      fontFamily: aboutServicesData.headlineFont,
                      fontWeight: 'bold'
                    }}
                  >
                    {aboutServicesData.servicesHeadline}
                  </h3>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[aboutServicesData.service1, aboutServicesData.service2, aboutServicesData.service3, aboutServicesData.service4].map((service, index) => 
                      service.enabled && (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow">
                          <div className="text-4xl mb-4">{service.icon}</div>
                          <h4 className="font-bold mb-3" style={{ color: aboutServicesData.headlineColor }}>
                            {service.title}
                          </h4>
                          <p className="text-sm leading-relaxed" style={{ color: aboutServicesData.aboutTextColor }}>
                            {service.description}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {aboutServicesData.showContactInfo && (
                <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                  <h3 
                    className="text-2xl font-bold mb-4"
                    style={{ color: aboutServicesData.headlineColor }}
                  >
                    {aboutServicesData.contactHeadline}
                  </h3>
                  <p 
                    className="mb-6"
                    style={{ color: aboutServicesData.aboutTextColor }}
                  >
                    {aboutServicesData.contactText}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {/* CTA Button */}
                    {aboutServicesData.ctaButton.enabled && (
                      <button
                        className={`${getButtonSize(aboutServicesData.ctaButton.size)} rounded font-semibold ${getAnimationClass(aboutServicesData.ctaButton.animation)}`}
                        style={{
                          backgroundColor: aboutServicesData.ctaButton.bgColor,
                          color: aboutServicesData.ctaButton.textColor
                        }}
                        onClick={() => handleButtonClick(aboutServicesData.ctaButton)}
                      >
                        {aboutServicesData.ctaButton.text}
                      </button>
                    )}
                    
                    {/* Contact Info */}
                    <div className="text-center sm:text-left">
                      <div className="text-xl font-bold" style={{ color: aboutServicesData.headlineColor }}>
                        {business.phone}
                      </div>
                      {business.email_1 && (
                        <div className="text-gray-600">{business.email_1}</div>
                      )}
                      {business.working_hours && (
                        <div className="text-sm text-gray-500 mt-1">{business.working_hours}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;

  const business = await getBusinessBySlug(slug);
  if (!business) {
    return { notFound: true };
  }

  const customization = await getTemplateCustomization(slug);

  return {
    props: {
      business,
      customization
    }
  };
};