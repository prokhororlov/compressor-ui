export default function Header() {
  return (
    <header className="border-b-2 border-terminal-neon-green bg-terminal-surface">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono text-lg sm:text-2xl font-bold neon-text mb-1">
              MEDIA_TOOLKIT://
            </h1>
            <p className="font-mono text-xs sm:text-sm text-terminal-muted hidden sm:block">
              &gt; Batch processing for images and videos
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-terminal-muted mb-1 hidden sm:block">STATUS</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-terminal-neon-green rounded-full animate-pulse-neon"></div>
              <span className="font-mono text-xs sm:text-sm font-bold text-terminal-neon-green">
                READY
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
