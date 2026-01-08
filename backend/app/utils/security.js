import { fileTypeFromFile } from 'file-type'
import path from 'path'
import fs from 'fs/promises'

// Allowed MIME types for images
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml'
])

// Allowed MIME types for videos
const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',     // MOV
  'video/x-matroska',    // MKV
  'video/x-msvideo',     // AVI
  'video/x-flv',         // FLV
  'video/x-ms-wmv',      // WMV
  'video/x-m4v'          // M4V
])

// Allowed extensions (lowercase, with dot)
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.tif', '.svg'
])

const ALLOWED_VIDEO_EXTENSIONS = new Set([
  '.mp4', '.webm', '.mov', '.mkv', '.avi', '.flv', '.wmv', '.m4v'
])

// Maximum filename length (excluding extension)
const MAX_FILENAME_LENGTH = 200

// Dangerous patterns to strip from filenames
const DANGEROUS_PATTERNS = [
  /\x00/g,           // Null bytes
  /\.\./g,           // Directory traversal
  /[<>:"|?*]/g,      // Windows forbidden characters
  /[\x00-\x1f]/g,    // Control characters
  /^\.+/,            // Leading dots (hidden files)
  /\.+$/,            // Trailing dots
  /\s+$/,            // Trailing whitespace
  /^\s+/,            // Leading whitespace
]

/**
 * Sanitize a filename to prevent security issues
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed'
  }

  // Get base name and extension separately
  const ext = path.extname(filename).toLowerCase()
  let baseName = path.basename(filename, ext)

  // Apply dangerous pattern replacements
  for (const pattern of DANGEROUS_PATTERNS) {
    baseName = baseName.replace(pattern, '')
  }

  // Replace spaces with underscores
  baseName = baseName.replace(/\s+/g, '_')

  // Remove any remaining non-alphanumeric characters except underscore and hyphen
  baseName = baseName.replace(/[^a-zA-Z0-9_\-]/g, '')

  // Ensure we have a valid base name
  if (!baseName || baseName.length === 0) {
    baseName = 'file'
  }

  // Truncate to max length
  if (baseName.length > MAX_FILENAME_LENGTH) {
    baseName = baseName.substring(0, MAX_FILENAME_LENGTH)
  }

  return baseName + ext
}

/**
 * Validate that a filename doesn't contain path traversal attempts
 * @param {string} filename - Filename to validate
 * @returns {boolean} True if safe, false if dangerous
 */
export function isPathTraversalSafe(filename) {
  if (!filename || typeof filename !== 'string') {
    return false
  }

  // Check for null bytes
  if (filename.includes('\x00')) {
    return false
  }

  // Check for directory traversal patterns
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false
  }

  // Check for absolute paths (Windows and Unix)
  if (path.isAbsolute(filename)) {
    return false
  }

  // Verify the filename equals its basename (no directory components)
  if (path.basename(filename) !== filename) {
    return false
  }

  return true
}

/**
 * Validate that a file path stays within the allowed directory
 * @param {string} filePath - Full file path
 * @param {string} allowedDir - The directory the file should be within
 * @returns {boolean} True if safe
 */
export function isWithinDirectory(filePath, allowedDir) {
  const resolvedPath = path.resolve(filePath)
  const resolvedAllowedDir = path.resolve(allowedDir)

  return resolvedPath.startsWith(resolvedAllowedDir + path.sep) ||
         resolvedPath === resolvedAllowedDir
}

/**
 * Validate file type by checking magic bytes
 * @param {string} filePath - Path to the file
 * @param {string} type - Expected type: 'image' or 'video'
 * @returns {Promise<{valid: boolean, detectedType: string|null, error: string|null}>}
 */
