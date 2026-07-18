'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PiLoginButton from '@/components/auth/PiLoginButton'
import { AuthLayout, AuthFooterLink } from '@/components/auth/AuthLayout'
import { clearExplicitLogout, isPiBrowser } from '@/lib/pi/pi-auth-client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [callbackUrl, setCallbackUrl] = useState('/')

  useEffect(() => {
    const paramCallback = searchParams.get('callbackUrl')
    if (paramCallback) {
      setCallbackUrl(paramCallback)
      return
    }
    if (isPiBrowser()) setCallbackUrl('/')
  }, [searchParams])

  useEffect(() => {
    clearExplicitLogout()
  }, [])

  return (
    <AuthLayout
      subtitle="منصة طبية موثوقة · Pi Network"
      cardTitle="مرحباً بك"
      hint="سجّل الدخول أو أنشئ حساباً جديداً عبر Pi Network فقط"
      footer={
        <AuthFooterLink href="/register">
          ليس لديك حساب؟ <strong style={{ color: 'var(--pi-accent)' }}>إنشاء حساب بـ Pi</strong>
        </AuthFooterLink>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-slate-300 text-sm leading-relaxed">
            🔒 الدخول والتسجيل متاحان حصرياً عبر <strong className="text-accent">Pi Browser</strong>
          </p>
        </div>

        <PiLoginButton callbackUrl={callbackUrl} />

        <p className="text-slate-500 text-xs text-center leading-relaxed">
          بالمتابعة، توافق على استخدام حساب Pi Network للمصادقة في MRI
        </p>
      </div>
    </AuthLayout>
  )
}
