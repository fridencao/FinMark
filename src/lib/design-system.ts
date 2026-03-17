/**
 * FinMark Design System
 *
 * This file documents the standardized design patterns used across the application.
 * All pages and components should follow these conventions for consistency.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary actions
  primary: 'indigo-600',
  primaryHover: 'indigo-700',

  // Success/positive actions
  success: 'emerald-600',
  successHover: 'emerald-700',

  // Danger/destructive actions
  danger: 'rose-600',
  dangerHover: 'rose-700',

  // Warning/caution
  warning: 'amber-500',

  // Information
  info: 'blue-500',

  // Neutral
  neutral: 'slate-600',
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Page titles (main headings)
  pageTitle: 'text-3xl font-bold',

  // Section titles
  sectionTitle: 'text-xl font-bold',

  // Card titles
  cardTitle: 'text-lg font-semibold',

  // Body text
  body: 'text-base',

  // Small text (labels, hints)
  small: 'text-sm',

  // Tiny text (captions, metadata)
  tiny: 'text-xs',
};

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const buttons = {
  // Primary action button
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl',

  // Secondary action button
  secondary: 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl',

  // Destructive action button
  destructive: 'bg-rose-600 hover:bg-rose-700 text-white rounded-xl',

  // Ghost button (minimal styling)
  ghost: 'hover:bg-slate-100 text-slate-600 rounded-xl',

  // Icon button
  icon: 'w-10 h-10 rounded-xl',

  // Small button
  sm: 'h-8 px-3 rounded-xl',

  // Standard button padding
  padding: 'px-4 py-2',
};

// ============================================================================
// CARD STYLES
// ============================================================================

export const cards = {
  // Standard card
  default: 'rounded-2xl border border-slate-200 bg-white shadow-sm',

  // Card padding
  padding: 'p-6',

  // Card header
  header: 'border-b border-slate-100 pb-4 mb-4',

  // Card title
  title: 'text-lg font-semibold text-slate-900',

  // Card description
  description: 'text-sm text-slate-500',
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  // Section spacing (vertical gap between major sections)
  section: 'space-y-6',

  // Grid gap (gap between items in a grid)
  grid: 'gap-4',

  // Form field gap
  form: 'space-y-4',

  // Inline gap (horizontal gap between inline elements)
  inline: 'gap-3',
};

// ============================================================================
// LAYOUT PATTERNS
// ============================================================================

export const layout = {
  // Page container
  page: 'container mx-auto p-6 space-y-6',

  // Header with title and actions
  header: 'flex items-center justify-between',

  // Two panel layout (sidebar + content)
  twoPanel: 'flex gap-6',

  // Grid layouts
  grid2: 'grid grid-cols-2 gap-4',
  grid3: 'grid grid-cols-3 gap-4',
  grid4: 'grid grid-cols-4 gap-4',
};

// ============================================================================
// COMPONENT PATTERNS
// ============================================================================

export const components = {
  // Input fields
  input: 'rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500',

  // Select dropdowns
  select: 'rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500',

  // Table
  table: 'rounded-xl border border-slate-200',

  // Badge
  badge: 'rounded-full px-2.5 py-0.5 text-xs font-medium',

  // Avatar
  avatar: 'rounded-full',

  // Dialog
  dialog: 'rounded-2xl',

  // Tabs
  tabs: 'rounded-xl',
};

// ============================================================================
// ANIMATION
// ============================================================================

export const animation = {
  // Standard transition
  transition: 'transition-all duration-200',

  // Hover scale
  hoverScale: 'hover:scale-105',

  // Hover lift
  hoverLift: 'hover:-translate-y-0.5',
};

// ============================================================================
// QUICK REFERENCE - Common Combinations
// ============================================================================

/**
 * Primary action button with icon
 * Usage: <Button className={design.primaryAction}>
 */
export const primaryAction = `${buttons.primary} ${buttons.padding} inline-flex items-center gap-2`;

/**
 * Secondary action button
 * Usage: <Button variant="outline" className={design.secondaryAction}>
 */
export const secondaryAction = `${buttons.secondary} ${buttons.padding} inline-flex items-center gap-2`;

/**
 * Stat card (for dashboard metrics)
 * Usage: <Card className={design.statCard}>
 */
export const statCard = `${cards.default} ${cards.padding} flex items-center gap-4`;

/**
 * Action card (clickable card with hover effect)
 * Usage: <Card className={design.actionCard}>
 */
export const actionCard = `${cards.default} ${cards.padding} cursor-pointer hover:shadow-md transition-shadow`;

/**
 * Page header pattern
 * Usage: <div className={design.pageHeader}>
 */
export const pageHeader = `${layout.header} mb-6`;
