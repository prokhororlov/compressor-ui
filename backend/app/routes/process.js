import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { processImages } from '../services/imageProcessor.js'
import { processVideo } from '../services/videoProcessor.js'
import { createArchive } from '../services/archiver.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
})

// Process images endpoint
router.post('/images', upload.array('files', 50), async (req, res) => {
  try {
    const files = req.files
    const options = JSON.parse(req.body.options || '{}')

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const results = await processImages(files, options)

    res.json({
      success: true,
      results: results
    })
  } catch (error) {
    console.error('Image processing error:', error)
    res.status(500).json({
      error: 'Image processing failed',
      message: error.message
    })
  }
})

// Process video endpoint
router.post('/video', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    const options = JSON.parse(req.body.options || '{}')

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const result = await processVideo(file, options)

    res.json({
      success: true,
      result: result
    })
  } catch (error) {
    console.error('Video processing error:', error)
    res.status(500).json({
      error: 'Video processing failed',
      message: error.message
    })
  }
})

// Download processed file
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(__dirname, '../../uploads', filename)

    // Check if file exists
    await fs.access(filePath)

    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err)
        res.status(500).json({ error: 'Download failed' })
      }
    })
  } catch (error) {
    res.status(404).json({ error: 'File not found' })
  }
})

// Create and download archive
router.post('/archive', async (req, res) => {
  try {
    const { files } = req.body

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' })
    }

    const archivePath = await createArchive(files)

    res.download(archivePath, 'processed-files.zip', async (err) => {
      if (err) {
        console.error('Archive download error:', err)
      }
      // Clean up archive file after download
      try {
        await fs.unlink(archivePath)
      } catch (cleanupError) {
        console.error('Archive cleanup error:', cleanupError)
      }
    })
  } catch (error) {
    console.error('Archive creation error:', error)
    res.status(500).json({
      error: 'Archive creation failed',
      message: error.message
    })
  }
})

export default router
