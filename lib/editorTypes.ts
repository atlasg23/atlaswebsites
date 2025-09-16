// Editor type definitions

export interface ButtonConfig {
  id: string;
  text: string;
  action: 'call' | 'email' | 'link' | 'scroll' | 'none';
  actionValue: string; // phone number, email, URL, section ID
  style: 'filled' | 'outline' | 'ghost';
  size: 'small' | 'medium' | 'large';
  bgColor: string;
  textColor: string;
  borderColor?: string;
  icon?: string;
  enabled: boolean;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  letterSpacing: number;
  lineHeight: number;
}

export interface HeroSectionData {
  // Image settings
  image: string;
  overlayOpacity: number;
  overlayColor: string;

  // Text content
  headline: string;
  headlineFont: FontConfig;
  headlineColor: string;

  subheadline: string;
  subheadlineFont: FontConfig;
  subheadlineColor: string;

  // Buttons
  buttons: ButtonConfig[];
  buttonAlignment: 'left' | 'center' | 'right';

  // Layout
  height: 'small' | 'medium' | 'large' | 'full';
  contentAlignment: 'left' | 'center' | 'right';
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface Version {
  id: string;
  timestamp: Date;
  data: any;
  note?: string;
  isAutoSave: boolean;
}

export interface EditorState {
  currentVersion: string;
  versions: Version[];
  unsavedChanges: boolean;
  undoStack: any[];
  redoStack: any[];
}