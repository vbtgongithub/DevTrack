// ============================================================================
// CommandPalette.tsx — Spotlight-Style Search Overlay
// ============================================================================
// Command center for settings navigation with keyboard shortcuts,
// intelligent ranking, and instant results.
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../../components/shared/Icon';
import { SETTINGS_SCHEMA } from '../schemas';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string, fieldId?: string) => void;
  onUpdateSetting: (settingId: string, value: any) => void;
  currentSettings: Record<string, any>;
}

interface SearchResult {
  id: string;
  type: 'section' | 'group' | 'field';
  title: string;
  description?: string;
  icon: string;
  sectionId: string;
  groupTitle?: string;
  settingId?: string;
  action?: {
    type: 'navigate' | 'toggle' | 'input';
    value?: any;
  };
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onUpdateSetting,
  currentSettings,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Build searchable index
  const searchIndex = useMemo(() => {
    const items: SearchResult[] = [];

    SETTINGS_SCHEMA.forEach(section => {
      // Add section
      items.push({
        id: `section-${section.id}`,
        type: 'section',
        title: section.title,
        description: section.description,
        icon: section.icon,
        sectionId: section.id,
        action: { type: 'navigate' },
      });

      // Add groups and fields
      section.groups.forEach(group => {
        items.push({
          id: `group-${section.id}-${group.title}`,
          type: 'group',
          title: group.title,
          description: group.description,
          icon: 'folder',
          sectionId: section.id,
          groupTitle: group.title,
          action: { type: 'navigate' },
        });

        group.fields.forEach(field => {
          // Determine if this is a toggleable field
          const isToggle = field.type === 'toggle';
          const currentValue = currentSettings[field.id];
          const isEnabled = isToggle && currentValue === true;

          items.push({
            id: `field-${field.id}`,
            type: 'field',
            title: field.label,
            description: field.description,
            icon: field.icon || (isToggle ? (isEnabled ? 'toggle-right' : 'toggle-left') : 'sliders'),
            sectionId: section.id,
            groupTitle: group.title,
            settingId: field.id,
            action: isToggle
              ? { type: 'toggle', value: !currentValue }
              : { type: 'navigate' },
          });
        });
      });
    });

    return items;
  }, [currentSettings]);

  // Search with intelligent ranking
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent/popular when empty
      return searchIndex.slice(0, 8);
    }

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(' ').filter(t => t.length > 0);

    // Aliases for common searches
    const aliases: Record<string, string[]> = {
      'theme': ['appearance', 'dark', 'light', 'mode'],
      'github': ['integrations', 'github', 'connect', 'sync'],
      'privacy': ['privacy', 'visibility', 'public', 'private'],
      'api': ['developer', 'api', 'tokens', 'webhooks'],
      'notifications': ['notifications', 'alerts', 'reminders', 'email'],
      'profile': ['account', 'profile', 'display', 'name'],
    };

    const expandedTerms = [...terms];
    terms.forEach(term => {
      const aliasList = aliases[term];
      if (aliasList) {
        expandedTerms.push(...aliasList);
      }
    });

    return searchIndex
      .map(item => {
        let score = 0;
        const searchableText = `${item.title} ${item.description || ''} ${item.groupTitle || ''}`.toLowerCase();

        // Exact match gets highest score
        if (item.title.toLowerCase().includes(lowerQuery)) {
          score += 100;
        }
        // Start of title match
        if (item.title.toLowerCase().startsWith(lowerQuery)) {
          score += 50;
        }
        // Description match
        if (item.description?.toLowerCase().includes(lowerQuery)) {
          score += 25;
        }
        // Expanded term matches
        expandedTerms.forEach(term => {
          if (searchableText.includes(term)) {
            score += 10;
          }
        });
        // Group context boost
        if (item.groupTitle && item.groupTitle.toLowerCase().includes(lowerQuery)) {
          score += 15;
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [query, searchIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          const result = results[selectedIndex];
          if (result.action?.type === 'toggle' && result.settingId) {
            onUpdateSetting(result.settingId, result.action.value);
          }
          onNavigate(result.sectionId, result.settingId);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onNavigate, onUpdateSetting, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const container = resultsRef.current;
    if (container) {
      const selected = container.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Palette Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-[640px] z-50"
          >
            <div className="bg-white/95 backdrop-blur-2xl border border-dt-primary/10 rounded-3xl shadow-[0_24px_64px_rgba(124,92,252,0.15),0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-dt-primary/5">
                <Icon name="magnifying-glass" size={20} className="text-dt-primary/60 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search settings, actions..."
                  className="flex-1 bg-transparent text-lg font-medium text-dt-text placeholder:text-dt-textMuted/40 focus:outline-none"
                />
                <kbd className="px-2.5 py-1 rounded-lg bg-black/5 text-[11px] font-black text-dt-textMuted/60 border border-black/5">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="max-h-[400px] overflow-y-auto py-3">
                {results.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Icon name="magnifying-glass" size={32} className="text-dt-textMuted/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-dt-textSecondary/60">No results found for "{query}"</p>
                  </div>
                ) : (
                  results.map((result, index) => (
                    <motion.button
                      key={result.id}
                      data-index={index}
                      onClick={() => {
                        if (result.action?.type === 'toggle' && result.settingId) {
                          onUpdateSetting(result.settingId, result.action.value);
                        }
                        onNavigate(result.sectionId, result.settingId);
                        onClose();
                      }}
                      className={[
                        'w-full flex items-center gap-4 px-6 py-3.5 text-left transition-all duration-150',
                        selectedIndex === index
                          ? 'bg-dt-primary/5'
                          : 'hover:bg-black/3',
                      ].join(' ')}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className={[
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        selectedIndex === index
                          ? 'bg-dt-primary/10 text-dt-primary'
                          : 'bg-dt-bg text-dt-textSecondary/50',
                      ].join(' ')}>
                        <Icon name={result.icon} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={[
                            'font-semibold truncate',
                            selectedIndex === index ? 'text-dt-text' : 'text-dt-text',
                          ].join(' ')}>
                            {result.title}
                          </span>
                          {result.type === 'field' && result.settingId && currentSettings[result.settingId] === true && (
                            <span className="px-2 py-0.5 rounded-full bg-dt-success/10 text-[10px] font-black text-dt-success uppercase tracking-wider">
                              ON
                            </span>
                          )}
                        </div>
                        {result.description && (
                          <p className="text-xs text-dt-textSecondary/60 truncate mt-0.5">
                            {result.groupTitle && (
                              <span className="text-dt-primary/60">{result.groupTitle} › </span>
                            )}
                            {result.description}
                          </p>
                        )}
                      </div>
                      {selectedIndex === index && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Icon name="arrow-right" size={14} className="text-dt-primary/40" />
                        </div>
                      )}
                    </motion.button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-dt-primary/5 bg-dt-bg/30">
                <div className="flex items-center gap-4 text-[11px] font-medium text-dt-textMuted/50">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-black/5 border border-black/10">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-black/5 border border-black/10">↵</kbd>
                    Select
                  </span>
                </div>
                <span className="text-[11px] font-medium text-dt-textMuted/40">
                  {results.length} results
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};