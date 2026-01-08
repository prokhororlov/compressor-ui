import { useState, useEffect } from 'react'

export default function ProcessingQueue({ files, onRemove, processing }) {
  const [previews, setPreviews] = useState({})

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // Generate preview URLs for image files
  useEffect(() => {
    const newPreviews = {}
    files.forEach((file, index) => {
      if (file.type && file.type.startsWith('image/')) {
        if (!previews[index]) {
          newPreviews[index] = URL.createObjectURL(file)
        }
      }
    })

    if (Object.keys(newPreviews).length > 0) {
      setPreviews(prev => ({ ...prev, ...newPreviews }))
    }

    // Cleanup function
    return () => {
      Object.values(newPreviews).forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  return (
    <div className="bg-terminal-surface border-2 border-terminal-border">
      <div className="p-4 border-b-2 border-terminal-border">
        <h3 className="font-mono text-lg font-bold text-terminal-text">
          {'>'} PROCESSING QUEUE ({files.length})
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border-b border-terminal-border hover:bg-terminal-bg transition-colors"
          >
            {/* Preview thumbnail */}
            {previews[index] && (
              <div className="flex-shrink-0 mr-4">
                <div className="w-16 h-16 border-2 border-terminal-neon-green overflow-hidden bg-terminal-bg flex items-center justify-center">
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm font-bold text-terminal-text truncate">
                {file.name}
              </div>
              <div className="font-mono text-xs text-terminal-muted mt-1">
                {formatFileSize(file.size)}
              </div>
            </div>

            <button
              onClick={() => onRemove(index)}
              disabled={processing}
              className="ml-4 px-3 py-1 font-mono text-xs border border-terminal-border
                       text-terminal-text hover:border-terminal-muted hover:text-terminal-muted
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              REMOVE
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
