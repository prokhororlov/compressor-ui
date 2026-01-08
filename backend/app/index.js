import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import processRouter from './routes/process.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from frontend dist
const frontendPath = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendPath))

// API Routes
app.use('/api/process', processRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve frontend for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Frontend served from: ${frontendPath}`)
})

export default app
