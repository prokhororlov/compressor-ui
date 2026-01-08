import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execPromise = promisify(exec)

/**
 * Check if ImageMagick is installed
 * @returns {Promise<boolean>}
 */
export async function isImageMagickAvailable() {
  try {
    await execPromise('convert -version')
    return true
  } catch (error) {
    console.warn('ImageMagick not found. Using Sharp for all image processing.')
    return false
  }
}

/**
 * Process images using ImageMagick (for formats Sharp doesn't support well)
 * This is a fallback/enhancement for specific formats like TIFF, PSD, etc.
 * @param {Array} files - Array of uploaded files
 * @param {Object} options - Processing options
 * @returns {Array} Results with processed file info
 */
export async function processWithImageMagick(files, options) {
  const available = await isImageMagickAvailable()
  if (!available) {
    throw new Error('ImageMagick is not installed on this system')
  }

  const {
    quality = 80,
    resize = 100,
    formats = ['webp']
  } = options

  const results = []

  for (const file of files) {
    try {
      const originalSize = (await fs.stat(file.path)).size
      const processedFiles = []

      for (const format of formats) {
        const outputFilename = path.basename(
          file.filename,
          path.extname(file.filename)
        ) + '.' + format

        const outputPath = path.join(
          path.dirname(file.path),
          outputFilename
        )

        // Build ImageMagick command
        let command = `convert "${file.path}"`

        // Apply resize if needed
        if (resize !== 100) {
          command += ` -resize ${resize}%`
        }

        // Apply quality
        command += ` -quality ${quality}`

        // Output format
        command += ` "${outputPath}"`

        // Execute ImageMagick
        await execPromise(command)

        const processedSize = (await fs.stat(outputPath)).size
        const savings = ((originalSize - processedSize) / originalSize * 100).toFixed(2)

        processedFiles.push({
          format,
          filename: outputFilename,
          size: processedSize,
          savings
        })
      }

      // Clean up original file
      await fs.unlink(file.path)

      results.push({
        name: file.originalname,
        originalSize,
        processedFiles,
        status: 'success',
        processor: 'ImageMagick'
      })

    } catch (error) {
      console.error(`Error processing ${file.originalname} with ImageMagick:`, error)
      results.push({
        name: file.originalname,
        status: 'error',
        error: error.message
      })
    }
  }

  return results
}

/**
 * Formats that ImageMagick handles better than Sharp
 */
export const IMAGEMAGICK_PREFERRED_FORMATS = [
  '.tiff', '.tif',
  '.psd',
  '.eps',
  '.ai',
  '.pdf', // Rasterization
  '.heic', '.heif' // Some systems
]

/**
 * Check if file should use ImageMagick
 * @param {string} filename
 * @returns {boolean}
 */
export function shouldUseImageMagick(filename) {
  const ext = path.extname(filename).toLowerCase()
  return IMAGEMAGICK_PREFERRED_FORMATS.includes(ext)
}
