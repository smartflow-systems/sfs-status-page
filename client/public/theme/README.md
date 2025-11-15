# 🌟 SFS Family Theme

Luxurious gold & marble design system for SmartFlow family products.

## # Overview

The SFS Family Theme provides a stunning, premium aesthetic with:
- **Sparkling gold accents** on dark marble backgrounds
- **Glassmorphism effects** with frosted glass cards and gold borders
- **Golden circuit-flow animation** as an animated background
- **Smooth transitions** with "Crickit flow" easing curves
- **Fully responsive** mobile-first design

## # Color Palette

### ## Core Colors
- **Black**: `#0a0908` - Deep marble black base
- **Brown**: `#1c1917` - Warm brown tones
- **Gold**: `#d4af37` - Luxurious primary gold
- **Gold Light**: `#f4e4c1` - Soft champagne
- **Gold Dark**: `#b8962e` - Rich darker gold
- **Beige**: `#f5f1e8` - Warm cream for text
- **White**: `#fefefe` - Pure white highlights

### ## Usage
```css
/* Use CSS variables */
color: var(--sf-gold);
background: var(--sf-black);
border-color: var(--sf-brown);
```

## # Files Included

### ## 1. sfs-complete-theme.css
Complete design system with:
- All color variables
- Glassmorphism components
- Elevation utilities
- Button styles
- Status indicators
- Typography
- Animations

### ## 2. sfs-circuit-flow.js
Animated golden circuit background:
- Auto-initializes on page load
- Draws flowing golden circuits
- Pulsing nodes with glow effects
- Responsive to window resize
- Performance-optimized

### ## 3. sfs-globals.css
Foundation styles:
- CSS reset
- Scrollbar styling
- Selection colors
- Focus states
- Base typography

### ## 4. sfs-theme-config.json
Configuration values:
- Color definitions
- Spacing scale
- Border radius
- Animation timings
- Circuit flow settings

## # Quick Start

### ## 1. Add to HTML

```html
<!DOCTYPE html>
<html>
<head>
  <!-- # Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- # SFS Theme Stylesheets -->
  <link rel="stylesheet" href="/theme/sfs-globals.css" />
  <link rel="stylesheet" href="/theme/sfs-complete-theme.css" />
</head>
<body class="marble-bg">
  <!-- # Circuit Flow Canvas -->
  <canvas id="sfs-circuit"></canvas>

  <!-- # Your Content -->
  <div id="root"></div>

  <!-- # Circuit Animation Script -->
  <script src="/theme/sfs-circuit-flow.js"></script>
</body>
</html>
```

### ## 2. Use Glass Cards

```html
<div class="glass-card">
  <h2>Luxurious Card</h2>
  <p>With frosted glass effect and gold borders</p>
</div>
```

### ## 3. Add Gold Buttons

```html
<button class="btn-gold">
  Click Me
</button>

<button class="btn-glass">
  Glass Button
</button>
```

### ## 4. Status Badges

```html
<span class="status-operational">
  Operational
</span>

<span class="status-degraded">
  Degraded
</span>

<span class="status-down">
  Down
</span>
```

## # Component Classes

### ## Glass Cards
```css
.glass-card         /* Frosted glass with gold border */
.glass-panel        /* Larger glass surface */
.glass-header       /* Sticky header with blur */
```

### ## Buttons
```css
.btn-gold           /* Primary gold gradient button */
.btn-glass          /* Glass effect button */
```

### ## Elevation
```css
.hover-elevate      /* Gold glow on hover */
.active-elevate     /* Elevation on click */
.gold-glow          /* Subtle gold shadow */
.gold-glow-strong   /* Intense gold shadow */
```

### ## Typography
```css
.text-gold          /* Gold gradient text */
.accent-gold        /* Gold accent color */
```

### ## Utilities
```css
.border-gold        /* Gold border */
.bg-gold            /* Gold background */
.gradient-gold      /* Gold gradient */
.marble-bg          /* Marble texture overlay */
```

## # Tailwind Integration

The theme also provides Tailwind utility classes:

```html
<!-- Glass Card -->
<div class="glass-card-tw">
  Content
</div>

<!-- Gold Button -->
<button class="btn-gold-tw">
  Click
</button>

<!-- Status Badges -->
<span class="status-operational-tw">
  Operational
</span>

<!-- Gold Text Gradient -->
<h1 class="text-gold-gradient">
  Premium Heading
</h1>
```

## # Circuit Flow Configuration

Customize the golden circuit animation:

```javascript
// Access the circuit flow instance
const circuit = window.SFSCircuitFlow;

// Or create custom instance
new SFSCircuitFlow('my-canvas-id');
```

Edit `sfs-theme-config.json` to change:
- Line color and width
- Node size and glow
- Animation speed
- Grid spacing

## # Animations

### ## Built-in Animations
```css
.animate-fade-in       /* Fade in from below */
.animate-shimmer       /* Gold shimmer effect */
.animate-pulse-glow    /* Pulsing gold glow */
```

### ## Custom Animation
```css
@keyframes myAnimation {
  from { opacity: 0; }
  to { opacity: 1; }
}

.my-element {
  animation: myAnimation 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## # Responsive Breakpoints

The theme is mobile-first:

```css
/* Mobile: Base styles */
.glass-card {
  padding: 1rem;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .glass-card {
    padding: 1.5rem;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .glass-card {
    padding: 2rem;
  }
}
```

## # Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Backdrop-filter may need fallbacks for older browsers

## # Performance Tips

### ## 1. Optimize Circuit Animation
The circuit-flow canvas pauses when tab is hidden to save resources.

### ## 2. Use Will-Change Sparingly
```css
.animating-element {
  will-change: transform;
}
```

### ## 3. Reduce Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## # Examples

### ## Full Page Layout
```html
<body class="marble-bg">
  <canvas id="sfs-circuit"></canvas>

  <header class="glass-header">
    <h1 class="text-gold-gradient">SFS Status</h1>
  </header>

  <main>
    <div class="glass-card hover-elevate">
      <h2>Service Status</h2>
      <span class="status-operational">
        All Systems Operational
      </span>
    </div>
  </main>

  <script src="/theme/sfs-circuit-flow.js"></script>
</body>
```

### ## Hero Section
```html
<section class="glass-panel">
  <h1 class="text-gold-gradient">
    Premium Monitoring
  </h1>
  <p class="text-beige">
    Luxurious status pages for modern teams
  </p>
  <button class="btn-gold">
    Get Started
  </button>
</section>
```

## # Color Variables Reference

```css
/* CSS Variables */
--sf-black: #0a0908
--sf-brown: #1c1917
--sf-gold: #d4af37
--sf-gold-light: #f4e4c1
--sf-gold-dark: #b8962e
--sf-beige: #f5f1e8
--sf-white: #fefefe

/* Semantic Tokens */
--background: 30 4% 4%
--foreground: 40 60% 96%
--primary: 43 64% 52%
--border: 40 20% 25%
```

## # License

Part of the SFS Status Page project. See main LICENSE file.

---

**Built with ❤️ in luxurious gold**

Powered by SFS Family Theme 🌟
