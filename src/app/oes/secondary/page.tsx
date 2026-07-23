'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SecondaryCountdownPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const updateCountdown = () => {
      // July 23, 2026, 12:00 PM Noon IST (UTC+5:30)
      const targetDate = new Date('2026-07-23T12:00:00+05:30').getTime()
      const now = new Date().getTime()
      const difference = targetDate - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        // Time's up, redirect to login
        window.location.href = '/oes/secondary/login'
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 bg-indigo-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">
            Secondary Submission Portal
          </h1>
          <p className="text-lg text-indigo-600 font-semibold">
            🎯 Opening TODAY at 12:00 PM
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <p className="text-gray-700 font-medium">
            Opens TODAY at <span className="text-indigo-600 font-bold">12:00 PM (Noon)</span>
          </p>

          <div className="grid grid-cols-4 gap-3">
            {/* Days */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
              <div className="text-3xl font-bold text-indigo-600">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-xs font-semibold text-gray-600 mt-1 uppercase">Days</div>
            </div>

            {/* Hours */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-xs font-semibold text-gray-600 mt-1 uppercase">Hours</div>
            </div>

            {/* Minutes */}
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4">
              <div className="text-3xl font-bold text-cyan-600">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs font-semibold text-gray-600 mt-1 uppercase">Minutes</div>
            </div>

            {/* Seconds */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4">
              <div className="text-3xl font-bold text-teal-600">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs font-semibold text-gray-600 mt-1 uppercase">Seconds</div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-2">
            <p className="text-sm text-gray-600">
              📋 Submit your secondary documents with your OES ID
            </p>
            <p className="text-sm text-gray-600">
              ⏰ You will have 7 days to complete your submission
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-left">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-blue-600">What to prepare:</span>
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-2">
            <li>✓ Student ID / Roll number</li>
            <li>✓ Latest marksheet (PDF)</li>
            <li>✓ Income proof document</li>
            <li>✓ Other supporting documents</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3 pt-4">
          <p className="text-xs text-gray-500">
            Portal opens in just a few minutes. Get ready to submit your documents!
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/oes"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
