import { optimize } from 'svgo'
import fs from 'fs/promises'
import path from 'path'

/**
 * Optimize SVG files using SVGO
 * @param {Array} files - Array of uploaded SVG files
 * @param {Object} options - Processing options
 * @returns {Array} Results with optimized file info
 */
export async function optimizeSVGs(files, options = {}) {
  const results = []

  // Extract SVG-specific options
  const {
    precision = 2,
    removeViewBox = false,
    cleanupIDs = true
  } = options

  // Build SVGO config based on options
  const svgoConfig = {
    floatPrecision: precision,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // Keep viewBox for proper scaling unless user wants to remove it
            removeViewBox: removeViewBox,
            // Clean up IDs if enabled
            cleanupIds: cleanupIDs
          }
        }
      }
    ]
  }

  for (const file of files) {
    try {
      const originalSize = (await fs.stat(file.path)).size
      const svgContent = await fs.readFile(file.path, 'utf8')

      // Optimize SVG
      const result = optimize(svgContent, svgoConfig)

      // Get original filename without extension and keep it
      const baseFilename = path.basename(file.originalname, path.extname(file.originalname))
      const outputFilename = baseFilename + '.svg'
      const outputPath = path.join(path.dirname(file.path), outputFilename)

      // Write optimized SVG
      await fs.writeFile(outputPath, result.data, 'utf8')

      const optimizedSize = (await fs.stat(outputPath)).size
      const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2)

      // Clean up original file if different from output
      if (file.path !== outputPath) {
        await fs.unlink(file.path)
      }

      results.push({
        name: file.originalname,
        originalSize,
        processedFiles: [{
          format: 'svg',
          filename: outputFilename,
          size: optimizedSize,
          savings
        }],
        status: 'success'
      })

    } catch (error) {
      console.error(`Error optimizing ${file.originalname}:`, error)
      results.push({
        name: file.originalname,
        status: 'error',
        error: error.message
      })
    }
  }

  return results
}
