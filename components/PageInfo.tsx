'use client'

import { useEffect, useState } from 'react'

function useLang(): 'en' | 'tr' {
  const [lang, setLang] = useState<'en' | 'tr'>('en')
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ba_lang')
      if (saved === 'tr') setLang('tr')
    } catch (_) {}
  }, [])
  return lang
}

export function PageInfo({ en, tr }: { en: string; tr: string }) {
  const lang = useLang()
  const text = lang === 'tr' ? tr : en

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '14px 16px',
      marginBottom: '4px',
      fontSize: '13px',
      color: 'var(--text-secondary)',
      lineHeight: '1.7',
      whiteSpace: 'pre-line',
    }}>
      {text}
    </div>
  )
}
