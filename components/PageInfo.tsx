'use client'

import { useLang } from './Providers'

export function PageInfo({ en, tr }: { en: string; tr: string }) {
  const { lang } = useLang()
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
      {lang === 'tr' ? tr : en}
    </div>
  )
}
