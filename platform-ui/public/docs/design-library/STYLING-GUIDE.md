# Design Library Styling Guide

## Sci-Fi / Tech Font Style Implementation

This guide explains how to use the custom sci-fi/tech styling for your Design Library section.

---

## 🎨 Style Overview

The styling replicates the futuristic, geometric font design with:
- **Angular, blocky letterforms** using Orbitron and Rajdhani fonts
- **Consistent stroke width** and squared-off corners
- **Tech/industrial aesthetic** with gray color scheme
- **Glowing effects** and animated borders
- **Responsive design** for all screen sizes

---

## 📦 Files Created

1. **`design-library-styles.css`** - Complete stylesheet with all tech-style classes
2. **`example.html`** - Working demonstration of all styling options
3. **`STYLING-GUIDE.md`** - This usage guide

---

## 🚀 Quick Start

### Option 1: HTML Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="design-library-styles.css">
</head>
<body class="design-library-container">
    <h1 class="design-library-title">Design Library</h1>
    <!-- Your content here -->
</body>
</html>
```

### Option 2: React/JSX Implementation

```jsx
import './design-library-styles.css';

function DesignLibrary() {
  return (
    <div className="design-library-container">
      <h1 className="design-library-title">Design Library</h1>
      {/* Your content here */}
    </div>
  );
}
```

### Option 3: Markdown with Custom CSS

Add this to your markdown renderer or documentation tool:

```html
<link rel="stylesheet" href="docs/design-library/design-library-styles.css">
```

---

## 🎯 Available Classes

### Main Container
```html
<div class="design-library-container">
  <!-- All content goes here -->
</div>
```
- Dark gradient background
- Full viewport height
- Proper padding and spacing

### Title Styles

#### Standard Title
```html
<h1 class="design-library-title">Design Library</h1>
```
- Large, bold, uppercase
- Wide letter spacing
- Glowing text shadow effect

#### Alternative Title (with line break)
```html
<div class="design-library-title-alt">
  Sci-Fi / Tech<br>
  Fonts
</div>
```
- Multi-line support
- Slightly smaller than standard
- Perfect for "Category / Subcategory" format

### Section Headers
```html
<h2 class="design-library-section-header">Platform Overview</h2>
```
- Medium size, uppercase
- Bottom border accent
- Glowing effect on hover

### Subsection Headers
```html
<h3 class="design-library-subsection">System Architecture</h3>
```
- Smaller than section headers
- Uppercase with moderate spacing
- Clean, technical look

### Body Text
```html
<p class="design-library-text">
  Your content here...
</p>
```
- Readable font size
- Proper line height
- Light gray color for contrast

### Cards
```html
<div class="design-library-card">
  <h3 class="design-library-subsection">Card Title</h3>
  <p class="design-library-text">Card content...</p>
</div>
```
- Dark background with border
- Hover effects (lift and glow)
- Perfect for feature highlights

### Links
```html
<a href="#" class="design-library-link">Read More →</a>
```
- Uppercase styling
- Animated underline on hover
- Glowing text effect

### Buttons
```html
<button class="design-library-button">Get Started</button>
```
- Bold, uppercase text
- Hover effect (inverted colors)
- Lift animation on hover

### Badges
```html
<span class="design-library-badge">Version 1.0.0</span>
```
- Small, compact design
- Border and shadow effects
- Perfect for tags and labels

### Tables
```html
<table class="design-library-table">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```
- Tech-styled headers
- Hover effects on rows
- Clean, readable layout

### Code Blocks
```html
<pre class="design-library-code">
{
  "example": "code"
}
</pre>
```
- Dark background
- Green text (terminal style)
- Accent border on left

### Animated Border Effect
```html
<div class="design-library-border-effect">
  <p>Content with pulsing border...</p>
