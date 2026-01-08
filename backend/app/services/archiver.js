import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Create a ZIP archive of processed files
 * @param {Array} files - Array of file paths to archive
 * @returns {Promise<string>} Path to created archive
 */
export async function createArchive(files) {
  return new Promise((resolve, reject) => {
    const archivePath = path.join(
      __dirname,
      '../../uploads',
      `archive-${Date.now()}.zip`
    )

    const output = fs.createWriteStream(archivePath)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    output.on('close', () => {
      resolve(archivePath)
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)

    // Add files to archive
    files.forEach(filename => {
      const filePath = path.join(__dirname, '../../uploads', filename)
      archive.file(filePath, { name: filename })
    })

    archive.finalize()
  })
}
