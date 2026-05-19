// ============================================================================
// SettingsWorkspace.tsx — Enhanced Settings with AI Intelligence
// ============================================================================
// Premium settings experience with command palette, recommendations,
// real-time sync, and elite micro-interactions.
// ============================================================================

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Icon } from '../../components/shared/Icon';
import { SETTINGS_SCHEMA } from './schemas';
import { useSettingsStore } from '../../store/settingsStore';
import { SettingsFieldRenderer } from './components/SettingsFieldRenderer';
import { updateSettings } from '../../services/settingsService';
import { useUIStore } from '../../store/uiStore';
import { CommandPalette } from './components/CommandPalette';
import { SystemHealthBar } from './components/SystemHealthBar';
import { generateRecommendations, getSettingHint } from './types/recommendations';

export const SettingsWorkspace: React.FC = () => {
  const { settings, fetchSettings } = useSettingsStore();
  const addToast = useUIStore((s) => s.addToast);

  const [activeSection, setActiveSection] = useState(SETTINGS_SCHEMA[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [localValues, setLocalValues] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // === PHASE 1: AI RECOMMENDATIONS ===
  const recommendations = useMemo(() => {
    if (!settings) return [];
    // In production, pass actual userActivity
    return generateRecommendations(settings);
  }, [settings]);

  // === PHASE 3: PREMIUM SAVE EXPERIENCE ===
  // Auto-save with debounce
  const handleAutoSave = useCallback(async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
     
    const payload: any = {};

    const setNestedValue = (obj: Record<string, unknown>, path: string, val: unknown) => {
      const parts = path.split('.');
      let current: unknown = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (typeof current !== 'object' || current === null) break;
        const record = current as Record<string, unknown>;
        if (!record[parts[i]]) record[parts[i]] = {};
        current = record[parts[i]];
      }
      if (typeof current === 'object' && current !== null) {
        (current as Record<string, unknown>)[parts[parts.length - 1]] = val;
      }
    };

    Object.entries(localValues).forEach(([key, value]) => {
      setNestedValue(payload, key, value);
    });

    try {
      await updateSettings(payload);
      await fetchSettings();
      setHasChanges(false);
      addToast({ type: 'success', title: 'Auto-saved', message: 'Your changes have been synced.', duration: 2000 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save settings.';
      addToast({ type: 'error', title: 'Save Failed', message });
    } finally {
      setIsSaving(false);
    }
  }, [localValues, hasChanges, isSaving, fetchSettings, addToast]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (hasChanges && !isSaving) {
      saveTimeoutRef.current = setTimeout(handleAutoSave, 2000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [hasChanges, isSaving, handleAutoSave]);

  // Keyboard shortcut for command palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize settings
  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  // Flatten settings into local values
  useEffect(() => {
    if (!settings) return;
    const flattened: Record<string, unknown> = {};
    const getNestedValue = (obj: unknown, path: string): unknown => {
      return path.split('.').reduce((acc, part) => {
        if (typeof acc !== 'object' || acc === null) return undefined;
        return (acc as Record<string, unknown>)[part];
      }, obj);
    };

    SETTINGS_SCHEMA.forEach(section => {
      section.groups.forEach(group => {
        group.fields.forEach(field => {
          flattened[field.id] = getNestedValue(settings, field.id) ?? '';
        });
      });
    });

    setLocalValues(flattened);
    setHasChanges(false);
  }, [settings]);

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery) return SETTINGS_SCHEMA;
    const lowerQuery = searchQuery.toLowerCase();

    return SETTINGS_SCHEMA.map(section => {
      const filteredGroups = section.groups.map(group => {
        const filteredFields = group.fields.filter(field =>
          field.label.toLowerCase().includes(lowerQuery) ||
          field.description?.toLowerCase().includes(lowerQuery)
        );
        return { ...group, fields: filteredFields };
      }).filter(group => group.fields.length > 0 || group.title.toLowerCase().includes(lowerQuery));

      return { ...section, groups: filteredGroups };
    }).filter(section => section.groups.length > 0 || section.title.toLowerCase().includes(lowerQuery));
  }, [searchQuery]);

  // === PHASE 1: Track recent changes ===
  const handleFieldChange = (id: string, value: unknown) => {
    setLocalValues(prev => ({ ...prev, [id]: value }));
    setHasChanges(true);
  };

  const handleCommandPaletteNavigate = (sectionId: string, fieldId?: string) => {
    setActiveSection(sectionId);
    if (fieldId) {
      // Scroll to field after render
      setTimeout(() => {
        document.getElementById(`field-${fieldId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    setSearchQuery('');
  };

  const handleCommandPaletteUpdate = (settingId: string, value: unknown) => {
    setLocalValues(prev => ({ ...prev, [settingId]: value }));
    setHasChanges(true);
  };

  const activeSectionData = filteredSections.find(s => s.id === activeSection) || filteredSections[0];

  // === PHASE 2: SPRING PHYSICS FOR TOGGLE ===
  // Calculate save progress for animation
  const saveProgress = useSpring(0, { stiffness: 300, damping: 30 });
  const saveProgressWidth = useTransform(saveProgress, [0, 1], ['0%', '100%']);
  useEffect(() => {
    if (isSaving) {
      saveProgress.set(0);
      setTimeout(() => saveProgress.set(1), 100);
    } else {
      saveProgress.set(0);
    }
  }, [isSaving, saveProgress]);

  return (
    <div className="max-w-[1200px] mx-auto pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-30 pt-6 pb-6 bg-dt-bg/90 backdrop-blur-xl border-b border-dt-primary/5 flex items-center justify-between mb-8 px-4">
        <div>
          <h1 className="text-3xl font-black text-dt-text tracking-tight">Settings</h1>
          <p className="text-sm font-medium text-dt-textSecondary/70 mt-1">Manage your developer workspace</p>
        </div>

        <div className="flex items-center gap-4">
          {/* PHASE 5: System Health Bar */}
          <SystemHealthBar />

          {/* Search with Command Palette trigger */}
          <div className="relative group">
            <Icon name="magnifying-glass" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dt-textSecondary/50 group-focus-within:text-dt-primary transition-colors z-10" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowCommandPalette(true)}
              className="pl-9 pr-14 py-2.5 bg-white/60 border border-dt-primary/10 rounded-2xl text-sm font-medium text-dt-text focus:outline-none focus:ring-2 focus:ring-dt-primary/20 focus:bg-white transition-all w-64 shadow-sm hover:shadow-md"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-50 group-focus-within:opacity-0 transition-opacity">
              <kbd className="px-1.5 py-0.5 rounded bg-black/5 text-[10px] font-black border border-black/10">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-black/5 text-[10px] font-black border border-black/10">K</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 1: AI Recommendations Banner */}
      <AnimatePresence>
        {showRecommendations && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 mx-4"
          >
            <div className="bg-gradient-to-r from-dt-primary/5 via-dt-secondary/5 to-dt-primary/5 border border-dt-primary/10 rounded-2xl p-4 flex items-center gap-4 overflow-x-auto">
              <div className="w-10 h-10 rounded-xl bg-dt-primary/10 flex items-center justify-center shrink-0">
                <Icon name="sparkles" size={18} className="text-dt-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-dt-text">Recommended for you</span>
                  <span className="px-2 py-0.5 rounded-full bg-dt-primary/10 text-[10px] font-black text-dt-primary uppercase">AI</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recommendations.slice(0, 3).map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => {
                        if (rec.action) {
                          handleFieldChange(rec.action.settingId, rec.action.value);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-dt-primary/10 hover:bg-white hover:border-dt-primary/20 transition-all whitespace-nowrap"
                    >
                      <Icon name={rec.icon} size={14} className="text-dt-primary/70" />
                      <span className="text-xs font-semibold text-dt-text">{rec.title}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowRecommendations(false)}
                className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                <Icon name="x" size={14} className="text-dt-textMuted/50" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8 px-4">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-[120px] flex flex-col gap-1">
            {SETTINGS_SCHEMA.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSearchQuery('');
                }}
                className="group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 text-left relative overflow-hidden"
              >
                {/* Hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-dt-primary/0 via-dt-primary/5 to-dt-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {activeSection === section.id && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-dt-primary rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  name={section.icon}
                  size={18}
                  className={`relative z-10 transition-all duration-300 ${
                    activeSection === section.id
                      ? 'text-dt-primary scale-110'
                      : 'text-dt-textSecondary/50 group-hover:text-dt-text group-hover:scale-105'
                  }`}
                />
                <span
                  className={`relative z-10 font-semibold transition-all duration-300 ${
                    activeSection === section.id
                      ? 'text-dt-text'
                      : 'text-dt-textSecondary/70 group-hover:text-dt-text'
                  }`}
                >
                  {section.title}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeSectionData ? (
            <div className="flex flex-col gap-8">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-dt-text flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-10 h-10 rounded-xl bg-white shadow-sm border border-dt-primary/5 flex items-center justify-center"
                  >
                    <Icon name={activeSectionData.icon} size={20} className="text-dt-primary" />
                  </motion.div>
                  {activeSectionData.title}
                </h2>
              </div>

              {activeSectionData.groups.map((group, groupIndex) => (
                <motion.div
                  key={group.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  className="bg-white/70 backdrop-blur-xl border border-dt-primary/8 rounded-[28px] p-6 shadow-[0_4px_24px_rgba(124,92,252,0.04)] hover:shadow-[0_8px_32px_rgba(124,92,252,0.06)] transition-shadow duration-300"
                >
                  <h3 className="text-sm font-black text-dt-text uppercase tracking-wider mb-5 flex items-center gap-2">
                    {group.title}
                    {group.description && (
                      <span className="text-[10px] font-normal text-dt-textMuted/50 normal-case tracking-normal ml-2">
                        {group.description}
                      </span>
                    )}
                  </h3>

                  <div className="flex flex-col gap-6">
                    {group.fields.map(field => {
                      // Hide experimental fields if powerUserMode is off
                      if (field.experimental && !localValues['account.powerUserMode']) {
                        return null;
                      }

                      if (field.dependencies) {
                        const isSatisfied = field.dependencies.every(dep => localValues[dep.id] === dep.value);
                        if (!isSatisfied) return null;
                      }

                      const hint = getSettingHint(field.id, localValues[field.id]);

                      return (
                        <div key={field.id} id={`field-${field.id}`}>
                          <SettingsFieldRenderer
                            field={field}
                            value={localValues[field.id]}
                            onChange={(val) => handleFieldChange(field.id, val)}
                          />
                          {/* Contextual hint */}
                          <AnimatePresence>
                            {hint && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 ml-1 flex items-center gap-2"
                              >
                                <Icon name="lightbulb" size={12} className="text-dt-primary/50" />
                                <p className="text-xs text-dt-textSecondary/60">{hint}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-dt-textSecondary/50 font-medium">
              No settings found for "{searchQuery}"
            </div>
          )}
        </main>
      </div>

      {/* Floating Sticky Save Bar - PHASE 3: PREMIUM SAVE */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 px-6 py-4 bg-white/90 backdrop-blur-2xl border border-dt-primary/10 rounded-full shadow-[0_16px_40px_rgba(124,92,252,0.15)] w-[90%] max-w-[600px]"
          >
            {/* Animated save indicator */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className="w-3 h-3 rounded-full bg-dt-primary"
                  animate={isSaving ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: isSaving ? Infinity : 0, duration: 1 }}
                />
                {isSaving && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-dt-primary/30"
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}
              </div>
              <span className="text-sm font-semibold text-dt-textSecondary/80">
                {isSaving ? 'Syncing...' : 'Unsaved changes'}
              </span>
            </div>

            {/* Save progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-dt-primary/20 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-dt-primary"
                style={{ width: saveProgressWidth }}
              />
            </motion.div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  fetchSettings();
                }}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-bold text-dt-textSecondary/70 hover:text-dt-text hover:bg-black/5 rounded-full transition-all active:scale-95"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={handleAutoSave}
                disabled={isSaving}
                className="relative flex items-center gap-2 px-6 py-2.5 bg-dt-primary text-white rounded-full text-sm font-black hover:bg-dt-primaryHover transition-all shadow-[0_4px_16px_rgba(124,92,252,0.3)] hover:shadow-[0_8px_24px_rgba(124,92,252,0.4)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 overflow-hidden"
              >
                <motion.span
                  animate={isSaving ? { x: -20, opacity: 0 } : { x: 0, opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Icon name="check" size={16} />
                  Save Now
                </motion.span>
                {isSaving && (
                  <motion.span
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Icon name="arrow-path" size={16} className="animate-spin" />
                  </motion.span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 4: COMMAND PALETTE */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleCommandPaletteNavigate}
        onUpdateSetting={handleCommandPaletteUpdate}
        currentSettings={localValues}
      />
    </div>
  );
};