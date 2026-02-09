# BannerForge Figma Plugin

Export Figma frames to BannerForge-compatible JSON format with all assets, styles, and typography.

## Features

- ✅ **No Rate Limits** - Runs locally in Figma with full access
- ✅ Export any frame from Figma
- ✅ Multi-frame batch export
- ✅ Complete layer hierarchy
- ✅ All typography (fonts, sizes, weights, alignment, spacing)
- ✅ Colors, fills, strokes, opacity
- ✅ Positioning (relative to frame)
- ✅ Rotation, effects, blend modes
- ✅ Image fills and assets (exported as base64)
- ✅ Vector shapes (rasterized to PNG @2x)
- ✅ Gradients (all types)
- ✅ Nested frames and groups
- ✅ Component instances (flattened)

## Installation

### Development Mode (Recommended)

1. **Build the plugin:**
   ```bash
   cd figma-plugin
   npm install
   npm run build
   ```

2. **Import in Figma:**
   - Open Figma Desktop App
   - Go to Menu → Plugins → Development → Import plugin from manifest...
   - Select `figma-plugin/manifest.json`

3. **Run the plugin:**
   - Right-click on canvas → Plugins → Development → BannerForge Export
   - Or use Menu → Plugins → Development → BannerForge Export

### Auto-rebuild during development

Run the TypeScript compiler in watch mode:
```bash
npm run build
```
This will automatically recompile `code.ts` → `code.js` when you make changes.

## Usage

1. **Create a frame in Figma** (standard banner sizes recommended):
   - 728×90 (Leaderboard)
   - 300×250 (Medium Rectangle)
   - 160×600 (Wide Skyscraper)
   - 320×50 (Mobile Banner)
   - Or any custom size

2. **Run the plugin** from Figma menu

3. **Select frames** to export (supports multi-select)

4. **Click "Export"** - a JSON file will be downloaded with:
   - Complete frame metadata
   - All layers with properties
   - Images embedded as base64
   - Typography and styles

5. **Import in BannerForge:**
   - Go to BannerForge web app
   - Click "Import from Figma Plugin"
   - Upload the downloaded JSON file

## Export Format

The plugin generates a JSON file with this structure:

```json
{
  "meta": {
    "pluginVersion": "1.0.0",
    "exportDate": "2026-02-08T...",
    "figmaFileKey": "abc123...",
    "figmaFileName": "My Design File"
  },
  "frames": [
    {
      "id": "123:456",
      "name": "Banner 728x90",
      "width": 728,
      "height": 90,
      "backgroundColor": "#FFFFFF",
      "nodes": [
        {
          "id": "123:457",
          "name": "Background",
          "type": "RECTANGLE",
          "x": 0,
          "y": 0,
          "width": 728,
          "height": 90,
          "rotation": 0,
          "opacity": 1,
          "fills": [...],
          "strokes": [...],
          ...
        },
        {
          "id": "123:458",
          "name": "Headline",
          "type": "TEXT",
          "characters": "Hello World",
          "fontSize": 24,
          "fontName": { "family": "Inter", "style": "Bold" },
          "fontWeight": 700,
          ...
        }
      ]
    }
  ],
  "images": {
    "imageHash123": "data:image/png;base64,...",
    "node_456": "data:image/png;base64,..."
  }
}
```

## Supported Node Types

| Figma Node Type | Export Method |
|----------------|---------------|
| RECTANGLE | Native properties (fills, strokes, corner radius) |
| ELLIPSE | Native properties (fills, strokes) |
| TEXT | Full typography + character data |
| VECTOR | Rasterized to PNG (@2x quality) |
| STAR | Rasterized to PNG |
| LINE | Rasterized to PNG |
| POLYGON | Rasterized to PNG |
| BOOLEAN_OPERATION | Rasterized to PNG |
| FRAME | Processed recursively (children exported) |
| GROUP | Processed recursively (children exported) |
| INSTANCE | Flattened (children exported) |
| COMPONENT | Flattened (children exported) |

## Advantages Over REST API

