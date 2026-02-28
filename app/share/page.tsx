"use client"

import { useState, useEffect } from "react"
import { Copy, Check, X, Zap, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, addDoc, Timestamp, doc, updateDoc, onSnapshot } from "firebase/firestore"
import AcceptModal from "../components/AcceptModal"

export default function SharePage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [finderName, setFinderName] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<"quick" | "hangout" | null>(null)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const expiresAtRef = useState<Date | null>(null)

  // Countdown timer
  useEffect(() => {
    if (!expiresAtRef[0]) return
    const interval = setInterval(() => {
      const diff = expiresAtRef[0]!.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft("Expired"); clearInterval(interval); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAtRef[0]])

  // Realtime listener
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
        setCode(null); setSessionId(null); setShowAcceptModal(false); setTimeLeft(null)
      }
    })
    return () => unsub()
  }, [sessionId])

  const generateCode = async (type: "quick" | "hangout") => {
    setLoading(true)
    try {
      const ownerId = localStorage.getItem("codemap_user_id")
      const ownerName = localStorage.getItem("codemap_username")
      if (!ownerId || !ownerName) { router.push("/"); return }

      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      const minutes = type === "quick" ? 30 : 120
      const expiryDate = new Date(Date.now() + minutes * 60 * 1000)
      const expiresAt = Timestamp.fromDate(expiryDate)

      const docRef = await addDoc(collection(db, "sessions"), {
        code: randomCode, ownerId, ownerName,
        status: "waiting", expiresAt,
        createdAt: Timestamp.now(), type,
      })

      expiresAtRef[1](expiryDate)
      setSessionId(docRef.id)
      setCode(randomCode)
      setSessionType(type)
      localStorage.setItem("codemap_session_id", docRef.id)
      localStorage.setItem("codemap_role", "owner")
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStopSharing = async () => {
    try {
      if (sessionId) await updateDoc(doc(db, "sessions", sessionId), { status: "cancelled" })
      localStorage.removeItem("codemap_session_id")
      localStorage.removeItem("codemap_role")
      setCode(null); setSessionId(null); setShowConfirm(false); setTimeLeft(null)
    } catch (err) { console.error(err) }
  }

  return (
    <div
      className="flex flex-col px-6 py-8 pb-28 gap-8 min-h-screen"
      style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: "#6366F1", letterSpacing: "0.02em" }}>LOCATION SHARING</p>
        <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.03em" }}>Share My Location</h1>
        <p className="text-gray-400 mt-1 text-sm">Choose how long you want to share</p>
      </div>

      {/* Session type buttons — only when no code */}
      {!code && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => generateCode("quick")}
            disabled={loading}
            className="relative overflow-hidden rounded-2xl p-5 text-left active:scale-[0.98] transition-transform duration-150 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              boxShadow: "0 6px 24px rgba(99,102,241,0.3)",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}>
                <Zap size={22} color="white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-white text-base">Quick Meet</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>30 minutes · perfect for nearby meetups</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => generateCode("hangout")}
            disabled={loading}
            className="relative overflow-hidden rounded-2xl p-5 text-left active:scale-[0.98] transition-transform duration-150 disabled:opacity-50"
            style={{
              background: "#F9FAFB",
              border: "1.5px solid #E5E7EB",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#EEF2FF" }}>
                <Clock size={22} style={{ color: "#6366F1" }} strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Hang Out</p>
                <p className="text-sm text-gray-400">2 hours · for longer meetups</p>
              </div>
            </div>
          </button>

          {loading && (
            <div className="flex justify-center py-2">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active session */}
      {code && (
        <div className="flex flex-col gap-4">

          {/* Session type badge */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: "cmPulse 2s ease-out infinite" }} />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {sessionType === "quick" ? "Quick Meet · 30 min" : "Hang Out · 2 hours"}
            </span>
          </div>

          {/* Code card */}
          <div
            className="rounded-3xl p-6 flex flex-col items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)",
              border: "1.5px solid rgba(99,102,241,0.15)",
            }}
          >
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Your code</p>
            <p
              className="text-4xl font-bold text-indigo-600 tracking-[0.15em]"
              style={{ fontFamily: "monospace" }}
            >
              {code}
            </p>
            {timeLeft && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(99,102,241,0.1)" }}>
                <Clock size={12} style={{ color: "#6366F1" }} />
                <span className="text-xs font-semibold" style={{ color: "#6366F1" }}>
                  Expires in {timeLeft}
                </span>
              </div>
            )}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150"
            style={{
              background: copied ? "#10B981" : "#6366F1",
              color: "white",
              boxShadow: copied ? "0 6px 20px rgba(16,185,129,0.3)" : "0 6px 20px rgba(99,102,241,0.3)",
              transition: "background 0.3s ease, box-shadow 0.3s ease",
            }}
          >
            {copied ? <><Check size={20} /> Copied!</> : <><Copy size={20} /> Copy Code</>}
          </button>

          {/* Stop sharing */}
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <X size={20} />
            Stop Sharing
          </button>
        </div>
      )}

      {/* Stop confirmation sheet */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end" style={{ backdropFilter: "blur(4px)" }}>
          <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4 max-w-sm mx-auto">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900 text-center" style={{ letterSpacing: "-0.02em" }}>Stop sharing?</h2>
            <p className="text-sm text-gray-400 text-center">This ends the session for both of you</p>
            <button onClick={handleStopSharing} className="w-full bg-red-500 text-white rounded-2xl py-4 font-semibold active:scale-[0.98] transition-transform">
              Yes, Stop Sharing
            </button>
            <button onClick={() => setShowConfirm(false)} className="w-full text-gray-400 rounded-2xl py-3 font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAcceptModal && finderName && sessionId && (
        <AcceptModal sessionId={sessionId} finderName={finderName} onClose={() => setShowAcceptModal(false)} />
      )}

      <style>{`@keyframes cmPulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.8);opacity:0}}`}</style>
    </div>
  )
}