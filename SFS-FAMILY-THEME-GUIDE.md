# SFS FAMILY THEME GUIDE
## Complete Guide for AI Agents Building SmartFlow Systems Applications

**CRITICAL**: All SmartFlow Systems (SFS) applications MUST use this EXACT theme. NO BLUE colors allowed!

---

## 🎨 BRAND IDENTITY

**SmartFlow Systems Family Theme:**
- **Luxury aesthetic**: Sparkling gold against dark marble brown-tinted black
- **NO BLUE**: This is the SFS family brand - gold/brown/black ONLY
- **Glassmorphism**: Semi-transparent surfaces with backdrop blur and gold borders
- **Circuit Flow**: Golden animated nodes with physics-based connections (background canvas)
- **Dark-first**: No light mode - luxury aesthetic requires dark backgrounds

---

## 📋 EXACT COLOR PALETTE

### Hex Colors (Use these exactly)
```css
--sf-black: #0D0D0D           /* Marble black - primary background */
--sf-brown: #3B2F2F           /* Brown - surface overlays */
--sf-gold: #FFD700            /* Primary gold - main accent */
--sf-gold-bright: #FFDD00     /* Bright gold variant */
--sf-gold-2: #E6C200          /* Gold hover state */
--sf-beige: #F5F5DC           /* Text on dark backgrounds */
--sf-white: #FFFFFF           /* Highlights and emphasis */
```

### HSL Semantic Tokens (shadcn/ui compatible)
```css
/* Primary = Gold (NOT blue!) */
--primary: 51 100% 50%;                 /* SFS Gold */
--primary-foreground: 0 0% 5%;          /* Black text on gold */

/* Backgrounds */
--background: 0 0% 5%;                  /* Marble black */
--foreground: 48 10% 98%;               /* Beige/white text */
--card: 0 0% 8%;                        /* Card background */
--card-foreground: 48 10% 98%;
--card-border: 51 50% 25%;              /* Gold-tinted border */

/* Secondary = Brown */
--secondary: 30 15% 18%;                /* SFS Brown */
--secondary-foreground: 48 10% 98%;

/* Accent = Gold hover state */
--accent: 51 91% 45%;                   /* Gold-2 */
--accent-foreground: 0 0% 5%;

/* Borders */
--border: 45 15% 20%;                   /* Brown-tinted borders */
--input: 45 15% 25%;
--ring: 51 100% 50%;                    /* Gold focus ring */

/* Chart Colors - Gold palette (NO blue/purple/pink!) */
--chart-1: 51 100% 50%;                 /* Gold */
--chart-2: 51 91% 45%;                  /* Gold-2 */
--chart-3: 45 100% 40%;                 /* Darker gold */
--chart-4: 30 15% 18%;                  /* Brown */
--chart-5: 48 56% 91%;                  /* Beige */

/* Status Colors (keep these for clarity) */
status: {
  operational: "hsl(142 76% 36%)",      /* Green */
  degraded: "hsl(43 96% 56%)",          /* Yellow */
  down: "hsl(0 84% 60%)",               /* Red */
}
```

---

## 🔮 GLASSMORPHISM SYSTEM

### Variables
```css
--sf-blur: 12px;                                    /* Card backdrop blur */
--sf-blur-panel: 16px;                              /* Panel backdrop blur */
--glass-bg: rgba(59, 47, 47, 0.4);                  /* Semi-transparent brown */
--glass-border: rgba(255, 215, 0, 0.15);            /* Gold border */
--glass-glow: rgba(255, 215, 0, 0.15);              /* Gold hover glow */
```

### CSS Classes (Add these to your index.css)
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--sf-blur));
  -webkit-backdrop-filter: blur(var(--sf-blur));
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px 0 rgba(13, 13, 13, 0.37);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 12px 48px 0 rgba(255, 215, 0, 0.15);
}

.glass-panel {
  background: rgba(13, 13, 13, 0.6);
  backdrop-filter: blur(var(--sf-blur-panel));
  -webkit-backdrop-filter: blur(var(--sf-blur-panel));
  border: 1px solid rgba(255, 215, 0, 0.25);
}