export async function validateFileType(filePath, type) {
  try {
    // First check if the file exists
    await fs.access(filePath)

    // Get file extension
    const ext = path.extname(filePath).toLowerCase()

    // Handle SVG separately since file-type doesn't detect text-based formats
    if (ext === '.svg') {
      if (type !== 'image') {
        return { valid: false, detectedType: 'svg', error: 'SVG files are only allowed for image processing' }
      }
      // Basic SVG validation - check if it starts with SVG-like content
      const content = await fs.readFile(filePath, 'utf-8')
      const trimmedContent = content.trim().toLowerCase()

      // Check for valid SVG patterns
      if (trimmedContent.startsWith('<?xml') ||
          trimmedContent.startsWith('<svg') ||
          trimmedContent.includes('<svg')) {

        // Security check: look for dangerous SVG content
        const dangerousPatterns = [
          /<script[\s>]/i,
          /javascript:/i,
          /on\w+\s*=/i,  // onclick, onload, etc.
          /<foreignObject/i,
          /xlink:href\s*=\s*["'](?!#)/i  // External references (allow internal #refs)
        ]

        for (const pattern of dangerousPatterns) {
          if (pattern.test(content)) {
            return { valid: false, detectedType: 'svg', error: 'SVG contains potentially dangerous content' }
          }
        }

        return { valid: true, detectedType: 'image/svg+xml', error: null }
      }
      return { valid: false, detectedType: null, error: 'Invalid SVG file format' }
    }

    // Use file-type for binary formats
    const fileType = await fileTypeFromFile(filePath)

    if (!fileType) {
      return { valid: false, detectedType: null, error: 'Unable to determine file type' }
    }

    const { mime } = fileType

    if (type === 'image') {
      if (ALLOWED_IMAGE_MIMES.has(mime)) {
        return { valid: true, detectedType: mime, error: null }
      }
      return { valid: false, detectedType: mime, error: `File type ${mime} is not an allowed image format` }
    }

    if (type === 'video') {
      if (ALLOWED_VIDEO_MIMES.has(mime)) {
        return { valid: true, detectedType: mime, error: null }
      }
      return { valid: false, detectedType: mime, error: `File type ${mime} is not an allowed video format` }
    }

    return { valid: false, detectedType: mime, error: 'Unknown validation type' }

  } catch (error) {
    return { valid: false, detectedType: null, error: `Validation error: ${error.message}` }
  }
}

/**
 * Validate file extension against allowed extensions
 * @param {string} filename - Filename to check
 * @param {string} type - Expected type: 'image' or 'video'
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateExtension(filename, type) {
  const ext = path.extname(filename).toLowerCase()

  if (type === 'image') {
    if (ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
      return { valid: true, error: null }
    }
    return { valid: false, error: `Extension ${ext} is not an allowed image extension` }
  }

  if (type === 'video') {
    if (ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
      return { valid: true, error: null }
    }
    return { valid: false, error: `Extension ${ext} is not an allowed video extension` }
  }

  return { valid: false, error: 'Unknown validation type' }
}

/**
 * Validate and sanitize processing options
 * @param {any} options - Raw options object
 * @param {string} type - Type of processing: 'image' or 'video'
 * @returns {{valid: boolean, sanitized: Object, errors: string[]}}
 */
export function validateOptions(options, type) {
  const errors = []
  const sanitized = {}

  // Ensure options is an object
  if (typeof options !== 'object' || options === null) {
    return { valid: false, sanitized: {}, errors: ['Options must be an object'] }
  }

  // Common validations
  if (options.quality !== undefined) {
    const quality = parseInt(options.quality, 10)
    if (isNaN(quality) || quality < 1 || quality > 100) {
      errors.push('Quality must be a number between 1 and 100')
    } else {
      sanitized.quality = quality
    }
  }

  if (options.resize !== undefined) {
    const resize = parseInt(options.resize, 10)
    if (isNaN(resize) || resize < 1 || resize > 200) {
      errors.push('Resize percentage must be between 1 and 200')
    } else {
      sanitized.resize = resize
    }
  }

  if (options.resizeMode !== undefined) {
    if (!['percent', 'absolute'].includes(options.resizeMode)) {
      errors.push('Resize mode must be "percent" or "absolute"')
    } else {
      sanitized.resizeMode = options.resizeMode
    }
  }

  if (options.width !== undefined && options.width !== null) {
    const width = parseInt(options.width, 10)
    if (isNaN(width) || width < 1 || width > 10000) {
      errors.push('Width must be between 1 and 10000')
    } else {
      sanitized.width = width
    }
  }

  if (options.height !== undefined && options.height !== null) {
    const height = parseInt(options.height, 10)
    if (isNaN(height) || height < 1 || height > 10000) {
      errors.push('Height must be between 1 and 10000')
    } else {
      sanitized.height = height
    }
  }

  if (options.crop !== undefined) {
    if (!['none', 'cover'].includes(options.crop)) {
      errors.push('Crop mode must be "none" or "cover"')
    } else {
      sanitized.crop = options.crop
    }
  }

  // Image-specific validations
  if (type === 'image') {
    if (options.formats !== undefined) {
      if (!Array.isArray(options.formats)) {
        errors.push('Formats must be an array')
      } else {
        const allowedFormats = ['webp', 'avif', 'jpg', 'jpeg', 'png', 'svg']
        const invalidFormats = options.formats.filter(f => !allowedFormats.includes(f))
        if (invalidFormats.length > 0) {
          errors.push(`Invalid formats: ${invalidFormats.join(', ')}`)
        } else {
          sanitized.formats = options.formats
        }
      }
    }

    if (options.useImageMagick !== undefined) {
      sanitized.useImageMagick = Boolean(options.useImageMagick)
    }
  }

  // Video-specific validations
  if (type === 'video') {
    if (options.format !== undefined) {
      const allowedFormats = ['mp4', 'webm', 'mov', 'mkv', 'gif']
      if (!allowedFormats.includes(options.format)) {
        errors.push(`Invalid video format: ${options.format}`)
      } else {
        sanitized.format = options.format
      }
    }

    if (options.bitrate !== undefined) {
      // Validate bitrate format (e.g., "2M", "500K")
      if (!/^\d+[KMG]?$/i.test(options.bitrate)) {
        errors.push('Invalid bitrate format')
      } else {
        sanitized.bitrate = options.bitrate
      }
    }

    if (options.preset !== undefined) {
      const allowedPresets = ['web', 'quality', 'fast']
      if (!allowedPresets.includes(options.preset)) {
        errors.push(`Invalid preset: ${options.preset}`)
      } else {
        sanitized.preset = options.preset
      }
    }

    if (options.audio !== undefined) {
      sanitized.audio = Boolean(options.audio)
    }
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors
  }
}

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - String to parse
 * @param {Object} defaultValue - Default value if parsing fails
 * @returns {{success: boolean, data: Object, error: string|null}}
 */
export function safeJsonParse(jsonString, defaultValue = {}) {
  if (!jsonString || typeof jsonString !== 'string') {
    return { success: true, data: defaultValue, error: null }
  }

  try {
    const data = JSON.parse(jsonString)
    if (typeof data !== 'object' || data === null) {
      return { success: false, data: defaultValue, error: 'Parsed JSON is not an object' }
    }
    return { success: true, data, error: null }
  } catch (error) {
    return { success: false, data: defaultValue, error: `JSON parse error: ${error.message}` }
  }
}

/**
 * Generate a secure random filename
 * @param {string} originalName - Original filename
 * @returns {string} Secure filename with timestamp and random suffix
 */
export function generateSecureFilename(originalName) {
  const sanitized = sanitizeFilename(originalName)
  const ext = path.extname(sanitized).toLowerCase()
  const baseName = path.basename(sanitized, ext)

  // Generate timestamp and random components
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1e9).toString(36)

  return `${baseName}-${timestamp}-${random}${ext}`
}

// Export constants for external use
export const ALLOWED_TYPES = {
  IMAGE_MIMES: ALLOWED_IMAGE_MIMES,
  VIDEO_MIMES: ALLOWED_VIDEO_MIMES,
  IMAGE_EXTENSIONS: ALLOWED_IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS: ALLOWED_VIDEO_EXTENSIONS
}
