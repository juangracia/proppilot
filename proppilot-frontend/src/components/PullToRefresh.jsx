import { Box, CircularProgress } from '@mui/material'
import { usePullToRefresh } from '../hooks/usePullToRefresh'

const PullToRefresh = ({ onRefresh, children, disabled = false }) => {
  const {
    containerRef,
    refreshing,
    pullDistance,
    showIndicator,
    progress,
    handlers,
  } = usePullToRefresh(onRefresh, { disabled })

  return (
    <Box
      ref={containerRef}
      {...handlers}
      sx={{ position: 'relative', minHeight: '100%' }}
    >
      {/* Pull indicator */}
      {showIndicator && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: `translate(-50%, ${Math.min(pullDistance - 40, 20)}px)`,
            transition: refreshing ? 'none' : 'transform 0.1s ease-out',
            zIndex: 10,
          }}
        >
          <CircularProgress
            size={32}
            variant={refreshing ? 'indeterminate' : 'determinate'}
            value={progress * 100}
          />
        </Box>
      )}

      {/* Content with offset when pulling */}
      <Box
        sx={{
          transform: showIndicator && !refreshing ? `translateY(${pullDistance * 0.5}px)` : 'none',
          transition: refreshing ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default PullToRefresh
