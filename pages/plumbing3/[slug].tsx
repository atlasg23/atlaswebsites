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

  // Process text with HTML formatting
  const renderFormattedText = (text: string) => {
    const processed = replacePlaceholders(text);
    return processed
      .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
      .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<span style="text-decoration:underline">$1</span>');
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

  // Handle button click
  const handleButtonClick = (button: typeof heroData.button1) => {
    switch (button.action) {
      case 'call':
        window.location.href = `tel:${button.actionValue}`;
        break;
      case 'email':
        window.location.href = `mailto:${button.actionValue}`;
        break;
      case 'link':
        window.open(button.actionValue, '_blank');
        break;
      case 'scroll':
        const element = document.getElementById(button.actionValue);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
        break;
    }
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

        {/* Placeholder sections for now */}
        <div className="py-20 text-center">
          <h2 className="text-3xl font-bold">More sections coming soon...</h2>
          <p className="text-gray-600 mt-4">Services, About, Contact sections will be added next</p>
        </div>
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