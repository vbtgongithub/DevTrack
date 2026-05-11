// ============================================================================
// SettingsFieldRenderer.tsx — Premium Component System
// ============================================================================
// Enhanced field components with elite micro-interactions, spring physics,
// and premium animations.
// ============================================================================

import React, { useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Icon } from '../../../components/shared/Icon';
import type { SettingFieldConfig } from '../types';

interface SettingsFieldRendererProps {
  field: SettingFieldConfig;
  value: any;
  onChange: (val: any) => void;
}

// === PHASE 2: ELITE TOGGLE WITH SPRING PHYSICS ===
const SpringToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => {
  // Spring physics for the knob
  const knobX = useSpring(checked ? 22 : 2, {
    stiffness: 400,
    damping: 25,
  });

  // Scale spring for the track
  const trackScale = useSpring(checked ? 1.02 : 1, {
    stiffness: 400,
    damping: 20,
  });

  // Glow intensity spring
  const glowIntensity = useSpring(checked ? 1 : 0, {
    stiffness: 300,
    damping: 25,
  });

  const glowOpacity = useTransform(glowIntensity, [0, 1], [0, 0.5]);

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={[
        'relative inline-flex h-7 w-12 rounded-full transition-all duration-300 cursor-pointer',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        checked
          ? 'bg-gradient-to-r from-dt-primary to-dt-secondary shadow-[0_2px_12px_rgba(124,92,252,0.4)]'
          : 'bg-gray-200 border border-black/5 hover:bg-gray-300',
      ].join(' ')}
      style={{ scale: trackScale }}
      role="switch"
      aria-checked={!!checked}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glow effect when enabled */}
      <motion.div
        className="absolute inset-0 rounded-full bg-dt-primary/30 blur-md"
        style={{ opacity: glowOpacity }}
      />

      {/* The knob */}
      <motion.div
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
        style={{ x: knobX }}
      >
        {/* Inner shine effect */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white to-gray-100" />
      </motion.div>
    </motion.button>
  );
};

// === PREMIUM SELECT PILLS ===
const PremiumPills: React.FC<{
  options: { label: string; value: any }[];
  value: any;
  onChange: (val: any) => void;
}> = ({ options, value, onChange }) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt, index) => {
        const isSelected = value === opt.value;
        return (
          <motion.button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'px-4 py-2 rounded-[20px] text-[12px] font-black transition-all duration-300 border relative overflow-hidden',
              isSelected
                ? 'bg-dt-primary text-white border-dt-primary shadow-[0_4px_12px_rgba(124,92,252,0.3)]'
                : 'bg-white text-dt-textSecondary border-dt-primary/10 hover:border-dt-primary/30 hover:bg-dt-primary/5',
            ].join(' ')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            {isSelected && (
              <motion.div
                layoutId="pillBackground"
                className="absolute inset-0 bg-dt-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

// === PREMIUM SLIDER ===
const PremiumSlider: React.FC<{
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
}> = ({ min = 0, max = 100, step = 1, value = 0, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;
  const fillWidth = useSpring(percentage, { stiffness: 300, damping: 25 });

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 relative h-3 bg-dt-primary/10 rounded-full overflow-hidden">
        {/* Fill */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-dt-primary to-dt-secondary rounded-full"
          style={{ width: fillWidth }}
        />

        {/* Track input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-2 border-dt-primary"
          style={{ left: `calc(${percentage}% - 10px)` }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        />
      </div>
      <span className="text-xs font-black text-dt-text w-8 text-right tabular-nums min-w-[2rem]">
        {value}
      </span>
    </div>
  );
};

// === PREMIUM INPUT ===
const PremiumInput: React.FC<{
  type: 'input' | 'password' | 'textarea';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ type, value, onChange, placeholder, rows }) => {
  const [isFocused, setIsFocused] = useState(false);

  if (type === 'textarea') {
    return (
      <motion.div className="w-full relative" animate={{ scale: isFocused ? 1.01 : 1 }} transition={{ duration: 0.2 }}>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-4 py-3 bg-white border border-dt-primary/10 rounded-[16px] text-[13px] font-medium text-dt-text focus:border-dt-primary/40 focus:ring-2 focus:ring-dt-primary/10 transition-all duration-300 outline-none resize-none"
        />
        <motion.div
          className="absolute -inset-0.5 rounded-[17px] bg-dt-primary/10 -z-10"
          animate={{ opacity: isFocused ? 1 : 0 }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div className="w-full max-w-lg relative" animate={{ scale: isFocused ? 1.01 : 1 }} transition={{ duration: 0.2 }}>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full px-4 py-2.5 bg-white border border-dt-primary/10 rounded-[14px] text-[13px] font-medium text-dt-text focus:border-dt-primary/40 focus:ring-2 focus:ring-dt-primary/10 transition-all duration-300 outline-none"
      />
      <motion.div
        className="absolute -inset-0.5 rounded-[15px] bg-dt-primary/10 -z-10"
        animate={{ opacity: isFocused ? 1 : 0 }}
      />
    </motion.div>
  );
};

// === MAIN RENDERER ===
export const SettingsFieldRenderer: React.FC<SettingsFieldRendererProps> = ({ field, value, onChange }) => {
  const { type, label, description, options, min, max, step, placeholder, danger, icon } = field;

  return (
    <div className={`
      flex ${type === 'toggle' ? 'items-center justify-between' : 'flex-col gap-2'}
      py-3 px-5 rounded-[18px] hover:bg-black/[0.02] transition-all duration-300 group
      ${danger ? 'hover:bg-red-50/50' : ''}
    `}>
      <div className={`${type === 'toggle' ? 'mr-4' : 'mb-1'} flex-1 flex items-start gap-3`}>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-dt-primary/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-dt-primary/10 transition-colors">
            <Icon name={icon} size={14} className="text-dt-primary/70" />
          </div>
        )}
        <div>
          <label className={['text-[13px] font-black tracking-tight block', danger ? 'text-red-600' : 'text-dt-text'].join(' ')}>
            {label}
          </label>
          {description && (
            <span className="text-[11px] font-medium text-dt-textSecondary/70 block mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </div>
      </div>

      <div className={`${type === 'toggle' ? 'flex-shrink-0' : 'w-full max-w-lg'} flex items-center`}>
        {type === 'toggle' && (
          <SpringToggle
            checked={!!value}
            onChange={(checked) => onChange(checked)}
          />
        )}

        {(type === 'input' || type === 'password' || type === 'textarea') && (
          <PremiumInput
            type={type}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            rows={type === 'textarea' ? 3 : undefined}
          />
        )}

        {type === 'select' && options && (
          <PremiumPills
            options={options}
            value={value}
            onChange={onChange}
          />
        )}

        {type === 'slider' && (
          <PremiumSlider
            min={min ?? 0}
            max={max ?? 100}
            step={step ?? 1}
            value={Number(value) || 0}
            onChange={onChange}
          />
        )}

        {type === 'color' && (
          <div className="flex gap-3 items-center">
            <div className="relative">
              <input
                type="color"
                value={value || '#7C5CFC'}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
              />
              <div className="absolute inset-0 rounded-lg border border-black/10 pointer-events-none" />
            </div>
            <span className="text-[12px] font-medium text-dt-textSecondary/70 uppercase tracking-widest">
              {value || '#7C5CFC'}
            </span>
          </div>
        )}

        {type === 'danger' && (
          <motion.button
            type="button"
            onClick={() => onChange(true)}
            className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-[16px] text-[13px] font-black hover:bg-red-600 hover:text-white transition-all shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {placeholder || label}
          </motion.button>
        )}
      </div>
    </div>
  );
};