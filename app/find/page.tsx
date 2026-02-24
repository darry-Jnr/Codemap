"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore"
import WaitingModal from "../components/WaitingModal"

export default function FindPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showWaiting, setShowWaiting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [ownerName, setOwnerName] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!code.trim()) {
      setError("Please enter a code first")
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
        setError("Code not found or already expired")
        setLoading(false)
        return
      }

      const sessionDoc = snapshot.docs[0]
      const sessionData = sessionDoc.data()

      if (sessionData.expiresAt.toDate() < new Date()) {
        setError("This code has expired")
        setLoading(false)
        return
      }

      if (sessionData.ownerId === finderId) {
        setError("You can't connect to your own code 😄")
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
          Paste your friend's code
        </label>
        <input
          type="text"
          placeholder="E.G., ABC123XYZ"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError(null)
          }}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest text-[#6366F1] outline-none focus:border-[#6366F1] uppercase"
        />
        {error && (
          <span className="text-red-400 text-sm text-center">{error}</span>
        )}
      </div>

      {/* Connect Button */}
      <button
        onClick={handleConnect}
        disabled={loading || code.trim().length < 8}
        className={`w-full rounded-2xl py-4 font-semibold text-base flex items-center justify-center gap-2 transition-all ${
          code.trim().length >= 8 && !loading
            ? "bg-[#6366F1] text-white"
            : "bg-[#6366F1]/30 text-white cursor-not-allowed"
        }`}
      >
        <Search size={20} />
        {loading ? "Connecting..." : "Connect"}
      </button>

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