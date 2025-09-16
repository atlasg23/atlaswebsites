
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getBusinessBySlug, PlumbingBusiness } from '../../lib/supabaseReader';
import { getTemplateCustomization, publishTemplate } from '../../lib/templateCustomizations';
import { RichTextEditor } from '../../components/RichTextEditor';
import SaveQueue from '../../lib/saveQueue';

interface Props {
  business: PlumbingBusiness;
  customization: any;
}

type EditingElement = 'headline' | 'subheadline' | 'description' | 'button1' | 'button2' | 'image' | 'section' | null;
type DeviceView = 'desktop' | 'tablet' | 'mobile';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Google Fonts
const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins',
  'Playfair Display', 'Raleway', 'Lato', 'Oswald', 'Merriweather'
];

// Animation options
const ANIMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-left', label: 'Slide From Left' },
  { value: 'slide-right', label: 'Slide From Right' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'bounce', label: 'Bounce' },
];

// Color palette
const COLOR_PALETTE = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#808080', '#A52A2A', '#008000', '#000080'
];

export default function EditorV4Plumbing4({ business, customization }: Props) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [editingElement, setEditingElement] = useState<EditingElement>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced' | 'history'>('content');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [showHistory, setShowHistory] = useState(false);
  const [copiedStyles, setCopiedStyles] = useState<any>(null);
  const saveQueueRef = useRef<SaveQueue | null>(null);

  // Initialize save queue
  useEffect(() => {
    saveQueueRef.current = new SaveQueue((status) => {
      setSaveStatus(status);
    });

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handlePublish();
      }
      // Escape to close editor panel
      if (e.key === 'Escape') {
        setEditingElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Replace placeholders with actual data
  const replacePlaceholders = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{business_name}/gi, business.name)
      .replace(/{city}/gi, business.city)
      .replace(/{state}/gi, business.state)
      .replace(/{phone}/gi, business.phone)
      .replace(/{email}/gi, business.email_1 || '')
      .replace(/{address}/gi, business.full_address);
  };

  // Process text with HTML formatting
  const renderFormattedText = (text: string) => {
    const processed = replacePlaceholders(text);
    return processed
      .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
      .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<span style="text-decoration:underline">$1</span>');
  };

  // Get device-specific styles
  const getDeviceStyles = (baseKey: string) => {
    const deviceKey = deviceView === 'desktop' ? 'desktop' : deviceView === 'tablet' ? 'tablet' : 'mobile';
    const deviceStyles = customization?.[`custom_styles_${deviceKey}`];
    if (deviceStyles && deviceStyles[baseKey]) {
      return deviceStyles[baseKey];
    }
    return customization?.custom_styles?.[baseKey];
  };

  // Get device-specific value
  const getDeviceValue = (key: string, defaultValue: any) => {
    const suffix = deviceView === 'mobile' ? '_mobile' : deviceView === 'tablet' ? '_tablet' : '_desktop';
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

  // Hero data with device-specific support for plumbing4
  const [heroData, setHeroData] = useState({
    // Image settings
    image: getDeviceValue('hero_image', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200'),
    imagePosition: getDeviceValue('hero_imagePosition', 'center center'),
    imageSize: getDeviceValue('hero_imageSize', 'cover'),
    overlayOpacity: parseInt(getDeviceValue('hero_overlayOpacity', '60')),

    // Headline
    headline: getDeviceValue('hero_headline', `Expert Plumbing Services in ${business.city}, ${business.state}`),
    headlineColor: getDeviceValue('hero_headlineColor', '#FFFFFF'),
    headlineSize: getDeviceValue('hero_headlineSize', 48),
    headlineFont: customization?.custom_styles?.hero_headlineFont || 'Inter',
    headlineWeight: customization?.custom_styles?.hero_headlineWeight || 'bold',

    // Subheadline
    subheadline: getDeviceValue('hero_subheadline', `Licensed & Insured • ${business.rating}★ Rating • Available 24/7`),
    subheadlineColor: getDeviceValue('hero_subheadlineColor', '#F3F4F6'),
    subheadlineSize: getDeviceValue('hero_subheadlineSize', 20),
    subheadlineFont: customization?.custom_styles?.hero_subheadlineFont || 'Inter',
    subheadlineWeight: customization?.custom_styles?.hero_subheadlineWeight || 'normal',

    // Description
    description: getDeviceValue('hero_description', `Professional plumbing solutions from {business_name}. Emergency repairs, installations, and maintenance services you can trust.`),
    descriptionColor: getDeviceValue('hero_descriptionColor', '#E5E7EB'),

    // Buttons
    button1Text: getDeviceValue('hero_button1Text', 'Call Now'),
    button1BgColor: getDeviceValue('hero_button1BgColor', business.primary_color || '#1E40AF'),
    button1Color: getDeviceValue('hero_button1Color', '#FFFFFF'),

    button2Text: getDeviceValue('hero_button2Text', 'Get Free Quote'),
    button2BgColor: getDeviceValue('hero_button2BgColor', 'transparent'),
    button2Color: getDeviceValue('hero_button2Color', '#FFFFFF'),
  });

  // Save changes using queue
  const saveChanges = useCallback((field: string, key: string, value: string) => {
    if (saveQueueRef.current) {
      // Determine which field type
      let fieldType: 'custom_images' | 'custom_text' | 'custom_colors' | 'custom_styles' | 'custom_buttons';

      if (key.includes('image') || key.includes('Image')) {
        fieldType = 'custom_images';
      } else if (key.includes('text') || key.includes('Text') || key.includes('headline') || key.includes('Headline') || key.includes('description')) {
        fieldType = 'custom_text';
      } else if (key.includes('color') || key.includes('Color') || key.includes('opacity') || key.includes('Opacity')) {
        fieldType = 'custom_colors';
      } else if (key.includes('button') && (key.includes('enabled') || key.includes('action') || key.includes('size'))) {
        fieldType = 'custom_buttons';
      } else {
        fieldType = 'custom_styles';
      }

      // Add device suffix if not on desktop
      const finalKey = deviceView !== 'desktop' ? `${key}_${deviceView}` : key;

      saveQueueRef.current.add(business.slug, fieldType, finalKey, value.toString());
    }
  }, [business.slug, deviceView]);

  const updateHeroData = (updates: any) => {
    setHeroData(prev => {
      const newData = { ...prev, ...updates };

      // Queue saves for each changed field
      Object.entries(updates).forEach(([key, value]) => {
        saveChanges(key, `hero_${key}`, String(value));
      });

      return newData;
    });
  };

  // Publish changes
  const handlePublish = async () => {
    setSaveStatus('saving');
    const result = await publishTemplate(business.slug);
    if (result) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
    }
  };

  // Get device viewport size
  const getDeviceWidth = () => {
    switch (deviceView) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  // Get save status color and icon
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="text-yellow-500 animate-pulse">⏳ Saving...</span>;
      case 'saved':
        return <span className="text-green-500">✓ Saved</span>;
      case 'error':
        return <span className="text-red-500">⚠ Error saving</span>;
      default:
        return <span className="text-gray-400">All changes saved</span>;
    }
  };

  return (
    <>
      <Head>
        <title>{`Plumbing4 Editor - ${business.name}`}</title>
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-fade-in { animation: fade-in 0.6s ease-out; }
          .animate-slide-up { animation: slide-up 0.6s ease-out; }
        `}</style>
      </Head>

      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/leeds2')} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <h1 className="font-semibold">{business.name}</h1>
            <span className="text-sm text-gray-500">Plumbing4 Editor</span>
          </div>

          {/* Device Preview Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-2 rounded ${deviceView === 'desktop' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
              title="Desktop"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`p-2 rounded ${deviceView === 'tablet' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
              title="Tablet"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-2 rounded ${deviceView === 'mobile' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
              title="Mobile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            <div className="border-l mx-2 h-6"></div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {deviceView.charAt(0).toUpperCase() + deviceView.slice(1)} View
            </span>
          </div>

          <div className="flex items-center gap-3">
            {getSaveStatusDisplay()}
            <a href={`/plumbing4/${business.slug}`} target="_blank" className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              View Live
            </a>
            <button
              onClick={handlePublish}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={saveStatus === 'saving'}
            >
              Publish
            </button>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Preview Panel with Device Frame */}
          <div className="flex-1 bg-gray-200 overflow-auto p-8 flex justify-center">
            <div
              className={`bg-white shadow-2xl transition-all ${
                deviceView === 'mobile' ? 'rounded-[2rem] border-8 border-gray-800' :
                deviceView === 'tablet' ? 'rounded-xl border-8 border-gray-700' :
                'rounded-lg'
              }`}
              style={{ width: getDeviceWidth(), maxWidth: '100%' }}
            >
              {/* Hero Section Preview */}
              <div
                className={`relative min-h-screen flex items-center justify-center overflow-hidden ${
                  hoveredElement === 'section' ? 'ring-2 ring-blue-500' : ''
                } ${editingElement === 'section' ? 'ring-2 ring-blue-600' : ''}`}
                style={{
                  backgroundImage: `url('${heroData.image}')`,
                  backgroundSize: heroData.imageSize,
                  backgroundPosition: heroData.imagePosition,
                }}
                onMouseEnter={() => setHoveredElement('section')}
                onMouseLeave={() => setHoveredElement(null)}
                onClick={() => setEditingElement('section')}
              >
                {/* Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: '#000',
                    opacity: heroData.overlayOpacity / 100
                  }}
                />

                <div className="relative z-10 text-center px-8 max-w-4xl">
                  {/* Headline */}
                  <h1
                    className={`mb-8 cursor-pointer transition-all leading-tight ${
                      hoveredElement === 'headline' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${editingElement === 'headline' ? 'ring-2 ring-blue-600' : ''}`}
                    style={{
                      color: heroData.headlineColor,
                      fontSize: `${heroData.headlineSize}px`,
                      fontFamily: heroData.headlineFont,
                      fontWeight: heroData.headlineWeight as any
                    }}
                    onMouseEnter={(e) => { e.stopPropagation(); setHoveredElement('headline'); }}
                    onMouseLeave={(e) => { e.stopPropagation(); setHoveredElement(null); }}
                    onClick={(e) => { e.stopPropagation(); setEditingElement('headline'); }}
                    dangerouslySetInnerHTML={{ __html: renderFormattedText(heroData.headline) }}
                  />

                  {/* Description */}
                  <p
                    className={`mb-12 cursor-pointer transition-all max-w-3xl mx-auto leading-relaxed ${
                      hoveredElement === 'description' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${editingElement === 'description' ? 'ring-2 ring-blue-600' : ''}`}
                    style={{
                      color: heroData.descriptionColor,
                      fontSize: '20px'
                    }}
                    onMouseEnter={(e) => { e.stopPropagation(); setHoveredElement('description'); }}
                    onMouseLeave={(e) => { e.stopPropagation(); setHoveredElement(null); }}
                    onClick={(e) => { e.stopPropagation(); setEditingElement('description'); }}
                    dangerouslySetInnerHTML={{ __html: renderFormattedText(heroData.description) }}
                  />

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    {/* Primary Button */}
                    <button
                      className={`px-8 py-4 rounded-full font-bold text-lg cursor-pointer transition-all w-full sm:w-auto shadow-xl ${
                        hoveredElement === 'button1' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      } ${editingElement === 'button1' ? 'ring-2 ring-blue-600' : ''}`}
                      style={{
                        backgroundColor: heroData.button1BgColor,
                        color: heroData.button1Color
                      }}
                      onMouseEnter={(e) => { e.stopPropagation(); setHoveredElement('button1'); }}
                      onMouseLeave={(e) => { e.stopPropagation(); setHoveredElement(null); }}
                      onClick={(e) => { e.stopPropagation(); setEditingElement('button1'); }}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span>{heroData.button1Text}</span>
                      </div>
                    </button>

                    {/* Secondary Button */}
                    <button
                      className={`px-8 py-4 rounded-full font-bold text-lg border-2 cursor-pointer transition-all w-full sm:w-auto shadow-xl ${
                        hoveredElement === 'button2' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      } ${editingElement === 'button2' ? 'ring-2 ring-blue-600' : ''}`}
                      style={{
                        backgroundColor: heroData.button2BgColor,
                        color: heroData.button2Color,
                        borderColor: business.secondary_color || '#3B82F6'
                      }}
                      onMouseEnter={(e) => { e.stopPropagation(); setHoveredElement('button2'); }}
                      onMouseLeave={(e) => { e.stopPropagation(); setHoveredElement(null); }}
                      onClick={(e) => { e.stopPropagation(); setEditingElement('button2'); }}
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
            </div>
          </div>

          {/* Contextual Editor Panel */}
          <div className="w-96 bg-white border-l flex flex-col">
            {editingElement ? (
              <>
                {/* Element Header */}
                <div className="border-b px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-semibold capitalize">
                    {editingElement === 'button1' ? 'Call Button' :
                     editingElement === 'button2' ? 'Quote Button' :
                     editingElement === 'section' ? 'Hero Section' : editingElement}
                  </h3>
                  <button onClick={() => setEditingElement(null)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-auto p-4">
                  {editingElement === 'headline' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Headline Text</label>
                        <textarea
                          value={heroData.headline}
                          onChange={(e) => updateHeroData({ headline: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                        <input
                          type="range"
                          min="24"
                          max="72"
                          value={heroData.headlineSize}
                          onChange={(e) => updateHeroData({ headlineSize: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{heroData.headlineSize}px</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <input
                          type="color"
                          value={heroData.headlineColor}
                          onChange={(e) => updateHeroData({ headlineColor: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {editingElement === 'description' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description Text</label>
                        <textarea
                          value={heroData.description}
                          onChange={(e) => updateHeroData({ description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <input
                          type="color"
                          value={heroData.descriptionColor}
                          onChange={(e) => updateHeroData({ descriptionColor: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {editingElement === 'button1' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                        <input
                          type="text"
                          value={heroData.button1Text}
                          onChange={(e) => updateHeroData({ button1Text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                        <input
                          type="color"
                          value={heroData.button1BgColor}
                          onChange={(e) => updateHeroData({ button1BgColor: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                        <input
                          type="color"
                          value={heroData.button1Color}
                          onChange={(e) => updateHeroData({ button1Color: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {editingElement === 'button2' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                        <input
                          type="text"
                          value={heroData.button2Text}
                          onChange={(e) => updateHeroData({ button2Text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                        <input
                          type="color"
                          value={heroData.button2BgColor}
                          onChange={(e) => updateHeroData({ button2BgColor: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                        <input
                          type="color"
                          value={heroData.button2Color}
                          onChange={(e) => updateHeroData({ button2Color: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {editingElement === 'section' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                        <input
                          type="url"
                          value={heroData.image}
                          onChange={(e) => updateHeroData({ image: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter image URL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image Position</label>
                        <select
                          value={heroData.imagePosition}
                          onChange={(e) => updateHeroData({ imagePosition: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="center center">Center</option>
                          <option value="top center">Top</option>
                          <option value="bottom center">Bottom</option>
                          <option value="left center">Left</option>
                          <option value="right center">Right</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={heroData.overlayOpacity}
                          onChange={(e) => updateHeroData({ overlayOpacity: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{heroData.overlayOpacity}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Click any element to edit</p>
                  <p className="text-sm">Hover over elements to see what&apos;s editable</p>
                  <div className="mt-6 text-xs text-gray-400">
                    <p>Keyboard Shortcuts:</p>
                    <p>Ctrl+S - Save/Publish</p>
                    <p>Escape - Close editor</p>
                  </div>
                </div>
              </div>
            )}
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