</div>
```
- Pulsing glow animation
- Draws attention to important content
- Subtle, professional effect

---

## 🎨 Utility Classes

### Text Alignment
```html
<div class="tech-text-center">Centered text</div>
<div class="tech-text-left">Left-aligned text</div>
<div class="tech-text-right">Right-aligned text</div>
```

### Text Effects
```html
<span class="tech-glow-effect">Glowing text</span>
<span class="tech-uppercase">Uppercase text</span>
```

### Letter Spacing
```html
<span class="tech-spacing-wide">Wide spacing</span>
<span class="tech-spacing-normal">Normal spacing</span>
```

---

## 🎨 Color Scheme

The styling uses CSS variables for easy customization:

```css
:root {
  --tech-primary: #6b7280;      /* Main gray */
  --tech-secondary: #4b5563;    /* Darker gray */
  --tech-accent: #9ca3af;       /* Light gray accent */
  --tech-bg: #1f2937;           /* Dark background */
  --tech-bg-light: #374151;     /* Lighter background */
  --tech-glow: rgba(107, 114, 128, 0.3); /* Glow effect */
}
```

To customize colors, override these variables in your own CSS:

```css
:root {
  --tech-primary: #your-color;
  --tech-accent: #your-accent;
}
```

---

## 📱 Responsive Design

The styles automatically adjust for mobile devices:
- Titles scale down on smaller screens
- Proper spacing maintained
- Touch-friendly button sizes
- Readable text at all sizes

---

## 🔤 Fonts Used

The styling imports three Google Fonts:

1. **Orbitron** - Main tech/sci-fi font for titles and headers
2. **Rajdhani** - Supporting font for body text and subtitles
3. **Audiowide** - Alternative tech font (available but not used by default)

These fonts are loaded automatically from Google Fonts CDN.

---

## 💡 Usage Examples

### Example 1: Documentation Page
```html
<div class="design-library-container">
  <h1 class="design-library-title">Design Library</h1>
  
  <h2 class="design-library-section-header">Getting Started</h2>
  <p class="design-library-text">
    Welcome to the design library...
  </p>
  
  <div class="design-library-card">
    <h3 class="design-library-subsection">Quick Start</h3>
    <p class="design-library-text">Follow these steps...</p>
    <button class="design-library-button">Begin</button>
  </div>
</div>
```

### Example 2: Feature Showcase
```html
<div class="design-library-container">
  <div class="design-library-title-alt">
    Platform<br>
    Features
  </div>
  
  <div class="design-library-card">
    <h3 class="design-library-subsection">AI Agents</h3>
    <span class="design-library-badge">8 Agents</span>
    <span class="design-library-badge">Production Ready</span>
    <p class="design-library-text">Specialized AI agents...</p>
    <a href="#" class="design-library-link">Learn More →</a>
  </div>
</div>
```

### Example 3: Status Dashboard
```html
<div class="design-library-container">
  <h1 class="design-library-title">System Status</h1>
  
  <div class="design-library-border-effect">
    <h3 class="design-library-subsection tech-text-center">
      All Systems Operational
    </h3>
    <p class="design-library-text tech-text-center">
      Last updated: 2025-12-17
    </p>
  </div>
  
  <table class="design-library-table">
    <thead>
      <tr>
        <th>Service</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>API Gateway</td>
        <td><span class="design-library-badge">Online</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 🔧 Customization Tips

### Change Background
```css
.design-library-container {
  background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}
```

### Adjust Font Sizes
```css
.design-library-title {
  font-size: 5rem; /* Larger */
}
```

### Modify Glow Intensity
```css
:root {
  --tech-glow: rgba(107, 114, 128, 0.6); /* Stronger glow */
}
```

### Add Custom Animations
```css
@keyframes yourAnimation {
  /* Your keyframes */
}

.your-element {
  animation: yourAnimation 2s ease-in-out infinite;
}
```

---

## 📝 Best Practices

1. **Use the container class** - Always wrap content in `design-library-container`
2. **Maintain hierarchy** - Use title → section → subsection → text structure
3. **Don't overuse effects** - Glowing and animations work best when used sparingly
4. **Test responsiveness** - Check on mobile devices
5. **Combine classes** - Mix utility classes with main classes for flexibility
6. **Keep it readable** - Don't sacrifice readability for style

---

## 🎬 View the Demo

Open [`example.html`](example.html) in your browser to see all styles in action!

---

## 📚 Integration with Existing Docs

To apply these styles to your existing Design Library markdown files:

1. Add the CSS link to your markdown renderer
2. Wrap sections with appropriate class divs
3. Use HTML blocks in markdown where needed
4. Consider creating a custom markdown template

---

## 🆘 Troubleshooting

**Fonts not loading?**
- Check internet connection (fonts load from Google CDN)
- Verify CSS file is properly linked
- Check browser console for errors

**Styles not applying?**
- Ensure CSS file path is correct
- Check for CSS conflicts with existing styles
- Verify class names are spelled correctly

**Responsive issues?**
- Test on actual devices, not just browser resize
- Check viewport meta tag is present
- Verify no conflicting media queries

---

## 📄 License

These styles are part of the WestPlant Operations Application Design Library.
© 2025 WestPlant Operations Application Team. All rights reserved.

---

**Questions or Issues?**
Contact the platform team or submit feedback through the issue tracker.
