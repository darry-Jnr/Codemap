"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import OnboardingScreen from "./components/OnboardingScreen"

// Helper — set a cookie readable by middleware
function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // If already logged in redirect to home
    const saved = localStorage.getItem("codemap_username")
    if (saved) { router.push("/home"); return }

    const seenOnboarding = localStorage.getItem("codemap_onboarded")
    if (!seenOnboarding) setShowOnboarding(true)

    setMounted(true)
  }, [router])

  const handleOnboardingDone = () => {
    localStorage.setItem("codemap_onboarded", "true")
    setShowOnboarding(false)
  }

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError("Please enter a name"); return }
    if (trimmed.length < 2) { setError("Name must be at least 2 characters"); return }
    if (trimmed.length > 32) { setError("Name is too long"); return }

    setLoading(true)
    setError(null)

    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

      await setDoc(doc(db, "users", userId), {
        displayName: trimmed,
        createdAt: new Date(),
      })

      // Save to localStorage
      localStorage.setItem("codemap_user_id", userId)
      localStorage.setItem("codemap_username", trimmed)

      // Set cookie so middleware can verify auth on every route
      setCookie("codemap_user_id", userId)

      router.push("/home")
    } catch (err) {
      console.error(err)
      setError("Something went wrong — try again")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <>
      {showOnboarding && <OnboardingScreen onDone={handleOnboardingDone} />}

      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-16 h-16">
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="512" height="512" rx="112" fill="#6366F1" />
              <circle cx="256" cy="220" r="140" fill="none" stroke="white" strokeWidth="18" opacity="0.2" />
              <circle cx="256" cy="220" r="110" fill="none" stroke="white" strokeWidth="18" opacity="0.35" />
              <circle cx="256" cy="220" r="80" fill="white" />
              <path d="M226 288 Q226 360 256 390 Q286 360 286 288Z" fill="white" />
              <circle cx="256" cy="220" r="36" fill="#6366F1" />
            </svg>
          </div>
          <div className="text-center">
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui", letterSpacing: "-0.02em" }}
            >
              CodeMap
            </h1>
            <p className="text-sm text-gray-400 mt-1">Find your people, not their coordinates</p>
          </div>
        </div>

        {/* Name input */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <input
            type="text"
            placeholder="What's your name?"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={32}
            autoFocus
            className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-base outline-none focus:border-indigo-400 transition-colors"
            style={{ fontFamily: "'SF Pro Text', 'Helvetica Neue', system-ui" }}
          />

          {error && <span className="text-red-400 text-sm text-center">{error}</span>}

          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="w-full rounded-2xl py-4 font-semibold text-white disabled:opacity-60 flex items-center justify-center min-h-[56px] active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
              fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui",
              letterSpacing: "-0.01em",
            }}
          >
            {loading ? (
              <span className="flex gap-1.5">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            ) : "Let's go →"}
          </button>

          <button
            onClick={() => setShowOnboarding(true)}
            className="text-sm text-gray-300 text-center mt-1 active:text-gray-500 transition-colors"
          >
            How does CodeMap work?
          </button>
        </div>
      </div>
    </>
  )
}