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

type EditingElement = 'headline' | 'subheadline' | 'button1' | 'button2' | 'image' | 'section' | null;
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

export default function EditorV4({ business, customization }: Props) {
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
      // Ctrl/Cmd + Z to undo (will implement with history)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // TODO: Implement undo
      }
      // Ctrl/Cmd + Shift + Z to redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        // TODO: Implement redo
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

  // Hero data with device-specific support
  const [heroData, setHeroData] = useState({
    // Section settings
    sectionHeight: getDeviceStyles('hero_sectionHeight') || 'large',
    sectionAnimation: customization?.custom_styles?.hero_sectionAnimation || 'none',

    // Image settings
    image: customization?.custom_images?.hero_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
    imagePosition: getDeviceStyles('hero_imagePosition') || 'center center',
    imageSize: getDeviceStyles('hero_imageSize') || 'cover',
    imageFilter: customization?.custom_styles?.hero_imageFilter || 'none',
    overlayOpacity: customization?.custom_colors?.hero_overlayOpacity || 50,

    // Headline
    headline: customization?.custom_text?.hero_headline || business.name,
    headlineSize: getDeviceStyles('hero_headlineSize') || 48,
    headlineFont: customization?.custom_styles?.hero_headlineFont || 'Inter',
    headlineWeight: customization?.custom_styles?.hero_headlineWeight || 'bold',
    headlineColor: customization?.custom_colors?.hero_headlineColor || '#FFFFFF',
    headlineAnimation: customization?.custom_styles?.hero_headlineAnimation || 'fade-in',

    // Subheadline
    subheadline: customization?.custom_text?.hero_subheadline || `Professional Plumbing Services in ${business.city}, ${business.state}`,
    subheadlineSize: getDeviceStyles('hero_subheadlineSize') || 20,
    subheadlineFont: customization?.custom_styles?.hero_subheadlineFont || 'Inter',
    subheadlineWeight: customization?.custom_styles?.hero_subheadlineWeight || 'normal',
    subheadlineColor: customization?.custom_colors?.hero_subheadlineColor || '#FFFFFF',
    subheadlineAnimation: customization?.custom_styles?.hero_subheadlineAnimation || 'fade-in',

    // Buttons
    button1: {
      enabled: customization?.custom_buttons?.button1_enabled !== false,
      text: customization?.custom_text?.hero_button1Text || 'Call Now',
      action: customization?.custom_buttons?.button1_action || 'call',
      actionValue: customization?.custom_buttons?.button1_actionValue || business.phone,
      bgColor: customization?.custom_colors?.hero_button1BgColor || '#10B981',
      textColor: customization?.custom_colors?.hero_button1Color || '#FFFFFF',
      size: customization?.custom_buttons?.button1_size || 'medium',
      animation: customization?.custom_styles?.hero_button1Animation || 'none',
    },

    button2: {
      enabled: customization?.custom_buttons?.button2_enabled !== false,
      text: customization?.custom_text?.hero_button2Text || 'Get Quote',
      action: customization?.custom_buttons?.button2_action || 'email',
      actionValue: customization?.custom_buttons?.button2_actionValue || business.email_1 || '',
      bgColor: customization?.custom_colors?.hero_button2BgColor || '#0066CC',
      textColor: customization?.custom_colors?.hero_button2Color || '#FFFFFF',
      size: customization?.custom_buttons?.button2_size || 'medium',
      animation: customization?.custom_styles?.hero_button2Animation || 'none',
    }
  });

  // Update hero data when device view changes
  useEffect(() => {
    setHeroData(prev => ({
      ...prev,
      sectionHeight: getDeviceStyles('hero_sectionHeight') || prev.sectionHeight,
      imagePosition: getDeviceStyles('hero_imagePosition') || prev.imagePosition,
      imageSize: getDeviceStyles('hero_imageSize') || prev.imageSize,
      headlineSize: getDeviceStyles('hero_headlineSize') || prev.headlineSize,
      subheadlineSize: getDeviceStyles('hero_subheadlineSize') || prev.subheadlineSize,
    }));
  }, [deviceView]);

  // Save changes using queue
  const saveChanges = useCallback((field: string, key: string, value: string) => {
    if (saveQueueRef.current) {
      // Determine which field type
      let fieldType: 'custom_images' | 'custom_text' | 'custom_colors' | 'custom_styles' | 'custom_buttons';

      if (key.includes('image') || key.includes('Image')) {
        fieldType = 'custom_images';
      } else if (key.includes('text') || key.includes('Text') || key.includes('headline') || key.includes('Headline')) {
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
        if (typeof value === 'object' && value !== null) {
          // Handle nested objects (like button1, button2)
          Object.entries(value as any).forEach(([subKey, subValue]) => {
            saveChanges(`${key}_${subKey}`, `hero_${key}${subKey.charAt(0).toUpperCase() + subKey.slice(1)}`, String(subValue));
          });
        } else {
          saveChanges(key, `hero_${key}`, String(value));
        }
      });

      return newData;
    });
  };

  // Copy styles
  const handleCopyStyles = () => {
    if (editingElement) {
      const styles: any = {};

      switch (editingElement) {
        case 'headline':
          styles.size = heroData.headlineSize;
          styles.font = heroData.headlineFont;
          styles.weight = heroData.headlineWeight;
          styles.color = heroData.headlineColor;
          styles.animation = heroData.headlineAnimation;
          break;
        case 'subheadline':
          styles.size = heroData.subheadlineSize;
          styles.font = heroData.subheadlineFont;
          styles.weight = heroData.subheadlineWeight;
          styles.color = heroData.subheadlineColor;
          styles.animation = heroData.subheadlineAnimation;
          break;
        case 'button1':
        case 'button2':
          const button = editingElement === 'button1' ? heroData.button1 : heroData.button2;
          styles.bgColor = button.bgColor;
          styles.textColor = button.textColor;
          styles.size = button.size;
          styles.animation = button.animation;
          break;
      }

      setCopiedStyles({ element: editingElement, styles });
      alert('Styles copied! Select another element to paste.');
    }
  };

  // Paste styles
  const handlePasteStyles = () => {
    if (!copiedStyles || !editingElement) return;

    const updates: any = {};

    switch (editingElement) {
      case 'headline':
        if (copiedStyles.element === 'headline' || copiedStyles.element === 'subheadline') {
          updates.headlineSize = copiedStyles.styles.size;
          updates.headlineFont = copiedStyles.styles.font;
          updates.headlineWeight = copiedStyles.styles.weight;
          updates.headlineColor = copiedStyles.styles.color;
          updates.headlineAnimation = copiedStyles.styles.animation;
        }
        break;
      case 'subheadline':
        if (copiedStyles.element === 'headline' || copiedStyles.element === 'subheadline') {
          updates.subheadlineSize = copiedStyles.styles.size;
          updates.subheadlineFont = copiedStyles.styles.font;
          updates.subheadlineWeight = copiedStyles.styles.weight;
          updates.subheadlineColor = copiedStyles.styles.color;
          updates.subheadlineAnimation = copiedStyles.styles.animation;
        }
        break;
      case 'button1':
        if (copiedStyles.element === 'button1' || copiedStyles.element === 'button2') {
          updates.button1 = {
            ...heroData.button1,
            bgColor: copiedStyles.styles.bgColor,
            textColor: copiedStyles.styles.textColor,
            size: copiedStyles.styles.size,
            animation: copiedStyles.styles.animation,
          };
        }
        break;
      case 'button2':
        if (copiedStyles.element === 'button1' || copiedStyles.element === 'button2') {
          updates.button2 = {
            ...heroData.button2,
            bgColor: copiedStyles.styles.bgColor,
            textColor: copiedStyles.styles.textColor,
            size: copiedStyles.styles.size,
            animation: copiedStyles.styles.animation,
          };
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      updateHeroData(updates);
    }
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

  // Get section height class
  const getSectionHeight = () => {
    switch (heroData.sectionHeight) {
      case 'small': return 'h-64';
      case 'medium': return 'h-[500px]';
      case 'large': return 'h-[700px]';
      case 'full': return 'h-screen';
      default: return 'h-96';
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

  // Get animation class
  const getAnimationClass = (animation: string) => {
    if (animation === 'none') return '';
    return `animate-${animation}`;
  };

  // Get button size
  const getButtonSize = (size: string) => {
    switch (size) {
      case 'small': return 'px-4 py-2 text-sm';
      case 'large': return 'px-8 py-4 text-lg';
      default: return 'px-6 py-3';
    }
  };

  // Get image filter
  const getImageFilter = () => {
    switch (heroData.imageFilter) {
      case 'blur': return 'blur(2px)';
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'brightness': return 'brightness(1.2)';
      case 'contrast': return 'contrast(1.2)';
      default: return 'none';
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
        <title>{`Pro Editor V4 - ${business.name}`}</title>
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slide-down {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slide-left {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slide-right {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes zoom-in {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-fade-in { animation: fade-in 0.6s ease-out; }
          .animate-slide-up { animation: slide-up 0.6s ease-out; }
          .animate-slide-down { animation: slide-down 0.6s ease-out; }
          .animate-slide-left { animation: slide-left 0.6s ease-out; }
          .animate-slide-right { animation: slide-right 0.6s ease-out; }
          .animate-zoom-in { animation: zoom-in 0.6s ease-out; }
          .animate-bounce { animation: bounce 0.6s ease-out; }
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
            <span className="text-sm text-gray-500">Editor V4 Pro</span>
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
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              title="View edit history"
            >
              📜 History
            </button>
            <a href={`/plumbing3/${business.slug}`} target="_blank" className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
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
              {/* Hero Section */}
              <div
                className={`relative ${getSectionHeight()} flex items-center justify-center overflow-hidden ${
                  hoveredElement === 'section' ? 'ring-2 ring-blue-500' : ''
                } ${editingElement === 'section' ? 'ring-2 ring-blue-600' : ''}`}
                style={{
                  backgroundImage: `url('${heroData.image}')`,
                  backgroundSize: heroData.imageSize,
                  backgroundPosition: heroData.imagePosition,
                  filter: getImageFilter()
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

                <div className={`relative z-10 text-center px-8 ${getAnimationClass(heroData.sectionAnimation)}`}>
                  {/* Headline */}
                  <h1
                    className={`mb-4 cursor-pointer transition-all ${
                      hoveredElement === 'headline' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${editingElement === 'headline' ? 'ring-2 ring-blue-600' : ''} ${
                      getAnimationClass(heroData.headlineAnimation)
                    }`}
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

                  {/* Subheadline */}
                  <p
                    className={`mb-8 cursor-pointer transition-all ${
                      hoveredElement === 'subheadline' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${editingElement === 'subheadline' ? 'ring-2 ring-blue-600' : ''} ${
                      getAnimationClass(heroData.subheadlineAnimation)
                    }`}
                    style={{
                      color: heroData.subheadlineColor,
                      fontSize: `${heroData.subheadlineSize}px`,
                      fontFamily: heroData.subheadlineFont,
                      fontWeight: heroData.subheadlineWeight as any
                    }}
                    onMouseEnter={(e) => { e.stopPropagation(); setHoveredElement('subheadline'); }}
                    onMouseLeave={(e) => { e.stopPropagation(); setHoveredElement(null); }}
                    onClick={(e) => { e.stopPropagation(); setEditingElement('subheadline'); }}
                    dangerouslySetInnerHTML={{ __html: renderFormattedText(heroData.subheadline) }}
                  />

                  {/* Buttons */}
                  <div className="flex gap-4 justify-center flex-wrap">
                    {heroData.button1.enabled && (
                      <button
                        className={`${getButtonSize(heroData.button1.size)} rounded font-semibold cursor-pointer transition-all ${
                          hoveredElement === 'button1' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        } ${editingElement === 'button1' ? 'ring-2 ring-blue-600' : ''} ${
                          getAnimationClass(heroData.button1.animation)
                        }`}
                        style={{
                          backgroundColor: heroData.button1.bgColor,
                          color: heroData.button1.textColor
                        }}
                        onMouseEnter={(e) => { e.stopPropagation(); setHoveredElement('button1'); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoveredElement(null); }}
                        onClick={(e) => { e.stopPropagation(); setEditingElement('button1'); }}
                      >
                        {heroData.button1.text}
                      </button>
                    )}

                    {heroData.button2.enabled && (
                      <button
                        className={`${getButtonSize(heroData.button2.size)} rounded font-semibold cursor-pointer transition-all ${
                          hoveredElement === 'button2' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        } ${editingElement === 'button2' ? 'ring-2 ring-blue-600' : ''} ${
                          getAnimationClass(heroData.button2.animation)
                        }`}
                        style={{
                          backgroundColor: heroData.button2.bgColor,
                          color: heroData.button2.textColor
                        }}
                        onMouseEnter={(e) => { e.stopPropagation(); setHoveredElement('button2'); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoveredElement(null); }}
                        onClick={(e) => { e.stopPropagation(); setEditingElement('button2'); }}
                      >
                        {heroData.button2.text}
                      </button>
                    )}
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
                    {editingElement === 'button1' ? 'Button 1' :
                     editingElement === 'button2' ? 'Button 2' :
                     editingElement === 'section' ? 'Section Settings' : editingElement}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyStyles}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Copy styles"
                    >
                      📋
                    </button>
                    {copiedStyles && (
                      <button
                        onClick={handlePasteStyles}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Paste styles"
                      >
                        📌
                      </button>
                    )}
                    <button onClick={() => setEditingElement(null)} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
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
                  <button
                    onClick={() => setActiveTab('advanced')}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === 'advanced' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-50'
                    }`}
                  >
                    Advanced
                  </button>
                </div>

                {/* Edit Panel Content - Simplified for now, full implementation would be similar to v3 */}
                <div className="flex-1 overflow-auto p-4">
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">Full editing panel coming...</p>
                    <p className="text-xs mt-2">Device: {deviceView}</p>
                    <p className="text-xs">Element: {editingElement}</p>
                  </div>
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
                    <p>Ctrl+Z - Undo (coming soon)</p>
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