.glass-header {
  background: rgba(13, 13, 13, 0.8);
  backdrop-filter: blur(var(--sf-blur));
  -webkit-backdrop-filter: blur(var(--sf-blur));
  border-bottom: 1px solid var(--glass-border);
}

.text-gold-gradient {
  background: linear-gradient(135deg, var(--sf-gold), var(--sf-gold-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## ✨ ELEVATION SYSTEM

```css
--elevate-1: rgba(255, 215, 0, 0.06);   /* Gold tint */
--elevate-2: rgba(255, 215, 0, 0.14);
--button-outline: rgba(255, 215, 0, .15);
--badge-outline: rgba(255, 215, 0, .10);
```

**Usage:**
```tsx
<Card className="hover-elevate active-elevate-2">
  {/* Content with gold tint on hover/active */}
</Card>
```

---

## 🌊 CIRCUIT FLOW ANIMATION

### Implementation
1. **Add canvas to HTML:**
```html
<body>
  <canvas id="sfs-circuit"></canvas>
  <div id="root"></div>
  <script src="/sfs-circuit-flow.js"></script>
</body>
```

2. **CSS for canvas:**
```css
#sfs-circuit {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  opacity: 0.4;
}
```

3. **Copy the circuit-flow script from:** `SmartFlowSite/sfs-circuit-flow.js`

**Features:**
- 35 golden animated nodes
- Physics-based movement with edge bouncing
- Dynamic connection lines between nearby nodes (150px threshold)
- Auto-pauses when tab inactive (performance optimization)
- Golden color (#FFD700) at 60% opacity

---

## 🎯 TYPOGRAPHY

### Font Stack
```css
--font-sans: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
--font-serif: Georgia, serif;
--font-mono: 'Fira Code', 'JetBrains Mono', Menlo, monospace;
```

### Typography Hierarchy
```tsx
// Page Titles
<h1 className="text-4xl md:text-6xl font-bold">Hero Title</h1>

// Section Headers
<h2 className="text-3xl md:text-4xl font-bold">Section Header</h2>

// Subsection
<h3 className="text-2xl font-semibold">Subsection</h3>

// Card Title
<h4 className="text-lg font-medium">Card Title</h4>

// Body Text
<p className="text-base">Normal body text</p>

// Labels
<label className="text-sm font-medium">Form Label</label>

// Caption/Meta
<span className="text-xs text-muted-foreground">Caption</span>
```

---

## 📐 LAYOUT PATTERNS

### Container Strategy
```tsx
// Dashboard pages
<div className="max-w-7xl mx-auto px-6">

// Public pages
<div className="max-w-5xl mx-auto px-6">

// Section padding
<section className="py-12 md:py-20 lg:py-24">
```

### Glass Header Pattern
```tsx
<header className="sticky top-0 z-50 w-full border-b bg-background/95
  backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="container mx-auto flex h-16 items-center justify-between px-4">
    {/* Logo left */}
    <Link href="/">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-primary rounded-md" />
        <span className="text-xl font-bold">App Name</span>
      </div>
    </Link>

    {/* Actions right */}
    <div className="flex items-center gap-4">
      <Button variant="outline">Action</Button>
    </div>
  </div>
</header>
```

### Card Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {items.map((item) => (
    <Card key={item.id} className="glass-card hover-elevate">
      <CardHeader>
        <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>{/* Content */}</CardContent>
    </Card>
  ))}
</div>
```

---

## 🎨 TAILWIND CONFIG

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem", // 9px
        md: ".375rem",  // 6px
        sm: ".1875rem", // 3px
      },
      colors: {
        // SFS Brand Colors
        'sf-black': '#0D0D0D',
        'sf-brown': '#3B2F2F',
        'sf-gold': '#FFD700',
        'sf-gold-bright': '#FFDD00',
        'sf-gold-2': '#E6C200',
        'sf-beige': '#F5F5DC',

        // Status colors
        status: {
          operational: "hsl(142 76% 36%)",
          degraded: "hsl(43 96% 56%)",
          down: "hsl(0 84% 60%)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["Georgia", "serif"],
        mono: ["Fira Code", "JetBrains Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## 📦 REQUIRED FILES FROM SMARTFLOWSITE

Copy these files from the SmartFlowSite repository:

### Theme Files (REQUIRED)
1. **`sfs-complete-theme.css`** - All CSS variables and theme tokens
2. **`sfs-circuit-flow.js`** - Golden circuit flow animation
3. **`sfs-globals.css`** - Global resets and base styles
4. **`sfs-theme-config.json`** - Configuration values

### Reference Files
5. **`SFS-DESIGN-SYSTEM.md`** - Complete design specifications
6. **`tailwind.config.cjs`** - Tailwind configuration
7. **`tailwind.smartflow.preset.cjs`** - SmartFlow-specific preset

---

## 🔧 IMPLEMENTATION CHECKLIST

When building a new SFS app:

- [ ] Copy `sfs-complete-theme.css` to your project
- [ ] Copy `sfs-circuit-flow.js` to `/public/`
- [ ] Add canvas element to HTML: `<canvas id="sfs-circuit"></canvas>`
- [ ] Update `index.css` with ALL color variables above
- [ ] Add glassmorphism CSS classes to `index.css`
- [ ] Add elevation utilities to `index.css`
- [ ] Update `tailwind.config.ts` with SFS colors
- [ ] Set `--background: 0 0% 5%` (black, not white!)
- [ ] Set `--primary: 51 100% 50%` (GOLD, not blue!)
- [ ] Set font families (Inter, Fira Code, Georgia)
- [ ] Load Inter font from Google Fonts
- [ ] Add circuit flow canvas styling
- [ ] Test dark-first theme (no light mode)
- [ ] Verify NO BLUE colors anywhere
- [ ] Add gold gradient text utility
- [ ] Test glassmorphism effects
- [ ] Verify circuit animation works
- [ ] Check gold focus rings on inputs
- [ ] Verify gold hover states on buttons

---

## ⚠️ CRITICAL RULES

### DO NOT:
- ❌ Use blue colors anywhere
- ❌ Use purple, pink, or teal in charts
- ❌ Implement light mode (dark-first only)
- ❌ Use hardcoded colors (always use CSS variables)
- ❌ Skip the circuit flow animation
- ❌ Use flat cards (always use glassmorphism)

### ALWAYS:
- ✅ Use gold (#FFD700) as primary color
- ✅ Use brown-tinted black (#0D0D0D) background
- ✅ Add backdrop-blur to headers/cards
- ✅ Include circuit flow canvas
- ✅ Use elevation system for hover states
- ✅ Keep status colors (green/yellow/red) for clarity
- ✅ Match SmartFlowSite exactly

---

## 🎯 BRAND CONSISTENCY

All SFS applications share:
1. **Same color palette** (gold/brown/black)
2. **Same glassmorphism effects** (blur + gold borders)
3. **Same circuit flow animation** (golden nodes)
4. **Same typography** (Inter, Fira Code, Georgia)
5. **Same elevation system** (gold tints on hover)
6. **Same design philosophy** (luxury, productivity-focused, dark-first)

---

## 📚 EXAMPLES FROM SFS-STATUS-PAGE

See these files in `sfs-status-page` for reference implementation:
- `/client/src/index.css` - Complete theme CSS
- `/client/index.html` - Canvas setup
- `/client/public/sfs-circuit-flow.js` - Circuit animation
- `/tailwind.config.ts` - Tailwind config
- `/CLAUDE.md` - Full documentation

---

## 🔗 SMARTFLOWSITE REPOSITORY

GitHub: `https://github.com/smartflow-systems/SmartFlowSite`

All theme files are in the root directory.

---

**Last Updated**: 2025-11-15
**Theme Version**: SFS Family v1.0
**Status**: Production-ready ✅

Copy this entire guide when starting any new SFS application!
