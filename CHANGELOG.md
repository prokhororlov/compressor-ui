# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-01-09

### Added
- **Electron Desktop App** - Cross-platform desktop application for Windows, macOS, and Linux
- **DISABLE_LIMITS mode** - Option to disable rate limiting and file size restrictions for local development
- **Bundled FFmpeg** - FFmpeg binaries included via ffmpeg-static for video processing
- **Auto-cleanup on startup** - Uploads directory cleared when running in Electron mode
- **GitHub Actions CI/CD** - Automated builds and releases for all platforms

### Changed
- Backend now supports running inside Electron with proper path resolution
- Frontend detects Electron mode and adjusts limits accordingly
- Improved file deletion with retry logic for Windows file locking issues

### Fixed
- Windows file locking issues when deleting processed files
- Path resolution for uploads directory in packaged Electron app

## [1.0.0] - 2026-01-09

### Added
- Initial release
- **Image Processing** - PNG, JPG, WebP, AVIF conversion and optimization using Sharp
- **SVG Optimization** - Vector graphics optimization using SVGO
- **Video Processing** - MP4, WebM, MOV, MKV, and GIF output using FFmpeg
- **Drag-and-Drop Interface** - React-based web UI
- **Batch Processing** - Handle up to 50 images per batch
- **Per-File Options** - Override global settings for individual files
- **Size Reporting** - Before/after comparisons with savings calculations
- **Automatic Cleanup** - Processed files expire after 10 minutes
- **Security Features** - Rate limiting, file validation, security headers
