'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ba_theme')
      const dark = saved !== 'light'
      setIsDark(dark)
    } catch (_) {}
  }, [])

  function toggle() {
    const next = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.classList.toggle('light', next === 'light')
    try { localStorage.setItem('ba_theme', next) } catch (_) {}
  }

  return (
    <button
      onClick={toggle}
      title="Toggle theme"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '5px 10px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
