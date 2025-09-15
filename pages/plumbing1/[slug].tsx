
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getBusinessBySlug, getAllBusinesses, PlumbingBusiness } from '../../lib/csvReader';

interface Props {
  business: PlumbingBusiness;
}

export default function Plumbing1({ business }: Props) {
  const primaryColor = business.primary_color || '#2563eb';
  const secondaryColor = business.secondary_color || '#1e40af';

  return (
    <>
      <Head>
        <title>{business.name} - Professional Plumbing Services</title>
        <meta name="description" content={`${business.name} provides professional plumbing services in ${business.city}, ${business.state}. Call ${business.phone} for reliable plumbing solutions.`} />
      </Head>

      <style jsx global>{`
        :root {
          --primary-color: ${primaryColor};
          --secondary-color: ${secondaryColor};
        }
      `}</style>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section 
          className="relative h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 text-white"
          style={{ 
            backgroundColor: primaryColor,
            backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
          }}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {business.name}
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Professional Plumbing Services in {business.city}, {business.state}
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <a 
                href={`tel:${business.phone}`}
                className="bg-white text-blue-800 px-8 py-4 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors"
                style={{ color: primaryColor }}
              >
                Call Now: {business.phone}
              </a>
              <div className="text-lg">
                ⭐ {business.rating}/5 ({business.reviews} reviews)
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6" style={{ color: primaryColor }}>
                  About {business.name}
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  {business.name} has proudly served {business.city} and surrounding areas with reliable, 
                  professional plumbing services. Our experienced team is committed to providing 
                  top-quality workmanship and exceptional customer service.
                </p>
                <p className="text-lg text-gray-700 mb-6">
                  Whether you need emergency repairs, routine maintenance, or new installations, 
                  we have the expertise to handle all your plumbing needs with efficiency and care.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                  <span className="font-semibold">Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: secondaryColor }}></div>
                  <span className="font-semibold">24/7 Emergency Service</span>
                </div>
              </div>
              <div className="relative">
                {business.logo && (
                  <img 
                    src={business.logo} 
                    alt={`${business.name} logo`}
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                )}
                {!business.logo && (
                  <div 
                    className="w-full h-64 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {business.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
              Our Services
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Emergency Repairs', icon: '🚨', desc: '24/7 emergency plumbing repairs' },
                { title: 'Drain Cleaning', icon: '🔧', desc: 'Professional drain cleaning services' },
                { title: 'Water Heater Service', icon: '🔥', desc: 'Installation and repair of water heaters' },
                { title: 'Pipe Installation', icon: '🔩', desc: 'New pipe installation and replacement' },
                { title: 'Leak Detection', icon: '💧', desc: 'Advanced leak detection and repair' },
                { title: 'Bathroom Remodeling', icon: '🚿', desc: 'Complete bathroom renovation services' }
              ].map((service, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-lg text-center">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: primaryColor }}>
                    {service.title}
                  </h3>
                  <p className="text-gray-600">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
              Customer Reviews
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((review) => (
                <div key={review} className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
                  </div>
                  <p className="text-gray-700 mb-4">
                    "Excellent service! Professional, timely, and affordable. 
                    I would definitely recommend {business.name} to anyone needing plumbing work."
                  </p>
                  <div className="font-semibold" style={{ color: primaryColor }}>
                    - Satisfied Customer
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <a 
                href={business.reviews_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Read More Reviews
              </a>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12" style={{ color: primaryColor }}>
              Service Area
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
                  We Serve {business.city} & Surrounding Areas
                </h3>
                <p className="text-lg text-gray-700 mb-6">
                  {business.full_address}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Phone:</span>
                    <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">
                      {business.phone}
                    </a>
                  </div>
                  {business.email_1 && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Email:</span>
                      <a href={`mailto:${business.email_1}`} className="text-blue-600 hover:underline">
                        {business.email_1}
                      </a>
                    </div>
                  )}
                  {business.working_hours && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Hours:</span>
                      <span>{business.working_hours}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-300 h-64 rounded-lg flex items-center justify-center">
                <span className="text-gray-600">Map Coming Soon</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-12 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">{business.name}</h3>
            <p className="text-gray-300 mb-4">
              Professional Plumbing Services in {business.city}, {business.state}
            </p>
            <div className="flex justify-center space-x-6 mb-6">
              <a href={`tel:${business.phone}`} className="hover:text-blue-400 transition-colors">
                📞 {business.phone}
              </a>
              {business.email_1 && (
                <a href={`mailto:${business.email_1}`} className="hover:text-blue-400 transition-colors">
                  ✉️ {business.email_1}
                </a>
              )}
            </div>
            <div className="flex justify-center space-x-4">
              {business.facebook && (
                <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Facebook
                </a>
              )}
              {business.instagram && (
                <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300">
                  Instagram
                </a>
              )}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700 text-gray-400">
              © 2024 {business.name}. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const business = getBusinessBySlug(params?.slug as string);

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
