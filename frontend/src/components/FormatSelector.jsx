import { useState, useEffect } from 'react'

/**
 * Smart format selector component that:
 * - Auto-detects input file types
 * - Suggests compatible output formats
 * - Provides preset options with manual override
 */
export default function FormatSelector({ files, selectedFormats, onChange, disabled, mode }) {
  const [showAllFormats, setShowAllFormats] = useState(false)
  const [detectedTypes, setDetectedTypes] = useState({ raster: false, svg: false, video: false })

  // Detect file types in the queue
  useEffect(() => {
    const types = { raster: false, svg: false, video: false }

    files.forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase()

      if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff'].includes(ext)) {
        types.raster = true
      } else if (ext === 'svg') {
        types.svg = true
      } else if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'flv', 'wmv', 'm4v'].includes(ext)) {
        types.video = true
      }
    })

    setDetectedTypes(types)
  }, [files])

  // Format definitions - only raster formats (SVG optimization handled separately)
  const rasterFormats = [
    { id: 'webp', label: 'WebP', desc: 'Best compression, modern browsers' },
    { id: 'avif', label: 'AVIF', desc: 'Superior compression, cutting edge' },
    { id: 'jpg', label: 'JPG', desc: 'Universal compatibility' },
    { id: 'png', label: 'PNG', desc: 'Lossless, transparency support' }
  ]

  const availableFormats = rasterFormats

  const handleFormatToggle = (formatId) => {
    const newFormats = selectedFormats.includes(formatId)
      ? selectedFormats.filter(f => f !== formatId)
      : [...selectedFormats, formatId]

    if (newFormats.length > 0) {
      onChange(newFormats)
    }
  }

  if (files.length === 0) {
    return (
      <div>
        <label className="block font-mono text-xs sm:text-sm font-bold mb-2 text-terminal-text">
          OUTPUT FORMATS
        </label>
        <div className="text-terminal-muted font-mono text-xs p-3 border border-terminal-border">
          Add files to see format options
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="block font-mono text-xs sm:text-sm font-bold text-terminal-text">
        OUTPUT FORMATS
      </label>

      {/* Individual format toggles */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {availableFormats.map(format => (
            <button
              key={format.id}
              onClick={() => handleFormatToggle(format.id)}
              disabled={disabled}
              title={format.desc}
              className={`px-3 py-2 font-mono text-xs font-bold border-2 transition-all text-left
                ${selectedFormats.includes(format.id)
                  ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                  : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-neon-green'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div>{format.label}</div>
              <div className="text-[10px] opacity-70 mt-1">{format.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SVG to raster conversion notice */}
      {detectedTypes.svg && !detectedTypes.raster && selectedFormats.some(f => ['webp', 'avif', 'jpg', 'png'].includes(f)) && (
        <div className="font-mono text-xs text-terminal-muted p-2 border border-terminal-border bg-terminal-bg">
          🎨 SVG will be converted to selected raster formats
        </div>
      )}

      {/* Mixed files notice */}
      {detectedTypes.raster && detectedTypes.svg && (
        <div className="font-mono text-xs text-terminal-muted p-2 border border-terminal-border">
          📦 Mixed files: Raster images will be converted, SVG can be optimized or converted
        </div>
      )}
    </div>
  )
}
