import { useState } from 'react'
import Header from './components/Header'
import FileDropZone from './components/FileDropZone'
import ProcessingOptions from './components/ProcessingOptions'
import Results from './components/Results'
import FileConversionOptions from './components/FileConversionOptions'
import { processImages, processVideo } from './services/api'

function App() {
  const [mode, setMode] = useState('images') // 'images' or 'video'
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [options, setOptions] = useState({
    images: {
      quality: 80,
      resize: 100,
      formats: ['webp']
    },
    svg: {
      precision: 2,
      removeViewBox: false,
      cleanupIDs: true
    },
    video: {
      format: 'mp4',
      resize: 100,
      bitrate: '2M',
      preset: 'web',
      audio: true
    }
  })
  // Per-file options (overrides global options if set)
  const [fileOptions, setFileOptions] = useState({})
  // File options modal state
  const [showFileOptionsModal, setShowFileOptionsModal] = useState(false)
  const [selectedFileIndex, setSelectedFileIndex] = useState(null)

  const handleFilesAdded = (newFiles) => {
    setFiles(prev => {
      // Create a Set of existing file identifiers (name + size + lastModified)
      const existingFiles = new Set(
        prev.map(f => `${f.name}-${f.size}-${f.lastModified}`)
      )

      // Filter out duplicates from newFiles
      const uniqueNewFiles = newFiles.filter(file => {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`
        return !existingFiles.has(fileId)
      })

      return [...prev, ...uniqueNewFiles]
    })
  }

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    // Also remove file-specific options
    setFileOptions(prev => {
      const newOptions = { ...prev }
      delete newOptions[index]
      // Reindex remaining options
      const reindexed = {}
      Object.keys(newOptions).forEach(key => {
        const oldIndex = parseInt(key)
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = newOptions[key]
        } else {
          reindexed[key] = newOptions[key]
        }
      })
      return reindexed
    })
  }

  const handleFileOptionsChange = (fileIndex, newOptions) => {
    setFileOptions(prev => ({
      ...prev,
      [fileIndex]: newOptions
    }))
  }

  const handleOpenFileOptions = (fileIndex) => {
    setSelectedFileIndex(fileIndex)
    setShowFileOptionsModal(true)
  }

  const handleCloseFileOptions = () => {
    setShowFileOptionsModal(false)
    setSelectedFileIndex(null)
  }

  const handleProcessClick = () => {
    if (files.length === 0) return
    handleProcess()
  }

  const handleProcess = async () => {
    if (files.length === 0) return

    setProcessing(true)
    setResults([])

    try {
      // Helper function to check if a file is an image
      const isImageFile = (file) => {
        const ext = file.name.split('.').pop().toLowerCase()
        return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'svg'].includes(ext)
      }

      // Helper function to check if a file is a video
      const isVideoFile = (file) => {
        const ext = file.name.split('.').pop().toLowerCase()
        return ['mp4', 'webm', 'mov', 'mkv', 'avi', 'flv', 'wmv', 'm4v'].includes(ext)
      }

      if (mode === 'images') {
        // Filter only image files
        const imageFiles = files.filter((file, index) => isImageFile(file))
        
        if (imageFiles.length === 0) {
          alert('No image files in the queue. Please add image files or switch to video mode.')
          setProcessing(false)
          return
        }

        // Check if any files have custom options
        const hasCustomOptions = Object.keys(fileOptions).length > 0

        if (hasCustomOptions) {
          // Process images individually with their specific options
          const processedResults = []

          for (let i = 0; i < files.length; i++) {
            const file = files[i]

            // Skip non-image files
            if (!isImageFile(file)) continue

            // Build file-specific options
            let fileSpecificOptions
            if (fileOptions[i]) {
              const isSvg = file.name.toLowerCase().endsWith('.svg')

              if (isSvg && fileOptions[i].svgMode === 'optimize') {
                // SVG optimization mode - use SVG options only
                fileSpecificOptions = {
                  ...options.svg,
                  ...fileOptions[i],
                  formats: ['svg'] // Force SVG output
                }
              } else if (isSvg && fileOptions[i].svgMode === 'convert') {
                // SVG to raster conversion - use raster options
                fileSpecificOptions = {
                  ...options.images,
                  ...fileOptions[i]
                }
              } else {
                // Regular raster image
                fileSpecificOptions = {
                  ...options.images,
                  ...fileOptions[i]
                }
              }
            } else {
              // No custom options - use defaults
              const isSvg = file.name.toLowerCase().endsWith('.svg')
              if (isSvg) {
                // SVG files default to optimize mode (no raster conversion)
                fileSpecificOptions = {
                  ...options.svg,
                  formats: ['svg'] // Force SVG output only
                }
              } else {
                // Regular raster image
                fileSpecificOptions = {
                  ...options.images
                }
              }
            }

            try {
              const response = await processImages([file], fileSpecificOptions)

              if (response.success && response.results.length > 0) {
                processedResults.push({
                  name: response.results[0].name,
                  beforeSize: response.results[0].originalSize,
                  processedFiles: response.results[0].processedFiles,
                  status: response.results[0].status,
                  error: response.results[0].error
                })
              }
            } catch (error) {
              processedResults.push({
                name: file.name,
                status: 'error',
                error: error.message
              })
            }
            setResults([...processedResults])
          }
        } else {
          // Process all images with same options (batch)
          // Separate SVG files from raster files
          const svgFiles = imageFiles.filter(f => f.name.toLowerCase().endsWith('.svg'))
          const rasterFiles = imageFiles.filter(f => !f.name.toLowerCase().endsWith('.svg'))

          const processedResults = []

          // Process raster files with raster options
          if (rasterFiles.length > 0) {
            const rasterOptions = {
              ...options.images
            }
            const response = await processImages(rasterFiles, rasterOptions)
            if (response.success) {
              response.results.forEach(result => {
                processedResults.push({
                  name: result.name,
                  beforeSize: result.originalSize,
                  processedFiles: result.processedFiles,
                  status: result.status,
                  error: result.error
                })
              })
            }
          }

          // Process SVG files with SVG options (optimize by default)
          if (svgFiles.length > 0) {
            const svgProcessingOptions = {
              ...options.svg,
              formats: ['svg'] // Force SVG output (optimization mode)
            }
            const response = await processImages(svgFiles, svgProcessingOptions)
            if (response.success) {
              response.results.forEach(result => {
                processedResults.push({
                  name: result.name,
                  beforeSize: result.originalSize,
                  processedFiles: result.processedFiles,
                  status: result.status,
                  error: result.error
                })
              })
            }
          }

          setResults(processedResults)
        }
      } else {
        // Filter only video files
        const videoFiles = files.filter((file, index) => isVideoFile(file))
        
        if (videoFiles.length === 0) {
          alert('No video files in the queue. Please add video files or switch to images mode.')
          setProcessing(false)
          return
        }

        // Process videos one by one with their specific options
        const processedResults = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          
          // Skip non-video files
          if (!isVideoFile(file)) continue
          
          const fileSpecificOptions = fileOptions[i] || options.video

          try {
            const response = await processVideo(file, fileSpecificOptions)

            if (response.success) {
              processedResults.push({
                name: response.result.name,
                beforeSize: response.result.originalSize,
                afterSize: response.result.processedSize,
                savings: response.result.savings,
                filename: response.result.filename,
                status: 'success'
              })
            }
          } catch (error) {
            processedResults.push({
              name: file.name,
              status: 'error',
              error: error.message
            })
          }
          setResults([...processedResults])
        }
      }
    } catch (error) {
      console.error('Processing error:', error)
      alert(`Processing failed: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleClear = () => {
    setFiles([])
    setResults([])
    setFileOptions({})
  }

  return (
    <div className="min-h-screen bg-terminal-bg relative overflow-hidden">
      {/* Scanline effect */}
      <div className="terminal-scanline absolute inset-0 pointer-events-none"></div>

      {/* File Options Modal */}
      {showFileOptionsModal && selectedFileIndex !== null && (
        <FileConversionOptions
          file={files[selectedFileIndex]}
          fileIndex={selectedFileIndex}
          mode={mode}
          globalOptions={fileOptions[selectedFileIndex] || options[mode]}
          onSave={handleFileOptionsChange}
          onClose={handleCloseFileOptions}
        />
      )}

      {/* Main content */}
      <div className="relative z-10">
        <Header />

        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={() => setMode('images')}
              className={`flex-1 py-2 sm:py-3 font-mono font-bold text-sm sm:text-base border-2 transition-all duration-200 ${
                mode === 'images'
                  ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                  : 'bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-neon-green'
              }`}
            >
              <span className="hidden sm:inline">[ IMAGE PROCESSING ]</span>
              <span className="sm:hidden">[ IMAGES ]</span>
            </button>
            <button
              onClick={() => setMode('video')}
              className={`flex-1 py-2 sm:py-3 font-mono font-bold text-sm sm:text-base border-2 transition-all duration-200 ${
                mode === 'video'
                  ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                  : 'bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-neon-green'
              }`}
            >
              <span className="hidden sm:inline">[ VIDEO PROCESSING ]</span>
              <span className="sm:hidden">[ VIDEO ]</span>
            </button>
          </div>

          {/* File Drop Zone with integrated queue */}
          <FileDropZone
            mode={mode}
            onFilesAdded={handleFilesAdded}
            files={files}
            onRemove={handleRemoveFile}
            onFileOptions={handleOpenFileOptions}
            fileOptions={fileOptions}
            disabled={processing}
          />

          {/* Processing Options */}
          <ProcessingOptions
            mode={mode}
            options={options[mode]}
            svgOptions={options.svg}
            onOptionsChange={(newOptions) => setOptions(prev => ({
              ...prev,
              [mode]: newOptions
            }))}
            onSvgOptionsChange={(newSvgOptions) => setOptions(prev => ({
              ...prev,
              svg: newSvgOptions
            }))}
            disabled={processing}
            files={files}
          />

          {/* Action Buttons */}
          {files.length > 0 && (
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={handleProcessClick}
                disabled={processing}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2 sm:py-3"
              >
                {processing ? '[ PROCESSING... ]' : '[ PROCESS FILES ]'}
              </button>
              <button
                onClick={handleClear}
                disabled={processing}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                [ CLEAR ]
              </button>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <Results results={results} processing={processing} mode={mode} />
          )}
        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-8 sm:mt-16 border-t-2 border-terminal-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-terminal-muted font-mono text-xs sm:text-sm">
            <div className="text-center sm:text-left">
              <span className="neon-text">SERVER PROCESSING</span> - Sharp + SVGO + FFmpeg
            </div>
            <div>
              Media Toolkit v1.0
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
