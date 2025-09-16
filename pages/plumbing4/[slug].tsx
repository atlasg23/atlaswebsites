import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { getBusinessBySlug, PlumbingBusiness } from '../../lib/supabaseReader';
import { getTemplateCustomization, TemplateCustomization } from '../../lib/templateCustomizations';

interface Props {
  business: PlumbingBusiness;
  customization: TemplateCustomization | null;
}

export default function Plumbing4({ business, customization }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Handle scroll for navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.addEventListener('scroll', handleScroll);
    };
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
      .replace(/{address}/gi, business.full_address)
      .replace(/{rating}/gi, business.rating)
      .replace(/{reviews}/gi, business.reviews);
  };

  // Primary colors
  const primaryColor = business.primary_color || '#1E40AF';
  const secondaryColor = business.secondary_color || '#3B82F6';

  // Hero data with all customizations
  const heroData = {
    // Image settings
    image: getDeviceValue('hero_image', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200'),
    imagePosition: getDeviceValue('hero_imagePosition', 'center center'),
    imageSize: getDeviceValue('hero_imageSize', 'cover'),
    overlayOpacity: parseInt(getDeviceValue('hero_overlayOpacity', '60')),

    // Headline
    headline: getDeviceValue('hero_headline', `Expert Plumbing Services in ${business.city}, ${business.state}`),
    headlineColor: getDeviceValue('hero_headlineColor', '#FFFFFF'),

    // Subheadline
    subheadline: getDeviceValue('hero_subheadline', `Licensed & Insured • ${business.rating}★ Rating • Available 24/7`),
    subheadlineColor: getDeviceValue('hero_subheadlineColor', '#F3F4F6'),

    // Description
    description: getDeviceValue('hero_description', `Professional plumbing solutions from {business_name}. Emergency repairs, installations, and maintenance services you can trust.`),
    descriptionColor: getDeviceValue('hero_descriptionColor', '#E5E7EB'),

    // Buttons
    button1Text: getDeviceValue('hero_button1Text', 'Call Now'),
    button1BgColor: getDeviceValue('hero_button1BgColor', primaryColor),
    button1Color: getDeviceValue('hero_button1Color', '#FFFFFF'),

    button2Text: getDeviceValue('hero_button2Text', 'Get Free Quote'),
    button2BgColor: getDeviceValue('hero_button2BgColor', 'transparent'),
    button2Color: getDeviceValue('hero_button2Color', '#FFFFFF'),
  };

  return (
    <>
      <Head>
        <title>{`${replacePlaceholders(heroData.headline)} | ${business.name}`}</title>
        <meta name="description" content={replacePlaceholders(heroData.description)} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        :root {
          --primary-color: ${primaryColor};
          --secondary-color: ${secondaryColor};
        }

        .glass-effect {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .text-shadow {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .nav-blur {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
        }
      `}</style>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'nav-blur shadow-lg py-3' : 'bg-transparent py-4'
        }`}>
          <div className="max-w-7xl mx-auto px-4">
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-center w-full relative">
                {/* Centered Content */}
                <div className="flex flex-col items-center space-y-2">
                  {/* Business Name */}
                  <h1 className={`text-lg font-bold text-center ${
                    isScrolled ? 'text-gray-900' : 'text-white text-shadow'
                  }`}>
                    {business.name}
                  </h1>

                  {/* Phone Number */}
                  <a
                    href={`tel:${business.phone}`}
                    className="px-3 py-1 rounded-full font-semibold text-sm transition-all"
                    style={{ 
                      backgroundColor: primaryColor,
                      color: 'white'
                    }}
                  >
                    {business.phone}
                  </a>

                  {/* Rating Display - Show only if 4.5+ stars */}
                  {parseFloat(business.rating) >= 4.5 && (
                    <div className={`flex items-center justify-center space-x-2 ${
                      isScrolled ? 'text-gray-700' : 'text-white'
                    }`}>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-yellow-400 text-sm ${i < Math.floor(parseFloat(business.rating)) ? '' : 'opacity-30'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      {/* Show count only if 10+ reviews */}
                      {parseInt(business.reviews) >= 10 && (
                        <span className="text-xs font-medium">
                          {business.rating} ({business.reviews})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Menu Button - Positioned absolutely to top-right */}
                <button className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2">
                  <div className={`w-6 h-0.5 mb-1 ${isScrolled ? 'bg-gray-900' : 'bg-white'}`}></div>
                  <div className={`w-6 h-0.5 mb-1 ${isScrolled ? 'bg-gray-900' : 'bg-white'}`}></div>
                  <div className={`w-6 h-0.5 ${isScrolled ? 'bg-gray-900' : 'bg-white'}`}></div>
                </button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between">
              {/* Business Name & Info */}
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className={`text-xl font-bold ${
                    isScrolled ? 'text-gray-900' : 'text-white text-shadow'
                  }`}>
                    {business.name}
                  </h1>
                  <p className={`text-sm ${
                    isScrolled ? 'text-gray-600' : 'text-gray-200'
                  }`}>
                    {business.city}, {business.state}
                  </p>
                </div>

                {/* Rating Display - Show only if 4.5+ stars */}
                {parseFloat(business.rating) >= 4.5 && (
                  <div className={`flex items-center space-x-2 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`}>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-yellow-400 ${i < Math.floor(parseFloat(business.rating)) ? '' : 'opacity-30'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    {/* Show count only if 10+ reviews */}
                    {parseInt(business.reviews) >= 10 && (
                      <span className="text-sm font-medium">
                        {business.rating} ({business.reviews})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="flex items-center space-x-8">
                <a href="#about" className={`font-medium hover:opacity-80 transition-opacity ${
                  isScrolled ? 'text-gray-700' : 'text-white text-shadow'
                }`}>
                  About
                </a>
                <a href="#contact" className={`font-medium hover:opacity-80 transition-opacity ${
                  isScrolled ? 'text-gray-700' : 'text-white text-shadow'
                }`}>
                  Contact
                </a>

                {/* Phone Button */}
                <a
                  href={`tel:${business.phone}`}
                  className="px-6 py-3 rounded-full font-semibold transition-all hover-lift flex items-center space-x-2"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <span>📞</span>
                  <span>{business.phone}</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `url('${heroData.image}')`,
            backgroundSize: heroData.imageSize,
            backgroundPosition: heroData.imagePosition,
            backgroundAttachment: 'fixed'
          }}
        >
          {/* Simple Dark Overlay */}
          <div 
            className="absolute inset-0 bg-black"
            style={{ opacity: heroData.overlayOpacity / 100 }}
          />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
            <div className="max-w-4xl mx-auto">
              {/* Main Headline */}
              <h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-shadow leading-tight"
                style={{ color: heroData.headlineColor }}
              >
                {replacePlaceholders(heroData.headline)}
              </h1>

              {/* Description */}
              <p 
                className="text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed"
                style={{ color: heroData.descriptionColor }}
              >
                {replacePlaceholders(heroData.description)}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* Primary CTA */}
                <a
                  href={`tel:${business.phone}`}
                  className="px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift w-full sm:w-auto"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <span>📞</span>
                    <span>Call {business.phone}</span>
                  </div>
                </a>

                {/* Secondary CTA */}
                <button
                  className="px-8 py-4 rounded-full font-bold text-lg border-2 transition-all hover-lift w-full sm:w-auto"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    borderColor: secondaryColor
                  }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <span>💬</span>
                    <span>{heroData.button2Text}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>


        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Image Side */}
              <div className="relative">
                {/* About Image: Get from customizaiton or use default */}
                <img
                  src={getDeviceValue('about_image', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=500&fit=crop')}
                  alt="Professional Plumber"
                  className="rounded-lg shadow-lg w-full h-[500px] object-cover"
                />
                {/* Trust Indicator - Rating */}
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-lg shadow-xl">
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: primaryColor }}>
                      {business.rating}★
                    </div>
                    <div className="text-sm text-gray-600">{business.reviews} Reviews</div>
                  </div>
                </div>
              </div>

              {/* Content Side */}
              <div className="space-y-6">
                <div>
                  {/* About Headline */}
                  <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
                    {replacePlaceholders(getDeviceValue('about_headline', `About {business_name}`))}
                  </h2>
                  {/* About Subheadline/Description */}
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {replacePlaceholders(getDeviceValue('about_subheadline', `Your trusted plumbing professionals serving {city} and surrounding areas. We combine years of experience with modern techniques to deliver reliable, high-quality plumbing solutions for homes and businesses.`))}
                  </p>
                </div>

                {/* Trust Indicators Grid */}
                <div className="grid sm:grid-cols-2 gap-6 mt-8">
                  {/* Trust Indicator 1: Licensed & Insured */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl">🛡️</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Licensed & Insured</h3>
                      <p className="text-sm text-gray-600">Fully licensed and insured for your protection</p>
                    </div>
                  </div>

                  {/* Trust Indicator 2: Customer Rating */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl">⭐</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{business.rating}/5 Star Rating</h3>
                      <p className="text-sm text-gray-600">{business.reviews} satisfied customers</p>
                    </div>
                  </div>

                  {/* Trust Indicator 3: Expert Technicians */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl">🏆</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Expert Technicians</h3>
                      <p className="text-sm text-gray-600">Experienced and certified professionals</p>
                    </div>
                  </div>

                  {/* Trust Indicator 4: Quality Guarantee */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl">💯</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Quality Guarantee</h3>
                      <p className="text-sm text-gray-600">100% satisfaction guarantee on all work</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-6">
                  <a
                    href={`tel:${business.phone}`}
                    className="inline-flex items-center px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift space-x-3"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white'
                    }}
                  >
                    <span>📞</span>
                    <span>Call Now: {business.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section - Image-Based */}
        <section id="services" className="py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
                {replacePlaceholders(getDeviceValue('services_headline', 'Our Professional Services'))}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {replacePlaceholders(getDeviceValue('services_subheadline', 'Expert plumbing solutions for your home and business. We handle everything from emergency repairs to complete installations.'))}
              </p>
            </div>

            {/* Services Grid with Images */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {/* Service 1: Emergency Plumbing */}
              <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getDeviceValue('service1_image', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop')}
                    alt="Emergency Plumbing"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all"></div>
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    24/7
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    {getDeviceValue('service1_title', 'Emergency Plumbing')}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {getDeviceValue('service1_description', 'Available 24/7 for urgent plumbing emergencies. Fast response times and expert solutions when you need them most.')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      24/7 Emergency Service
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Burst Pipe Repairs
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Water Leak Detection
                    </li>
                  </ul>
                </div>
              </div>

              {/* Service 2: Drain Cleaning */}
              <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getDeviceValue('service2_image', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop')}
                    alt="Drain Cleaning"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    {getDeviceValue('service2_title', 'Drain Cleaning')}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {getDeviceValue('service2_description', 'Professional drain cleaning services to clear clogs and keep your plumbing flowing smoothly.')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Hydro Jetting
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Sewer Line Cleaning
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Root Removal
                    </li>
                  </ul>
                </div>
              </div>

              {/* Service 3: Water Heater Services */}
              <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getDeviceValue('service3_image', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop')}
                    alt="Water Heater Services"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    {getDeviceValue('service3_title', 'Water Heater Services')}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {getDeviceValue('service3_description', 'Complete water heater installation, repair, and maintenance for both tank and tankless systems.')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Installation & Replacement
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Tankless Systems
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Annual Maintenance
                    </li>
                  </ul>
                </div>
              </div>

              {/* Service 4: Pipe Repair & Replacement */}
              <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getDeviceValue('service4_image', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=300&fit=crop')}
                    alt="Pipe Repair"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    {getDeviceValue('service4_title', 'Pipe Repair & Replacement')}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {getDeviceValue('service4_description', 'Expert pipe repair and replacement using modern materials and techniques for lasting solutions.')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Trenchless Repair
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Copper & PEX Installation
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Leak Detection
                    </li>
                  </ul>
                </div>
              </div>

              {/* Service 5: Fixture Installation */}
              <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getDeviceValue('service5_image', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=300&fit=crop')}
                    alt="Fixture Installation"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    {getDeviceValue('service5_title', 'Fixture Installation')}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {getDeviceValue('service5_description', 'Professional installation of faucets, toilets, sinks, showers, and other plumbing fixtures.')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Faucets & Sinks
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Toilet Installation
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Shower & Tub Systems
                    </li>
                  </ul>
                </div>
              </div>

              {/* Service 6: Sewer Line Services */}
              <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getDeviceValue('service6_image', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop')}
                    alt="Sewer Line Services"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3" style={{ color: primaryColor }}>
                    {getDeviceValue('service6_title', 'Sewer Line Services')}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {getDeviceValue('service6_description', 'Complete sewer line inspection, cleaning, and repair services using advanced technology.')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Camera Inspection
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Trenchless Replacement
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Root & Blockage Removal
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-3xl font-bold mb-4" style={{ color: primaryColor }}>
                {getDeviceValue('services_cta_headline', 'Need Professional Plumbing Service?')}
              </h3>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {replacePlaceholders(getDeviceValue('services_cta_description', 'Contact {business_name} today for fast, reliable plumbing services. We provide free estimates and emergency support.'))}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`tel:${business.phone}`}
                  className="px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  📞 Call {business.phone}
                </a>
                <button
                  className="px-8 py-4 rounded-full font-bold text-lg border-2 transition-all hover-lift"
                  style={{
                    borderColor: primaryColor,
                    color: primaryColor,
                    backgroundColor: 'transparent'
                  }}
                >
                  💬 Get Free Quote
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
                Contact Us Today
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Ready to solve your plumbing problems? Get in touch with {business.name} for fast, reliable service.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information Side */}
              <div className="space-y-8">
                {/* Main Contact Card */}
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <h3 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
                    Get in Touch
                  </h3>
                  
                  {/* Phone */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: primaryColor }}
                    >
                      📞
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Call Us</h4>
                      <a 
                        href={`tel:${business.phone}`}
                        className="text-xl font-bold hover:underline"
                        style={{ color: primaryColor }}
                      >
                        {business.phone}
                      </a>
                      <p className="text-sm text-gray-600">Available 24/7 for emergencies</p>
                    </div>
                  </div>

                  {/* Email - Only show if business has email */}
                  {business.email_1 && (
                    <div className="flex items-center space-x-4 mb-6">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: primaryColor }}
                      >
                        ✉️
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Email Us</h4>
                        <a 
                          href={`mailto:${business.email_1}`}
                          className="text-lg hover:underline"
                          style={{ color: primaryColor }}
                        >
                          {business.email_1}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: primaryColor }}
                    >
                      📍
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Service Area</h4>
                      <p className="text-gray-600">{business.full_address}</p>
                      <p className="text-sm text-gray-500">Serving {business.city} and surrounding areas</p>
                    </div>
                  </div>
                </div>

                {/* Working Hours Card */}
                {business.working_hours && (
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
                      Business Hours
                    </h3>
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: primaryColor }}
                      >
                        🕒
                      </div>
                      <div>
                        <div className="text-lg text-gray-900">
                          {business.working_hours.split('\n').map((line, index) => (
                            <div key={index} className="mb-1">{line.trim()}</div>
                          ))}
                        </div>
                        <p className="text-sm text-red-600 font-semibold mt-3">
                          Emergency services available 24/7
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Media Card - Only show if we have social media */}
                {(business.instagram || business.facebook) && (
                  <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
                      Follow Us
                    </h3>
                    <div className="flex space-x-4">
                      {business.facebook && (
                        <a 
                          href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <span className="text-xl">👥</span>
                          <span className="font-semibold">Facebook</span>
                        </a>
                      )}
                      {business.instagram && (
                        <a 
                          href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
                        >
                          <span className="text-xl">📸</span>
                          <span className="font-semibold">Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick CTA */}
                <div className="bg-white p-8 rounded-xl shadow-lg text-center border-2" style={{ borderColor: primaryColor }}>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
                    Need Service Now?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Don't wait - plumbing problems get worse over time. Call us now for fast, professional service.
                  </p>
                  <a
                    href={`tel:${business.phone}`}
                    className="inline-flex items-center px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift space-x-3"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white'
                    }}
                  >
                    <span>📞</span>
                    <span>Call {business.phone}</span>
                  </a>
                </div>
              </div>

              {/* Map Side */}
              <div className="space-y-6">
                {/* Service Area Map */}
                <div className="bg-white p-8 rounded-xl shadow-lg h-[600px]">
                  <h3 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
                    Our Service Area
                  </h3>
                  
                  {/* Google Maps Embed - Using business coordinates or address */}
                  <div className="w-full h-full bg-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={business.latitude && business.longitude ? 
                        `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${business.latitude},${business.longitude}&t=&z=13&ie=UTF8&iwloc=&output=embed` :
                        `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodeURIComponent(business.city + ', ' + business.state)}&t=&z=12&ie=UTF8&iwloc=&output=embed`
                      }
                      title={`${business.name} Service Area Map`}
                      className="rounded-lg"
                    />
                  </div>
                  
                  {/* Service Area Info */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2" style={{ color: primaryColor }}>
                      Areas We Serve:
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {business.city}, {business.state} and surrounding communities within a 25-mile radius
                    </p>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                    <div className="text-3xl mb-2">⭐</div>
                    <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {business.rating}/5
                    </div>
                    <div className="text-sm text-gray-600">{business.reviews} Reviews</div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                    <div className="text-3xl mb-2">🛡️</div>
                    <div className="text-lg font-bold" style={{ color: primaryColor }}>
                      Licensed
                    </div>
                    <div className="text-sm text-gray-600">& Insured</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
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