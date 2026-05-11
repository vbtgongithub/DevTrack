export type SettingFieldType = 
  | 'toggle'
  | 'input'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'slider'
  | 'color'
  | 'password'
  | 'button'
  | 'card'
  | 'danger';

export interface SettingOption {
  label: string;
  value: string | number | boolean;
}

export interface SettingFieldConfig {
  id: string; // e.g., 'appearance.theme'
  label: string;
  description?: string;
  icon?: string;
  type: SettingFieldType;
  options?: SettingOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  buttonText?: string;
  buttonAction?: () => void;
  requiresRestart?: boolean;
  premium?: boolean;
  danger?: boolean;
  dependencies?: { id: string; value: any }[];
  experimental?: boolean; // Hidden unless Power User Mode is enabled
}

export interface SettingGroupConfig {
  title: string;
  description?: string;
  fields: SettingFieldConfig[];
}

export interface SettingSectionConfig {
  id: string;
  title: string;
  description?: string;
  icon: string;
  groups: SettingGroupConfig[];
}

// Flat key-value map for the values
export type SettingsValues = Record<string, any>;
