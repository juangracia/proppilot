import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const usePullToRefresh = (onRefresh, options = {}) => {
  const { isNative } = useAuth()
  const { threshold = 80, disabled = false } = options

  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const containerRef = useRef(null)

  const handleRefresh = useCallback(async () => {
    if (refreshing || disabled || !isNative) return

    setRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh, refreshing, disabled, isNative])

  const handleTouchStart = useCallback((e) => {
    if (!isNative || disabled) return
    const scrollTop = containerRef.current?.scrollTop || window.scrollY
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY
    }
  }, [isNative, disabled])

  const handleTouchMove = useCallback((e) => {
    if (!isNative || disabled || startY.current === 0) return
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    if (diff > 0) {
      setPullDistance(Math.min(diff, threshold * 1.5))
    }
  }, [isNative, disabled, threshold])

  const handleTouchEnd = useCallback(() => {
    if (!isNative || disabled) return
    if (pullDistance >= threshold) {
      handleRefresh()
    } else {
      setPullDistance(0)
    }
    startY.current = 0
  }, [isNative, disabled, pullDistance, threshold, handleRefresh])

  return {
    containerRef,
    refreshing,
    pullDistance,
    showIndicator: pullDistance > 0 || refreshing,
    progress: Math.min(pullDistance / threshold, 1),
    handlers: isNative ? {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    } : {},
  }
}

export default usePullToRefresh
