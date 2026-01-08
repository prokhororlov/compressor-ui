import { getDownloadUrl, downloadArchive } from '../services/api'

export default function Results({ results, processing, mode }) {
  // Filter results based on mode
  // Image results have processedFiles array, video results have filename
  const filteredResults = results.filter(result => {
    if (mode === 'images') {
      // Image results have processedFiles array
      return result.processedFiles !== undefined
    } else {
      // Video results have filename but no processedFiles
      return result.processedFiles === undefined
    }
  })
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = (filename) => {
    if (!filename) return
    const url = getDownloadUrl(filename)
    window.open(url, '_blank')
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
      alert(`Download failed: ${error.message}`)
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
          <h3 className="font-mono text-sm sm:text-base font-bold neon-text">
            {'>'} RESULTS
          </h3>
          {!processing && filteredResults.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="px-2 sm:px-3 py-1 sm:py-2 font-mono text-xs sm:text-sm font-bold border-2 border-terminal-neon-green
                       bg-terminal-neon-green text-terminal-bg hover:bg-terminal-bg hover:text-terminal-neon-green
                       transition-all"
            >
              <span className="hidden sm:inline">[ DOWNLOAD ALL ]</span>
              <span className="sm:hidden">[ ALL ]</span>
            </button>
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
                <th className="text-center p-2 sm:p-3 font-mono text-xs font-bold text-terminal-muted">
                  ACTION
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
                      <td className="p-2 sm:p-3 text-center">
                        <button
                          onClick={() => handleDownload(pf.filename)}
                          className="px-2 py-1 font-mono text-xs font-bold border border-terminal-neon-green
                                   text-terminal-neon-green hover:bg-terminal-neon-green hover:text-terminal-bg
                                   transition-all"
                        >
                          <span className="hidden sm:inline">DL</span>
                          <span className="sm:hidden">↓</span>
                        </button>
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
                      <td className="p-2 sm:p-3 text-center">
                        {result.filename && (
                          <button
                            onClick={() => handleDownload(result.filename)}
                            className="px-2 py-1 font-mono text-xs font-bold border border-terminal-neon-green
                                     text-terminal-neon-green hover:bg-terminal-neon-green hover:text-terminal-bg
                                     transition-all"
                          >
                            <span className="hidden sm:inline">DL</span>
                            <span className="sm:hidden">↓</span>
                          </button>
                        )}
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
