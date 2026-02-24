"use client"

import { useState, useEffect } from "react"
import { Copy, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, addDoc, Timestamp, doc, updateDoc, onSnapshot } from "firebase/firestore"
import AcceptModal from "../components/AcceptModal"

export default function SharePage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [expiry, setExpiry] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [finderName, setFinderName] = useState<string | null>(null)

  // Listen for incoming requests in realtime
  useEffect(() => {
    if (!sessionId) return

    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      const data = snap.data()
      if (!data) return

      if (data.status === "pending" && data.finderName) {
        setFinderName(data.finderName)
        setShowAcceptModal(true)
      }

      if (data.status === "cancelled") {
        setCode(null)
        setExpiry(null)
        setSessionId(null)
        setShowAcceptModal(false)
      }
    })

    return () => unsub()
  }, [sessionId])

  const generateCode = async (type: "quick" | "hangout") => {
    setLoading(true)

    try {
      const ownerId = localStorage.getItem("codemap_user_id")
      const ownerName = localStorage.getItem("codemap_username")

      if (!ownerId || !ownerName) {
        router.push("/")
        return
      }

      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      const minutes = type === "quick" ? 30 : 120
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + minutes * 60 * 1000)
      )

      const docRef = await addDoc(collection(db, "sessions"), {
        code: randomCode,
        ownerId,
        ownerName,
        status: "waiting",
        expiresAt,
        createdAt: Timestamp.now(),
        type,
      })

      setSessionId(docRef.id)
      setCode(randomCode)
      setExpiry(type === "quick" ? "30:00" : "2:00:00")

      localStorage.setItem("codemap_session_id", docRef.id)
      localStorage.setItem("codemap_role", "owner")

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStopSharing = async () => {
    try {
      if (sessionId) {
        await updateDoc(doc(db, "sessions", sessionId), {
          status: "cancelled",
        })
      }
      localStorage.removeItem("codemap_session_id")
      localStorage.removeItem("codemap_role")
      setCode(null)
      setExpiry(null)
      setSessionId(null)
      setShowConfirm(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col px-6 py-8 pb-24 gap-8">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Share My Location</h1>
        <p className="text-gray-400 mt-1">Pick how long you want to share</p>
      </div>

      {/* Buttons */}
      {!code && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => generateCode("quick")}
            disabled={loading}
            className="w-full bg-[#6366F1] text-white rounded-2xl py-4 font-semibold text-base disabled:opacity-50"
          >
            {loading ? "Generating..." : "Quick Meet (30 min)"}
          </button>
          <button
            onClick={() => generateCode("hangout")}
            disabled={loading}
            className="w-full border-2 border-[#6366F1] text-[#6366F1] rounded-2xl py-4 font-semibold text-base disabled:opacity-50"
          >
            {loading ? "Generating..." : "Hang Out (2 hours)"}
          </button>
        </div>
      )}

      {/* Code Box */}
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-2 min-h-[120px] justify-center">
        {code ? (
          <>
            <span className="text-3xl font-bold text-[#6366F1] tracking-widest">
              {code}
            </span>
            <span className="text-sm text-gray-400">
              Your code will expire in {expiry}
            </span>
          </>
        ) : (
          <span className="text-gray-300 text-sm">Your code will appear here</span>
        )}
      </div>

      {/* Copy Button */}
      {code && (
        <button
          onClick={handleCopy}
          className="w-full bg-[#10B981] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check size={20} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={20} />
              Copy Code
            </>
          )}
        </button>
      )}

      {/* Stop Sharing Button */}
      {code && (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full bg-red-500 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2"
        >
          <X size={20} />
          Stop Sharing
        </button>
      )}

      {/* Stop Sharing Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900 text-center">
              Are you sure?
            </h2>
            <p className="text-sm text-gray-400 text-center">
              This will end the session for both of you
            </p>
            <button
              onClick={handleStopSharing}
              className="w-full bg-red-500 text-white rounded-2xl py-3 font-semibold"
            >
              Yes, Stop Sharing
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full border border-gray-200 text-gray-600 rounded-2xl py-3 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Accept Modal — shows when friend types your code */}
      {showAcceptModal && finderName && sessionId && (
        <AcceptModal
          sessionId={sessionId}
          finderName={finderName}
          onClose={() => setShowAcceptModal(false)}
        />
      )}

    </div>
  )
}