# Media Toolkit

> Server-side media processing toolkit with drag-and-drop web interface for batch image and video optimization

A production-grade media processing system that runs 100% locally using Node.js. No cloud services, no uploads to third parties, complete control over your media files.

## Features

- **Image Processing**: PNG, JPG, WebP, AVIF conversion and optimization using Sharp
- **Video Processing**: MP4 encoding and compression using FFmpeg
- **Drag-and-Drop Interface**: Intuitive React-based web UI
- **Local Processing**: Everything runs on your machine
- **Batch Processing**: Handle multiple files at once
- **Size Reporting**: Before/after comparisons with savings calculations
- **Real-time Progress**: Watch your files being processed
- **Download Results**: Get processed files as a ZIP archive

## Prerequisites

**Required:**

- Node.js >= 18.0.0
- FFmpeg (for video processing)

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

## Installation

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Or install manually
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Quick Start

### Development Mode

Start both frontend and backend in development mode:

```bash
# Build frontend and start backend
npm run dev

# Or run separately in different terminals:
npm run dev:frontend  # Frontend at http://localhost:5173
npm run dev:backend   # Backend at http://localhost:3001
```

### Production Mode

```bash
# Build frontend
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3001`

## Usage

1. **Open the Web Interface**
   - Navigate to `http://localhost:3001` (production) or `http://localhost:5173` (development)

2. **Select Processing Mode**
   - Choose between Image Processing or Video Processing

3. **Configure Options**
   - **Images**: Set quality (1-100), resize percentage, output formats (WebP, PNG, JPG, AVIF)
   - **Videos**: Set format (MP4), resize percentage, bitrate, preset, audio options

4. **Add Files**
   - Drag and drop files onto the drop zone
   - Or click to browse and select files

5. **Process**
   - Click "Process Files"
   - Watch real-time progress
   - View file-by-file results

6. **Download**
   - Download individual files or all results as a ZIP

## Image Processing Options

- **Quality**: 1-100 (default: 80) - Controls compression level
- **Resize**: 1-100 (default: 100) - Percentage of original size
- **Formats**: WebP, PNG, JPG, AVIF - Generate multiple formats from single source

**Example Use Case:**
- Upload high-res photos at 100% quality
- Process at 80% quality, 75% size, WebP + JPG formats
- Get web-optimized images with fallback format

## Video Processing Options

- **Format**: MP4 (H.264 codec)
- **Resize**: 1-100 (default: 100) - Percentage of original size
- **Bitrate**: e.g., "2M", "1500k" - Controls output quality/size
- **Preset**:
  - `web`: Balanced (default) - Good for websites
  - `quality`: High quality - Larger files, better visuals
  - `fast`: Quick encoding - Smaller files, lower quality
- **Audio**: Enable/disable audio track

**Example Use Case:**
- Upload raw video footage
- Process at 75% size, "web" preset, 2M bitrate
- Get web-optimized MP4 ready for embedding

## Project Structure

```
media-toolkit/
├── backend/              # Express server
│   ├── app/
│   │   ├── index.js     # Server entry point
│   │   ├── routes/      # API routes
│   │   └── services/    # Processing logic (Sharp, FFmpeg)
│   ├── uploads/         # Temporary file storage
│   └── package.json
├── frontend/            # React web UI
│   ├── src/
│   │   ├── App.jsx     # Main application
│   │   ├── components/ # React components
│   │   └── main.jsx    # Entry point
│   ├── public/         # Static assets
│   └── package.json
├── package.json        # Root workspace config
└── README.md          # This file
```

## Technology Stack

**Backend:**
- Express.js - Web server
- Sharp - Image processing
- Fluent-FFmpeg - Video processing
- Multer - File upload handling
- Archiver - ZIP file generation

**Frontend:**
- React - UI framework
- Vite - Build tool and dev server
- Tailwind CSS - Styling
- JSZip - Client-side ZIP handling

## Format Comparison

### Images

| Format | Quality | File Size | Use Case |
|--------|---------|-----------|----------|
| **WebP** | Excellent | Small | Modern web (97%+ browser support) |
| **AVIF** | Excellent | Smallest | Cutting-edge (92%+ support) |
| **JPG** | Good | Medium | Photos, universal support |
| **PNG** | Lossless | Large | Graphics, logos, transparency |

**Recommendation:** Generate WebP + JPG for maximum compatibility

### Videos

Currently supports MP4 (H.264) which offers:
- Universal browser support
- Good compression
- Hardware acceleration
- Configurable quality presets

## API Endpoints

**POST** `/api/process/images`
- Body: `multipart/form-data`
- Fields: `files[]`, `quality`, `resize`, `formats[]`
- Returns: Processed image files

**POST** `/api/process/video`
- Body: `multipart/form-data`
- Fields: `file`, `format`, `resize`, `bitrate`, `preset`, `audio`
- Returns: Processed video file

**GET** `/api/download/:filename`
- Downloads a processed file

**POST** `/api/download/zip`
- Body: `{ filenames: string[] }`
- Returns: ZIP archive of processed files

## Development

```bash
# Run frontend dev server (with HMR)
npm run dev:frontend

# Run backend dev server
npm run dev:backend

# Build frontend for production
npm run build

# Run production build
npm start
```

## Troubleshooting

### FFmpeg Not Found
```bash
# Verify FFmpeg installation
ffmpeg -version

# If missing, install it (see Prerequisites section)
```

### Port Already in Use
- Frontend default: 5173 (Vite auto-increments if taken)
- Backend default: 3001 (change in `backend/app/index.js`)

### Large File Uploads
- Default limit: 500MB per file
- Adjust in `backend/app/index.js` if needed

### AVIF Support
- Requires recent version of Sharp with libvips/libheif support
- Included by default in Sharp npm package

## Performance Notes

**Image Processing:**
- PNG/JPG: ~0.5-1s per image
- WebP: ~1-2s per image
- AVIF: ~3-5s per image (CPU intensive)

**Video Processing:**
- Depends on: file size, duration, resolution, preset
- `web` preset: ~1-1.5x real-time speed
- `quality` preset: ~0.5-1x real-time speed
- `fast` preset: ~2-3x real-time speed

## License

MIT License - Use freely in personal and commercial projects.

## Built With

- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [FFmpeg](https://ffmpeg.org/) - Complete video processing solution
- [React](https://react.dev/) - UI framework
- [Express](https://expressjs.com/) - Web server
- [Vite](https://vitejs.dev/) - Frontend build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

**Built for developers and content creators who need reliable, local media processing without cloud dependencies.**
