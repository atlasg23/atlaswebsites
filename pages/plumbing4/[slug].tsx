
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { getBusinessBySlug, getBusinessReviews, PlumbingBusiness, GoogleReview } from '../../lib/supabaseReader';
import { getTemplateCustomization, TemplateCustomization } from '../../lib/templateCustomizations';

interface Props {
  business: PlumbingBusiness;
  customization: TemplateCustomization | null;
  reviews: GoogleReview[];
}

export default function Plumbing4({ business, customization, reviews }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const reviewsContainerRef = useRef<HTMLDivElement>(null);

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
      window.removeEventListener('scroll', handleScroll);
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

  // Services data
  const services = [
    { name: 'Emergency Plumbing', href: '#services' },
    { name: 'Drain Cleaning', href: '#services' },
    { name: 'Water Heater Services', href: '#services' },
    { name: 'Pipe Repair & Replacement', href: '#services' },
    { name: 'Fixture Installation', href: '#services' },
    { name: 'Sewer Line Services', href: '#services' }
  ];

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

        .dropdown-menu {
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }

        .dropdown-menu.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .mobile-menu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .mobile-menu.show {
          max-height: 500px;
        }

        .review-card {
          min-width: 300px;
          flex: 0 0 auto;
        }

        @media (min-width: 768px) {
          .review-card {
            min-width: 400px;
          }
        }

        .reviews-container {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .reviews-container::-webkit-scrollbar {
          display: none;
        }

        .review-dots {
          transition: all 0.3s ease;
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
              <div className="flex items-center justify-between">
                {/* Business Name */}
                <div>
                  <h1 className={`text-lg font-bold ${
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

                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: showMobileMenu ? primaryColor : 'transparent' }}
                >
                  <div className={`w-6 h-0.5 mb-1 transition-all ${showMobileMenu ? 'bg-white' : (isScrolled ? 'bg-gray-900' : 'bg-white')}`}></div>
                  <div className={`w-6 h-0.5 mb-1 transition-all ${showMobileMenu ? 'bg-white' : (isScrolled ? 'bg-gray-900' : 'bg-white')}`}></div>
                  <div className={`w-6 h-0.5 transition-all ${showMobileMenu ? 'bg-white' : (isScrolled ? 'bg-gray-900' : 'bg-white')}`}></div>
                </button>
              </div>

              {/* Mobile Menu */}
              <div className={`mobile-menu ${showMobileMenu ? 'show' : ''} bg-white shadow-lg rounded-lg mt-4 p-4`}>
                <div className="space-y-4">
                  <a href="#about" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">About</a>
                  <a href="#services" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">Services</a>
                  <a href="#contact" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">Contact</a>
                  <a
                    href={`tel:${business.phone}`}
                    className="block w-full py-3 px-4 rounded-full font-bold text-center text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Call {business.phone}
                  </a>
                </div>
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
                    Professional Plumbing Services • {business.city}, {business.state}
                  </p>
                </div>

                {/* Rating Display - Show only if 5+ stars AND 10+ reviews */}
                {parseFloat(business.rating) >= 5.0 && parseInt(business.reviews) >= 10 && (
                  <div className={`flex items-center space-x-2 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`}>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
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
                  isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white text-shadow hover:text-blue-200'
                }`}>
                  About
                </a>

                {/* Services Dropdown */}
                <div 
                  className="relative"
                  onMouseEnter={() => setShowServicesDropdown(true)}
                  onMouseLeave={() => setShowServicesDropdown(false)}
                >
                  <button className={`font-medium hover:opacity-80 transition-opacity flex items-center space-x-1 ${
                    isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white text-shadow hover:text-blue-200'
                  }`}>
                    <span>Services</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`dropdown-menu ${showServicesDropdown ? 'show' : ''} absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2`}>
                    {services.map((service, index) => (
                      <a
                        key={index}
                        href={service.href}
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors font-medium"
                      >
                        {service.name}
                      </a>
                    ))}
                  </div>
                </div>

                <a href="#contact" className={`font-medium hover:opacity-80 transition-opacity ${
                  isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white text-shadow hover:text-blue-200'
                }`}>
                  Contact
                </a>

                {/* Phone Button */}
                <a
                  href={`tel:${business.phone}`}
                  className="px-6 py-3 rounded-full font-semibold transition-all hover-lift flex items-center space-x-2 shadow-lg"
                  style={{ 
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
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
                  className="px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift w-full sm:w-auto shadow-xl"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>Call {business.phone}</span>
                  </div>
                </a>

                {/* Secondary CTA */}
                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 rounded-full font-bold text-lg border-2 transition-all hover-lift w-full sm:w-auto shadow-xl"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'white',
                    borderColor: secondaryColor
                  }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
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
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                      <svg className="w-6 h-6" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Licensed & Insured</h3>
                      <p className="text-sm text-gray-600">Fully licensed and insured for your protection</p>
                    </div>
                  </div>

                  {/* Trust Indicator 2: Fast Turnaround */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                      <svg className="w-6 h-6" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Fast Turnaround</h3>
                      <p className="text-sm text-gray-600">Quick response times and efficient service</p>
                    </div>
                  </div>

                  {/* Trust Indicator 3: Fair Pricing */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                      <svg className="w-6 h-6" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Fair & Honest Pricing</h3>
                      <p className="text-sm text-gray-600">Transparent pricing with no hidden fees</p>
                    </div>
                  </div>

                  {/* Trust Indicator 4: Licensed Only */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                      <svg className="w-6 h-6" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Quality Guarantee</h3>
                      <p className="text-sm text-gray-600">Satisfaction guaranteed on all work</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-6">
                  <a
                    href={`tel:${business.phone}`}
                    className="inline-flex items-center px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift space-x-3 shadow-lg"
                    style={{
                      backgroundColor: primaryColor,
                      color: 'white'
                    }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
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
                {replacePlaceholders(getDeviceValue('services_headline', '{business_name} Professional Services'))}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {replacePlaceholders(getDeviceValue('services_subheadline', 'Expert plumbing solutions for residential and commercial properties in {city} and surrounding areas. Our comprehensive services include everything from emergency repairs to complete installations.'))}
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
                    {replacePlaceholders(getDeviceValue('service2_description', 'Professional drain cleaning services for residential and commercial properties in {city} and surrounding areas to clear clogs and keep your plumbing flowing smoothly.'))}
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
                    {replacePlaceholders(getDeviceValue('service3_description', 'Complete water heater installation, repair, and maintenance for both tank and tankless systems. Serving residential and commercial clients throughout {city}.'))}
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
                    {replacePlaceholders(getDeviceValue('service5_description', 'Professional installation of faucets, toilets, sinks, showers, and other plumbing fixtures. Expert handling of both residential and commercial installations.'))}
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
                  className="px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift shadow-lg"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>Call {business.phone}</span>
                  </div>
                </a>
                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 rounded-full font-bold text-lg border-2 transition-all hover-lift shadow-lg bg-white"
                  style={{
                    borderColor: primaryColor,
                    color: primaryColor
                  }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                    <span>Get Free Quote</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section - Only show if 3+ five-star reviews */}
        {reviews.length >= 3 && (
          <section className="py-20 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
                  What Our Customers Say
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Real reviews from satisfied customers in {business.city} and surrounding areas
                </p>
              </div>

              {/* Reviews Carousel */}
              <div className="relative">
                <div
                  ref={reviewsContainerRef}
                  className="reviews-container flex gap-6 overflow-x-auto pb-8"
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const scrollPercentage = container.scrollLeft / (container.scrollWidth - container.clientWidth);
                    const index = Math.round(scrollPercentage * (Math.min(reviews.length, 5) - 1));
                    setCurrentReviewIndex(index);
                  }}
                >
                  {reviews.slice(0, 5).map((review, index) => (
                    <div
                      key={review.review_id || index}
                      className="review-card bg-white rounded-xl shadow-lg p-6 hover-lift border border-gray-100"
                    >
                      {/* Stars */}
                      <div className="flex items-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-5 h-5 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>

                      {/* Review Text */}
                      {review.review_text && (
                        <p className="text-gray-700 mb-4 line-clamp-4 leading-relaxed">
                          "{review.review_text}"
                        </p>
                      )}

                      {/* Reviewer Name & Date */}
                      <div className="mt-auto">
                        <p className="font-semibold text-gray-900">
                          {review.reviewer_name}
                        </p>
                        {review.published_at && (
                          <p className="text-sm text-gray-500">
                            {review.published_at}
                          </p>
                        )}
                        {review.is_local_guide && (
                          <p className="text-xs text-blue-600 mt-1">
                            <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Local Guide
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows for Desktop */}
                <button
                  onClick={() => {
                    if (reviewsContainerRef.current) {
                      const cardWidth = reviewsContainerRef.current.querySelector('.review-card')?.clientWidth || 400;
                      reviewsContainerRef.current.scrollLeft -= cardWidth + 24;
                    }
                  }}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full shadow-lg items-center justify-center bg-white hover:shadow-xl transition-all"
                  style={{ borderColor: primaryColor, borderWidth: '2px' }}
                >
                  <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (reviewsContainerRef.current) {
                      const cardWidth = reviewsContainerRef.current.querySelector('.review-card')?.clientWidth || 400;
                      reviewsContainerRef.current.scrollLeft += cardWidth + 24;
                    }
                  }}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full shadow-lg items-center justify-center bg-white hover:shadow-xl transition-all"
                  style={{ borderColor: primaryColor, borderWidth: '2px' }}
                >
                  <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Dots Indicator */}
              {reviews.length > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  {reviews.slice(0, 5).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (reviewsContainerRef.current) {
                          const cardWidth = reviewsContainerRef.current.querySelector('.review-card')?.clientWidth || 400;
                          reviewsContainerRef.current.scrollLeft = index * (cardWidth + 24);
                          setCurrentReviewIndex(index);
                        }
                      }}
                      className="review-dots w-2 h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: index === currentReviewIndex ? primaryColor : '#CBD5E0',
                        width: index === currentReviewIndex ? '24px' : '8px'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* View More Reviews Button */}
              {business.reviews_link && (
                <div className="text-center mt-12">
                  <a
                    href={business.reviews_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift shadow-lg"
                    style={{
                      backgroundColor: 'white',
                      color: primaryColor,
                      borderWidth: '2px',
                      borderColor: primaryColor
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    View More Reviews on Google
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Contact Section with Form */}
        <section id="contact" className="py-20 px-6 relative overflow-hidden">
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-block p-3 rounded-full mb-6" style={{ backgroundColor: `${primaryColor}15` }}>
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: primaryColor }}>
                Get in Touch
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Ready to solve your plumbing problems? Contact {business.name} for professional, reliable service you can trust.
              </p>
            </div>

            {/* Contact Grid */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Contact Form */}
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
                  Get Your Free Quote
                </h3>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                        style={{ focusRingColor: primaryColor }}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Needed</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all">
                      <option>Select a service...</option>
                      <option>Emergency Plumbing</option>
                      <option>Drain Cleaning</option>
                      <option>Water Heater Services</option>
                      <option>Pipe Repair & Replacement</option>
                      <option>Fixture Installation</option>
                      <option>Sewer Line Services</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none"
                      placeholder="Please describe your plumbing issue or project..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-8 py-4 rounded-full font-bold text-lg transition-all hover-lift shadow-lg text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Send Message & Get Free Quote
                  </button>
                </form>

                <div className="mt-6 p-4 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600 text-center">
                    <svg className="w-5 h-5 inline-block mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Your information is secure and will only be used to contact you about your plumbing needs.
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                {/* Phone Contact */}
                <div className="bg-white p-8 rounded-2xl shadow-lg hover-lift">
                  <div className="flex items-center space-x-4 mb-4">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold" style={{ color: primaryColor }}>Call Now</h4>
                      <p className="text-gray-600">24/7 Emergency Service</p>
                    </div>
                  </div>
                  
                  <a 
                    href={`tel:${business.phone}`}
                    className="text-2xl font-bold hover:underline mb-4 block transition-all"
                    style={{ color: primaryColor }}
                  >
                    {business.phone}
                  </a>
                  
                  <a
                    href={`tel:${business.phone}`}
                    className="inline-block w-full px-6 py-3 rounded-full font-bold text-center transition-all hover-lift text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Call Now
                  </a>
                </div>

                {/* Email */}
                {business.email_1 && (
                  <div className="bg-white p-6 rounded-2xl shadow-lg hover-lift">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900 mb-1">Email Us</h4>
                        <a 
                          href={`mailto:${business.email_1}`}
                          className="hover:underline break-all"
                          style={{ color: primaryColor }}
                        >
                          {business.email_1}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Area */}
                <div className="bg-white p-6 rounded-2xl shadow-lg hover-lift">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">Service Area</h4>
                      <p className="text-gray-600">
                        {business.city}, {business.state} and surrounding areas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                {business.working_hours && (
                  <div className="bg-white p-6 rounded-2xl shadow-lg hover-lift">
                    <div className="flex items-center space-x-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">Business Hours</h4>
                      </div>
                    </div>
                    
                    <div className="ml-16 space-y-2">
                      {(() => {
                        try {
                          const hours = JSON.parse(business.working_hours);
                          return Object.entries(hours).map(([day, time]) => (
                            <div key={day} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                              <span className="font-medium text-gray-900">{day}</span>
                              <span className="text-gray-600">{time}</span>
                            </div>
                          ));
                        } catch {
                          return business.working_hours.split('\n').map((line, index) => (
                            <div key={index} className="text-gray-700 py-1">
                              {line.trim()}
                            </div>
                          ));
                        }
                      })()}
                    </div>
                    
                    <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}08` }}>
                      <p className="text-center font-semibold text-sm" style={{ color: primaryColor }}>
                        🚨 Emergency Services Available 24/7
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
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>{business.phone}</span>
                  </a>
                  
                  {business.email_1 && (
                    <a 
                      href={`mailto:${business.email_1}`}
                      className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <span>{business.email_1}</span>
                    </a>
                  )}
                  
                  <div className="flex items-center space-x-3 text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{business.city}, {business.state}</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                  Our Services
                </h4>
                <ul className="space-y-2">
                  {services.map((service, index) => (
                    <li key={index}>
                      <a href={service.href} className="text-gray-400 hover:text-white transition-colors">
                        {service.name}
                      </a>
                    </li>
                  ))}
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

                {/* Business Hours Summary */}
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
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Licensed & Insured</span>
                </div>

                {/* Rating - Show only if 5+ stars AND 10+ reviews */}
                {parseFloat(business.rating) >= 5.0 && parseInt(business.reviews) >= 10 && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-sm">★</span>
                      ))}
                    </div>
                    <span className="text-sm">{business.rating}/5 ({business.reviews} reviews)</span>
                  </div>
                )}

                {/* Emergency Service */}
                <div className="flex items-center space-x-2 text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">24/7 Emergency Service</span>
                </div>
              </div>
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

  // Fetch Google Reviews if place_id exists
  let reviews: GoogleReview[] = [];
  if (business.place_id) {
    reviews = await getBusinessReviews(business.place_id, 10);
  }

  return {
    props: {
      business,
      customization,
      reviews
    }
  };
};
