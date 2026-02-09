# Quick Setup Guide

## Installation (5 minutes)

### 1. Plugin is Ready!
The plugin has been built and is ready to use. Files generated:
- ✅ `code.js` - Compiled plugin code
- ✅ `manifest.json` - Plugin metadata
- ✅ `ui.html` - Plugin UI

### 2. Import into Figma Desktop

1. **Open Figma Desktop App** (not web browser - plugins require desktop app)

2. **Go to Plugins Menu:**
   - Menu → Plugins → Development → Import plugin from manifest...

3. **Select manifest.json:**
   - Navigate to: `C:\projects\bannerforge\figma-plugin\manifest.json`
   - Click "Open"

4. **Plugin Installed!** You should see "BannerForge Export" in your development plugins

### 3. Run the Plugin

1. **Open any Figma file** (or create a new one)

2. **Create a frame:**
   - Press `F` (frame tool)
   - Draw a frame or use preset sizes:
     - 728×90 (Leaderboard)
     - 300×250 (Medium Rectangle)
     - 160×600 (Wide Skyscraper)

3. **Add content to your frame:**
   - Rectangles, circles, text, images, etc.

4. **Run the plugin:**
   - Right-click on canvas → Plugins → Development → BannerForge Export
   - OR Menu → Plugins → Development → BannerForge Export

5. **Select frames and export:**
   - Check the frames you want to export
   - Click "Export X Frames"
   - JSON file will download automatically

### 4. Import into BannerForge

**Option A: Manual import (for now)**
1. Open the downloaded JSON file
2. You'll see the complete structure with all layers and images

**Option B: Automated import (next step)**
We'll build an import dialog in BannerForge that reads this JSON format.

## What Gets Exported?

✅ **Frames** - Width, height, background color  
✅ **Shapes** - Rectangles, circles with fills & strokes  
✅ **Text** - Full typography (font, size, weight, color, alignment)  
✅ **Images** - Image fills as base64  
✅ **Vectors** - Rasterized as PNG @2x quality  
✅ **Positioning** - Relative to frame  
✅ **Effects** - Opacity, rotation, blend modes  
✅ **Nested layers** - Groups and frames processed recursively  



## Troubleshooting

**Plugin not appearing?**
- Make sure you're using Figma Desktop App (not web)
- Check: Menu → Plugins → Development (should show BannerForge Export)

**Export button disabled?**
- You need to create at least one FRAME (not just shapes on canvas)
- Press `F` to use frame tool

**No frames found?**
- Make sure you're on a page with frames
- Groups are not frames - use the frame tool (`F`)

**JSON download not working?**
- Check browser console for errors (Right-click plugin → Inspect)
- Make sure popup blockers aren't blocking the download

## Development

**Make changes to the plugin:**
```bash
cd figma-plugin
# Edit code.ts or ui.html
npm run build  # Auto-rebuilds on save
# In Figma: Plugins → Development → Reload plugin
```

**View logs:**
- Plugin code (`code.ts`): Figma → Help → Toggle Developer Tools
- UI code (`ui.html`): Right-click plugin → Inspect
