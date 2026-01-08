import { useState, useEffect } from 'react'
import FormatSelector from './FormatSelector'

export default function ProcessingOptions({ mode, options, svgOptions, onOptionsChange, onSvgOptionsChange, disabled, files = [] }) {
  const [detectedTypes, setDetectedTypes] = useState({ raster: false, svg: false })

  // Detect file types in the queue
  useEffect(() => {
    const types = { raster: false, svg: false }

    files.forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase()

      if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff'].includes(ext)) {
        types.raster = true
      } else if (ext === 'svg') {
        types.svg = true
      }
    })

    setDetectedTypes(types)
  }, [files])

  if (mode === 'images') {
    return (
      <div className="space-y-4">
        {/* Info notice about default presets */}
        {(detectedTypes.raster || detectedTypes.svg) && (
          <div className="bg-terminal-surface border border-terminal-border p-2 sm:p-3">
            <div className="font-mono text-xs text-terminal-text flex items-start gap-2">
              <span className="text-terminal-muted">ℹ</span>
              <div>
                <span className="font-bold">DEFAULT PRESETS</span> - These settings apply to all files.
                Click the <span className="inline-flex items-center px-1 bg-terminal-border text-terminal-text">⚙</span> button on any file to override with custom settings.
              </div>
            </div>
          </div>
        )}

        {/* Raster Image Options - Show if raster files present OR if SVG files will be converted to raster */}
        {(detectedTypes.raster || (detectedTypes.svg && options.formats.some(f => ['webp', 'avif', 'jpg', 'png'].includes(f)))) && (
          <div className="bg-terminal-surface border-2 border-terminal-border p-3 sm:p-4">
            <h3 className="font-mono text-sm sm:text-base font-bold mb-3 sm:mb-4 text-terminal-neon-green">
              {'>'} RASTER IMAGE OPTIONS (DEFAULT PRESET)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Quality */}
              <div>
                <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text">
                  QUALITY
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={options.quality}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || /^\d+$/.test(val)) {
                        onOptionsChange({ ...options, quality: val === '' ? '' : parseInt(val) })
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value === '' ? 80 : parseInt(e.target.value)
                      const clamped = Math.max(1, Math.min(100, val))
                      onOptionsChange({ ...options, quality: clamped })
                    }}
                    disabled={disabled}
                    placeholder="1-100"
                    className="input-field flex-1 text-center font-mono font-bold text-terminal-neon-green
                             [&::-webkit-inner-spin-button]:appearance-none
                             [&::-webkit-outer-spin-button]:appearance-none
                             [-moz-appearance:textfield]"
                  />
                  <span className="font-mono text-sm text-terminal-text">%</span>
                </div>
              </div>

              {/* Resize */}
              <div>
                <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text">
                  RESIZE
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={options.resize}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || /^\d+$/.test(val)) {
                        onOptionsChange({ ...options, resize: val === '' ? '' : parseInt(val) })
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value === '' ? 100 : parseInt(e.target.value)
                      const clamped = Math.max(10, Math.min(100, val))
                      onOptionsChange({ ...options, resize: clamped })
                    }}
                    disabled={disabled}
                    placeholder="10-100"
                    className="input-field flex-1 text-center font-mono font-bold text-terminal-neon-green
                             [&::-webkit-inner-spin-button]:appearance-none
                             [&::-webkit-outer-spin-button]:appearance-none
                             [-moz-appearance:textfield]"
                  />
                  <span className="font-mono text-sm text-terminal-text">%</span>
                </div>
              </div>

              {/* Output Formats - Smart Selector */}
              <div className="sm:col-span-2 lg:col-span-3">
                <FormatSelector
                  files={files}
                  selectedFormats={options.formats}
                  onChange={(formats) => onOptionsChange({ ...options, formats })}
                  disabled={disabled}
                  mode={mode}
                />
              </div>
            </div>
          </div>
        )}

        {/* SVG Options - Show if SVG files present */}
        {detectedTypes.svg && (
          <div className="bg-terminal-surface border-2 border-terminal-border p-3 sm:p-4">
            <h3 className="font-mono text-sm sm:text-base font-bold mb-3 sm:mb-4 text-terminal-neon-green">
              {'>'} SVG VECTOR OPTIONS (DEFAULT PRESET)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Precision */}
              <div>
                <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text">
                  PRECISION
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={svgOptions.precision}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || /^\d+$/.test(val)) {
                        onSvgOptionsChange({ ...svgOptions, precision: val === '' ? '' : parseInt(val) })
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value === '' ? 2 : parseInt(e.target.value)
                      const clamped = Math.max(0, Math.min(5, val))
                      onSvgOptionsChange({ ...svgOptions, precision: clamped })
                    }}
                    disabled={disabled}
                    placeholder="0-5"
                    className="input-field flex-1 text-center font-mono font-bold text-terminal-neon-green
                             [&::-webkit-inner-spin-button]:appearance-none
                             [&::-webkit-outer-spin-button]:appearance-none
                             [-moz-appearance:textfield]"
                  />
                  <span className="font-mono text-xs text-terminal-muted">decimals</span>
                </div>
                <div className="font-mono text-[10px] text-terminal-muted mt-1">
                  Coordinate precision (lower = smaller file)
                </div>
              </div>

              {/* Remove ViewBox Toggle */}
              <div>
                <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text whitespace-nowrap">
                  KEEP VIEWBOX
                </label>
                <div className="flex items-center h-[46px] sm:h-[50px]">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-sm text-terminal-text">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={!svgOptions.removeViewBox}
                        onChange={(e) => onSvgOptionsChange({ ...svgOptions, removeViewBox: !e.target.checked })}
                        disabled={disabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-terminal-bg border-2 border-terminal-border peer-focus:outline-none transition-all relative peer-checked:border-terminal-neon-green disabled:opacity-50">
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 transition-all ${
                          !svgOptions.removeViewBox
                            ? 'translate-x-5 bg-terminal-neon-green'
                            : 'translate-x-0 bg-terminal-text'
                        }`}></div>
                      </div>
                    </div>
                    <span>{!svgOptions.removeViewBox ? 'ON' : 'OFF'}</span>
                  </label>
                </div>
                <div className="font-mono text-[10px] text-terminal-muted mt-1">
                  Keep viewBox for proper scaling
                </div>
              </div>

              {/* Cleanup IDs Toggle */}
              <div>
                <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text whitespace-nowrap">
                  CLEANUP IDs
                </label>
                <div className="flex items-center h-[46px] sm:h-[50px]">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-sm text-terminal-text">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={svgOptions.cleanupIDs}
                        onChange={(e) => onSvgOptionsChange({ ...svgOptions, cleanupIDs: e.target.checked })}
                        disabled={disabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-terminal-bg border-2 border-terminal-border peer-focus:outline-none transition-all relative peer-checked:border-terminal-neon-green disabled:opacity-50">
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 transition-all ${
                          svgOptions.cleanupIDs
                            ? 'translate-x-5 bg-terminal-neon-green'
                            : 'translate-x-0 bg-terminal-text'
                        }`}></div>
                      </div>
                    </div>
                    <span>{svgOptions.cleanupIDs ? 'ON' : 'OFF'}</span>
                  </label>
                </div>
                <div className="font-mono text-[10px] text-terminal-muted mt-1">
                  Remove unused IDs and minify remaining
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show message if no files */}
        {!detectedTypes.raster && !detectedTypes.svg && (
          <div className="bg-terminal-surface border-2 border-terminal-border p-3 sm:p-4">
            <div className="text-terminal-muted font-mono text-sm p-3 text-center">
              Add image files to see processing options
            </div>
          </div>
        )}
      </div>
    )
  }

  // Video options
  return (
    <div className="bg-terminal-surface border-2 border-terminal-border p-3 sm:p-4">
      <h3 className="font-mono text-sm sm:text-base font-bold mb-3 sm:mb-4 text-terminal-neon-green">
        {'>'} VIDEO OPTIONS
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Format */}
        <div>
          <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text">
            FORMAT
          </label>
          <select
            value={options.format}
            onChange={(e) => onOptionsChange({ ...options, format: e.target.value })}
            disabled={disabled}
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
          <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text">
            QUALITY
          </label>
          <select
            value={options.preset || 'web'}
            onChange={(e) => onOptionsChange({ ...options, preset: e.target.value })}
            disabled={disabled}
            className="input-field"
          >
            <option value="fast">Fast (Lower Quality)</option>
            <option value="web">Web (Balanced)</option>
            <option value="quality">Quality (Slower)</option>
          </select>
        </div>

        {/* Resize */}
        <div>
          <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text">
            RESIZE
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={options.resize}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || /^\d+$/.test(val)) {
                  onOptionsChange({ ...options, resize: val === '' ? '' : parseInt(val) })
                }
              }}
              onBlur={(e) => {
                const val = e.target.value === '' ? 100 : parseInt(e.target.value)
                const clamped = Math.max(10, Math.min(100, val))
                onOptionsChange({ ...options, resize: clamped })
              }}
              disabled={disabled}
              placeholder="10-100"
              className="input-field flex-1 text-center font-mono font-bold text-terminal-neon-green
                       [&::-webkit-inner-spin-button]:appearance-none
                       [&::-webkit-outer-spin-button]:appearance-none
                       [-moz-appearance:textfield]"
            />
            <span className="font-mono text-sm text-terminal-text">%</span>
          </div>
        </div>

        {/* Audio Toggle */}
        <div>
          <label className="block font-mono text-xs sm:text-sm font-bold mb-1 sm:mb-2 text-terminal-text">
            AUDIO
          </label>
          <div className="flex items-center h-[46px] sm:h-[50px]">
            <label className="flex items-center gap-2 cursor-pointer font-mono text-sm text-terminal-text">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={options.audio}
                  onChange={(e) => onOptionsChange({ ...options, audio: e.target.checked })}
                  disabled={disabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-terminal-bg border-2 border-terminal-border peer-focus:outline-none transition-all relative peer-checked:border-terminal-neon-green disabled:opacity-50">
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 transition-all ${
                    options.audio
                      ? 'translate-x-5 bg-terminal-neon-green'
                      : 'translate-x-0 bg-terminal-text'
                  }`}></div>
                </div>
              </div>
              <span>{options.audio ? 'ON' : 'OFF'}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
