import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getBusinessBySlug, PlumbingBusiness } from '../../lib/supabaseReader';
import { getTemplateCustomization, saveTemplateCustomization, publishTemplate } from '../../lib/templateCustomizations';
import { RichTextEditor } from '../../components/RichTextEditor';
import { VersionHistory } from '../../components/VersionHistory';
import { debounce } from 'lodash';

interface Props {
  business: PlumbingBusiness;
  customization: any;
}

type EditingElement = 'headline' | 'subheadline' | 'button1' | 'button2' | 'image' | 'section' | null;
type DeviceView = 'desktop' | 'tablet' | 'mobile';
type ApplyTo = 'desktop' | 'mobile' | 'both';

// Google Fonts with descriptions
const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (Clean & Modern)' },
  { value: 'Roboto', label: 'Roboto (Google Style)' },
  { value: 'Open Sans', label: 'Open Sans (Friendly)' },
  { value: 'Montserrat', label: 'Montserrat (Professional)' },
  { value: 'Poppins', label: 'Poppins (Rounded)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant Serif)' },
  { value: 'Raleway', label: 'Raleway (Thin & Stylish)' },
  { value: 'Lato', label: 'Lato (Humanist)' },
  { value: 'Oswald', label: 'Oswald (Bold & Narrow)' },
  { value: 'Merriweather', label: 'Merriweather (Classic Serif)' },
  { value: 'Work Sans', label: 'Work Sans (Simple & Clean)' },
  { value: 'DM Sans', label: 'DM Sans (Geometric)' },
  { value: 'Space Grotesk', label: 'Space Grotesk (Tech)' },
  { value: 'Outfit', label: 'Outfit (Contemporary)' },
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

