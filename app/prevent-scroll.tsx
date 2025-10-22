'use client'

import { useEffect } from 'react'

export default function PreventHorizontalScroll() {
  useEffect(() => {
    // Prevent horizontal scroll with JavaScript
    const preventHorizontalScroll = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // Prevent touch horizontal swipe
    let touchStartX = 0
    let touchStartY = 0

    const preventHorizontalTouch = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      }
    }

    const preventHorizontalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touchEndX = e.touches[0].clientX
        const touchEndY = e.touches[0].clientY
        const deltaX = Math.abs(touchEndX - touchStartX)
        const deltaY = Math.abs(touchEndY - touchStartY)

        // If horizontal movement is greater than vertical
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    }

    // Lock window scroll position on X axis
    const lockScroll = () => {
      if (window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY)
      }
    }

    // Force styles
    const forceStyles = () => {
      const html = document.documentElement
      const body = document.body

      // Apply critical styles
      html.style.overflowX = 'hidden'
      html.style.maxWidth = '100vw'
      html.style.width = '100%'

      body.style.overflowX = 'hidden'
      body.style.maxWidth = '100vw'
      body.style.width = '100%'

      // Set overscroll behavior
      html.style.setProperty('overscroll-behavior-x', 'none')
      body.style.setProperty('overscroll-behavior-x', 'none')
    }

    // Add all event listeners with passive: false to allow preventDefault
    document.addEventListener('wheel', preventHorizontalScroll, { passive: false })
    document.addEventListener('touchstart', preventHorizontalTouch, { passive: false })
    document.addEventListener('touchmove', preventHorizontalTouchMove, { passive: false })
    window.addEventListener('scroll', lockScroll, { passive: false })

    // Force lock immediately
    window.scrollTo(0, 0)
    forceStyles()

    // Re-apply styles every 100ms for first 3 seconds (to override any delayed CSS)
    const interval = setInterval(forceStyles, 100)
    setTimeout(() => clearInterval(interval), 3000)

    return () => {
      document.removeEventListener('wheel', preventHorizontalScroll)
      document.removeEventListener('touchstart', preventHorizontalTouch)
      document.removeEventListener('touchmove', preventHorizontalTouchMove)
      window.removeEventListener('scroll', lockScroll)
      clearInterval(interval)
    }
  }, [])

  return null
}
