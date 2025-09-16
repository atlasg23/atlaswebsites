// Color utility functions for ensuring good contrast

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function getLuminance(r: number, g: number, b: number): number {
  // Calculate relative luminance
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return true; // Default to light if can't parse

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5;
}

export function ensureContrast(bgColor: string, fgColor: string): { bg: string; fg: string } {
  // Ensure minimum contrast ratio of 4.5:1 for WCAG AA compliance
  const ratio = getContrastRatio(bgColor, fgColor);

  if (ratio >= 4.5) {
    return { bg: bgColor, fg: fgColor };
  }

  // If contrast is too low, use black or white text based on background luminance
  const textColor = isLightColor(bgColor) ? '#000000' : '#ffffff';
  return { bg: bgColor, fg: textColor };
}

export function getTextColorForBg(bgColor: string): string {
  // Returns black or white text based on background color
  if (!bgColor || bgColor === 'nan' || bgColor === '') {
    return '#000000'; // Default to black text
  }

  return isLightColor(bgColor) ? '#000000' : '#ffffff';
}

export function validateColor(color: string | undefined | null): string {
  // Validate and provide fallback for colors
  if (!color || color === 'nan' || color === '' || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
    return '#2563eb'; // Default blue
  }
  return color;
}

export function getColorScheme(primary?: string, secondary?: string) {
  // Validate and adjust colors for good contrast
  const validPrimary = validateColor(primary);
  const validSecondary = validateColor(secondary);

  // Ensure secondary isn't too similar to primary
  if (getContrastRatio(validPrimary, validSecondary) < 1.5) {
    // Colors are too similar, darken or lighten secondary
    const rgb = hexToRgb(validSecondary);
    if (rgb) {
      const isDark = !isLightColor(validSecondary);
      if (isDark) {
        // Lighten it
        return {
          primary: validPrimary,
          secondary: '#' + [rgb.r, rgb.g, rgb.b].map(c =>
            Math.min(255, Math.floor(c * 1.5)).toString(16).padStart(2, '0')
          ).join(''),
          textOnPrimary: getTextColorForBg(validPrimary),
          textOnSecondary: getTextColorForBg(validSecondary)
        };
      } else {
        // Darken it
        return {
          primary: validPrimary,
          secondary: '#' + [rgb.r, rgb.g, rgb.b].map(c =>
            Math.floor(c * 0.7).toString(16).padStart(2, '0')
          ).join(''),
          textOnPrimary: getTextColorForBg(validPrimary),
          textOnSecondary: getTextColorForBg(validSecondary)
        };
      }
    }
  }

  return {
    primary: validPrimary,
    secondary: validSecondary,
    textOnPrimary: getTextColorForBg(validPrimary),
    textOnSecondary: getTextColorForBg(validSecondary)
  };
}