| Feature | Plugin | REST API |
|---------|--------|----------|
| Rate Limits | ✅ None | ❌ 15/min |
| Authentication | ✅ Not needed | ❌ Token required |
| Network Issues | ✅ None | ❌ Possible |
| CORS | ✅ N/A | ❌ Proxy needed |
| Access | ✅ Full document | ⚠️ Limited |
| Speed | ✅ Instant | ❌ Multiple requests |

## Limitations

- ✅ No rate limits (runs locally in Figma)
- ✅ No authentication needed
- ✅ Full access to all node properties
- ❌ Requires Figma Desktop App (web version has limited plugin support)
- ❌ Auto Layout constraints are not preserved (absolute positioning used)
- ❌ Animations/interactions are not exported
- ❌ Plugins/widgets are not included

## Development

### Project Structure

```
figma-plugin/
├── manifest.json       # Plugin metadata
├── code.ts            # Main plugin logic (TypeScript)
├── code.js            # Compiled output (generated)
├── ui.html            # Plugin UI
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
└── README.md          # This file
```

### Making Changes

1. Edit `code.ts` for plugin logic
2. Edit `ui.html` for UI changes
3. Run `npm run build` to compile
4. Reload plugin in Figma: Plugins → Development → Reload plugin

### Debugging

- Use `console.log()` in `code.ts` - logs appear in Figma Desktop console (Help → Toggle Developer Tools)
- Use `console.log()` in `ui.html` - logs appear in plugin UI console (right-click plugin → Inspect)

## Publishing (Future)

When ready to publish to Figma Community:

1. Update version in `manifest.json` and `package.json`
2. Test thoroughly with various frame types
3. Follow Figma's plugin publishing guidelines: https://www.figma.com/plugin-docs/publishing/

## Next steps and possible additions 

🔴 Critical Missing Data**

1. **Layer Clipping/Overflow** - Currently not exported
   - `node.clipsContent` (for frames)
   - Important for proper overflow:hidden rendering
   - Would prevent content from spilling outside containers

2. **Text Styling Gaps**
   - Missing: `textIndent`, `paragraphSpacing`, `paragraphIndent`
   - Missing: `textAutoResize` (important for dynamic sizing)
   - Missing: `textTruncation` (how text is cut off)
   - These affect text layout accuracy

3. **Layout Constraints** - Partially captured but not detailed
   - Currently just stored as `constraints?: any`
   - Should export specific horizontal/vertical constraint details
   - Critical for responsive behavior understanding

### **🟡 Medium Priority Enhancements**

4. **Blend Modes & Opacity Interactions**
   - Blend modes are exported, but layer compositing order might be lost
   - Consider exporting `isMask` property for masking layers
   - Export `isolateBlending` if needed

5. **Effects Details** - Currently just spread (`[...node.effects]`)
   - Should process effects more explicitly:
     - Drop shadows (x, y, blur, spread, color)
     - Inner shadows
     - Layer blur
     - Background blur
   - Would enable accurate shadow rendering in HTML/CSS

6. **Stroke Details**
   - Missing: `strokeCap`, `strokeJoin`, `strokeMiterLimit`
   - Missing: `dashPattern` for dashed strokes
   - Important for accurate border rendering

7. **Auto Layout Properties** (if Figma frames use it)
   - `layoutMode` (horizontal/vertical)
   - `layoutAlign`, `layoutGrow`
   - `padding`, `itemSpacing`
   - While you mention "absolute positioning used", having this data could help BannerForge understand designer intent

### **🟢 Nice-to-Have Additions**

8. **Export Settings Metadata**
   - Image compression quality info
   - Original vs exported dimensions
   - Would help with file size optimization

9. **Component/Instance Information**
   - Currently flattened - maybe preserve component name/key
   - Useful for debugging and understanding structure

10. **Text Baseline & Vertical Alignment**
    - More precise text positioning data
    - `textAlignVertical` is captured but baseline offset could help

11. **Frame Metadata**
    - `layoutGrids` (if designers use grids)
    - `guides` positions
    - Helpful for understanding structure intent

12. **Asset Optimization Flags**
    - Add flag to indicate if image should be compressed
    - Suggest optimal export format (PNG vs JPG vs WebP)
    - Could reduce final banner file sizes
