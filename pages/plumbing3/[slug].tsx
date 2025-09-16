import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getBusinessBySlug, PlumbingBusiness } from '../../lib/supabaseReader';
import { getTemplateCustomization, TemplateCustomization } from '../../lib/templateCustomizations';

interface Props {
  business: PlumbingBusiness;
  customization: TemplateCustomization | null;
}

interface HeroData {
  image: string;
  headline: string;
  headlineColor: string;
  subheadline: string;
  subheadlineColor: string;
  button1Text: string;
  button1Color: string;
  button1BgColor: string;
  button2Text: string;
  button2Color: string;
  button2BgColor: string;
}

export default function Plumbing3({ business, customization }: Props) {
  // Replace placeholders with actual business data
  const replacePlaceholders = (text: string) => {
    return text
      .replace('{business_name}', business.name)
      .replace('{city}', business.city)
      .replace('{state}', business.state)
      .replace('{phone}', business.phone)
      .replace('{address}', business.full_address);
  };

  // Hero section data - MUST match editor exactly
  const hero: HeroData = {
    image: customization?.custom_images?.hero_image ||
           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
    headline: customization?.custom_text?.hero_headline ||
              business.name,
    headlineColor: customization?.custom_colors?.hero_headlineColor ||
                   '#FFFFFF',
    subheadline: customization?.custom_text?.hero_subheadline ||
                 `Professional Plumbing Services in ${business.city}, ${business.state}`,
    subheadlineColor: customization?.custom_colors?.hero_subheadlineColor ||
                      '#FFFFFF',
    button1Text: customization?.custom_text?.hero_button1Text ||
                 'Call Now',
    button1Color: customization?.custom_colors?.hero_button1Color ||
                  '#FFFFFF',
    button1BgColor: customization?.custom_colors?.hero_button1BgColor ||
                    '#10B981',
    button2Text: customization?.custom_text?.hero_button2Text ||
                 'View Reviews',
    button2Color: customization?.custom_colors?.hero_button2Color ||
                  '#FFFFFF',
    button2BgColor: customization?.custom_colors?.hero_button2BgColor ||
                    '#0066CC',
  };

  return (
    <>
      <Head>
        <title>{hero.headline} - Professional Plumbing Services</title>
        <meta name="description" content={hero.subheadline} />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section - EXACTLY matching editor preview */}
        <div
          className="relative h-96 flex items-center justify-center"
          style={{
            backgroundImage: `url('${hero.image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative z-10 text-center px-8">
            <h1
              className="text-5xl font-bold mb-4"
              style={{ color: hero.headlineColor }}
            >
              {replacePlaceholders(hero.headline)}
            </h1>
            <p
              className="text-xl mb-8"
              style={{ color: hero.subheadlineColor }}
            >
              {replacePlaceholders(hero.subheadline)}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="px-6 py-3 rounded font-semibold"
                style={{
                  backgroundColor: hero.button1BgColor,
                  color: hero.button1Color
                }}
                onClick={() => window.location.href = `tel:${business.phone}`}
              >
                {hero.button1Text}
              </button>
              <button
                className="px-6 py-3 rounded font-semibold"
                style={{
                  backgroundColor: hero.button2BgColor,
                  color: hero.button2Color
                }}
                onClick={() => {
                  if (business.reviews_link) {
                    window.open(business.reviews_link, '_blank');
                  }
                }}
              >
                {hero.button2Text}
              </button>
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