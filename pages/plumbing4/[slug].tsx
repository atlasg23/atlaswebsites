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

                  {/* Rating Display - Show only if 5+ stars AND 10+ reviews */}
                  {parseFloat(business.rating) >= 5.0 && parseInt(business.reviews) >= 10 && (
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
                      <span className="text-xs font-medium">
                        {business.rating} ({business.reviews})
                      </span>
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

                {/* Rating Display - Show only if 5+ stars AND 10+ reviews */}
                {parseFloat(business.rating) >= 5.0 && parseInt(business.reviews) >= 10 && (
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
                    <span className="text-sm font-medium">
                      {business.rating} ({business.reviews})
                    </span>
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
                {replacePlaceholders(getDeviceValue('services_subheadline', '{business_name} provides expert plumbing solutions for residential and commercial properties in {city} and surrounding areas. A few of {business_name}\'s services include everything from emergency repairs to complete installations.'))}
              </p>
            </div>

            {/* Services Grid with Images */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {/* Service 1: Emergency Plumbing */}
              <div className="group bg-white rounded-xl shadow-lg overflow-hidden hover-lift">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getDeviceValue('service1_image', 'https://media.istockphoto.com/id/2164998055/photo/excess-water-on-the-bathroom-floor-flooding-in-the-bathroom.jpg?s=612x612&w=0&k=20&c=jGsDXpJAohowK-Q6V4dGlcCcMzkLgh5sE0mzTrpfZJo=')}
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
                    {replacePlaceholders(getDeviceValue('service1_description', 'Available 24/7 for urgent plumbing emergencies in {city} and surrounding areas. Fast response times and expert solutions when you need them most.'))}
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
                    src={getDeviceValue('service2_image', 'https://media.istockphoto.com/id/2188182926/photo/plumber-unclogging-blocked-shower-drain-with-hydro-jetting-at-home-bathroom-sewer-cleaning.jpg?s=612x612&w=0&k=20&c=x_cUZ9f-68akj7Vn8VIFAUVyhAoku0wt0uARXIUWeKk=')}
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
                    {replacePlaceholders(getDeviceValue('service2_description', '{business_name} provides professional drain cleaning services for residential and commercial properties in {city} and surrounding areas to clear clogs and keep your plumbing flowing smoothly.'))}
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
                    src={getDeviceValue('service3_image', 'https://media.istockphoto.com/id/2212376667/photo/man-fixing-water-heater-using-wrench.jpg?s=612x612&w=0&k=20&c=Fcp6DxVDkXFlvQAlv227EHr-49rdy2e1RQPvYerxUV4=')}
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
                    {replacePlaceholders(getDeviceValue('service3_description', 'Complete water heater installation, repair, and maintenance for both tank and tankless systems. {business_name} serves residential and commercial clients throughout {city}.'))}
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
                    src={getDeviceValue('service4_image', 'https://media.istockphoto.com/id/1052635334/photo/laying-and-installation-of-a-sewer-pipe.jpg?s=612x612&w=0&k=20&c=RCRzKnqrz897kWVFsJdbp6HXQ-Oqsyl0bQcFl4rdryE=')}
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
                    src={getDeviceValue('service5_image', 'https://media.istockphoto.com/id/1290764152/photo/installing-the-head-of-the-built-in-shower-faucet.jpg?s=612x612&w=0&k=20&c=FuouoZ16EqeOZpo-jKOBayZRVilrnUotSI_rVEmFKM8=')}
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
                    {replacePlaceholders(getDeviceValue('service5_description', 'Professional installation of faucets, toilets, sinks, showers, and other plumbing fixtures. {business_name} handles both residential and commercial fixture installations.'))}
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
                    src={getDeviceValue('service6_image', 'https://media.istockphoto.com/id/2167162369/photo/repairing-old-district-heating-pipeline-in-concrete-trench.jpg?s=612x612&w=0&k=20&c=2ylN8aXN9kHVSycfFpCv_8jgesHbavHkDkVAl21lG-I=')}
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
        <section id="contact" className="py-20 px-6 relative overflow-hidden">
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            {/* Section Header */}
            <div className="text-center mb-20">
              <div className="inline-block p-2 rounded-full mb-6" style={{ backgroundColor: `${primaryColor}15` }}>
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  📞
                </div>
              </div>
              <h2 className="text-5xl lg:text-6xl font-bold mb-6" style={{ color: primaryColor }}>
                Get in Touch
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Ready to solve your plumbing problems? Contact {business.name} for professional, reliable service you can trust.
              </p>
            </div>

            {/* Main Contact Grid */}
            <div className="grid lg:grid-cols-3 gap-8 mb-16">
              {/* Phone Contact - Primary CTA */}
              <div className="lg:col-span-1">
                <div 
                  className="bg-white p-8 rounded-2xl shadow-xl border-l-4 hover-lift h-full"
                  style={{ borderLeftColor: primaryColor }}
                >
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-6"
                      style={{ backgroundColor: primaryColor }}
                    >
                      📞
                    </div>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
                      Call Now
                    </h3>
                    <a 
                      href={`tel:${business.phone}`}
                      className="text-3xl font-bold hover:underline mb-4 block transition-all"
                      style={{ color: primaryColor }}
                    >
                      {business.phone}
                    </a>
                    <p className="text-gray-600 mb-6">
                      24/7 Emergency Service Available
                    </p>
                    <a
                      href={`tel:${business.phone}`}
                      className="inline-block px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift text-white w-full"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Call Now
                    </a>
                  </div>
                </div>
              </div>

              {/* Email & Service Area */}
              <div className="lg:col-span-1 space-y-8">
                {/* Email Card */}
                {business.email_1 && (
                  <div className="bg-white p-6 rounded-2xl shadow-lg hover-lift">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        ✉️
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900 mb-1">Email Us</h4>
                        <a 
                          href={`mailto:${business.email_1}`}
                          className="text-lg hover:underline break-all"
                          style={{ color: primaryColor }}
                        >
                          {business.email_1}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Area Card */}
                <div className="bg-white p-6 rounded-2xl shadow-lg hover-lift">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      📍
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">Service Area</h4>
                      <p className="text-gray-600">
                        {business.city}, {business.state} and surrounding areas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust Indicator */}
                <div className="bg-white p-6 rounded-2xl shadow-lg hover-lift">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      🛡️
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">Licensed & Insured</h4>
                      <p className="text-gray-600">
                        Fully licensed professionals with comprehensive insurance
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="lg:col-span-1">
                {business.working_hours ? (
                  <div className="bg-white p-8 rounded-2xl shadow-lg hover-lift h-full">
                    <div className="text-center mb-6">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        🕒
                      </div>
                      <h3 className="text-2xl font-bold" style={{ color: primaryColor }}>
                        Business Hours
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {(() => {
                        try {
                          const hours = JSON.parse(business.working_hours);
                          return Object.entries(hours).map(([day, time]) => (
                            <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                              <span className="font-medium text-gray-900">{day}</span>
                              <span className="text-gray-600">{time}</span>
                            </div>
                          ));
                        } catch {
                          return business.working_hours.split('\n').map((line, index) => (
                            <div key={index} className="text-center py-1 text-gray-700">
                              {line.trim()}
                            </div>
                          ));
                        }
                      })()}
                    </div>
                    
                    <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}08` }}>
                      <p className="text-center font-semibold" style={{ color: primaryColor }}>
                        🚨 Emergency Services Available 24/7
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl shadow-lg hover-lift h-full flex items-center justify-center">
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"
                        style={{ backgroundColor: primaryColor }}
                      >
                        🚨
                      </div>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
                        24/7 Service
                      </h3>
                      <p className="text-gray-600">
                        Emergency plumbing services available around the clock
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="mb-8 text-center">
                <h3 className="text-3xl font-bold mb-4" style={{ color: primaryColor }}>
                  Our Service Area
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  We proudly serve {business.city}, {business.state} and surrounding communities. 
                  See our coverage area below.
                </p>
              </div>
              
              {/* Google Maps Container */}
              <div className="relative h-96 rounded-xl overflow-hidden shadow-lg">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={business.latitude && business.longitude ? 
                    `https://maps.google.com/maps?width=100%25&height=400&hl=en&q=${business.latitude},${business.longitude}&t=&z=13&ie=UTF8&iwloc=&output=embed` :
                    `https://maps.google.com/maps?width=100%25&height=400&hl=en&q=${encodeURIComponent(business.city + ', ' + business.state)}&t=&z=12&ie=UTF8&iwloc=&output=embed`
                  }
                  title={`${business.name} Service Area Map`}
                  className="w-full h-full"
                />
              </div>
              
              {/* Service Area Info */}
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}08` }}>
                  <h4 className="font-bold mb-2" style={{ color: primaryColor }}>
                    📍 Primary Service Area
                  </h4>
                  <p className="text-gray-700 text-sm">
                    {business.city}, {business.state} and immediate surrounding areas
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <h4 className="font-bold mb-2 text-gray-900">
                    🌟 Extended Coverage
                  </h4>
                  <p className="text-gray-700 text-sm">
                    We also serve communities within a 25-mile radius for scheduled services
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 text-center">
              <div className="bg-white p-12 rounded-2xl shadow-xl" style={{ background: `linear-gradient(135deg, ${primaryColor}08 0%, white 100%)` }}>
                <h3 className="text-4xl font-bold mb-6" style={{ color: primaryColor }}>
                  Ready to Get Started?
                </h3>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Don't let plumbing problems disrupt your day. Contact {business.name} now for fast, professional service.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <a
                    href={`tel:${business.phone}`}
                    className="flex-1 px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    📞 Call {business.phone}
                  </a>
                  <button
                    className="flex-1 px-8 py-4 rounded-full font-bold text-lg border-2 transition-all hover-lift bg-white"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    💬 Get Free Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
                  {business.name}
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                  Your trusted plumbing professionals serving {business.city}, {business.state} and surrounding areas. 
                  Licensed, insured, and committed to quality service.
                </p>
                
                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <a 
                    href={`tel:${business.phone}`}
                    className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <span>📞</span>
                    <span>{business.phone}</span>
                  </a>
                  
                  {business.email_1 && (
                    <a 
                      href={`mailto:${business.email_1}`}
                      className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <span>✉️</span>
                      <span>{business.email_1}</span>
                    </a>
                  )}
                  
                  <div className="flex items-center space-x-3 text-gray-400">
                    <span>📍</span>
                    <span>{business.city}, {business.state}</span>
                  </div>
                </div>

                {/* Social Links - Only show if available */}
                {(business.facebook || business.instagram) && (
                  <div className="flex space-x-4">
                    {business.facebook && (
                      <a
                        href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                          👥
                        </div>
                      </a>
                    )}
                    {business.instagram && (
                      <a
                        href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-pink-400 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-colors">
                          📸
                        </div>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Services */}
              <div>
                <h4 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                  Our Services
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      Emergency Plumbing
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      Drain Cleaning
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      Water Heater Service
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      Pipe Repair
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      Fixture Installation
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      Sewer Line Services
                    </a>
                  </li>
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                  Quick Links
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="text-gray-400 hover:text-white transition-colors">
                      Services
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href={`tel:${business.phone}`} className="text-gray-400 hover:text-white transition-colors">
                      Emergency Service
                    </a>
                  </li>
                </ul>

                {/* Business Hours */}
                {business.working_hours && (
                  <div className="mt-6">
                    <h5 className="font-medium mb-2">Business Hours</h5>
                    <div className="text-sm text-gray-400">
                      {(() => {
                        try {
                          const hours = JSON.parse(business.working_hours);
                          const todayKey = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
                          return (
                            <div>
                              <div className="font-medium text-gray-300">
                                Today: {hours[todayKey] || 'Closed'}
                              </div>
                              <div className="text-xs mt-1">
                                <a href="#contact" className="hover:text-white transition-colors">
                                  View all hours
                                </a>
                              </div>
                            </div>
                          );
                        } catch {
                          return (
                            <div>
                              <a href="#contact" className="hover:text-white transition-colors">
                                View hours
                              </a>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Indicators Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between py-6 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-4 sm:mb-0">
                {/* License Badge */}
                <div className="flex items-center space-x-2 text-gray-400">
                  <span>🛡️</span>
                  <span className="text-sm">Licensed & Insured</span>
                </div>

                {/* Rating - Show only if 5+ stars AND 10+ reviews */}
                {parseFloat(business.rating) >= 5.0 && parseInt(business.reviews) >= 10 && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-yellow-400 text-sm ${i < Math.floor(parseFloat(business.rating)) ? '' : 'opacity-30'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm">{business.rating}/5 ({business.reviews} reviews)</span>
                  </div>
                )}

                {/* Emergency Service */}
                <div className="flex items-center space-x-2 text-gray-400">
                  <span>🚨</span>
                  <span className="text-sm">24/7 Emergency Service</span>
                </div>
              </div>

              {/* Emergency Call Button */}
              <a
                href={`tel:${business.phone}`}
                className="px-6 py-3 rounded-full font-bold transition-all hover-lift"
                style={{
                  backgroundColor: primaryColor,
                  color: 'white'
                }}
              >
                📞 Emergency Call
              </a>
            </div>

            {/* Copyright */}
            <div className="border-t border-gray-800 pt-6 text-center text-gray-500">
              <p>
                © {new Date().getFullYear()} {business.name}. All rights reserved.
                {business.city && business.state && (
                  <span> • Proudly serving {business.city}, {business.state}</span>
                )}
              </p>
            </div>
          </div>
        </footer>
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