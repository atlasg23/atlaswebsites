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

type EditingElement = 'headline' | 'subheadline' | 'button1' | 'button2' | 'image' | null;

// Google Fonts
const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins',
  'Playfair Display', 'Raleway', 'Lato', 'Oswald', 'Merriweather'
];

export default function EditorV2({ business, customization }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [editingElement, setEditingElement] = useState<EditingElement>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // Hero data - using ACTUAL business data, not placeholders
  const [heroData, setHeroData] = useState({
    image: customization?.custom_images?.hero_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
    overlayOpacity: customization?.custom_colors?.hero_overlayOpacity || 50,

    headline: customization?.custom_text?.hero_headline || business.name,
    headlineSize: customization?.custom_styles?.hero_headlineSize || 48,
    headlineFont: customization?.custom_styles?.hero_headlineFont || 'Inter',
    headlineWeight: customization?.custom_styles?.hero_headlineWeight || 'bold',
    headlineColor: customization?.custom_colors?.hero_headlineColor || '#FFFFFF',

    subheadline: customization?.custom_text?.hero_subheadline || `Professional Plumbing Services in ${business.city}, ${business.state}`,
    subheadlineSize: customization?.custom_styles?.hero_subheadlineSize || 20,
    subheadlineFont: customization?.custom_styles?.hero_subheadlineFont || 'Inter',
    subheadlineWeight: customization?.custom_styles?.hero_subheadlineWeight || 'normal',
    subheadlineColor: customization?.custom_colors?.hero_subheadlineColor || '#FFFFFF',

    button1: {
      enabled: customization?.custom_buttons?.button1_enabled !== false,
      text: customization?.custom_text?.hero_button1Text || 'Call Now',
      action: customization?.custom_buttons?.button1_action || 'call',
      actionValue: customization?.custom_buttons?.button1_actionValue || business.phone,
      bgColor: customization?.custom_colors?.hero_button1BgColor || '#10B981',
      textColor: customization?.custom_colors?.hero_button1Color || '#FFFFFF',
      size: customization?.custom_buttons?.button1_size || 'medium',
    },

    button2: {
      enabled: customization?.custom_buttons?.button2_enabled !== false,
      text: customization?.custom_text?.hero_button2Text || 'Email Us',
      action: customization?.custom_buttons?.button2_action || 'email',
      actionValue: customization?.custom_buttons?.button2_actionValue || business.email_1 || 'contact@example.com',
      bgColor: customization?.custom_colors?.hero_button2BgColor || '#0066CC',
      textColor: customization?.custom_colors?.hero_button2Color || '#FFFFFF',
      size: customization?.custom_buttons?.button2_size || 'medium',
    }
  });

  // Save changes
  const saveChanges = useCallback(
    debounce(async (data: any) => {
      setIsSaving(true);

      // Save all customizations
      await saveTemplateCustomization(business.slug, 'custom_images', 'hero_image', data.image);
      await saveTemplateCustomization(business.slug, 'custom_text', 'hero_headline', data.headline);
      await saveTemplateCustomization(business.slug, 'custom_text', 'hero_subheadline', data.subheadline);
      await saveTemplateCustomization(business.slug, 'custom_colors', 'hero_overlayOpacity', data.overlayOpacity);

      setIsSaving(false);
    }, 1000),
    [business.slug]
  );

  const updateHeroData = (updates: any) => {
    const newData = { ...heroData, ...updates };
    setHeroData(newData);
    saveChanges(newData);
  };

  // Get button href
  const getButtonHref = (button: any) => {
    switch (button.action) {
      case 'call': return `tel:${button.actionValue}`;
      case 'email': return `mailto:${button.actionValue}`;
      case 'link': return button.actionValue;
      default: return '#';
    }
  };

  // Get button size classes
  const getButtonSize = (size: string) => {
    switch (size) {
      case 'small': return 'px-4 py-2 text-sm';
      case 'large': return 'px-8 py-4 text-lg';
      default: return 'px-6 py-3';
    }
  };

  return (
    <>
      <Head>
        <title>{`Editor - ${business.name}`}</title>
      </Head>

      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/leeds2')} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <h1 className="font-semibold">{business.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && <span className="text-sm text-gray-500 animate-pulse">Saving...</span>}
            <a href={`/plumbing3/${business.slug}`} target="_blank" className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              View Live
            </a>
            <button onClick={() => publishTemplate(business.slug)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Publish
            </button>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Preview Panel - Click to Edit */}
          <div className="flex-1 bg-gray-100 overflow-auto p-4">
            <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '1200px' }}>

              {/* Hero Section */}
              <div
                className="relative h-96 flex items-center justify-center"
                style={{
                  backgroundImage: `url('${heroData.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Image Edit Overlay */}
                <div
                  className={`absolute inset-0 ${hoveredElement === 'image' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    backgroundColor: '#000',
                    opacity: heroData.overlayOpacity / 100
                  }}
                  onMouseEnter={() => setHoveredElement('image')}
                  onMouseLeave={() => setHoveredElement(null)}
                  onClick={() => setEditingElement('image')}
                >
                  {hoveredElement === 'image' && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      Click to edit background
                    </div>
                  )}
                </div>

                <div className="relative z-10 text-center px-8">
                  {/* Headline - Clickable */}
                  <h1
                    className={`text-5xl font-bold mb-4 cursor-pointer transition-all ${
                      hoveredElement === 'headline' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${editingElement === 'headline' ? 'ring-2 ring-blue-600' : ''}`}
                    style={{
                      color: heroData.headlineColor,
                      fontSize: `${heroData.headlineSize}px`,
                      fontFamily: heroData.headlineFont,
                      fontWeight: heroData.headlineWeight as any
                    }}
                    onMouseEnter={() => setHoveredElement('headline')}
                    onMouseLeave={() => setHoveredElement(null)}
                    onClick={() => setEditingElement('headline')}
                  >
                    {heroData.headline}
                  </h1>

                  {/* Subheadline - Clickable */}
                  <p
                    className={`text-xl mb-8 cursor-pointer transition-all ${
                      hoveredElement === 'subheadline' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${editingElement === 'subheadline' ? 'ring-2 ring-blue-600' : ''}`}
                    style={{
                      color: heroData.subheadlineColor,
                      fontSize: `${heroData.subheadlineSize}px`,
                      fontFamily: heroData.subheadlineFont,
                      fontWeight: heroData.subheadlineWeight as any
                    }}
                    onMouseEnter={() => setHoveredElement('subheadline')}
                    onMouseLeave={() => setHoveredElement(null)}
                    onClick={() => setEditingElement('subheadline')}
                  >
                    {heroData.subheadline}
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-4 justify-center">
                    {heroData.button1.enabled && (
                      <button
                        className={`${getButtonSize(heroData.button1.size)} rounded font-semibold cursor-pointer transition-all ${
                          hoveredElement === 'button1' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        } ${editingElement === 'button1' ? 'ring-2 ring-blue-600' : ''}`}
                        style={{
                          backgroundColor: heroData.button1.bgColor,
                          color: heroData.button1.textColor
                        }}
                        onMouseEnter={() => setHoveredElement('button1')}
                        onMouseLeave={() => setHoveredElement(null)}
                        onClick={() => setEditingElement('button1')}
                      >
                        {heroData.button1.text}
                      </button>
                    )}

                    {heroData.button2.enabled && (
                      <button
                        className={`${getButtonSize(heroData.button2.size)} rounded font-semibold cursor-pointer transition-all ${
                          hoveredElement === 'button2' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        } ${editingElement === 'button2' ? 'ring-2 ring-blue-600' : ''}`}
                        style={{
                          backgroundColor: heroData.button2.bgColor,
                          color: heroData.button2.textColor
                        }}
                        onMouseEnter={() => setHoveredElement('button2')}
                        onMouseLeave={() => setHoveredElement(null)}
                        onClick={() => setEditingElement('button2')}
                      >
                        {heroData.button2.text}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Placeholder for more sections */}
              <div className="py-20 text-center text-gray-400">
                <p>More sections coming soon...</p>
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
                    Edit {editingElement === 'button1' ? 'Button 1' : editingElement === 'button2' ? 'Button 2' : editingElement}
                  </h3>
                  <button
                    onClick={() => setEditingElement(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === 'content' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-50'
                    }`}
                  >
                    Content
                  </button>
                  <button
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === 'style' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-50'
                    }`}
                  >
                    Style
                  </button>
                </div>

                {/* Edit Panel Content */}
                <div className="flex-1 overflow-auto p-4">
                  {/* Headline Editor */}
                  {editingElement === 'headline' && (
                    <>
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Text</label>
                            <textarea
                              value={heroData.headline}
                              onChange={(e) => updateHeroData({ headline: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                      {activeTab === 'style' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Font Family</label>
                            <select
                              value={heroData.headlineFont}
                              onChange={(e) => updateHeroData({ headlineFont: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              {FONT_FAMILIES.map(font => (
                                <option key={font} value={font}>{font}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Size</label>
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
                            <label className="block text-sm font-medium mb-2">Weight</label>
                            <select
                              value={heroData.headlineWeight}
                              onChange={(e) => updateHeroData({ headlineWeight: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="light">Light</option>
                              <option value="normal">Regular</option>
                              <option value="medium">Medium</option>
                              <option value="semibold">Semibold</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={heroData.headlineColor}
                                onChange={(e) => updateHeroData({ headlineColor: e.target.value })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.headlineColor}
                                onChange={(e) => updateHeroData({ headlineColor: e.target.value })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Subheadline Editor */}
                  {editingElement === 'subheadline' && (
                    <>
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Text</label>
                            <textarea
                              value={heroData.subheadline}
                              onChange={(e) => updateHeroData({ subheadline: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                      {activeTab === 'style' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Font Family</label>
                            <select
                              value={heroData.subheadlineFont}
                              onChange={(e) => updateHeroData({ subheadlineFont: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              {FONT_FAMILIES.map(font => (
                                <option key={font} value={font}>{font}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Size</label>
                            <input
                              type="range"
                              min="14"
                              max="32"
                              value={heroData.subheadlineSize}
                              onChange={(e) => updateHeroData({ subheadlineSize: parseInt(e.target.value) })}
                              className="w-full"
                            />
                            <span className="text-sm text-gray-500">{heroData.subheadlineSize}px</span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={heroData.subheadlineColor}
                                onChange={(e) => updateHeroData({ subheadlineColor: e.target.value })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.subheadlineColor}
                                onChange={(e) => updateHeroData({ subheadlineColor: e.target.value })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Button 1 Editor */}
                  {editingElement === 'button1' && (
                    <>
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={heroData.button1.enabled}
                              onChange={(e) => updateHeroData({
                                button1: { ...heroData.button1, enabled: e.target.checked }
                              })}
                            />
                            <label className="text-sm font-medium">Show Button</label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Button Text</label>
                            <input
                              type="text"
                              value={heroData.button1.text}
                              onChange={(e) => updateHeroData({
                                button1: { ...heroData.button1, text: e.target.value }
                              })}
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Action</label>
                            <select
                              value={heroData.button1.action}
                              onChange={(e) => updateHeroData({
                                button1: { ...heroData.button1, action: e.target.value }
                              })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="call">Call</option>
                              <option value="email">Email</option>
                              <option value="link">Link to URL</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {heroData.button1.action === 'call' ? 'Phone Number' :
                               heroData.button1.action === 'email' ? 'Email Address' : 'URL'}
                            </label>
                            <input
                              type="text"
                              value={heroData.button1.actionValue}
                              onChange={(e) => updateHeroData({
                                button1: { ...heroData.button1, actionValue: e.target.value }
                              })}
                              className="w-full px-3 py-2 border rounded"
                              placeholder={heroData.button1.action === 'call' ? business.phone : business.email_1}
                            />
                          </div>
                        </div>
                      )}
                      {activeTab === 'style' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Size</label>
                            <select
                              value={heroData.button1.size}
                              onChange={(e) => updateHeroData({
                                button1: { ...heroData.button1, size: e.target.value }
                              })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Background Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={heroData.button1.bgColor}
                                onChange={(e) => updateHeroData({
                                  button1: { ...heroData.button1, bgColor: e.target.value }
                                })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.button1.bgColor}
                                onChange={(e) => updateHeroData({
                                  button1: { ...heroData.button1, bgColor: e.target.value }
                                })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Text Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={heroData.button1.textColor}
                                onChange={(e) => updateHeroData({
                                  button1: { ...heroData.button1, textColor: e.target.value }
                                })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.button1.textColor}
                                onChange={(e) => updateHeroData({
                                  button1: { ...heroData.button1, textColor: e.target.value }
                                })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Button 2 Editor - Similar to Button 1 */}
                  {editingElement === 'button2' && (
                    <>
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={heroData.button2.enabled}
                              onChange={(e) => updateHeroData({
                                button2: { ...heroData.button2, enabled: e.target.checked }
                              })}
                            />
                            <label className="text-sm font-medium">Show Button</label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Button Text</label>
                            <input
                              type="text"
                              value={heroData.button2.text}
                              onChange={(e) => updateHeroData({
                                button2: { ...heroData.button2, text: e.target.value }
                              })}
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Action</label>
                            <select
                              value={heroData.button2.action}
                              onChange={(e) => updateHeroData({
                                button2: { ...heroData.button2, action: e.target.value }
                              })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="call">Call</option>
                              <option value="email">Email</option>
                              <option value="link">Link to URL</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {heroData.button2.action === 'call' ? 'Phone Number' :
                               heroData.button2.action === 'email' ? 'Email Address' : 'URL'}
                            </label>
                            <input
                              type="text"
                              value={heroData.button2.actionValue}
                              onChange={(e) => updateHeroData({
                                button2: { ...heroData.button2, actionValue: e.target.value }
                              })}
                              className="w-full px-3 py-2 border rounded"
                              placeholder={heroData.button2.action === 'call' ? business.phone : business.email_1}
                            />
                          </div>
                        </div>
                      )}
                      {activeTab === 'style' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Size</label>
                            <select
                              value={heroData.button2.size}
                              onChange={(e) => updateHeroData({
                                button2: { ...heroData.button2, size: e.target.value }
                              })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Background Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={heroData.button2.bgColor}
                                onChange={(e) => updateHeroData({
                                  button2: { ...heroData.button2, bgColor: e.target.value }
                                })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.button2.bgColor}
                                onChange={(e) => updateHeroData({
                                  button2: { ...heroData.button2, bgColor: e.target.value }
                                })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Text Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={heroData.button2.textColor}
                                onChange={(e) => updateHeroData({
                                  button2: { ...heroData.button2, textColor: e.target.value }
                                })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.button2.textColor}
                                onChange={(e) => updateHeroData({
                                  button2: { ...heroData.button2, textColor: e.target.value }
                                })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Image/Background Editor */}
                  {editingElement === 'image' && (
                    <>
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Background Image URL</label>
                            <input
                              type="text"
                              value={heroData.image}
                              onChange={(e) => updateHeroData({ image: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      )}
                      {activeTab === 'style' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Overlay Opacity</label>
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
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Click any element to edit</p>
                  <p className="text-sm">Hover over elements to see what's editable</p>
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