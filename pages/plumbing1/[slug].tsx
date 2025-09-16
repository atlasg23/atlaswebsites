import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getBusinessBySlug, PlumbingBusiness } from '../../lib/supabaseReader';
import { getTemplateCustomization, TemplateCustomization } from '../../lib/templateCustomizations';

interface Props {
  business: PlumbingBusiness;
  customization: TemplateCustomization | null;
}

export default function Plumbing1({ business, customization }: Props) {
  // Get all customizations with defaults
  const heroImage = customization?.custom_images?.hero_image ||
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920';

  const headline = customization?.custom_text?.hero_headline ||
    business.name;

  const headlineColor = customization?.custom_colors?.hero_headlineColor ||
    '#FFFFFF';

  const subheadline = customization?.custom_text?.hero_subheadline ||
    `Professional Plumbing Services in ${business.city}, ${business.state}`;

  const subheadlineColor = customization?.custom_colors?.hero_subheadlineColor ||
    '#FFFFFF';

  const button1Text = customization?.custom_text?.hero_button1Text ||
    'Call Now';

  const button1BgColor = customization?.custom_colors?.hero_button1BgColor ||
    '#10B981';

  const button1Color = customization?.custom_colors?.hero_button1Color ||
    '#FFFFFF';

  const button2Text = customization?.custom_text?.hero_button2Text ||
    'View Reviews';

  const button2BgColor = customization?.custom_colors?.hero_button2BgColor ||
    '#0066CC';

  const button2Color = customization?.custom_colors?.hero_button2Color ||
    '#FFFFFF';

  return (
    <>
      <Head>
        <title>{headline} - Professional Plumbing Services</title>
        <meta name="description" content={subheadline} />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section - Fully Customizable */}
        <section
          className="relative h-screen flex items-center justify-center"
          style={{
            backgroundImage: `url('${heroImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>

          {/* Content */}
          <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
            <h1
              className="text-5xl md:text-6xl font-bold mb-6"
              style={{ color: headlineColor }}
            >
              {headline}
            </h1>

            <p
              className="text-xl md:text-2xl mb-8"
              style={{ color: subheadlineColor }}
            >
              {subheadline}
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <a
                href={`tel:${business.phone}`}
                className="px-8 py-4 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: button1BgColor,
                  color: button1Color
                }}
              >
                {button1Text}
              </a>

              <a
                href={business.reviews_link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: button2BgColor,
                  color: button2Color
                }}
              >
                {button2Text}
              </a>
            </div>
          </div>
        </section>

        {/* Services Section - Placeholder for now */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600">Services section coming soon...</p>
          </div>
        </section>

        {/* About Section - Placeholder for now */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">About Us</h2>
            <p className="text-gray-600">About section coming soon...</p>
          </div>
        </section>

        {/* Contact Section - Basic */}
        <section className="py-20 px-6 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl mb-2">{business.phone}</p>
            <p className="text-gray-400">{business.full_address}</p>
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