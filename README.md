# Wapuufy API

The community-powered Wapuu character library for [Wapuufy](https://wapuufy.com) — the AR + AI selfie camera app for WordPress events.

This repository hosts the global library of 2D and 3D Wapuu characters. Anyone can submit a Wapuu by opening a pull request.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| [`/v1/wapuus.json`](https://kdctek.github.io/wapuufy-api/v1/wapuus.json) | 2D Wapuu characters (PNG/SVG) |
| [`/v1/models.json`](https://kdctek.github.io/wapuufy-api/v1/models.json) | 3D Wapuu models (GLB/GLTF) for AR mode |

Base URL: `https://kdctek.github.io/wapuufy-api`

---

## How to Submit a 2D Wapuu

A 2D Wapuu is a flat character illustration (the classic Wapuu style).

### Requirements

- **Format**: PNG or SVG
- **Size**: At least 512x512px (PNG), or vector (SVG)
- **Max file size**: 2 MB
- **Background**: Transparent
- **License**: By submitting, you agree to license your Wapuu under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

### Steps

1. **Fork** this repository
2. **Add your image** to the `assets/wapuus/` folder
   - Name it with a unique slug: `my-event-wapuu.png` (lowercase, hyphens, no spaces)
3. **Add a row** to `wapuus.csv` with your Wapuu's details:

   | Field | Example |
   |-------|---------|
   | `id` | `my-event-wapuu` |
   | `wapuu.name` | `My Event Wapuu` |
   | `wapuu.src` | `https://kdctek.github.io/wapuufy-api/assets/wapuus/my-event-wapuu.png` |
   | `wapuu.url` | `https://my-event.wordcamp.org/` |
   | `wapuu.repository` | _(your GitHub repo, if any)_ |
   | `wapuu.mime_type` | `image/png` |
   | `author.name` | `Your Name` |
   | `author.url` | `https://your-site.com` |
   | `description` | `Wapuu for My Event 2026` |
   | `event` | `my-event-2026` _(optional)_ |
   | `tags` | `wordcamp,custom` _(optional)_ |

4. **Open a Pull Request** with a brief description of your Wapuu

That's it! Once merged, your Wapuu will appear in the Wapuufy app automatically (synced daily).

---

## How to Submit a 3D Wapuu Model

A 3D Wapuu is a character model used in the app's AR mode.

### Requirements

- **Format**: GLB (recommended) or GLTF
- **Max file size**: 50 MB
- **Polygon count**: Under 100K triangles recommended for mobile AR
- **Animations**: Embed animations in the GLB file (idle, happy, wave, etc.)
- **Thumbnail**: Include a preview PNG (512x512px)
- **License**: CC BY-SA 4.0

### Steps

1. **Fork** this repository
2. **Add your files** to `assets/models/`:
   - Model file: `my-wapuu.glb`
   - Thumbnail: `my-wapuu-thumb.png`
3. **Add a row** to `models.csv`:

   | Field | Example |
   |-------|---------|
   | `id` | `my-wapuu-3d` |
   | `name` | `My Wapuu` |
   | `model_url` | `https://kdctek.github.io/wapuufy-api/assets/models/my-wapuu.glb` |
   | `thumbnail_url` | `https://kdctek.github.io/wapuufy-api/assets/models/my-wapuu-thumb.png` |
   | `mime_type` | `model/gltf-binary` |
   | `animations` | `idle,happy,wave` |
   | `file_size` | `5242880` _(in bytes)_ |
   | `author.name` | `Your Name` |
   | `author.url` | `https://your-site.com` |
   | `description` | `A custom 3D Wapuu for AR mode` |
   | `license` | `CC-BY-SA-4.0` |

4. **Open a Pull Request**

---

## Schema Reference

### 2D Wapuu (wapuus.json)

```json
{
  "name": "original-wapuu",
  "wapuu": {
    "name": "Wapuu",
    "src": "https://kdctek.github.io/wapuufy-api/assets/wapuus/original-wapuu.png",
    "url": "https://ja.wordpress.org/",
    "repository": "https://github.com/jawordpressorg/wapuu",
    "mime_type": "image/png"
  },
  "author": {
    "name": "Kazuko Kaneuchi",
    "url": "https://twitter.com/mutsuking"
  },
  "description": "Original Wapuu",
  "event": "",
  "tags": ["original"]
}
```

### 3D Model (models.json)

```json
{
  "id": "default-wapuu-3d",
  "name": "Default Wapuu",
  "model_url": "https://kdctek.github.io/wapuufy-api/assets/models/default-wapuu.glb",
  "thumbnail_url": "https://kdctek.github.io/wapuufy-api/assets/models/default-wapuu-thumb.png",
  "mime_type": "model/gltf-binary",
  "animations": ["idle", "happy", "wave"],
  "file_size": 5242880,
  "author": {
    "name": "KDC",
    "url": "https://kdc.in"
  },
  "description": "The default 3D Wapuu for AR mode",
  "license": "CC-BY-SA-4.0"
}
```

---

## For Developers

### How it works

1. Contributors add images/models to `assets/` and rows to the CSV files
2. On merge to `main`, a GitHub Action converts the CSVs to JSON
3. The JSON files are deployed to GitHub Pages
4. The Wapuufy WordPress plugin syncs from these endpoints daily

### Local development

```bash
npm install
npm run build   # Converts CSVs → JSON in v1/
```

### Compatibility

The 2D Wapuu schema is fully compatible with the [jawordpressorg/wapuu-api](https://github.com/jawordpressorg/wapuu-api) format, with optional extra fields (`event`, `tags`) that the Wapuufy app uses.

---

## About Wapuufy

[Wapuufy](https://wapuufy.com) is a selfie camera app for the WordPress community. Take selfies with AR Wapuu characters or transform your face into a unique Wapuu portrait using AI — all at WordCamp events worldwide.

- App: [wapuufy.com](https://wapuufy.com)
- Backend: [wapuu.app](https://wapuu.app)
- Source: [github.com/kdctek/wapuufy](https://github.com/kdctek/wapuufy)

## License

Content (Wapuu images and models) is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Code is licensed under [GPL-2.0-or-later](https://www.gnu.org/licenses/gpl-2.0.html).
