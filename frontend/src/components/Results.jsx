import { useState, useEffect, useCallback } from 'react'
import { getDownloadUrl, downloadArchive } from '../services/api'
import { useToast } from './Toast'

const RESULT_LIFETIME_MS = 10 * 60 * 1000 // 10 minutes

export default function Results({ results, processing, onClear, mode }) {
  const { showToast } = useToast()
  const [timeRemaining, setTimeRemaining] = useState(null)

  const storageKey = `media-toolkit-results-timestamp-${mode}`

  // Initialize or get timestamp from localStorage
  useEffect(() => {
    if (results.length === 0) {
      localStorage.removeItem(storageKey)
      setTimeRemaining(null)
      return
    }

    let timestamp = localStorage.getItem(storageKey)

    if (!timestamp) {
      // New results - set timestamp
      timestamp = Date.now().toString()
      localStorage.setItem(storageKey, timestamp)
    }

    const updateTimer = () => {
      const created = parseInt(timestamp, 10)
      const elapsed = Date.now() - created
      const remaining = RESULT_LIFETIME_MS - elapsed

      if (remaining <= 0) {
        setTimeRemaining(0)
        localStorage.removeItem(storageKey)
      } else {
        setTimeRemaining(remaining)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [results.length, storageKey])

  // Reset timestamp when new processing starts
  useEffect(() => {
    if (processing) {
      localStorage.removeItem(storageKey)
      setTimeRemaining(null)
    }
  }, [processing, storageKey])

  const formatTimeRemaining = useCallback((ms) => {
    if (ms === null || ms <= 0) return '00:00'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  const handleClear = useCallback(() => {
    localStorage.removeItem(storageKey)
    setTimeRemaining(null)
    onClear()
  }, [storageKey, onClear])

  // Results are already mode-specific (passed from parent), no filtering needed
  const filteredResults = results
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = async (filename) => {
    if (!filename) return
    const url = getDownloadUrl(filename)

    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) {
          showToast('File storage time has expired', 'error')
        } else {
          showToast('Download failed', 'error')
        }
        return
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      showToast('File storage time has expired', 'error')
    }
  }

  const handleDownloadAll = async () => {
    try {
      // Collect all processed filenames from filtered results
      const filenames = []
      filteredResults.forEach(result => {
        if (result.processedFiles) {
          result.processedFiles.forEach(pf => filenames.push(pf.filename))
        } else if (result.filename) {
          filenames.push(result.filename)
        }
      })

      if (filenames.length === 0) return

      const blob = await downloadArchive(filenames)

      // Download the ZIP
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `processed-files-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download all error:', error)
      showToast(`Download failed: ${error.message}`, 'error')
    }
  }

  const totalBefore = filteredResults.reduce((sum, r) => sum + (r.beforeSize || 0), 0)
  const totalAfter = filteredResults.reduce((sum, r) => {
    if (r.processedFiles) {
      return sum + r.processedFiles.reduce((s, pf) => s + (pf.size || 0), 0)
    }
    return sum + (r.afterSize || 0)
  }, 0)
  const totalSavings = totalBefore > 0
    ? ((totalBefore - totalAfter) / totalBefore * 100).toFixed(2)
    : 0

  // Don't render if no filtered results (and not processing)
  if (filteredResults.length === 0 && !processing) {
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="stat-card p-3 sm:p-4">
          <div className="font-mono text-xs text-terminal-muted mb-1">ORIGINAL</div>
          <div className="font-mono text-sm sm:text-xl font-bold text-terminal-text">
            {formatFileSize(totalBefore)}
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="font-mono text-xs text-terminal-muted mb-1">COMPRESSED</div>
          <div className="font-mono text-sm sm:text-xl font-bold text-terminal-neon-green">
            {formatFileSize(totalAfter)}
          </div>
        </div>

        <div className="stat-card p-3 sm:p-4">
          <div className="font-mono text-xs text-terminal-muted mb-1">SAVED</div>
          <div className="font-mono text-sm sm:text-xl font-bold text-terminal-neon-cyan">
            {totalSavings}%
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="terminal-border bg-terminal-surface">
        <div className="p-2 sm:p-3 border-b-2 border-terminal-neon-green flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <h3 className="font-mono text-sm sm:text-base font-bold neon-text">
              {'>'} RESULTS
            </h3>
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className={`font-mono text-xs sm:text-sm font-bold ${
                timeRemaining < 60000 ? 'text-terminal-neon-red' : 'text-terminal-muted'
              }`}>
                [ TTL: {formatTimeRemaining(timeRemaining)} ]
              </div>
            )}
            {timeRemaining === 0 && (
              <div className="font-mono text-xs sm:text-sm font-bold text-terminal-neon-red">
                [ EXPIRED ]
              </div>
            )}
          </div>
          {!processing && filteredResults.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadAll}
                className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs sm:text-sm font-bold border-2 border-terminal-neon-green
                         bg-terminal-neon-green text-terminal-bg hover:bg-terminal-bg hover:text-terminal-neon-green
                         transition-all"
              >
                <span className="hidden sm:inline">[ DOWNLOAD ALL ]</span>
                <span className="sm:hidden">[ ALL ]</span>
              </button>
              <button
                onClick={handleClear}
                className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs sm:text-sm font-bold border-2 border-terminal-muted
                         bg-transparent text-terminal-muted hover:border-terminal-neon-red hover:text-terminal-neon-red
                         transition-all"
              >
                <span className="hidden sm:inline">[ CLEAR SESSION ]</span>
                <span className="sm:hidden">[ CLEAR ]</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-terminal-border">
                <th className="text-left p-2 sm:p-3 font-mono text-xs font-bold text-terminal-muted">
                  FILE
                </th>
                <th className="text-right p-2 sm:p-3 font-mono text-xs font-bold text-terminal-muted">
                  BEFORE
                </th>
                <th className="text-right p-2 sm:p-3 font-mono text-xs font-bold text-terminal-muted hidden sm:table-cell">
                  AFTER
                </th>
                <th className="text-right p-2 sm:p-3 font-mono text-xs font-bold text-terminal-muted">
                  SAVED
                </th>
                <th className="text-center p-2 sm:p-3 font-mono text-xs font-bold text-terminal-muted hidden md:table-cell">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => {
                // Handle both image and video results
                if (result.processedFiles) {
                  // Image results - show each format
                  return result.processedFiles.map((pf, pfIndex) => (
                    <tr
                      key={`${index}-${pfIndex}`}
                      className="border-b border-terminal-border hover:bg-terminal-bg transition-colors"
                    >
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-terminal-text truncate max-w-[120px] sm:max-w-none">
                        {result.name} ({pf.format})
                      </td>
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-right text-terminal-text">
                        {formatFileSize(result.beforeSize)}
                      </td>
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-right text-terminal-neon-green hidden sm:table-cell">
                        {formatFileSize(pf.size)}
                      </td>
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-right text-terminal-neon-cyan">
                        {pf.savings}%
                      </td>
                      <td className="p-2 sm:p-3 text-center hidden md:table-cell">
                        <span className={`inline-block px-2 py-1 font-mono text-xs font-bold ${
                          result.status === 'success'
                            ? 'bg-terminal-neon-green text-terminal-bg'
                            : 'bg-terminal-neon-red text-terminal-bg'
                        }`}>
                          {result.status === 'success' ? '✓' : '✗'}
                        </span>
                      </td>
                    </tr>
                  ))
                } else {
                  // Video results or error
                  return (
                    <tr
                      key={index}
                      className="border-b border-terminal-border hover:bg-terminal-bg transition-colors"
                    >
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-terminal-text truncate max-w-[120px] sm:max-w-none">
                        {result.name}
                        {result.error && (
                          <div className="text-xs text-terminal-neon-red mt-1">
                            Error: {result.error}
                          </div>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-right text-terminal-text">
                        {formatFileSize(result.beforeSize || 0)}
                      </td>
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-right text-terminal-neon-green hidden sm:table-cell">
                        {result.afterSize ? formatFileSize(result.afterSize) : '-'}
                      </td>
                      <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-right text-terminal-neon-cyan">
                        {result.savings || '-'}%
                      </td>
                      <td className="p-2 sm:p-3 text-center hidden md:table-cell">
                        <span className={`inline-block px-2 py-1 font-mono text-xs font-bold ${
                          result.status === 'success'
                            ? 'bg-terminal-neon-green text-terminal-bg'
                            : 'bg-terminal-neon-red text-terminal-bg'
                        }`}>
                          {result.status === 'success' ? '✓' : '✗'}
                        </span>
                      </td>
                    </tr>
                  )
                }
              })}
            </tbody>
          </table>
        </div>

        {processing && (
          <div className="p-4 border-t-2 border-terminal-neon-green">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-terminal-neon-green rounded-full animate-pulse-neon"></div>
              <span className="font-mono text-sm font-bold text-terminal-neon-green">
                PROCESSING IN PROGRESS...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
