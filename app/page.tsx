"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter a name")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check if username is already taken
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", name.trim().toLowerCase()))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        setError("That name is already taken — try another")
        setLoading(false)
        return
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, "users"), {
        username: name.trim().toLowerCase(),
        displayName: name.trim(),
        createdAt: new Date(),
      })

      // Save to localStorage so we remember this device
      localStorage.setItem("codemap_user_id", docRef.id)
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      
      {/* Logo */}
      <div className="w-16 h-16 bg-[#6366F1] rounded-2xl flex items-center justify-center mb-6">
        <span className="text-white text-2xl font-bold">C</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Welcome to CodeMap</h1>
      <p className="text-gray-400 mb-8 text-sm">Find your people, not their coordinates</p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6366F1]"
        />

        {error && (
          <span className="text-red-400 text-sm text-center">{error}</span>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#6366F1] text-white rounded-xl py-3 font-semibold disabled:opacity-50"
        >
          {loading ? "Checking..." : "Let's Go"}
        </button>
      </div>

    </div>
  )
}