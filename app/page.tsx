"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dots, setDots] = useState("")

  // Animate the three dots
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 400)
    return () => clearInterval(interval)
  }, [loading])

  // If already has a name saved, skip landing
  useEffect(() => {
    const saved = localStorage.getItem("codemap_username")
    if (saved) {
      router.push("/home")
      return
    }
    // Pre-warm Firestore connection while user is typing their name
    const warmUp = doc(db, "users", "warmup")
    getDoc(warmUp).catch(() => {}) // fire and forget, we dont care about result
  }, [router])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter a name")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const username = name.trim().toLowerCase()
      const userRef = doc(db, "users", username)

      // Direct lookup — instant, no scanning
      const existing = await getDoc(userRef)

      if (existing.exists()) {
        setError("That name is already taken — try another")
        setLoading(false)
        return
      }

      await setDoc(userRef, {
        username,
        displayName: name.trim(),
        createdAt: new Date(),
      })

      localStorage.setItem("codemap_user_id", username)
      localStorage.setItem("codemap_username", name.trim())

      router.push("/home")

    } catch (err) {
      setError("Something went wrong — try again")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">

      {/* Logo */}
      <div className="w-16 h-16 bg-[#6366F1] rounded-2xl flex items-center justify-center mb-6">
        <span className="text-white text-2xl font-bold">C</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Welcome to CodeMap</h1>
      <p className="text-gray-400 mb-8 text-sm text-center">
        Find your people, not their coordinates
      </p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6366F1]"
        />

        {error && (
          <span className="text-red-400 text-sm text-center">{error}</span>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#6366F1] text-white rounded-xl py-3 font-semibold disabled:opacity-70 flex items-center justify-center min-h-[48px]"
        >
          {loading ? (
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          ) : (
            "Let's Go"
          )}
        </button>
      </div>

    </div>
  )
}