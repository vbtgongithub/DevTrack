// ============================================================================
// uiStore.ts — Global UI State Store
// ============================================================================
// Transient UI state: sidebar, modals, toasts, theme.
// NOT cached data — purely ephemeral presentation state.
// ============================================================================

import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
}

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Modals
  activeModal: string | null;
  modalProps: Record<string, unknown>;
  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Command Palette / Search
  isSearchOpen: boolean;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;

  // Page Loading (global)
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Theme
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme });
    // Apply to document
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  },

  // Modals
  activeModal: null,
  modalProps: {},
  openModal: (modalId, props = {}) =>
    set({ activeModal: modalId, modalProps: props }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),

  // Toasts
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      const id = `toast-${++toastCounter}`;
      const newToast: Toast = { ...toast, id };

      // Auto-remove after duration
      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          set((s) => ({
            toasts: s.toasts.filter((t) => t.id !== id),
          }));
        }, duration);
      }

      return { toasts: [...state.toasts, newToast] };
    }),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),

  // Search
  isSearchOpen: false,
  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  // Page Loading
  isPageLoading: false,
  setPageLoading: (loading) => set({ isPageLoading: loading }),
}));
