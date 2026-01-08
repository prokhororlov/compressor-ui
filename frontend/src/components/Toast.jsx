import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'error', duration = 5000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const typeStyles = {
    error: 'border-terminal-neon-red text-terminal-neon-red',
    success: 'border-terminal-neon-green text-terminal-neon-green',
    warning: 'border-terminal-neon-yellow text-terminal-neon-yellow',
    info: 'border-terminal-neon-cyan text-terminal-neon-cyan'
  }

  const typeIcons = {
    error: '✕',
    success: '✓',
    warning: '!',
    info: 'i'
  }

  return (
    <div
      className={`terminal-border bg-terminal-surface p-3 pr-8 shadow-lg animate-slide-in ${typeStyles[toast.type] || typeStyles.error}`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <span className="font-mono font-bold text-sm shrink-0">
          [{typeIcons[toast.type] || typeIcons.error}]
        </span>
        <p className="font-mono text-sm text-terminal-text break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="absolute top-2 right-2 font-mono text-terminal-muted hover:text-terminal-text transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export default ToastProvider
