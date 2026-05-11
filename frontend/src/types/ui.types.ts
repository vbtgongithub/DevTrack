// ============================================================================
// ui.types.ts — UI Component Prop Types
// ============================================================================
// These types define the props interface for every presentational component.
// Components receive ONLY these types — never raw API or internal ViewModel data.
// ============================================================================

import type {
  StreakBannerVM,
  StatsGridVM,
  StatCardVM,
  PlatformSummaryVM,
  MissionPanelVM,
  MissionCardVM,
  RecentActivityVM,
  DsaStatsVM,
  DsaProblemTableVM,
  DsaProblemRowVM,
  DsaCategoryVM,
  DsaFilterOptionsVM,
  DsaProgressVM,
  ProjectsStatsVM,
  ProjectCardVM,
  ProjectsFilterOptionsVM,
  ProjectDetailVM,
  ProjectMilestoneVM,
  ProjectTaskVM,
  SettingsProfileVM,
  SettingsPlatformVM,
  SettingsNotificationsVM,
  SettingsAppearanceVM,
  SettingsPrivacyVM,
  SidebarNavItemVM,
  TopbarVM,
  DataStatus,
} from './vm.types';

// ---------------------------------------------------------------------------
// 1. LAYOUT COMPONENT PROPS
// ---------------------------------------------------------------------------

export interface AppLayoutProps {
  children: React.ReactNode;
}

export interface SidebarProps {
  navItems: SidebarNavItemVM[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  profile?: {
    displayName: string;
    avatarUrl: string | null;
    subtitle?: string;
  };
}

export interface TopbarProps {
  data: TopbarVM;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onSearchClick: () => void;
}

export interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  status: DataStatus;
  error: string | null;
  onRetry?: () => void;
}

// ---------------------------------------------------------------------------
// 2. DASHBOARD COMPONENT PROPS
// ---------------------------------------------------------------------------

export interface StreakBannerProps {
  data: StreakBannerVM;
}

export interface StatsGridProps {
  data: StatsGridVM;
}

export interface StatCardProps {
  data: StatCardVM;
}

export interface PlatformSummaryRowProps {
  platforms: PlatformSummaryVM[];
}

export interface PlatformSummaryCardProps {
  data: PlatformSummaryVM;
}

export interface MissionPanelProps {
  data: MissionPanelVM;
  onMissionClick?: (missionId: string) => void;
}

export interface MissionCardProps {
  data: MissionCardVM;
  onClick?: () => void;
}

export interface RecentActivityListProps {
  activities: RecentActivityVM[];
  maxItems?: number;
  onViewAll?: () => void;
}

export interface RecentActivityItemProps {
  data: RecentActivityVM;
}


// ---------------------------------------------------------------------------
// 4. DSA COMPONENT PROPS
// ---------------------------------------------------------------------------

export interface DsaStatsProps {
  data: DsaStatsVM;
}

export interface DsaDifficultyBarProps {
  easy: { solved: number; total: number; percent: number };
  medium: { solved: number; total: number; percent: number };
  hard: { solved: number; total: number; percent: number };
}

export interface DsaProblemTableProps {
  data: DsaProblemTableVM;
  onSort?: (column: string) => void;
  onPageChange?: (page: number) => void;
  onToggleFavorite?: (problemId: string) => void;
  onProblemClick?: (problemId: string) => void;
}

export interface DsaProblemRowProps {
  data: DsaProblemRowVM;
  onToggleFavorite?: () => void;
  onClick?: () => void;
}

export interface DsaCategoryListProps {
  categories: DsaCategoryVM[];
  onCategoryClick?: (slug: string) => void;
}

export interface DsaCategoryCardProps {
  data: DsaCategoryVM;
  onClick?: () => void;
}

export interface DsaFilterBarProps {
  options: DsaFilterOptionsVM;
  selected: {
    difficulty: string;
    status: string;
    category: string;
    platform: string;
    sortBy: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onSearchChange: (query: string) => void;
  onClear: () => void;
}

export interface DsaProgressChartProps {
  data: DsaProgressVM;
}

// ---------------------------------------------------------------------------
// 5. PROJECTS COMPONENT PROPS
// ---------------------------------------------------------------------------

export interface ProjectsStatsProps {
  data: ProjectsStatsVM;
}

export interface ProjectCardComponentProps {
  data: ProjectCardVM;
  onClick?: () => void;
}

export interface ProjectsGridProps {
  projects: ProjectCardVM[];
  onProjectClick?: (projectId: string) => void;
}

export interface ProjectsFilterBarProps {
  options: ProjectsFilterOptionsVM;
  selected: {
    status: string;
    visibility: string;
    language: string;
    sortBy: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onSearchChange: (query: string) => void;
  onClear: () => void;
}

export interface ProjectDetailViewProps {
  data: ProjectDetailVM;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface ProjectMilestoneListProps {
  milestones: ProjectMilestoneVM[];
  onMilestoneClick?: (milestoneId: string) => void;
}

export interface ProjectTaskBoardProps {
  tasks: ProjectTaskVM[];
  onTaskClick?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

// ---------------------------------------------------------------------------
// 6. SETTINGS COMPONENT PROPS
// ---------------------------------------------------------------------------

export interface SettingsProfileFormProps {
  data: SettingsProfileVM;
  onSave: (updates: Record<string, string>) => void;
  isSaving: boolean;
}

export interface SettingsPlatformListProps {
  platforms: SettingsPlatformVM[];
  onConnect: (platformId: string) => void;
  onDisconnect: (platformId: string) => void;
  onSync: (platformId: string) => void;
}

export interface SettingsPlatformCardProps {
  data: SettingsPlatformVM;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
}

export interface SettingsNotificationsFormProps {
  data: SettingsNotificationsVM;
  onToggle: (key: string, value: boolean) => void;
  isSaving: boolean;
}

export interface SettingsAppearanceFormProps {
  data: SettingsAppearanceVM;
  onChange: (key: string, value: string | boolean) => void;
  isSaving: boolean;
}

export interface SettingsPrivacyFormProps {
  data: SettingsPrivacyVM;
  onChange: (key: string, value: string | boolean) => void;
  isSaving: boolean;
}

export interface SettingsTabsProps {
  activeTab: string;
  tabs: { id: string; label: string; icon: string }[];
  onTabChange: (tabId: string) => void;
}

// ---------------------------------------------------------------------------
// 7. SKELETON / LOADING COMPONENT PROPS
// ---------------------------------------------------------------------------

export interface SkeletonCardProps {
  lines?: number;
  hasImage?: boolean;
  className?: string;
}

export interface SkeletonGridProps {
  columns?: number;
  rows?: number;
  cardLines?: number;
  className?: string;
}

export interface SkeletonHeatmapProps {
  weeks?: number;
  className?: string;
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// 8. SHARED / REUSABLE COMPONENT PROPS
// ---------------------------------------------------------------------------

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export interface BadgeProps {
  label: string;
  color?: string;
  variant?: 'solid' | 'outline' | 'subtle';
  size?: 'sm' | 'md';
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: {
    id: string;
    label: string;
    icon?: string;
    onClick: () => void;
    danger?: boolean;
  }[];
  isOpen: boolean;
  onToggle: () => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export interface SelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}
