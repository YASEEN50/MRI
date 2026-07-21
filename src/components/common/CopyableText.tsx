'use client'

import { useState } from 'react'

interface CopyableTextProps {
  value: string
  className?: string
  mono?: boolean
}

export default function CopyableText({ value, className = '', mono = true }: CopyableTextProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`flex items-center gap-2 min-w-0 max-w-[65%] justify-end ${className}`}>
      <span
        className={`text-white break-all text-end ${mono ? 'font-mono text-xs' : 'text-sm'}`}
        title={value}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? 'تم النسخ' : 'نسخ'}
        title={copied ? 'تم النسخ' : 'نسخ'}
        className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
      >
        {copied ? '✓' : 'نسخ'}
      </button>
    </div>
  )
}
