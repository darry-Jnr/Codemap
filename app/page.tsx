"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import OnboardingScreen from "./components/OnboardingScreen"

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
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("codemap_username")
    if (saved) {
      const userId = localStorage.getItem("codemap_user_id")
      if (userId && !document.cookie.includes("codemap_user_id")) {
        setCookie("codemap_user_id", userId)
      }
      router.replace("/home")
      return
    }
    const seenOnboarding = localStorage.getItem("codemap_onboarded")
    if (!seenOnboarding) setShowOnboarding(true)
    setChecking(false)
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
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

      // ── Save locally and set cookie FIRST, redirect immediately ──
      localStorage.setItem("codemap_user_id", userId)
      localStorage.setItem("codemap_username", trimmed)
      setCookie("codemap_user_id", userId)

      // ── Redirect right away — don't wait for Firestore ──
      router.push("/home")

      // ── Write to Firestore in the background ──
      setDoc(doc(db, "users", userId), {
        displayName: trimmed,
        createdAt: new Date(),
      }).catch((err) => {
        // Non-blocking — user is already on home page
        console.error("Firestore write failed:", err)
      })

    } catch (err) {
      console.error(err)
      setError("Something went wrong — try again")
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    )
  }

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
              style={{
                fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui",
                letterSpacing: "-0.02em",
              }}
            >
              CodeMap
            </h1>
            <p className="text-sm text-gray-400 mt-1">Find your people, not their coordinates</p>
          </div>
        </div>

        {/* Input */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <input
            type="text"
            placeholder="What's your name?"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={32}
            autoFocus
            className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-base outline-none transition-colors"
            style={{
              fontFamily: "'SF Pro Text', 'Helvetica Neue', system-ui",
              borderColor: error ? "#FCA5A5" : undefined,
            }}
            onFocus={(e) => e.target.style.borderColor = "#6366F1"}
            onBlur={(e) => e.target.style.borderColor = error ? "#FCA5A5" : "#E5E7EB"}
          />

          {error && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="w-full rounded-2xl py-4 font-semibold text-white flex items-center justify-center min-h-[56px] transition-all duration-150"
            style={{
              background: name.trim()
                ? "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)"
                : "#E5E7EB",
              color: name.trim() ? "white" : "#9CA3AF",
              boxShadow: name.trim() ? "0 8px 24px rgba(99,102,241,0.3)" : "none",
              fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui",
              transform: loading ? "scale(0.98)" : "scale(1)",
            }}
          >
            {loading ? (
              <span className="flex gap-1.5">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              "Let's go →"
            )}
          </button>

          <button
            onClick={() => setShowOnboarding(true)}
            className="text-sm text-gray-300 text-center mt-1 transition-colors"
            style={{ fontFamily: "'SF Pro Text', system-ui" }}
          >
            How does CodeMap work?
          </button>
        </div>
      </div>
    </>
  )
}