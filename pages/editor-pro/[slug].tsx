import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getBusinessBySlug, PlumbingBusiness } from '../../lib/supabaseReader';
import { getTemplateCustomization, saveTemplateCustomization, publishTemplate } from '../../lib/templateCustomizations';
import { HeroSectionData, ButtonConfig, FontConfig, Version } from '../../lib/editorTypes';
import { debounce } from 'lodash';

interface Props {
  business: PlumbingBusiness;
  customization: any;
}

// Google Fonts list
const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Poppins',
  'Playfair Display',
  'Raleway',
  'Lato',
  'Oswald',
  'Merriweather'
];

const FONT_SIZES = {
  headline: [32, 36, 40, 48, 56, 64, 72],
  subheadline: [16, 18, 20, 24, 28, 32]
};

export default function EditorPro({ business, customization }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activePanel, setActivePanel] = useState<'content' | 'style' | 'history'>('content');

  // Version history
  const [versions, setVersions] = useState<Version[]>([]);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Replace placeholders
  const replacePlaceholders = (text: string) => {
    return text
      .replace('{business_name}', business.name)
      .replace('{city}', business.city)
      .replace('{state}', business.state)
      .replace('{phone}', business.phone)
      .replace('{email}', business.email_1 || '')
      .replace('{address}', business.full_address);
  };

  // Hero section data with enhanced structure
  const [heroData, setHeroData] = useState<HeroSectionData>({
    // Image settings
    image: customization?.custom_images?.hero_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
    overlayOpacity: 50,
    overlayColor: '#000000',

    // Headline
    headline: customization?.custom_text?.hero_headline || '{business_name}',
    headlineFont: {
      family: 'Inter',
      size: 48,
      weight: 'bold',
      letterSpacing: 0,
      lineHeight: 1.2
    },
    headlineColor: customization?.custom_colors?.hero_headlineColor || '#FFFFFF',

    // Subheadline
    subheadline: customization?.custom_text?.hero_subheadline || 'Professional Plumbing Services in {city}, {state}',
    subheadlineFont: {
      family: 'Inter',
      size: 20,
      weight: 'normal',
      letterSpacing: 0,
      lineHeight: 1.5
    },
    subheadlineColor: customization?.custom_colors?.hero_subheadlineColor || '#FFFFFF',

    // Buttons
    buttons: [
      {
        id: 'btn1',
        text: customization?.custom_text?.hero_button1Text || 'Call Now',
        action: 'call',
        actionValue: '{phone}',
        style: 'filled',
        size: 'medium',
        bgColor: customization?.custom_colors?.hero_button1BgColor || '#10B981',
        textColor: customization?.custom_colors?.hero_button1Color || '#FFFFFF',
        enabled: true
      },
      {
        id: 'btn2',
        text: customization?.custom_text?.hero_button2Text || 'Get Quote',
        action: 'email',
        actionValue: '{email}',
        style: 'filled',
        size: 'medium',
        bgColor: customization?.custom_colors?.hero_button2BgColor || '#0066CC',
        textColor: customization?.custom_colors?.hero_button2Color || '#FFFFFF',
        enabled: false
      }
    ],
    buttonAlignment: 'center',

    // Layout
    height: 'medium',
    contentAlignment: 'center',
    padding: { top: 100, bottom: 100, left: 20, right: 20 }
  });

  // Save changes with debounce
  const saveChanges = useCallback(
    debounce(async (data: HeroSectionData) => {
      setIsSaving(true);

      // Save to database
      const customImages = { hero_image: data.image };
      const customText = {
        hero_headline: data.headline,
        hero_subheadline: data.subheadline,
        hero_button1Text: data.buttons[0]?.text,
        hero_button2Text: data.buttons[1]?.text
      };
      const customColors = {
        hero_headlineColor: data.headlineColor,
        hero_subheadlineColor: data.subheadlineColor,
        hero_button1BgColor: data.buttons[0]?.bgColor,
        hero_button1Color: data.buttons[0]?.textColor,
        hero_button2BgColor: data.buttons[1]?.bgColor,
        hero_button2Color: data.buttons[1]?.textColor,
        hero_overlayOpacity: data.overlayOpacity
      };

      // Save each category
      await saveTemplateCustomization(business.slug, 'custom_images', 'hero_image', data.image);
      await saveTemplateCustomization(business.slug, 'custom_text', 'hero_headline', data.headline);
      await saveTemplateCustomization(business.slug, 'custom_colors', 'hero_headlineColor', data.headlineColor);

      // Save version
      const newVersion: Version = {
        id: Date.now().toString(),
        timestamp: new Date(),
        data: data,
        isAutoSave: true
      };
      setVersions(prev => [...prev.slice(-9), newVersion]); // Keep last 10 versions

      setIsSaving(false);
    }, 1000),
    [business.slug]
  );

  // Update with undo support
  const updateHeroData = (updates: Partial<HeroSectionData>) => {
    setUndoStack(prev => [...prev, heroData]);
    setRedoStack([]);
    const newData = { ...heroData, ...updates };
    setHeroData(newData);
    saveChanges(newData);
  };

  // Undo/Redo functions
  const undo = () => {
    if (undoStack.length > 0) {
      const previous = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, heroData]);
      setUndoStack(prev => prev.slice(0, -1));
      setHeroData(previous);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, heroData]);
      setRedoStack(prev => prev.slice(0, -1));
      setHeroData(next);
    }
  };

  // Button management
  const addButton = () => {
    const newButton: ButtonConfig = {
      id: `btn${Date.now()}`,
      text: 'New Button',
      action: 'link',
      actionValue: '#',
      style: 'filled',
      size: 'medium',
      bgColor: '#3B82F6',
      textColor: '#FFFFFF',
      enabled: true
    };
    updateHeroData({ buttons: [...heroData.buttons, newButton] });
  };

  const updateButton = (id: string, updates: Partial<ButtonConfig>) => {
    const newButtons = heroData.buttons.map(btn =>
      btn.id === id ? { ...btn, ...updates } : btn
    );
    updateHeroData({ buttons: newButtons });
  };

  const removeButton = (id: string) => {
    updateHeroData({ buttons: heroData.buttons.filter(btn => btn.id !== id) });
  };

  // Get button action href
  const getButtonHref = (button: ButtonConfig) => {
    const value = replacePlaceholders(button.actionValue);
    switch (button.action) {
      case 'call': return `tel:${value}`;
      case 'email': return `mailto:${value}`;
      case 'link': return value;
      case 'scroll': return `#${value}`;
      default: return '#';
    }
  };

  // Get height class
  const getHeightClass = () => {
    switch (heroData.height) {
      case 'small': return 'h-64';
      case 'medium': return 'h-96';
      case 'large': return 'h-[600px]';
      case 'full': return 'h-screen';
      default: return 'h-96';
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 's') {
          e.preventDefault();
          // Trigger save
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [undoStack, redoStack]);

  return (
    <>
      <Head>
        <title>Pro Editor - {business.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=Raleway:wght@300;400;500;600;700&family=Lato:wght@300;400;700&family=Oswald:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/leeds2')} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <h1 className="font-semibold">{business.name}</h1>
            <div className="flex gap-1">
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                title="Undo (Ctrl+Z)"
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                title="Redo (Ctrl+Shift+Z)"
              >
                ↷
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && <span className="text-sm text-gray-500">Saving...</span>}
            <a href={`/plumbing3/${business.slug}`} target="_blank" className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              View Live
            </a>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Publish
            </button>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Preview Panel */}
          <div className="flex-1 bg-gray-100 overflow-auto p-4">
            <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '1200px' }}>

              {/* Hero Section Preview */}
              <div
                className={`relative ${getHeightClass()} flex items-center justify-center`}
                style={{
                  backgroundImage: `url('${heroData.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  padding: `${heroData.padding.top}px ${heroData.padding.right}px ${heroData.padding.bottom}px ${heroData.padding.left}px`
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: heroData.overlayColor,
                    opacity: heroData.overlayOpacity / 100
                  }}
                ></div>

                <div className={`relative z-10 text-${heroData.contentAlignment} w-full max-w-4xl px-8`}>
                  <h1
                    style={{
                      color: heroData.headlineColor,
                      fontFamily: heroData.headlineFont.family,
                      fontSize: `${heroData.headlineFont.size}px`,
                      fontWeight: heroData.headlineFont.weight as any,
                      letterSpacing: `${heroData.headlineFont.letterSpacing}px`,
                      lineHeight: heroData.headlineFont.lineHeight
                    }}
                    className="mb-4"
                  >
                    {replacePlaceholders(heroData.headline)}
                  </h1>

                  <p
                    style={{
                      color: heroData.subheadlineColor,
                      fontFamily: heroData.subheadlineFont.family,
                      fontSize: `${heroData.subheadlineFont.size}px`,
                      fontWeight: heroData.subheadlineFont.weight as any,
                      letterSpacing: `${heroData.subheadlineFont.letterSpacing}px`,
                      lineHeight: heroData.subheadlineFont.lineHeight
                    }}
                    className="mb-8"
                  >
                    {replacePlaceholders(heroData.subheadline)}
                  </p>

                  <div className={`flex gap-4 justify-${heroData.buttonAlignment}`}>
                    {heroData.buttons.filter(btn => btn.enabled).map(button => (
                      <a
                        key={button.id}
                        href={getButtonHref(button)}
                        className={`
                          ${button.size === 'small' ? 'px-4 py-2 text-sm' : ''}
                          ${button.size === 'medium' ? 'px-6 py-3' : ''}
                          ${button.size === 'large' ? 'px-8 py-4 text-lg' : ''}
                          rounded font-semibold transition-transform hover:scale-105
                          ${button.style === 'outline' ? 'border-2' : ''}
                          ${button.style === 'ghost' ? 'bg-transparent' : ''}
                        `}
                        style={{
                          backgroundColor: button.style === 'filled' ? button.bgColor : 'transparent',
                          color: button.textColor,
                          borderColor: button.style === 'outline' ? button.bgColor : 'transparent'
                        }}
                      >
                        {button.text}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-96 bg-white border-l flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActivePanel('content')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${activePanel === 'content' ? 'bg-gray-50 border-b-2 border-blue-500' : ''}`}
              >
                Content
              </button>
              <button
                onClick={() => setActivePanel('style')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${activePanel === 'style' ? 'bg-gray-50 border-b-2 border-blue-500' : ''}`}
              >
                Style
              </button>
              <button
                onClick={() => setActivePanel('history')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${activePanel === 'history' ? 'bg-gray-50 border-b-2 border-blue-500' : ''}`}
              >
                History
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {/* Content Panel */}
              {activePanel === 'content' && (
                <div className="space-y-6">
                  {/* Headline */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Headline</label>
                    <textarea
                      value={heroData.headline}
                      onChange={(e) => updateHeroData({ headline: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      rows={2}
                    />
                    <p className="text-xs text-gray-500 mt-1">Use {'{business_name}'}, {'{city}'}, {'{state}'}</p>
                  </div>

                  {/* Subheadline */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Subheadline</label>
                    <textarea
                      value={heroData.subheadline}
                      onChange={(e) => updateHeroData({ subheadline: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      rows={2}
                    />
                  </div>

                  {/* Buttons */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium">Buttons</label>
                      <button
                        onClick={addButton}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Button
                      </button>
                    </div>

                    {heroData.buttons.map((button, idx) => (
                      <div key={button.id} className="border rounded p-3 mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={button.enabled}
                              onChange={(e) => updateButton(button.id, { enabled: e.target.checked })}
                            />
                            <span className="text-sm font-medium">Button {idx + 1}</span>
                          </label>
                          <button
                            onClick={() => removeButton(button.id)}
                            className="text-red-500 text-sm hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>

                        {button.enabled && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={button.text}
                              onChange={(e) => updateButton(button.id, { text: e.target.value })}
                              placeholder="Button text"
                              className="w-full px-2 py-1 border rounded text-sm"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={button.action}
                                onChange={(e) => updateButton(button.id, { action: e.target.value as any })}
                                className="px-2 py-1 border rounded text-sm"
                              >
                                <option value="call">Call</option>
                                <option value="email">Email</option>
                                <option value="link">Link</option>
                                <option value="scroll">Scroll to</option>
                              </select>

                              <input
                                type="text"
                                value={button.actionValue}
                                onChange={(e) => updateButton(button.id, { actionValue: e.target.value })}
                                placeholder="Action value"
                                className="px-2 py-1 border rounded text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={button.style}
                                onChange={(e) => updateButton(button.id, { style: e.target.value as any })}
                                className="px-2 py-1 border rounded text-sm"
                              >
                                <option value="filled">Filled</option>
                                <option value="outline">Outline</option>
                                <option value="ghost">Ghost</option>
                              </select>

                              <select
                                value={button.size}
                                onChange={(e) => updateButton(button.id, { size: e.target.value as any })}
                                className="px-2 py-1 border rounded text-sm"
                              >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                              </select>

                              <div className="flex gap-1">
                                <input
                                  type="color"
                                  value={button.bgColor}
                                  onChange={(e) => updateButton(button.id, { bgColor: e.target.value })}
                                  className="w-8 h-8 border rounded cursor-pointer"
                                  title="Background"
                                />
                                <input
                                  type="color"
                                  value={button.textColor}
                                  onChange={(e) => updateButton(button.id, { textColor: e.target.value })}
                                  className="w-8 h-8 border rounded cursor-pointer"
                                  title="Text"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Background Image */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Background Image</label>
                    <input
                      type="text"
                      value={heroData.image}
                      onChange={(e) => updateHeroData({ image: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Image URL"
                    />
                  </div>
                </div>
              )}

              {/* Style Panel */}
              {activePanel === 'style' && (
                <div className="space-y-6">
                  {/* Typography */}
                  <div>
                    <h3 className="font-medium mb-3">Headline Typography</h3>
                    <div className="space-y-2">
                      <select
                        value={heroData.headlineFont.family}
                        onChange={(e) => updateHeroData({
                          headlineFont: { ...heroData.headlineFont, family: e.target.value }
                        })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      >
                        {FONT_FAMILIES.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs">Size</label>
                          <select
                            value={heroData.headlineFont.size}
                            onChange={(e) => updateHeroData({
                              headlineFont: { ...heroData.headlineFont, size: parseInt(e.target.value) }
                            })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            {FONT_SIZES.headline.map(size => (
                              <option key={size} value={size}>{size}px</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs">Weight</label>
                          <select
                            value={heroData.headlineFont.weight}
                            onChange={(e) => updateHeroData({
                              headlineFont: { ...heroData.headlineFont, weight: e.target.value as any }
                            })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            <option value="light">Light</option>
                            <option value="normal">Regular</option>
                            <option value="medium">Medium</option>
                            <option value="semibold">Semibold</option>
                            <option value="bold">Bold</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs">Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={heroData.headlineColor}
                            onChange={(e) => updateHeroData({ headlineColor: e.target.value })}
                            className="w-12 h-8 border rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={heroData.headlineColor}
                            onChange={(e) => updateHeroData({ headlineColor: e.target.value })}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout */}
                  <div>
                    <h3 className="font-medium mb-3">Layout</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs">Section Height</label>
                        <select
                          value={heroData.height}
                          onChange={(e) => updateHeroData({ height: e.target.value as any })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        >
                          <option value="small">Small (256px)</option>
                          <option value="medium">Medium (384px)</option>
                          <option value="large">Large (600px)</option>
                          <option value="full">Full Screen</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs">Content Alignment</label>
                        <div className="flex gap-2">
                          {['left', 'center', 'right'].map(align => (
                            <button
                              key={align}
                              onClick={() => updateHeroData({ contentAlignment: align as any })}
                              className={`flex-1 px-3 py-2 border rounded text-sm ${
                                heroData.contentAlignment === align ? 'bg-blue-50 border-blue-500' : ''
                              }`}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs">Overlay Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={heroData.overlayOpacity}
                          onChange={(e) => updateHeroData({ overlayOpacity: parseInt(e.target.value) })}
                          className="w-full"
                        />
                        <span className="text-xs">{heroData.overlayOpacity}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* History Panel */}
              {activePanel === 'history' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Recent versions (auto-saved)</p>
                  {versions.slice().reverse().map(version => (
                    <div
                      key={version.id}
                      className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setHeroData(version.data)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {version.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {version.isAutoSave ? 'Auto-save' : 'Manual'}
                        </span>
                      </div>
                      {version.note && (
                        <p className="text-xs text-gray-600 mt-1">{version.note}</p>
                      )}
                    </div>
                  ))}
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