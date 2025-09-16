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
                <a href="#services" className={`font-medium hover:opacity-80 transition-opacity ${
                  isScrolled ? 'text-gray-700' : 'text-white text-shadow'
                }`}>
                  Services
                </a>
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

        {/* Services Section */}
        <section id="services" className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8" style={{ color: primaryColor }}>
              Services
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {/* Service 1: Emergency Plumbing */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover-lift">
                <div className="text-4xl mb-4">🚨</div>
                <h3 className="text-xl font-bold mb-3">Emergency Plumbing</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  24/7 emergency plumbing for urgent issues like burst pipes, severe leaks, and overflowing toilets. We are available day or night to address your critical plumbing needs.
                </p>
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center px-6 py-3 rounded-full font-bold text-lg transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  Call: {business.phone}
                </a>
              </div>

              {/* Service 2: Drain Cleaning */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover-lift">
                <div className="text-4xl mb-4">
                  <img src="https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200" alt="Drain Cleaning" className="w-24 h-24 object-cover rounded-md"/>
                </div>
                <h3 className="text-xl font-bold mb-3">Drain Cleaning</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Clogged drains are no match for us. We use professional equipment to clear blockages in sinks, showers, and main sewer lines, ensuring smooth water flow.
                </p>
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center px-6 py-3 rounded-full font-bold text-lg transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  Call: {business.phone}
                </a>
              </div>

              {/* Service 3: Water Heater Services */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover-lift">
                <div className="text-4xl mb-4">🔥</div>
                <h3 className="text-xl font-bold mb-3">Water Heater Services</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  From installation to repair and maintenance, we ensure your water heater runs efficiently. Enjoy reliable hot water with our expert services for all major brands.
                </p>
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center px-6 py-3 rounded-full font-bold text-lg transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  Call: {business.phone}
                </a>
              </div>

              {/* Service 4: Leak Detection */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover-lift">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-3">Leak Detection</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Undetected leaks cause damage. We use advanced technology to pinpoint hidden leaks in pipes, walls, and foundations, preventing costly repairs and water waste.
                </p>
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center px-6 py-3 rounded-full font-bold text-lg transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  Call: {business.phone}
                </a>
              </div>

              {/* Service 5: Fixture Installation */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover-lift">
                <div className="text-4xl mb-4">🔧</div>
                <h3 className="text-xl font-bold mb-3">Fixture Installation</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Upgrade your kitchen or bathroom with professional fixture installation. We expertly install faucets, sinks, toilets, and more, ensuring perfect fit and function.
                </p>
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center px-6 py-3 rounded-full font-bold text-lg transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  Call: {business.phone}
                </a>
              </div>

              {/* Service 6: Pipe Repair */}
              <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md hover-lift">
                <div className="text-4xl mb-4">🛠️</div>
                <h3 className="text-xl font-bold mb-3">Pipe Repair</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  Damaged pipes? We provide reliable pipe repair services, addressing everything from minor leaks to major pipe replacements, ensuring the integrity of your plumbing system.
                </p>
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center px-6 py-3 rounded-full font-bold text-lg transition-all"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white'
                  }}
                >
                  Call: {business.phone}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 px-6 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl mb-4">{business.phone}</p>
            {business.email_1 && (
              <p className="text-lg mb-2">{business.email_1}</p>
            )}
            <p className="text-gray-400">{business.full_address}</p>
            {business.working_hours && (
              <p className="text-gray-400 mt-2">{business.working_hours}</p>
            )}
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