# Smart Student Attendance System - Design Guidelines

## Design Approach
**System-Based Approach**: Drawing from modern productivity tools like Linear, Notion, and Asana to create a clean, efficient interface optimized for daily professor workflow.

## Core Design Principles
1. **Information Clarity**: Dense data presented with clear hierarchy and breathing room
2. **Workflow Efficiency**: Minimize clicks; common actions readily accessible
3. **Professional Minimalism**: Clean, uncluttered interface that feels polished and trustworthy

## Typography System

**Font Stack**: Inter (via Google Fonts) for its excellent readability at all sizes

**Hierarchy**:
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Captions/Meta: text-sm text-muted-foreground
- Stats/Numbers: text-2xl font-bold (for dashboard metrics)

## Layout & Spacing System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 for consistency
- Component padding: p-4 or p-6
- Section gaps: space-y-6 or space-y-8
- Card spacing: gap-4
- Form fields: space-y-4

**Layout Structure**:
- Two-column dashboard: 280px fixed sidebar + flexible main content area
- Sidebar: Fixed navigation with sections for Dashboard, Students, Attendance, Reports
- Main content: max-w-7xl mx-auto with px-6 py-8 padding
- Cards: Rounded corners (rounded-lg), subtle shadows for depth

## Component Library

### Navigation Sidebar
- Fixed left sidebar with logo/app name at top
- Navigation items with icons (using Heroicons)
- Active state with subtle background treatment
- User profile section at bottom with professor name/photo

### Dashboard Layout
- Stats cards grid: 4 columns on desktop (grid-cols-4), responsive to 2 cols on tablet, 1 on mobile
- Each stat card: Icon, large number, label, and trend indicator
- Quick action buttons prominently placed
- Recent activity feed with student avatars

### Student Management
- Student roster: Table view with alternating row treatment
- Each row: Student photo (40x40 rounded-full), name, ID, email, quick actions
- "Add Student" button: Primary CTA positioned top-right
- Search bar with filter dropdowns (by status, date enrolled)

### Add/Edit Student Form
- Modal overlay or dedicated page with form container (max-w-2xl)
- Photo upload area: Large dropzone (200x200) with preview
- Form fields in single column, full-width inputs
- Save/Cancel buttons: Primary + ghost button pair

### Attendance Tracking Interface
- Date selector prominently at top
- Student list with large touchable rows for quick marking
- Each student row: Photo, name, 4 status buttons (Present/Absent/Late/Excused)
- Selected status highlighted with checkmark
- Optional notes: Expandable textarea below each student (collapsed by default)
- Bulk actions: "Mark all present" quick action button

### Attendance History/Reports
- Filterable table with sorting capabilities
- Columns: Date, Student, Status, Notes, Added by
- Export button: Top-right with download icon
- Date range picker for filtering
- Visual status indicators: Badges with distinct shapes

### Student Detail View
- Header: Large student photo (120x120), name, ID, email
- Tabs for: Attendance History, Statistics, Edit Profile
- Attendance history: Timeline-style view with dates and statuses
- Statistics card: Attendance rate, total classes, breakdown by status

## Form Components
- Input fields: Clean border, focus ring, rounded-md
- Labels: font-medium mb-2
- Required indicators: Asterisk in label
- Error states: Red border with error message below (text-sm)
- Dropdowns: Native selects styled to match inputs
- Textareas: Min height of 100px for notes

## Table Components
- Header row: Sticky, medium font weight
- Row hover: Subtle background change
- Zebra striping for easier scanning
- Pagination: Bottom-right with page numbers + prev/next

## Button Hierarchy
- Primary actions: Solid buttons with medium padding (px-6 py-2.5)
- Secondary: Outline buttons
- Destructive: Red treatment for delete actions
- Icon buttons: Square (40x40) for quick actions in rows

## Card Components
- Container: Rounded corners, border or subtle shadow
- Padding: p-6 for content
- Header: Border bottom or distinct background
- Sections within cards: Separated by dividers or spacing

## Images
No hero image required - this is a utility application, not marketing. Student photos are functional elements displayed as:
- Avatar circles (40px in lists, 120px in detail view)
- Upload preview in forms (200x200)
- All images: object-cover with proper aspect ratio constraints

## Data Visualization
- Attendance rate charts: Simple progress bars or donut charts
- Trend indicators: Arrow icons with percentage changes
- Color coding for status (semantic, not decorative)

## Responsive Behavior
- Desktop-first approach (primary use case)
- Tablet: Sidebar collapses to icon-only
- Mobile: Hamburger menu, single column layouts, simplified tables (card view)

## Animation Guidelines
Minimal, purposeful animations only:
- Smooth transitions on hover states (150ms)
- Modal/drawer entrance: Slide-in with fade (200ms)
- Success confirmations: Brief checkmark animation
- NO page transitions, NO scroll animations

## Accessibility
- Keyboard navigation throughout
- Focus indicators on all interactive elements
- Proper ARIA labels for icons-only buttons
- High contrast ratios for text
- Form validation with clear error messages