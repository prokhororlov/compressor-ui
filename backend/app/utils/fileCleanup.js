import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// File expiry time in milliseconds (10 minutes, matching frontend)
const FILE_EXPIRY_MS = 10 * 60 * 1000

// Cleanup interval (run every minute)
const CLEANUP_INTERVAL_MS = 60 * 1000

const uploadsDir = path.join(__dirname, '../../uploads')

/**
 * Clean up expired files from the uploads directory
 * Files older than FILE_EXPIRY_MS will be deleted
 */
async function cleanupExpiredFiles() {
  try {
    // Ensure uploads directory exists
    try {
      await fs.access(uploadsDir)
    } catch {
      // Directory doesn't exist, nothing to clean
      return { cleaned: 0, errors: 0 }
    }

    const files = await fs.readdir(uploadsDir)
    const now = Date.now()
    let cleaned = 0
    let errors = 0

    for (const file of files) {
      const filePath = path.join(uploadsDir, file)

      try {
        const stats = await fs.stat(filePath)

        // Skip directories
        if (stats.isDirectory()) continue

        // Check if file is expired (based on modification time)
        const fileAge = now - stats.mtimeMs

        if (fileAge > FILE_EXPIRY_MS) {
          await fs.unlink(filePath)
          cleaned++
          console.log(`[Cleanup] Deleted expired file: ${file} (age: ${Math.round(fileAge / 1000)}s)`)
        }
      } catch (err) {
        errors++
        console.error(`[Cleanup] Error processing file ${file}:`, err.message)
      }
    }

    if (cleaned > 0 || errors > 0) {
      console.log(`[Cleanup] Completed: ${cleaned} files deleted, ${errors} errors`)
    }

    return { cleaned, errors }
  } catch (err) {
    console.error('[Cleanup] Error during cleanup:', err.message)
    return { cleaned: 0, errors: 1 }
  }
}

/**
 * Start the automatic file cleanup scheduler
 */
function startCleanupScheduler() {
  console.log(`[Cleanup] Starting file cleanup scheduler (interval: ${CLEANUP_INTERVAL_MS / 1000}s, expiry: ${FILE_EXPIRY_MS / 1000}s)`)

  // Run cleanup immediately on startup
  cleanupExpiredFiles()

  // Schedule periodic cleanup
  const intervalId = setInterval(cleanupExpiredFiles, CLEANUP_INTERVAL_MS)

  // Return cleanup function for graceful shutdown
  return () => {
    clearInterval(intervalId)
    console.log('[Cleanup] File cleanup scheduler stopped')
  }
}

export { cleanupExpiredFiles, startCleanupScheduler, FILE_EXPIRY_MS }
