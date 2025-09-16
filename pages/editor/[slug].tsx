import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getBusinessBySlug, PlumbingBusiness } from '../../lib/supabaseReader';
import { getTemplateCustomization, saveTemplateCustomization, publishTemplate } from '../../lib/templateCustomizations';
import { debounce } from 'lodash';

interface Props {
  business: PlumbingBusiness;
  customization: any;
}

interface SectionData {
  hero: {
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
  };
  services: {
    title: string;
    titleColor: string;
    services: string[];
    bgColor: string;
  };
  about: {
    title: string;
    content: string;
    image: string;
  };
}

export default function Editor({ business, customization }: Props) {
  const router = useRouter();
  const selectedTemplate = 'plumbing3'; // ONLY edit Template 3
  const [activeSection, setActiveSection] = useState<keyof SectionData>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Replace placeholders with actual business data
  const replacePlaceholders = (text: string) => {
    return text
      .replace('{business_name}', business.name)
      .replace('{city}', business.city)
      .replace('{state}', business.state)
      .replace('{phone}', business.phone)
      .replace('{address}', business.full_address);
  };

  // Section data with defaults
  const [sectionData, setSectionData] = useState<SectionData>({
    hero: {
      image: customization?.custom_images?.hero_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
      headline: customization?.custom_text?.hero_headline || '{business_name}',
      headlineColor: customization?.custom_colors?.hero_headlineColor || '#FFFFFF',
      subheadline: customization?.custom_text?.hero_subheadline || 'Professional Plumbing Services in {city}, {state}',
      subheadlineColor: customization?.custom_colors?.hero_subheadlineColor || '#FFFFFF',
      button1Text: customization?.custom_text?.hero_button1Text || 'Call Now',
      button1Color: customization?.custom_colors?.hero_button1Color || '#FFFFFF',
      button1BgColor: customization?.custom_colors?.hero_button1BgColor || '#10B981',
      button2Text: customization?.custom_text?.hero_button2Text || 'View Reviews',
      button2Color: customization?.custom_colors?.hero_button2Color || '#FFFFFF',
      button2BgColor: customization?.custom_colors?.hero_button2BgColor || '#0066CC',
    },
    services: {
      title: 'Our Services',
      titleColor: '#1F2937',
      services: [
        'Emergency Plumbing',
        'Drain Cleaning',
        'Water Heater Repair',
        'Leak Detection'
      ],
      bgColor: '#F9FAFB'
    },
    about: {
      title: 'About Us',
      content: `${business.name} has been serving ${business.city} with professional plumbing services.`,
      image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800'
    }
  });

  // Auto-save with debounce
  const saveChanges = useCallback(
    debounce(async (section: string, field: string, value: any) => {
      setIsSaving(true);

      // Determine which category this belongs to
      let category: 'custom_images' | 'custom_text' | 'custom_colors' = 'custom_text';
      if (field.includes('image') || field.includes('Image')) {
        category = 'custom_images';
      } else if (field.includes('color') || field.includes('Color')) {
        category = 'custom_colors';
      }

      const key = `${section}_${field}`;
      await saveTemplateCustomization(business.slug, category, key, value);

      setIsSaving(false);
    }, 1000),
    [business.slug]
  );

  const updateField = (section: keyof SectionData, field: string, value: any) => {
    setSectionData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    saveChanges(section, field, value);
  };

  return (
    <>
      <Head>
        <title>{`Editor - ${business.name}`}</title>
      </Head>

      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/leeds2')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="font-semibold">{business.name}</h1>
            <span className="px-3 py-1 bg-gray-100 rounded text-sm">Template 3 Editor</span>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}
            <a
              href={`/plumbing3/${business.slug}`}
              target="_blank"
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            >
              View Live
            </a>
            <button
              onClick={async () => {
                setIsSaving(true);
                await publishTemplate(business.slug);
                setIsSaving(false);
                alert('Template published! It will be live on your production site.');
              }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Publish
            </button>
          </div>
        </header>

        {/* Main Editor */}
        <div className="flex-1 flex">
          {/* Preview Panel */}
          <div className="flex-1 bg-gray-100 overflow-auto p-4">
            <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '1200px' }}>

              {/* Hero Section Preview - MUST MATCH plumbing3 EXACTLY */}
              <div
                className={`relative h-96 flex items-center justify-center cursor-pointer transition-all ${
                  hoveredSection === 'hero' ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
                } ${activeSection === 'hero' ? 'ring-4 ring-blue-500' : ''}`}
                style={{
                  backgroundImage: `url('${sectionData.hero.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onMouseEnter={() => setHoveredSection('hero')}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => setActiveSection('hero')}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <div className="relative z-10 text-center px-8">
                  <h1
                    className="text-5xl font-bold mb-4"
                    style={{ color: sectionData.hero.headlineColor }}
                  >
                    {replacePlaceholders(sectionData.hero.headline)}
                  </h1>
                  <p
                    className="text-xl mb-8"
                    style={{ color: sectionData.hero.subheadlineColor }}
                  >
                    {replacePlaceholders(sectionData.hero.subheadline)}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      className="px-6 py-3 rounded font-semibold"
                      style={{
                        backgroundColor: sectionData.hero.button1BgColor,
                        color: sectionData.hero.button1Color
                      }}
                    >
                      {sectionData.hero.button1Text}
                    </button>
                    <button
                      className="px-6 py-3 rounded font-semibold"
                      style={{
                        backgroundColor: sectionData.hero.button2BgColor,
                        color: sectionData.hero.button2Color
                      }}
                    >
                      {sectionData.hero.button2Text}
                    </button>
                  </div>
                </div>
              </div>

              {/* Placeholder sections - matching plumbing3 */}
              <div className="py-20 text-center">
                <h2 className="text-3xl font-bold">More sections coming soon...</h2>
                <p className="text-gray-600 mt-4">Services, About, Contact sections will be added next</p>
              </div>

            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-96 bg-white border-l overflow-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {activeSection} Section
              </h3>

              {/* Hero Section Controls */}
              {activeSection === 'hero' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Background Image</label>
                    <input
                      type="text"
                      value={sectionData.hero.image}
                      onChange={(e) => updateField('hero', 'image', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Image URL"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Headline</label>
                    <input
                      type="text"
                      value={sectionData.hero.headline}
                      onChange={(e) => updateField('hero', 'headline', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Headline Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={sectionData.hero.headlineColor}
                        onChange={(e) => updateField('hero', 'headlineColor', e.target.value)}
                        className="w-12 h-10 border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={sectionData.hero.headlineColor}
                        onChange={(e) => updateField('hero', 'headlineColor', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Subheadline</label>
                    <textarea
                      value={sectionData.hero.subheadline}
                      onChange={(e) => updateField('hero', 'subheadline', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      rows={2}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Button 1</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={sectionData.hero.button1Text}
                        onChange={(e) => updateField('hero', 'button1Text', e.target.value)}
                        placeholder="Button text"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs">Background</label>
                          <input
                            type="color"
                            value={sectionData.hero.button1BgColor}
                            onChange={(e) => updateField('hero', 'button1BgColor', e.target.value)}
                            className="w-full h-8 border rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Text Color</label>
                          <input
                            type="color"
                            value={sectionData.hero.button1Color}
                            onChange={(e) => updateField('hero', 'button1Color', e.target.value)}
                            className="w-full h-8 border rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Button 2</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={sectionData.hero.button2Text}
                        onChange={(e) => updateField('hero', 'button2Text', e.target.value)}
                        placeholder="Button text"
                        className="w-full px-3 py-2 border rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs">Background</label>
                          <input
                            type="color"
                            value={sectionData.hero.button2BgColor}
                            onChange={(e) => updateField('hero', 'button2BgColor', e.target.value)}
                            className="w-full h-8 border rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs">Text Color</label>
                          <input
                            type="color"
                            value={sectionData.hero.button2Color}
                            onChange={(e) => updateField('hero', 'button2Color', e.target.value)}
                            className="w-full h-8 border rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Services Section Controls */}
              {activeSection === 'services' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Section Title</label>
                    <input
                      type="text"
                      value={sectionData.services.title}
                      onChange={(e) => updateField('services', 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Title Color</label>
                    <input
                      type="color"
                      value={sectionData.services.titleColor}
                      onChange={(e) => updateField('services', 'titleColor', e.target.value)}
                      className="w-full h-10 border rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Background Color</label>
                    <input
                      type="color"
                      value={sectionData.services.bgColor}
                      onChange={(e) => updateField('services', 'bgColor', e.target.value)}
                      className="w-full h-10 border rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Services</label>
                    {sectionData.services.services.map((service, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={service}
                        onChange={(e) => {
                          const newServices = [...sectionData.services.services];
                          newServices[idx] = e.target.value;
                          updateField('services', 'services', newServices);
                        }}
                        className="w-full px-3 py-2 border rounded mb-2"
                      />
                    ))}
                    <button
                      onClick={() => {
                        const newServices = [...sectionData.services.services, 'New Service'];
                        updateField('services', 'services', newServices);
                      }}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                    >
                      + Add Service
                    </button>
                  </div>
                </div>
              )}

              {/* About Section Controls */}
              {activeSection === 'about' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={sectionData.about.title}
                      onChange={(e) => updateField('about', 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <textarea
                      value={sectionData.about.content}
                      onChange={(e) => updateField('about', 'content', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Image</label>
                    <input
                      type="text"
                      value={sectionData.about.image}
                      onChange={(e) => updateField('about', 'image', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Image URL"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return {
      notFound: true
    };
  }

  const customization = await getTemplateCustomization(slug);

  return {
    props: {
      business,
      customization
    }
  };
};