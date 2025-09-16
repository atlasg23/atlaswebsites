
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getBusinessBySlug, getAllBusinesses, PlumbingBusiness } from '../../lib/supabaseReader';

interface Props {
  business: PlumbingBusiness;
}

export default function Plumbing2({ business }: Props) {
  const primaryColor = business.primary_color || '#059669';
  const secondaryColor = business.secondary_color || '#047857';

  return (
    <>
      <Head>
        <title>{`${business.name} - Trusted Plumbing Experts`}</title>
        <meta name="description" content={`${business.name} - Your trusted plumbing experts in ${business.city}, ${business.state}. Professional service since day one. Call ${business.phone}.`} />
      </Head>

      <style jsx global>{`
        :root {
          --primary-color: ${primaryColor};
          --secondary-color: ${secondaryColor};
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* Header/Navigation */}
        <header className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {business.logo && (
                  <img src={business.logo} alt={business.name} className="h-12 w-12 rounded-full" />
                )}
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {business.name}
                </h1>
              </div>
              <a 
                href={`tel:${business.phone}`}
                className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                📞 {business.phone}
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                  Trusted Since Day One
                </span>
                <h2 className="text-5xl font-bold mb-6 leading-tight">
                  Professional <br />
                  <span style={{ color: primaryColor }}>Plumbing Services</span> <br />
                  in {business.city}
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  From emergency repairs to complete installations, we provide reliable 
                  plumbing solutions you can trust. Available 24/7 for your convenience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href={`tel:${business.phone}`}
                    className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors text-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Get Free Quote
                  </a>
                  <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition-colors"
                          style={{ borderColor: primaryColor, color: primaryColor }}>
                    View Services
                  </button>
                </div>
                <div className="flex items-center gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-xl">⭐</span>
                    <span className="font-semibold">{business.rating}/5</span>
                  </div>
                  <div className="text-gray-600">
                    {business.reviews} Happy Customers
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-8 text-white"
                     style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
                  <h3 className="text-2xl font-bold mb-4">Emergency Service Available</h3>
                  <p className="mb-6">
                    Don't let plumbing problems ruin your day. Our experienced team 
                    is ready to help 24/7.
                  </p>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-3xl font-bold">{business.phone}</div>
                    <div className="text-sm opacity-90">Call now for immediate assistance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 px-6 bg-green-50" style={{ backgroundColor: `${primaryColor}08` }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
                Why Choose {business.name}?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We've been proudly serving {business.city} and surrounding areas with 
                honest, reliable plumbing services that you can count on.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: '🛡️', 
                  title: 'Licensed & Insured', 
                  desc: 'Fully licensed professionals with comprehensive insurance coverage for your peace of mind.' 
                },
                { 
                  icon: '⚡', 
                  title: 'Fast Response', 
                  desc: 'Quick emergency response times to minimize damage and get your plumbing back to normal.' 
                },
                { 
                  icon: '💰', 
                  title: 'Fair Pricing', 
                  desc: 'Transparent, upfront pricing with no hidden fees. Quality work at competitive rates.' 
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg text-center">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
                Complete Plumbing Services
              </h2>
              <p className="text-xl text-gray-600">
                From minor repairs to major installations, we handle it all
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { service: 'Drain Cleaning', icon: '🌊' },
                { service: 'Water Heater Repair', icon: '🔥' },
                { service: 'Pipe Replacement', icon: '🔧' },
                { service: 'Leak Detection', icon: '🔍' },
                { service: 'Toilet Repair', icon: '🚽' },
                { service: 'Faucet Installation', icon: '🚿' },
                { service: 'Sewer Line Service', icon: '🔩' },
                { service: 'Emergency Repairs', icon: '🚨' }
              ].map((item, index) => (
                <div key={index} className="group border border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
                     style={{ '--hover-color': primaryColor } as any}>
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold group-hover:text-green-600" 
                      style={{ color: 'inherit' }}>
                    {item.service}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-20 px-6 bg-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
                What Our Customers Say
              </h2>
              <div className="flex items-center justify-center gap-2 text-2xl">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span className="font-bold text-xl">{business.rating}/5</span>
                <span className="text-gray-600">({business.reviews} reviews)</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  text: "Outstanding service! They arrived quickly and fixed our burst pipe with minimal mess. Professional and courteous throughout the entire process.",
                  author: "Sarah M.",
                  location: business.city
                },
                {
                  text: "I've used their services multiple times and they never disappoint. Fair pricing, quality work, and they always clean up after themselves.",
                  author: "Mike R.",
                  location: business.city
                }
              ].map((review, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="text-yellow-400 text-xl mb-4">⭐⭐⭐⭐⭐</div>
                  <p className="text-gray-700 mb-6 text-lg italic">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold"
                         style={{ backgroundColor: primaryColor }}>
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{review.author}</div>
                      <div className="text-gray-600 text-sm">{review.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact/Location Section */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-4xl font-bold mb-6" style={{ color: primaryColor }}>
                  Ready to Get Started?
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Contact us today for a free estimate. We're here to solve your 
                  plumbing problems quickly and professionally.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white"
                         style={{ backgroundColor: primaryColor }}>
                      📞
                    </div>
                    <div>
                      <div className="font-semibold">Call Us</div>
                      <a href={`tel:${business.phone}`} className="text-green-600 text-lg hover:underline"
                         style={{ color: primaryColor }}>
                        {business.phone}
                      </a>
                    </div>
                  </div>
                  {business.email_1 && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white"
                           style={{ backgroundColor: primaryColor }}>
                        ✉️
                      </div>
                      <div>
                        <div className="font-semibold">Email Us</div>
                        <a href={`mailto:${business.email_1}`} className="text-green-600 text-lg hover:underline"
                           style={{ color: primaryColor }}>
                          {business.email_1}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white"
                         style={{ backgroundColor: primaryColor }}>
                      📍
                    </div>
                    <div>
                      <div className="font-semibold">Service Area</div>
                      <div className="text-gray-600">{business.city}, {business.state}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-green-600 rounded-2xl p-8 text-white"
                   style={{ backgroundColor: primaryColor }}>
                <h3 className="text-2xl font-bold mb-6">Emergency Service</h3>
                <p className="mb-6">
                  Plumbing emergencies don't wait for business hours. 
                  That's why we're available 24/7 for urgent repairs.
                </p>
                <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold mb-2">{business.phone}</div>
                  <div className="text-sm opacity-90">Available 24/7</div>
                  <a 
                    href={`tel:${business.phone}`}
                    className="mt-4 inline-block bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    style={{ color: primaryColor }}
                  >
                    Call Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{business.name}</h3>
                <p className="text-gray-400 mb-4">
                  Your trusted plumbing professionals in {business.city}, {business.state}.
                </p>
                <div className="flex space-x-4">
                  {business.facebook && (
                    <a href={business.facebook} className="text-blue-400 hover:text-blue-300">Facebook</a>
                  )}
                  {business.instagram && (
                    <a href={business.instagram} className="text-pink-400 hover:text-pink-300">Instagram</a>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Emergency Repairs</li>
                  <li>Drain Cleaning</li>
                  <li>Water Heater Service</li>
                  <li>Pipe Installation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <div className="space-y-2 text-gray-400">
                  <div>📞 {business.phone}</div>
                  {business.email_1 && <div>✉️ {business.email_1}</div>}
                  <div>📍 {business.city}, {business.state}</div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              © 2024 {business.name}. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const business = await getBusinessBySlug(params?.slug as string);

  if (!business) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      business
    }
  };
};
