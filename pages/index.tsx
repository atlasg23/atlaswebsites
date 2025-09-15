
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { getAllBusinesses, PlumbingBusiness } from "../lib/csvReader";
import { GetStaticProps } from "next";

interface Props {
  businesses: PlumbingBusiness[];
}

const Home: NextPage<Props> = ({ businesses }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Plumbing Business Templates</title>
        <meta name="description" content="Plumbing business website templates" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">
            Plumbing Business Templates
          </h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            Choose from two different template designs for your plumbing business
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-blue-600">Template 1</h2>
              <p className="text-gray-600 mb-4">
                Modern gradient design with hero section and service cards
              </p>
              <div className="text-sm text-gray-500">
                Features: Gradient backgrounds, card layouts, centered design
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-green-600">Template 2</h2>
              <p className="text-gray-600 mb-4">
                Clean professional design with sticky header and emergency call-to-action
              </p>
              <div className="text-sm text-gray-500">
                Features: Sticky navigation, emergency sections, testimonials
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-8">Available Businesses</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.slice(0, 12).map((business) => (
              <div key={business.slug} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  {business.logo && (
                    <img 
                      src={business.logo} 
                      alt={business.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg truncate">{business.name}</h3>
                    <p className="text-gray-600 text-sm">{business.city}, {business.state}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4 space-x-4">
                  <div className="flex items-center">
                    <span className="text-yellow-400">⭐</span>
                    <span className="ml-1 text-sm">{business.rating}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {business.reviews} reviews
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  {business.primary_color && (
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: business.primary_color }}
                      title={`Primary: ${business.primary_color}`}
                    ></div>
                  )}
                  {business.secondary_color && (
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: business.secondary_color }}
                      title={`Secondary: ${business.secondary_color}`}
                    ></div>
                  )}
                  <span className="text-xs text-gray-500">Brand Colors</span>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    href={`/plumbing1/${business.slug}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Template 1
                  </Link>
                  <Link 
                    href={`/plumbing2/${business.slug}`}
                    className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    Template 2
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {businesses.length > 12 && (
            <div className="text-center mt-8">
              <p className="text-gray-600">
                Showing first 12 of {businesses.length} businesses
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const businesses = getAllBusinesses();

  return {
    props: {
      businesses
    }
  };
};

export default Home;
