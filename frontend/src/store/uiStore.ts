// ============================================================================
// uiStore.ts — Global UI State Store
// ============================================================================
// Transient UI state: sidebar, modals, toasts, theme, connection status.
// NOT cached data — purely ephemeral presentation state.
// ============================================================================

import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: {
    current: number;
    total: number;
  };
  icon?: string;
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
  addActionToast: (toast: Omit<Toast, 'id' | 'action'> & { action: Toast['action'] }) => void;

  // Connection status
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  // SSE status
  sseStatus: 'connected' | 'reconnecting' | 'disconnected';
  setSseStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void;

  // Infrastructure status (degraded mode)
  isInfrastructureDegraded: boolean;
  setInfrastructureDegraded: (degraded: boolean) => void;

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
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    const newToast: Toast = { ...toast, id };

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({
          toasts: s.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    set((state) => {
      // Limit to 4 toasts max
      const trimmed = state.toasts.slice(-3);
      return { toasts: [...trimmed, newToast] };
    });
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
  addActionToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    const newToast: Toast = { ...toast, id, duration: toast.duration ?? 8000 };

    // Action toasts don't auto-dismiss unless duration > 0
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((s) => ({
          toasts: s.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }

    set((state) => {
      const trimmed = state.toasts.slice(-3);
      return { toasts: [...trimmed, newToast] };
    });
  },

  // Connection status
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (online) => set({ isOnline: online }),

  // SSE status
  sseStatus: 'disconnected',
  setSseStatus: (status) => set({ sseStatus: status }),

  // Infrastructure status
  isInfrastructureDegraded: false,
  setInfrastructureDegraded: (degraded) => set({ isInfrastructureDegraded: degraded }),

  // Search
  isSearchOpen: false,
  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  // Page Loading
  isPageLoading: false,
  setPageLoading: (loading) => set({ isPageLoading: loading }),
}));
