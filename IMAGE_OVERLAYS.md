# 🎨 Image Overlays & Watermarking Guide

This guide covers all available transformations, parameters, positioning options, and usage examples for **image and video overlays** in Openinary.

Overlays allow you to layer images (such as brand logos, watermarks, badges, or protective patterns) onto base images or videos dynamically via URL parameters or programmatic SDK calls.

---

## ⚡ Quick Start Example

```http
GET /t/l_watermark.png,lo_50,lw_150,lh_50,lg_southeast,lx_20,ly_20/sample.jpg
```

This request takes `sample.jpg`, applies `watermark.png` at **50% opacity**, resizes the watermark to **150x50 pixels**, anchors it to the **bottom-right corner (southeast)**, and offsets it **20 pixels** from the edges.

---

## 🛠️ Complete Overlay Parameter Reference

| Parameter | URL Key | TypeScript Key | Type / Range | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Layer Path** | `l_<path>` | `overlayPath` | String | *Required* | File path of the overlay image. Colons (`:`) convert to slashes (`/`). |
| **Opacity** | `lo_<0-100>` | `overlayOpacity` | Integer (`0` to `100`) | `50` | Transparency level (0 = completely transparent, 100 = fully opaque). |
| **Width** | `lw_<px>` | `overlayWidth` | Integer / `auto` | Original width | Target width of the overlay before composition. |
| **Height** | `lh_<px>` | `overlayHeight` | Integer / `auto` | Original height | Target height of the overlay before composition. |
| **Gravity** | `lg_<gravity>`| `overlayGravity` | `FullGravityMode` | `center` | Anchor alignment position on the base image/video. |
| **X Offset** | `lx_<val>` | `overlayXOffset` | Integer (px) or Percentage (`20p`, `0.2`) | `0` | Horizontal offset in pixels or relative percentage of image width. |
| **Y Offset** | `ly_<val>` | `overlayYOffset` | Integer (px) or Percentage (`20p`, `0.2`) | `0` | Vertical offset in pixels or relative percentage of image height. |
| **Tiled Pattern** | `lt_<bool>` | `overlayTiled` | Boolean (`true`, `1`) | `false` | Repeats the overlay across the entire canvas. |
| **Tile Spacing** | `ls_<px>` | `overlayTileSpacing` | Integer (px) | `0` | Spacing in pixels between repeated tiled overlays. |

> **Note**: If custom offsets are specified, both `lx` and `ly` must be provided together.

---

## 🧭 Gravity Positioning Modes (`lg`)

The `lg` parameter determines where the overlay is anchored relative to the base image canvas.

```text
┌─────────────────────────────────────────┐
│ Northwest     North           Northeast │
│  (nw, top_left) (n, top)    (ne, top_right)│
│                                         │
│ West          Center               East │
│  (w, left)    (c, center)    (e, right) │
│                                         │
│ Southwest     South           Southeast │
│  (sw, bot_left) (s, bottom) (se, bot_right)│
└─────────────────────────────────────────┘
```

### Supported Values

| Gravity Mode | URL Aliases | Description |
| :--- | :--- | :--- |
| **Northwest** | `northwest`, `north_west`, `top_left`, `nw` | Top-left corner |
| **North** | `north`, `north_center`, `top`, `top_center`, `n` | Top-center |
| **Northeast** | `northeast`, `north_east`, `top_right`, `ne` | Top-right corner |
| **West** | `west`, `west_center`, `center_left`, `w` | Middle-left side |
| **Center** | `center`, `c` | Center of the canvas |
| **East** | `east`, `east_center`, `center_right`, `e` | Middle-right side |
| **Southwest** | `southwest`, `south_west`, `bottom_left`, `sw` | Bottom-left corner |
| **South** | `south`, `south_center`, `bottom`, `bottom_center`, `s` | Bottom-center |
| **Southeast** | `southeast`, `south_east`, `bottom_right`, `se` | Bottom-right corner |

---

## 💡 Practical Examples

### 1. Photo Watermarking (Bottom-Right Badge)
Overlay a translucent logo watermark at 40% opacity in the bottom-right corner with a 15px margin:
```http
GET /t/l_brand:watermark.png,lo_40,lw_120,lg_se,lx_15,ly_15/photo.jpg
```

### 2. Centered Logo Overlay
Place a logo squarely in the center of a product image:
```http
GET /t/l_logo.png,lw_200,lh_200,lg_center/product.png
```

### 3. Tiled Security Watermarking
Repeat a small semi-transparent watermark pattern across the entire image to prevent unauthorized reuse:
```http
GET /t/l_copyright.png,lo_15,lt_true,ls_40/preview-document.jpg
```

### 4. Video Watermarking
Add a persistent brand logo overlay to the top-right corner of a video:
```http
GET /t/l_tv-logo.png,lo_80,lw_100,lg_ne,lx_20,ly_20/stream.mp4
```

---

## 💻 Programmatic Usage (TypeScript / Node.js)

When working directly with Openinary core services or shared packages, pass overlay parameters via `OverlayTransformParams`:

```typescript
import { ImageTransformParams } from "@openinary/shared";

const transformOptions: ImageTransformParams = {
  width: 1200,
  height: 800,
  format: "webp",
  // Overlay Configuration
  overlayPath: "assets/watermark.png",
  overlayOpacity: 60,
  overlayWidth: 180,
  overlayGravity: FullGravityMode.SOUTHEAST,
  overlayXOffset: 20,
  overlayYOffset: 20,
};
```

---

## 🔒 Security & Best Practices

1. **Path Normalization**: Directory traversal sequences (`..`) in `l_<path>` are stripped automatically for security.
2. **File Formats**: PNGs with transparency (alpha channels) are recommended for clean watermarks.
3. **Offset Coupling**: Always specify `lx` and `ly` together to avoid layout alignment errors.
