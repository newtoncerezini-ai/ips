---
name: Institutional Clarity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 280px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for executive oversight and regional progress tracking. It adopts a **Corporate Modern** aesthetic that prioritizes data density without sacrificing legibility. The style is characterized by expansive white space, a structured information hierarchy, and a restrained use of color to ensure that critical Social Progress Index (IPS) metrics remain the focal point.

The target audience—government officials, researchers, and policy makers—requires an environment that feels authoritative, transparent, and precise. The UI avoids decorative elements, favoring functional minimalism where every line and margin serves a purpose in the interpretation of complex socio-economic data.

## Colors
The palette is rooted in a "Deep Professional Blue" for primary interactions and navigation, conveying stability and institutional trust. 

- **Primary (#0F172A):** Used for sidebar backgrounds, primary headings, and high-emphasis UI states.
- **Secondary (#0EA5E9):** A light azure used for data accents, active navigation states, and primary action buttons.
- **Neutral / Background (#F8FAFC):** The canvas is predominantly white and off-white to maximize contrast for data visualizations.
- **Semantic Accents:** Use standard success (Emerald), warning (Amber), and error (Rose) tokens specifically for IPS performance indicators (above or below targets).

## Typography
**Inter** is the exclusive typeface for this design system, chosen for its exceptional legibility in data-heavy contexts. 

- **Display & Headlines:** Used for municipality names and aggregate IPS scores. These use tighter letter spacing and bold weights to create a strong visual anchor.
- **Body:** Optimized for descriptive text and metadata.
- **Labels:** Small, uppercase, and slightly tracked-out for table headers and chart legends to distinguish them from primary content.
- **Numerical Data:** For tables and charts, utilize the "tabular num" OpenType feature of Inter to ensure digits align vertically for easier comparison.

## Layout & Spacing
The design system employs a **Fixed Grid** model for large screens to ensure consistent dashboard layouts, transitioning to a fluid stack for mobile devices.

- **Dashboard Structure:** A persistent 280px sidebar on the left houses primary navigation. The main content area uses a 12-column grid with 24px gutters.
- **Executive Spacing:** Generous 32px outer margins create a "breathing room" effect, preventing the information from feeling overwhelming.
- **Alignment:** All data cards and chart containers must align to the grid. Use 8px base units for all internal component padding (e.g., 16px, 24px, 32px).

## Elevation & Depth
This design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to maintain a clean, professional finish.

- **Background:** The base layer is `#F8FAFC`.
- **Containers:** Data cards and tables sit on pure `#FFFFFF` surfaces.
- **Borders:** Surfaces are defined by a subtle 1px border (`#E2E8F0`) to create separation.
- **Subtle Elevation:** Only the primary "active" elements or dropdown menus may use a very soft, diffused shadow (Blur: 12px, Y: 4px, Color: rgba(15, 23, 42, 0.05)) to suggest interactivity.

## Shapes
The design system utilizes **Soft** geometry. A standard radius of 4px (0.25rem) is applied to all UI elements to strike a balance between modern friendliness and professional rigor.

- **Small Components:** Checkboxes and small buttons use a 4px radius.
- **Data Cards:** Larger containers use an 8px (0.5rem) radius for a slightly softer appearance that differentiates them from the page background.
- **Charts:** Bar charts and heatmaps should use slight rounding on top edges (2px) to avoid a harsh "brutalist" look.

## Components
Consistent styling across data-centric components ensures a unified user experience.

- **Sidebar:** Dark theme (`#0F172A`). Nav items use a ghost style with a 2px light azure left-border for the active state.
- **Data Cards:** Pure white backgrounds with a title row in `label-md` and the primary metric in `display-lg`. Include a small trend indicator (sparkline or percentage change) in the footer.
- **Tables:** No vertical borders. Use 1px horizontal dividers (`#F1F5F9`). The header row should be slightly tinted (`#F8FAFC`) with `label-md` typography.
- **Input Fields:** Minimalist design with a 1px border. Focus state uses a 2px secondary azure ring with no offset.
- **Charts:** Use a refined palette of blues and grays. Data points should have distinct hover states with tooltips that follow the "Soft" shape language.
- **Breadcrumbs:** Use `body-sm` in `tertiary` color for secondary navigation cues within the municipality hierarchy.