export default function EditorV3({ business, customization }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [editingElement, setEditingElement] = useState<EditingElement>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [applyTo, setApplyTo] = useState<ApplyTo>('both');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previousData, setPreviousData] = useState<any>(null);

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
    // Simple HTML rendering for bold, italic, underline
    return processed
      .replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
      .replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<span style="text-decoration:underline">$1</span>');
  };

  // Get device-specific value or fallback to general
  const getDeviceValue = (key: string, defaultValue: any) => {
    // Check device-specific values based on current view
    if (deviceView === 'mobile') {
      const mobileKey = `${key}_mobile`;
      const mobileValue = customization?.custom_styles?.[mobileKey] ||
                         customization?.custom_colors?.[mobileKey] ||
                         customization?.custom_text?.[mobileKey] ||
                         customization?.custom_buttons?.[mobileKey];
      if (mobileValue !== undefined) return mobileValue;
    } else if (deviceView === 'desktop') {
      const desktopKey = `${key}_desktop`;
      const desktopValue = customization?.custom_styles?.[desktopKey] ||
                           customization?.custom_colors?.[desktopKey] ||
                           customization?.custom_text?.[desktopKey] ||
                           customization?.custom_buttons?.[desktopKey];
      if (desktopValue !== undefined) return desktopValue;
    }
    // Fallback to general value
    return customization?.custom_styles?.[key] ||
           customization?.custom_colors?.[key] ||
           customization?.custom_text?.[key] ||
           customization?.custom_buttons?.[key] ||
           defaultValue;
  };

  // Hero data with enhanced options
  const [heroData, setHeroData] = useState({
    // Section settings
    sectionHeight: getDeviceValue('hero_sectionHeight', 'large'),
    sectionAnimation: getDeviceValue('hero_sectionAnimation', 'none'),

    // Image settings
    image: getDeviceValue('hero_image', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920'),
    imagePosition: getDeviceValue('hero_imagePosition', 'center center'),
    imageSize: getDeviceValue('hero_imageSize', 'cover'),
    imageFilter: getDeviceValue('hero_imageFilter', 'none'),
    overlayOpacity: getDeviceValue('hero_overlayOpacity', 50),

    // Headline
    headline: getDeviceValue('hero_headline', business.name),
    headlineSize: getDeviceValue('hero_headlineSize', 48),
    headlineFont: getDeviceValue('hero_headlineFont', 'Inter'),
    headlineWeight: getDeviceValue('hero_headlineWeight', 'bold'),
    headlineColor: getDeviceValue('hero_headlineColor', '#FFFFFF'),
    headlineAnimation: getDeviceValue('hero_headlineAnimation', 'fade-in'),

    // Subheadline
    subheadline: getDeviceValue('hero_subheadline', `Professional Plumbing Services in ${business.city}, ${business.state}`),
    subheadlineSize: getDeviceValue('hero_subheadlineSize', 20),
    subheadlineFont: getDeviceValue('hero_subheadlineFont', 'Inter'),
    subheadlineWeight: getDeviceValue('hero_subheadlineWeight', 'normal'),
    subheadlineColor: getDeviceValue('hero_subheadlineColor', '#FFFFFF'),
    subheadlineAnimation: getDeviceValue('hero_subheadlineAnimation', 'fade-in'),

    // Buttons
    button1: {
      enabled: getDeviceValue('hero_button1Enabled', 'true') === 'true',
      text: getDeviceValue('hero_button1Text', 'Call Now'),
      action: getDeviceValue('hero_button1_action', 'call'),
      actionValue: getDeviceValue('hero_button1_actionValue', business.phone),
      bgColor: getDeviceValue('hero_button1BgColor', '#10B981'),
      textColor: getDeviceValue('hero_button1Color', '#FFFFFF'),
      size: getDeviceValue('hero_button1Size', 'medium'),
      animation: getDeviceValue('hero_button1Animation', 'none'),
    },

    button2: {
      enabled: getDeviceValue('hero_button2Enabled', 'true') === 'true',
      text: getDeviceValue('hero_button2Text', 'Get Quote'),
      action: getDeviceValue('hero_button2_action', 'email'),
      actionValue: getDeviceValue('hero_button2_actionValue', business.email_1 || ''),
      bgColor: getDeviceValue('hero_button2BgColor', '#0066CC'),
      textColor: getDeviceValue('hero_button2Color', '#FFFFFF'),
      size: getDeviceValue('hero_button2Size', 'medium'),
      animation: getDeviceValue('hero_button2Animation', 'none'),
    }
  });

  // Update heroData when device view changes
  useEffect(() => {
    setHeroData({
      // Section settings
      sectionHeight: getDeviceValue('hero_sectionHeight', 'large'),
      sectionAnimation: getDeviceValue('hero_sectionAnimation', 'none'),

      // Image settings
      image: getDeviceValue('hero_image', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920'),
      imagePosition: getDeviceValue('hero_imagePosition', 'center center'),
      imageSize: getDeviceValue('hero_imageSize', 'cover'),
      imageFilter: getDeviceValue('hero_imageFilter', 'none'),
      overlayOpacity: getDeviceValue('hero_overlayOpacity', 50),

      // Headline
      headline: getDeviceValue('hero_headline', business.name),
      headlineSize: getDeviceValue('hero_headlineSize', 48),
      headlineFont: getDeviceValue('hero_headlineFont', 'Inter'),
      headlineWeight: getDeviceValue('hero_headlineWeight', 'bold'),
      headlineColor: getDeviceValue('hero_headlineColor', '#FFFFFF'),
      headlineAnimation: getDeviceValue('hero_headlineAnimation', 'fade-in'),

      // Subheadline
      subheadline: getDeviceValue('hero_subheadline', `Professional Plumbing Services in ${business.city}, ${business.state}`),
      subheadlineSize: getDeviceValue('hero_subheadlineSize', 20),
      subheadlineFont: getDeviceValue('hero_subheadlineFont', 'Inter'),
      subheadlineWeight: getDeviceValue('hero_subheadlineWeight', 'normal'),
      subheadlineColor: getDeviceValue('hero_subheadlineColor', '#FFFFFF'),
      subheadlineAnimation: getDeviceValue('hero_subheadlineAnimation', 'fade-in'),

      // Buttons
      button1: {
        enabled: getDeviceValue('hero_button1Enabled', 'true') === 'true',
        text: getDeviceValue('hero_button1Text', 'Call Now'),
        action: getDeviceValue('hero_button1_action', 'call'),
        actionValue: getDeviceValue('hero_button1_actionValue', business.phone),
        bgColor: getDeviceValue('hero_button1BgColor', '#10B981'),
        textColor: getDeviceValue('hero_button1Color', '#FFFFFF'),
        size: getDeviceValue('hero_button1Size', 'medium'),
        animation: getDeviceValue('hero_button1Animation', 'none'),
      },

      button2: {
        enabled: getDeviceValue('hero_button2Enabled', 'true') === 'true',
        text: getDeviceValue('hero_button2Text', 'Get Quote'),
        action: getDeviceValue('hero_button2_action', 'email'),
        actionValue: getDeviceValue('hero_button2_actionValue', business.email_1 || ''),
        bgColor: getDeviceValue('hero_button2BgColor', '#0066CC'),
        textColor: getDeviceValue('hero_button2Color', '#FFFFFF'),
        size: getDeviceValue('hero_button2Size', 'medium'),
        animation: getDeviceValue('hero_button2Animation', 'none'),
      }
    });
  }, [deviceView]); // Re-run when device view changes

  // Save changes with device-specific handling
  const saveChangesWithDevice = useCallback(
    async (data: any, applyTo: ApplyTo) => {
      setIsSaving(true);
      const savePromises = [];
      const historyEdits = [];

      // Store previous data for history tracking
      if (!previousData) {
        setPreviousData(heroData);
      }

      // Determine suffixes based on applyTo
      const suffixes = applyTo === 'both' ? ['', '_mobile', '_desktop'] :
                      applyTo === 'mobile' ? ['_mobile'] :
                      ['_desktop'];

      // Save to appropriate keys based on device selection
      for (const suffix of suffixes) {
        // Images
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_images', `hero_image${suffix}`, data.image));

        // Text content
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_text', `hero_headline${suffix}`, data.headline));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_text', `hero_subheadline${suffix}`, data.subheadline));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_text', `hero_button1Text${suffix}`, data.button1.text));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_text', `hero_button2Text${suffix}`, data.button2.text));

        // Colors
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', `hero_headlineColor${suffix}`, data.headlineColor));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', `hero_subheadlineColor${suffix}`, data.subheadlineColor));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', `hero_button1BgColor${suffix}`, data.button1.bgColor));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', `hero_button1Color${suffix}`, data.button1.textColor));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', `hero_button2BgColor${suffix}`, data.button2.bgColor));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', `hero_button2Color${suffix}`, data.button2.textColor));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', `hero_overlayOpacity${suffix}`, data.overlayOpacity.toString()));

        // Styles
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_sectionHeight${suffix}`, data.sectionHeight));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_sectionAnimation${suffix}`, data.sectionAnimation));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_imagePosition${suffix}`, data.imagePosition));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_imageSize${suffix}`, data.imageSize));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_imageFilter${suffix}`, data.imageFilter));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_headlineSize${suffix}`, data.headlineSize.toString()));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_headlineFont${suffix}`, data.headlineFont));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_headlineWeight${suffix}`, data.headlineWeight));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_headlineAnimation${suffix}`, data.headlineAnimation));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_subheadlineSize${suffix}`, data.subheadlineSize.toString()));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_subheadlineFont${suffix}`, data.subheadlineFont));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_subheadlineWeight${suffix}`, data.subheadlineWeight));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', `hero_subheadlineAnimation${suffix}`, data.subheadlineAnimation));

        // Buttons
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', `hero_button1Enabled${suffix}`, data.button1.enabled.toString()));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', `hero_button1Size${suffix}`, data.button1.size));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', `hero_button1Animation${suffix}`, data.button1.animation));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', `hero_button2Enabled${suffix}`, data.button2.enabled.toString()));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', `hero_button2Size${suffix}`, data.button2.size));
        savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', `hero_button2Animation${suffix}`, data.button2.animation));
      }

      await Promise.all(savePromises);

      // Track history - compare what changed
      if (previousData) {
        const changes: any[] = [];

        // Check each field for changes
        Object.keys(data).forEach(key => {
          if (JSON.stringify(data[key]) !== JSON.stringify(previousData[key])) {
            if (typeof data[key] === 'object') {
              // Handle nested objects like buttons
              Object.keys(data[key]).forEach(subKey => {
                if (data[key][subKey] !== previousData[key]?.[subKey]) {
                  changes.push({
                    field: key.includes('button') ? 'custom_buttons' : 'custom_styles',
                    key: `hero_${key}${subKey.charAt(0).toUpperCase() + subKey.slice(1)}`,
                    oldValue: previousData[key]?.[subKey],
                    newValue: data[key][subKey],
                    deviceType: applyTo
                  });
                }
              });
            } else {
              const fieldType = key.includes('Color') ? 'custom_colors' :
                              key.includes('headline') || key.includes('subheadline') ? 'custom_text' :
                              key === 'image' ? 'custom_images' : 'custom_styles';

              changes.push({
                field: fieldType,
                key: `hero_${key}`,
                oldValue: previousData[key],
                newValue: data[key],
                deviceType: applyTo
              });
            }
          }
        });

        // Save history if there are changes
        if (changes.length > 0) {
          fetch('/api/edit-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: business.slug, edits: changes })
          }).catch(console.error);
        }
      }

      setPreviousData(data);
      setIsSaving(false);
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    [business.slug]
  );

  // Save changes (legacy - for backward compatibility)
  const saveChanges = useCallback(
    debounce(async (data: any) => {
      setIsSaving(true);

      // Save all customizations
      const savePromises = [];

      // Images
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_images', 'hero_image', data.image));

      // Text content
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_text', 'hero_headline', data.headline));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_text', 'hero_subheadline', data.subheadline));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_text', 'hero_button1Text', data.button1.text));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_text', 'hero_button2Text', data.button2.text));

      // Colors
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', 'hero_headlineColor', data.headlineColor));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', 'hero_subheadlineColor', data.subheadlineColor));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', 'hero_button1BgColor', data.button1.bgColor));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', 'hero_button1Color', data.button1.textColor));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', 'hero_button2BgColor', data.button2.bgColor));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', 'hero_button2Color', data.button2.textColor));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_colors', 'hero_overlayOpacity', data.overlayOpacity.toString()));

      // Styles
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_sectionHeight', data.sectionHeight));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_sectionAnimation', data.sectionAnimation));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_imagePosition', data.imagePosition));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_imageSize', data.imageSize));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_imageFilter', data.imageFilter));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_headlineSize', data.headlineSize.toString()));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_headlineFont', data.headlineFont));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_headlineWeight', data.headlineWeight));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_headlineAnimation', data.headlineAnimation));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_subheadlineSize', data.subheadlineSize.toString()));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_subheadlineFont', data.subheadlineFont));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_subheadlineWeight', data.subheadlineWeight));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_subheadlineAnimation', data.subheadlineAnimation));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_button1Animation', data.button1.animation));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_styles', 'hero_button2Animation', data.button2.animation));

      // Buttons
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', 'button1_enabled', data.button1.enabled.toString()));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', 'button1_action', data.button1.action));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', 'button1_actionValue', data.button1.actionValue));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', 'button1_size', data.button1.size));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', 'button2_enabled', data.button2.enabled.toString()));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', 'button2_action', data.button2.action));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', 'button2_actionValue', data.button2.actionValue));
      savePromises.push(saveTemplateCustomization(business.slug, 'custom_buttons', 'button2_size', data.button2.size));

      await Promise.all(savePromises);

      setIsSaving(false);
    }, 1000),
    [business.slug]
  );

  const updateHeroData = (updates: any) => {
    const newData = { ...heroData, ...updates };
    setHeroData(newData);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
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

  return (
    <>
      <Head>
        <title>{`Pro Editor - ${business.name}`}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Open+Sans:wght@300;400;600;700;800&family=Montserrat:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;700;900&family=Raleway:wght@300;400;500;600;700;800&family=Lato:wght@300;400;700;900&family=Oswald:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700;900&family=Work+Sans:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
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
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 font-medium">
                ⚠ Unsaved Changes
              </span>
            )}
            {!hasUnsavedChanges && saveStatus === 'saved' && (
              <span className="text-sm text-green-600">
                ✓ All Saved
              </span>
            )}
            <button onClick={() => setShowHistory(true)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              History
            </button>
            <a href={`/plumbing3/${business.slug}`} target="_blank" className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              View Live
            </a>
            <button onClick={() => publishTemplate(business.slug)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
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
                <div className="border-b px-4 py-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold capitalize">
                      {editingElement === 'button1' ? 'Button 1' :
                       editingElement === 'button2' ? 'Button 2' :
                       editingElement === 'section' ? 'Section Settings' : editingElement}
                    </h3>
                    <button onClick={() => setEditingElement(null)} className="text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>

                  {/* Apply To Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Apply to:</label>
                    <select
                      value={applyTo}
                      onChange={(e) => setApplyTo(e.target.value as ApplyTo)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    >
                      <option value="both">All Devices</option>
                      <option value="desktop">Desktop Only</option>
                      <option value="mobile">Mobile Only</option>
                    </select>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => saveChangesWithDevice(heroData, applyTo)}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`mt-3 w-full px-4 py-2 font-medium text-white rounded transition-colors ${
                      isSaving ? 'bg-gray-400' :
                      !hasUnsavedChanges ? 'bg-gray-300' :
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isSaving ? 'Saving...' :
                     saveStatus === 'saved' && !hasUnsavedChanges ? 'All Changes Saved ✓' :
                     hasUnsavedChanges ? `Save Changes${applyTo === 'both' ? '' : ` (${applyTo} only)`}` :
                     'No Changes'}
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
                  <button
                    onClick={() => setActiveTab('advanced')}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === 'advanced' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-50'
                    }`}
                  >
                    Advanced
                  </button>
                </div>

                {/* Edit Panel Content */}
                <div className="flex-1 overflow-auto p-4">
                  {/* Section Editor */}
                  {editingElement === 'section' && (
                    <>
                      {activeTab === 'content' && (
                        <div className="space-y-4">
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
                          <div>
                            <label className="block text-sm font-medium mb-2">Section Height</label>
                            <select
                              value={heroData.sectionHeight}
                              onChange={(e) => updateHeroData({ sectionHeight: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="small">Small (256px)</option>
                              <option value="medium">Medium (500px)</option>
                              <option value="large">Large (700px)</option>
                              <option value="full">Full Screen</option>
                            </select>
                          </div>
                        </div>
                      )}
                      {activeTab === 'style' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Image Position</label>
                            <select
                              value={heroData.imagePosition}
                              onChange={(e) => updateHeroData({ imagePosition: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="center center">Center</option>
                              <option value="top center">Top</option>
                              <option value="bottom center">Bottom</option>
                              <option value="left center">Left</option>
                              <option value="right center">Right</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Image Size</label>
                            <select
                              value={heroData.imageSize}
                              onChange={(e) => updateHeroData({ imageSize: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="cover">Cover (Full)</option>
                              <option value="contain">Contain (Fit)</option>
                              <option value="auto">Auto</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Image Filter</label>
                            <select
                              value={heroData.imageFilter}
                              onChange={(e) => updateHeroData({ imageFilter: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="none">None</option>
                              <option value="blur">Blur</option>
                              <option value="grayscale">Grayscale</option>
                              <option value="sepia">Sepia</option>
                              <option value="brightness">Brightness</option>
                              <option value="contrast">High Contrast</option>
                            </select>
                          </div>
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
                      {activeTab === 'advanced' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Section Animation</label>
                            <select
                              value={heroData.sectionAnimation}
                              onChange={(e) => updateHeroData({ sectionAnimation: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              {ANIMATIONS.map(anim => (
                                <option key={anim.value} value={anim.value}>{anim.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Headline Editor */}
                  {editingElement === 'headline' && (
                    <>
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Headline Text</label>
                            <RichTextEditor
                              value={heroData.headline}
                              onChange={(value) => updateHeroData({ headline: value })}
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
                                <option key={font.value} value={font.value}>{font.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Font Size</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="12"
                                max="120"
                                value={heroData.headlineSize}
                                onChange={(e) => updateHeroData({ headlineSize: parseInt(e.target.value) || 48 })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                              <span className="px-3 py-2 bg-gray-50 border rounded text-sm">px</span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              <button onClick={() => updateHeroData({ headlineSize: 36 })} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">36</button>
                              <button onClick={() => updateHeroData({ headlineSize: 48 })} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">48</button>
                              <button onClick={() => updateHeroData({ headlineSize: 60 })} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">60</button>
                              <button onClick={() => updateHeroData({ headlineSize: 72 })} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">72</button>
                            </div>
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
                      {activeTab === 'advanced' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Animation</label>
                            <select
                              value={heroData.headlineAnimation}
                              onChange={(e) => updateHeroData({ headlineAnimation: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              {ANIMATIONS.map(anim => (
                                <option key={anim.value} value={anim.value}>{anim.label}</option>
                              ))}
                            </select>
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
                            <label className="block text-sm font-medium mb-2">Subheadline Text</label>
                            <RichTextEditor
                              value={heroData.subheadline}
                              onChange={(value) => updateHeroData({ subheadline: value })}
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
                                <option key={font.value} value={font.value}>{font.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Font Size</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="10"
                                max="60"
                                value={heroData.subheadlineSize}
                                onChange={(e) => updateHeroData({ subheadlineSize: parseInt(e.target.value) || 20 })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                              <span className="px-3 py-2 bg-gray-50 border rounded text-sm">px</span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              <button onClick={() => updateHeroData({ subheadlineSize: 16 })} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">16</button>
                              <button onClick={() => updateHeroData({ subheadlineSize: 18 })} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">18</button>
                              <button onClick={() => updateHeroData({ subheadlineSize: 20 })} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">20</button>
                              <button onClick={() => updateHeroData({ subheadlineSize: 24 })} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">24</button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Weight</label>
                            <select
                              value={heroData.subheadlineWeight}
                              onChange={(e) => updateHeroData({ subheadlineWeight: e.target.value })}
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
                      {activeTab === 'advanced' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Animation</label>
                            <select
                              value={heroData.subheadlineAnimation}
                              onChange={(e) => updateHeroData({ subheadlineAnimation: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              {ANIMATIONS.map(anim => (
                                <option key={anim.value} value={anim.value}>{anim.label}</option>
                              ))}
                            </select>
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
                          <div>
                            <label className="block text-sm font-medium mb-2">Button Text</label>
                            <input
                              type="text"
                              value={heroData.button1.text}
                              onChange={(e) => updateHeroData({ button1: { ...heroData.button1, text: e.target.value } })}
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Button Action</label>
                            <select
                              value={heroData.button1.action}
                              onChange={(e) => updateHeroData({ button1: { ...heroData.button1, action: e.target.value } })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="call">Call</option>
                              <option value="email">Email</option>
                              <option value="link">Link</option>
                              <option value="scroll">Scroll To Section</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Action Value</label>
                            <input
                              type="text"
                              value={heroData.button1.actionValue}
                              onChange={(e) => updateHeroData({ button1: { ...heroData.button1, actionValue: e.target.value } })}
                              className="w-full px-3 py-2 border rounded"
                              placeholder={heroData.button1.action === 'call' ? 'Phone number' : heroData.button1.action === 'email' ? 'Email address' : 'URL or section ID'}
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={heroData.button1.enabled}
                                onChange={(e) => updateHeroData({ button1: { ...heroData.button1, enabled: e.target.checked } })}
                              />
                              <span className="text-sm font-medium">Show Button</span>
                            </label>
                          </div>
                        </div>
                      )}
                      {activeTab === 'style' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Button Size</label>
                            <select
                              value={heroData.button1.size}
                              onChange={(e) => updateHeroData({ button1: { ...heroData.button1, size: e.target.value } })}
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
                                onChange={(e) => updateHeroData({ button1: { ...heroData.button1, bgColor: e.target.value } })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.button1.bgColor}
                                onChange={(e) => updateHeroData({ button1: { ...heroData.button1, bgColor: e.target.value } })}
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
                                onChange={(e) => updateHeroData({ button1: { ...heroData.button1, textColor: e.target.value } })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.button1.textColor}
                                onChange={(e) => updateHeroData({ button1: { ...heroData.button1, textColor: e.target.value } })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === 'advanced' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Animation</label>
                            <select
                              value={heroData.button1.animation}
                              onChange={(e) => updateHeroData({ button1: { ...heroData.button1, animation: e.target.value } })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              {ANIMATIONS.map(anim => (
                                <option key={anim.value} value={anim.value}>{anim.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Button 2 Editor */}
                  {editingElement === 'button2' && (
                    <>
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Button Text</label>
                            <input
                              type="text"
                              value={heroData.button2.text}
                              onChange={(e) => updateHeroData({ button2: { ...heroData.button2, text: e.target.value } })}
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Button Action</label>
                            <select
                              value={heroData.button2.action}
                              onChange={(e) => updateHeroData({ button2: { ...heroData.button2, action: e.target.value } })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="call">Call</option>
                              <option value="email">Email</option>
                              <option value="link">Link</option>
                              <option value="scroll">Scroll To Section</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Action Value</label>
                            <input
                              type="text"
                              value={heroData.button2.actionValue}
                              onChange={(e) => updateHeroData({ button2: { ...heroData.button2, actionValue: e.target.value } })}
                              className="w-full px-3 py-2 border rounded"
                              placeholder={heroData.button2.action === 'call' ? 'Phone number' : heroData.button2.action === 'email' ? 'Email address' : 'URL or section ID'}
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={heroData.button2.enabled}
                                onChange={(e) => updateHeroData({ button2: { ...heroData.button2, enabled: e.target.checked } })}
                              />
                              <span className="text-sm font-medium">Show Button</span>
                            </label>
                          </div>
                        </div>
                      )}
                      {activeTab === 'style' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Button Size</label>
                            <select
                              value={heroData.button2.size}
                              onChange={(e) => updateHeroData({ button2: { ...heroData.button2, size: e.target.value } })}
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
                                onChange={(e) => updateHeroData({ button2: { ...heroData.button2, bgColor: e.target.value } })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.button2.bgColor}
                                onChange={(e) => updateHeroData({ button2: { ...heroData.button2, bgColor: e.target.value } })}
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
                                onChange={(e) => updateHeroData({ button2: { ...heroData.button2, textColor: e.target.value } })}
                                className="w-12 h-10 border rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={heroData.button2.textColor}
                                onChange={(e) => updateHeroData({ button2: { ...heroData.button2, textColor: e.target.value } })}
                                className="flex-1 px-3 py-2 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === 'advanced' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Animation</label>
                            <select
                              value={heroData.button2.animation}
                              onChange={(e) => updateHeroData({ button2: { ...heroData.button2, animation: e.target.value } })}
                              className="w-full px-3 py-2 border rounded"
                            >
                              {ANIMATIONS.map(anim => (
                                <option key={anim.value} value={anim.value}>{anim.label}</option>
                              ))}
                            </select>
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
                  <p className="text-sm">Hover over elements to see what&apos;s editable</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      <VersionHistory
        slug={business.slug}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={(restoredData) => {
          // Apply restored data
          const updatedData = { ...heroData, ...restoredData };
          if (restoredData.button1) {
            updatedData.button1 = { ...heroData.button1, ...restoredData.button1 };
          }
          if (restoredData.button2) {
            updatedData.button2 = { ...heroData.button2, ...restoredData.button2 };
          }
          setHeroData(updatedData);
          setHasUnsavedChanges(true);
          setSaveStatus('idle');
        }}
      />
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