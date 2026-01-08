import { useState, useEffect } from 'react'

/**
 * Per-file conversion options modal
 * Allows setting individual conversion settings for each file in the queue
 */
export default function FileConversionOptions({ file, fileIndex, mode, globalOptions, onSave, onClose }) {
  // Detect if this is an SVG file
  const isSvgFile = file.name.toLowerCase().endsWith('.svg')

  // For SVG files, add conversion mode: 'optimize' or 'convert'
  const initialOptions = isSvgFile && !globalOptions.svgMode
    ? { ...globalOptions, svgMode: 'optimize' }
    : globalOptions

  const [localOptions, setLocalOptions] = useState(initialOptions)
  const [aspectRatio, setAspectRatio] = useState(null)
  const [originalDimensions, setOriginalDimensions] = useState({ width: null, height: null })

  // Load image/video dimensions to calculate aspect ratio
  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        setAspectRatio(img.width / img.height)
        setOriginalDimensions({ width: img.width, height: img.height })
        URL.revokeObjectURL(objectUrl)
      }
      img.src = objectUrl
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)
      video.onloadedmetadata = () => {
        setAspectRatio(video.videoWidth / video.videoHeight)
        setOriginalDimensions({ width: Math.round(video.videoWidth), height: Math.round(video.videoHeight) })
        URL.revokeObjectURL(objectUrl)
      }
      video.preload = 'metadata'
      video.src = objectUrl
      video.load()
    }
  }, [file])

  // Handle switching to absolute resize mode - set default dimensions
  const handleSwitchToAbsolute = () => {
    const newOptions = { ...localOptions, resizeMode: 'absolute' }
    // Set default dimensions if we have them and they're not already set
    if (originalDimensions.width && originalDimensions.height) {
      const needsWidth = localOptions.width === undefined || localOptions.width === null || localOptions.width === '' || localOptions.width === 0
      const needsHeight = localOptions.height === undefined || localOptions.height === null || localOptions.height === '' || localOptions.height === 0
      if (needsWidth) {
        newOptions.width = originalDimensions.width
      }
      if (needsHeight) {
        newOptions.height = originalDimensions.height
      }
    }
    setLocalOptions(newOptions)
  }

  // Set default dimensions when originalDimensions load (if already in absolute mode)
  useEffect(() => {
    if (localOptions.resizeMode === 'absolute' && originalDimensions.width && originalDimensions.height) {
      // Only set if width/height are not yet defined (undefined, null, 0, or empty string)
      const needsWidth = localOptions.width === undefined || localOptions.width === null || localOptions.width === '' || localOptions.width === 0
      const needsHeight = localOptions.height === undefined || localOptions.height === null || localOptions.height === '' || localOptions.height === 0
      if (needsWidth || needsHeight) {
        setLocalOptions(prev => ({
          ...prev,
          width: needsWidth ? originalDimensions.width : prev.width,
          height: needsHeight ? originalDimensions.height : prev.height
        }))
      }
    }
  }, [originalDimensions.width, originalDimensions.height, localOptions.resizeMode])

  // Handle width change with aspect ratio preservation
  const handleWidthChange = (newWidth) => {
    if (aspectRatio && newWidth !== '') {
      const calculatedHeight = Math.round(parseInt(newWidth) / aspectRatio)
      setLocalOptions({ ...localOptions, width: parseInt(newWidth), height: calculatedHeight })
    } else {
      setLocalOptions({ ...localOptions, width: newWidth === '' ? '' : parseInt(newWidth) })
    }
  }

  // Handle height change with aspect ratio preservation
  const handleHeightChange = (newHeight) => {
    if (aspectRatio && newHeight !== '') {
      const calculatedWidth = Math.round(parseInt(newHeight) * aspectRatio)
      setLocalOptions({ ...localOptions, height: parseInt(newHeight), width: calculatedWidth })
    } else {
      setLocalOptions({ ...localOptions, height: newHeight === '' ? '' : parseInt(newHeight) })
    }
  }

  const handleSave = () => {
    onSave(fileIndex, localOptions)
    onClose()
  }

  const accentColor = mode === 'images' ? 'terminal-neon-green' : 'terminal-neon-green'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={(e) => e.target === e.currentTarget && e.stopPropagation()}>
      <div className="bg-terminal-bg border-2 border-terminal-border max-w-lg w-full max-h-[80vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center
                   border-2 border-terminal-text text-terminal-text
                   hover:border-terminal-neon-yellow hover:text-terminal-neon-yellow
                   transition-colors font-bold text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className={`border-b-2 p-3 ${
          mode === 'images'
            ? 'bg-terminal-neon-green bg-opacity-20 border-terminal-neon-green'
            : 'bg-terminal-neon-green bg-opacity-20 border-terminal-neon-green'
        }`}>
          <h2 className="font-mono text-xs font-bold text-terminal-bg">
            {'>'} FILE OPTIONS
          </h2>
          <div className={`font-mono text-xs mt-1 truncate inline-block px-2 py-0.5 ${
            mode === 'images'
              ? 'bg-terminal-neon-green text-terminal-bg'
              : 'bg-terminal-neon-green text-terminal-bg'
          }`}>
            {file.name}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {mode === 'images' ? (
            <>
              {/* SVG Mode Selector - Only show for SVG files */}
              {isSvgFile && (
                <div>
                  <label className="block font-mono text-xs font-bold mb-2 text-terminal-text">
                    SVG PROCESSING MODE
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLocalOptions({ ...localOptions, svgMode: 'optimize' })}
                      className={`px-3 py-2 font-mono text-xs font-bold border-2 transition-all
                        ${localOptions.svgMode === 'optimize'
                          ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                          : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-neon-green'
                        }
                      `}
                    >
                      <div>OPTIMIZE</div>
                      <div className="text-[10px] opacity-70 mt-0.5">Keep as SVG</div>
                    </button>
                    <button
                      onClick={() => setLocalOptions({ ...localOptions, svgMode: 'convert' })}
                      className={`px-3 py-2 font-mono text-xs font-bold border-2 transition-all
                        ${localOptions.svgMode === 'convert'
                          ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                          : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-neon-green'
                        }
                      `}
                    >
                      <div>CONVERT</div>
                      <div className="text-[10px] opacity-70 mt-0.5">To raster</div>
                    </button>
                  </div>
                </div>
              )}

              {/* SVG Optimization Options - Only show when optimizing */}
              {isSvgFile && localOptions.svgMode === 'optimize' && (
                <div className="space-y-3 p-3 border border-terminal-border bg-terminal-bg bg-opacity-50">
                  <div className="font-mono text-xs font-bold text-terminal-neon-green mb-2">
                    {'>'} SVG OPTIMIZATION
                  </div>

                  {/* Precision */}
                  <div>
                    <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                      PRECISION
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={localOptions.precision ?? 2}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || /^\d+$/.test(val)) {
                            setLocalOptions({ ...localOptions, precision: val === '' ? '' : parseInt(val) })
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value === '' ? 2 : parseInt(e.target.value)
                          const clamped = Math.max(0, Math.min(5, val))
                          setLocalOptions({ ...localOptions, precision: clamped })
                        }}
                        placeholder="0-5"
                        className="w-full px-2 py-2 bg-terminal-bg border-2 border-terminal-border text-terminal-text font-mono font-bold text-center focus:border-terminal-neon-green focus:outline-none"
                      />
                      <span className="font-mono text-xs text-terminal-text">decimals</span>
                    </div>
                  </div>

                  {/* Keep ViewBox Toggle */}
                  <div>
                    <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                      KEEP VIEWBOX
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-terminal-text">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={!(localOptions.removeViewBox ?? false)}
                          onChange={(e) => setLocalOptions({ ...localOptions, removeViewBox: !e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-terminal-bg border-2 border-terminal-border peer-focus:outline-none transition-all relative peer-checked:border-terminal-neon-green">
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 transition-all ${
                            !(localOptions.removeViewBox ?? false)
                              ? 'translate-x-5 bg-terminal-neon-green'
                              : 'translate-x-0 bg-terminal-text'
                          }`}></div>
                        </div>
                      </div>
                      <span>{!(localOptions.removeViewBox ?? false) ? 'ON' : 'OFF'}</span>
                    </label>
                  </div>

                  {/* Cleanup IDs Toggle */}
                  <div>
                    <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                      CLEANUP IDs
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-terminal-text">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={localOptions.cleanupIDs ?? true}
                          onChange={(e) => setLocalOptions({ ...localOptions, cleanupIDs: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-terminal-bg border-2 border-terminal-border peer-focus:outline-none transition-all relative peer-checked:border-terminal-neon-green">
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 transition-all ${
                            (localOptions.cleanupIDs ?? true)
                              ? 'translate-x-5 bg-terminal-neon-green'
                              : 'translate-x-0 bg-terminal-text'
                          }`}></div>
                        </div>
                      </div>
                      <span>{(localOptions.cleanupIDs ?? true) ? 'ON' : 'OFF'}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Raster Options - Show for non-SVG or when converting SVG */}
              {(!isSvgFile || localOptions.svgMode === 'convert') && (
                <>
                  {/* Dimension Mode Selector */}
                  <div>
                    <label className="block font-mono text-xs font-bold mb-2 text-terminal-text">
                      RESIZE MODE
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setLocalOptions({ ...localOptions, resizeMode: 'percent' })}
                        className={`px-3 py-2 font-mono text-xs font-bold border-2 transition-all
                          ${(localOptions.resizeMode ?? 'percent') === 'percent'
                            ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                            : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-neon-green'
                          }
                        `}
                      >
                        PERCENTAGE
                      </button>
                      <button
                        onClick={handleSwitchToAbsolute}
                        className={`px-3 py-2 font-mono text-xs font-bold border-2 transition-all
                          ${localOptions.resizeMode === 'absolute'
                            ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                            : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-neon-green'
                          }
                        `}
                      >
                        ABSOLUTE
                      </button>
                    </div>
                  </div>

                  {/* Resize Controls */}
                  {(localOptions.resizeMode ?? 'percent') === 'percent' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                          QUALITY
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={localOptions.quality}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '' || /^\d+$/.test(val)) {
                                setLocalOptions({ ...localOptions, quality: val === '' ? '' : parseInt(val) })
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value === '' ? 80 : parseInt(e.target.value)
                              const clamped = Math.max(1, Math.min(100, val))
                              setLocalOptions({ ...localOptions, quality: clamped })
                            }}
                            placeholder="1-100"
                            className="w-full px-2 py-2 bg-terminal-bg border-2 border-terminal-border text-terminal-text font-mono font-bold text-center focus:border-terminal-neon-green focus:outline-none"
                          />
                          <span className="font-mono text-xs text-terminal-text">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                          RESIZE
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={localOptions.resize}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '' || /^\d+$/.test(val)) {
                                setLocalOptions({ ...localOptions, resize: val === '' ? '' : parseInt(val) })
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value === '' ? 100 : parseInt(e.target.value)
                              const clamped = Math.max(10, Math.min(100, val))
                              setLocalOptions({ ...localOptions, resize: clamped })
                            }}
                            placeholder="10-100"
                            className="w-full px-2 py-2 bg-terminal-bg border-2 border-terminal-border text-terminal-text font-mono font-bold text-center focus:border-terminal-neon-green focus:outline-none"
                          />
                          <span className="font-mono text-xs text-terminal-text">%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                          QUALITY
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={localOptions.quality}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '' || /^\d+$/.test(val)) {
                                setLocalOptions({ ...localOptions, quality: val === '' ? '' : parseInt(val) })
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value === '' ? 80 : parseInt(e.target.value)
                              const clamped = Math.max(1, Math.min(100, val))
                              setLocalOptions({ ...localOptions, quality: clamped })
                            }}
                            placeholder="1-100"
                            className="w-full px-2 py-2 bg-terminal-bg border-2 border-terminal-border text-terminal-text font-mono font-bold text-center focus:border-terminal-neon-green focus:outline-none"
                          />
                          <span className="font-mono text-xs text-terminal-text">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                          WIDTH
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={localOptions.width ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '' || /^\d+$/.test(val)) {
                                handleWidthChange(val)
                              }
                            }}
                            placeholder="px"
                            className="w-full px-2 py-2 bg-terminal-bg border-2 border-terminal-border text-terminal-text font-mono font-bold text-center focus:border-terminal-neon-green focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                          HEIGHT
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={localOptions.height ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '' || /^\d+$/.test(val)) {
                                handleHeightChange(val)
                              }
                            }}
                            placeholder="px"
                            className="w-full px-2 py-2 bg-terminal-bg border-2 border-terminal-border text-terminal-text font-mono font-bold text-center focus:border-terminal-neon-green focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Output Formats */}
                  <div>
                    <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                      OUTPUT FORMATS
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'webp', label: 'WebP' },
                        { id: 'avif', label: 'AVIF' },
                        { id: 'jpg', label: 'JPG' },
                        { id: 'png', label: 'PNG' }
                      ].map(format => (
                        <button
                          key={format.id}
                          onClick={() => {
                            const newFormats = localOptions.formats.includes(format.id)
                              ? localOptions.formats.filter(f => f !== format.id)
                              : [...localOptions.formats, format.id]
                            if (newFormats.length > 0) {
                              setLocalOptions({ ...localOptions, formats: newFormats })
                            }
                          }}
                          className={`px-2 py-1.5 font-mono text-xs font-bold border-2 transition-all
                            ${localOptions.formats.includes(format.id)
                              ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                              : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-neon-green'
                            }
                          `}
                        >
                          {format.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Video Format */}
              <div>
                <label className="block font-mono text-xs font-bold mb-2 text-terminal-text">
                  FORMAT
                </label>
                <select
                  value={localOptions.format}
                  onChange={(e) => setLocalOptions({ ...localOptions, format: e.target.value })}
                  className="input-field"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                  <option value="mov">MOV</option>
                  <option value="mkv">MKV</option>
                  <option value="gif">GIF</option>
                </select>
              </div>

              {/* Quality Preset */}
              <div>
                <label className="block font-mono text-xs font-bold mb-2 text-terminal-text">
                  QUALITY
                </label>
                <select
                  value={localOptions.preset || 'web'}
                  onChange={(e) => setLocalOptions({ ...localOptions, preset: e.target.value })}
                  className="input-field"
                >
                  <option value="fast">Fast (Lower Quality)</option>
                  <option value="web">Web (Balanced)</option>
                  <option value="quality">Quality (Slower)</option>
                </select>
              </div>

              {/* Resize Mode Selector */}
              <div>
                <label className="block font-mono text-xs font-bold mb-2 text-terminal-text">
                  RESIZE MODE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLocalOptions({ ...localOptions, resizeMode: 'percent' })}
                    className={`px-3 py-2 font-mono text-xs font-bold border-2 transition-all
                      ${(localOptions.resizeMode ?? 'percent') === 'percent'
                        ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                        : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-neon-green'
                      }
                    `}
                  >
                    PERCENTAGE
                  </button>
                  <button
                    onClick={handleSwitchToAbsolute}
                    className={`px-3 py-2 font-mono text-xs font-bold border-2 transition-all
                      ${localOptions.resizeMode === 'absolute'
                        ? 'bg-terminal-neon-green text-terminal-bg border-terminal-neon-green'
                        : 'bg-terminal-bg text-terminal-text border-terminal-border hover:border-terminal-neon-green'
                      }
                    `}
                  >
                    ABSOLUTE
                  </button>
                </div>
              </div>

              {/* Resize Controls */}
              {(localOptions.resizeMode ?? 'percent') === 'percent' ? (
                <div>
                  <label className="block font-mono text-xs font-bold mb-2 text-terminal-text">
                    RESIZE
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={localOptions.resize}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '' || /^\d+$/.test(val)) {
                          setLocalOptions({ ...localOptions, resize: val === '' ? '' : parseInt(val) })
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value === '' ? 100 : parseInt(e.target.value)
                        const clamped = Math.max(10, Math.min(100, val))
                        setLocalOptions({ ...localOptions, resize: clamped })
                      }}
                      placeholder="10-100"
                      className="input-field flex-1 text-center font-mono font-bold text-terminal-neon-green"
                    />
                    <span className="font-mono text-sm text-terminal-text">%</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                      WIDTH
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={localOptions.width ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || /^\d+$/.test(val)) {
                            handleWidthChange(val)
                          }
                        }}
                        placeholder="px"
                        className="w-full px-2 py-2 bg-terminal-bg border-2 border-terminal-border text-terminal-text font-mono font-bold text-center focus:border-terminal-neon-green focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                      HEIGHT
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={localOptions.height ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '' || /^\d+$/.test(val)) {
                            handleHeightChange(val)
                          }
                        }}
                        placeholder="px"
                        className="w-full px-2 py-2 bg-terminal-bg border-2 border-terminal-border text-terminal-text font-mono font-bold text-center focus:border-terminal-neon-green focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Toggle */}
              <div>
                <label className="block font-mono text-xs font-bold mb-1 text-terminal-text">
                  AUDIO
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-terminal-text h-[38px]">
                  <div className="relative flex items-center h-full">
                    <input
                      type="checkbox"
                      checked={localOptions.audio}
                      onChange={(e) => setLocalOptions({ ...localOptions, audio: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-terminal-bg border-2 border-terminal-border peer-focus:outline-none transition-all relative peer-checked:border-terminal-neon-green">
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 transition-all ${
                        localOptions.audio
                          ? 'translate-x-5 bg-terminal-neon-green'
                          : 'translate-x-0 bg-terminal-text'
                      }`}></div>
                    </div>
                  </div>
                  <span>{localOptions.audio ? 'ON' : 'OFF'}</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="border-t-2 border-terminal-border p-3">
          <button
            onClick={handleSave}
            className={`w-full py-2 font-mono font-bold text-sm border-2 bg-${accentColor} text-terminal-bg border-${accentColor} hover:opacity-90 transition-opacity`}
          >
            [ SAVE ]
          </button>
        </div>
      </div>
    </div>
  )
}