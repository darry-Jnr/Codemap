"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore"
import WaitingModal from "../components/WaitingModal"

export default function FindPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showWaiting, setShowWaiting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [ownerName, setOwnerName] = useState<string | null>(null)

  // Only allow alphanumeric, max 8 chars, auto uppercase
  const handleCodeChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)
    setCode(cleaned)
    setError(null)
  }

  const validateCode = (): string | null => {
    if (!code.trim()) return "Please enter a code"
    if (code.length < 8) return `Code must be 8 characters (you have ${code.length})`
    return null
  }

  const handleConnect = async () => {
    const validationError = validateCode()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const finderId = localStorage.getItem("codemap_user_id")
      const finderName = localStorage.getItem("codemap_username")

      if (!finderId || !finderName) {
        router.push("/")
        return
      }

      const sessionsRef = collection(db, "sessions")
      const q = query(
        sessionsRef,
        where("code", "==", code.trim().toUpperCase()),
        where("status", "==", "waiting")
      )
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setError("Code not found — double check it or ask your friend to generate a new one")
        setLoading(false)
        return
      }

      const sessionDoc = snapshot.docs[0]
      const sessionData = sessionDoc.data()

      // Check expiry
      if (sessionData.expiresAt.toDate() < new Date()) {
        setError("This code has expired — ask your friend to generate a new one")
        setLoading(false)
        return
      }

      // Can't connect to own code
      if (sessionData.ownerId === finderId) {
        setError("That's your own code! Share it with a friend 😄")
        setLoading(false)
        return
      }

      await updateDoc(doc(db, "sessions", sessionDoc.id), {
        status: "pending",
        finderId,
        finderName,
        requestedAt: Timestamp.now(),
      })

      localStorage.setItem("codemap_session_id", sessionDoc.id)
      localStorage.setItem("codemap_role", "finder")

      setSessionId(sessionDoc.id)
      setOwnerName(sessionData.ownerName)
      setShowWaiting(true)
    } catch (err) {
      console.error(err)
      setError("Something went wrong — try again")
    } finally {
      setLoading(false)
    }
  }

  const isReady = code.length === 8 && !loading

  return (
    <div className="flex flex-col px-6 py-8 pb-24 gap-8">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Find a Friend</h1>
        <p className="text-gray-400 mt-1">Enter the code your friend shared</p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600">
          Friend's code
        </label>
        <input
          type="text"
          inputMode="text"
          placeholder="ABC123XY"
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          maxLength={8}
          className="w-full border border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] text-[#6366F1] outline-none focus:border-[#6366F1] uppercase transition-colors"
        />

        {/* Character counter */}
        <div className="flex items-center justify-between px-1">
          {error ? (
            <span className="text-red-400 text-sm">{error}</span>
          ) : (
            <span className="text-gray-300 text-sm">
              {code.length > 0 ? `${code.length}/8 characters` : "8 characters"}
            </span>
          )}
          {code.length > 0 && (
            <button
              onClick={() => { setCode(""); setError(null) }}
              className="text-xs text-gray-400 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Connect Button */}
      <button
        onClick={handleConnect}
        disabled={!isReady}
        className={`w-full rounded-2xl py-4 font-semibold text-base flex items-center justify-center gap-2 transition-all ${
          isReady
            ? "bg-[#6366F1] text-white active:scale-95"
            : "bg-[#6366F1]/30 text-white cursor-not-allowed"
        }`}
      >
        <Search size={20} />
        {loading ? "Connecting..." : "Connect"}
      </button>

      {/* Hint */}
      <p className="text-center text-sm text-gray-300">
        Ask your friend to tap "Share My Location" to get a code
      </p>

      {/* Waiting Modal */}
      {showWaiting && sessionId && ownerName && (
        <WaitingModal
          sessionId={sessionId}
          ownerName={ownerName}
          onClose={() => {
            setShowWaiting(false)
            setCode("")
            setSessionId(null)
            setOwnerName(null)
            localStorage.removeItem("codemap_session_id")
            localStorage.removeItem("codemap_role")
          }}
        />
      )}

    </div>
  )
}