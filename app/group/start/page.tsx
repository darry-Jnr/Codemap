"use client"

import { useState, useEffect, useRef } from "react"
import { Copy, Check, X, Users, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, addDoc, Timestamp, doc, updateDoc, onSnapshot } from "firebase/firestore"

const MAX_MEMBERS = 10

export default function GroupStartPage() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("2:00:00")
  const expiryRef = useRef<Date | null>(null)

  // Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (!expiryRef.current) return
      const diff = expiryRef.current.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft("Expired"); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(h > 0
        ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        : `${m}:${s.toString().padStart(2, "0")}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Realtime members listener
  useEffect(() => {
    if (!sessionId) return
    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      const data = snap.data()
      if (!data) return
      if (data.members) setMembers(data.members)
      if (data.status === "cancelled") {
        setCode(null); setSessionId(null); setMembers([])
      }
    })
    return () => unsub()
  }, [sessionId])

  const generateCode = async () => {
    setLoading(true)
    try {
      const ownerId = localStorage.getItem("codemap_user_id")
      const ownerName = localStorage.getItem("codemap_username")
      if (!ownerId || !ownerName) { router.push("/"); return }

      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      const expiryDate = new Date(Date.now() + 2 * 60 * 60 * 1000)

      const docRef = await addDoc(collection(db, "sessions"), {
        code: randomCode,
        ownerId,
        ownerName,
        status: "active",
        type: "group",
        expiresAt: Timestamp.fromDate(expiryDate),
        createdAt: Timestamp.now(),
        members: [],
        maxMembers: MAX_MEMBERS,
      })

      expiryRef.current = expiryDate
      setSessionId(docRef.id)
      setCode(randomCode)
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

  const handleStop = async () => {
    try {
      if (sessionId) await updateDoc(doc(db, "sessions", sessionId), { status: "cancelled" })
      localStorage.removeItem("codemap_session_id")
      localStorage.removeItem("codemap_role")
      setCode(null); setSessionId(null); setMembers([]); setShowConfirm(false)
    } catch (err) { console.error(err) }
  }

  const isFull = members.length >= MAX_MEMBERS

  return (
    <div
      className="flex flex-col px-6 py-8 pb-28 min-h-screen"
      style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      <div className="mb-8">
        <p className="text-sm font-semibold mb-1" style={{ color: "#F97316", letterSpacing: "0.02em" }}>YOU'RE THE LEADER</p>
        <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.03em" }}>Start a Group</h1>
        <p className="text-gray-400 mt-1 text-sm">Share the code — anyone who enters it joins instantly</p>
      </div>

      {/* Generate */}
      {!code && (
        <button
          onClick={generateCode}
          disabled={loading}
          className="rounded-3xl p-6 text-left active:scale-[0.98] transition-transform duration-150 disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
            boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}>
              {loading
                ? <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0ms]" /><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:150ms]" /><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:300ms]" /></span>
                : <Users size={22} color="white" />
              }
            </div>
            <div>
              <p className="font-bold text-white text-base">Generate Group Code</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>2 hour session · up to {MAX_MEMBERS} people</p>
            </div>
          </div>
        </button>
      )}

      {/* Active session */}
      {code && (
        <div className="flex flex-col gap-4">

          {/* Code card */}
          <div
            className="rounded-3xl p-6 flex flex-col items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
              border: "1.5px solid rgba(249,115,22,0.2)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#F97316" }}>Group Code</p>
            <p className="text-4xl font-bold tracking-[0.15em]" style={{ color: "#EA580C", fontFamily: "monospace" }}>
              {code}
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(249,115,22,0.1)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" style={{ animation: "cmPulse 1.5s ease-out infinite" }} />
              <span className="text-xs font-semibold" style={{ color: "#F97316" }}>Expires in {timeLeft}</span>
            </div>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="w-full rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200"
            style={{
              background: copied ? "#10B981" : "#F97316",
              color: "white",
              boxShadow: copied ? "0 6px 20px rgba(16,185,129,0.3)" : "0 6px 20px rgba(249,115,22,0.3)",
            }}
          >
            {copied ? <><Check size={20} />Copied!</> : <><Copy size={20} />Copy Code</>}
          </button>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Members Joined</h3>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: isFull ? "#FEE2E2" : "#EEF2FF",
                  color: isFull ? "#EF4444" : "#6366F1",
                }}
              >
                {members.length}/{MAX_MEMBERS}
              </span>
            </div>

            {members.length === 0 ? (
              <div
                className="rounded-2xl py-8 flex flex-col items-center gap-2"
                style={{ background: "#F9FAFB", border: "1.5px dashed #E5E7EB" }}
              >
                <Users size={24} style={{ color: "#D1D5DB" }} />
                <p className="text-sm text-gray-400">Waiting for people to join...</p>
                <p className="text-xs text-gray-300">Share the code above</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: "#F9FAFB", animation: "slideDown 0.3s ease" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #FFEDD5, #FED7AA)" }}
                    >
                      <span className="text-sm font-bold" style={{ color: "#F97316" }}>
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                    <span className="ml-auto text-xs text-gray-300">#{i + 1}</span>
                  </div>
                ))}
                {isFull && (
                  <div className="rounded-2xl py-3 px-4 text-center" style={{ background: "#FEE2E2" }}>
                    <p className="text-sm font-semibold text-red-500">Group is full ({MAX_MEMBERS}/{MAX_MEMBERS})</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Start tracking — go to map */}
          <button
            onClick={() => router.push("/group-map?role=owner")}
            className="w-full rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{
              background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
              color: "white",
              boxShadow: "0 8px 24px rgba(249,115,22,0.3)",
            }}
          >
            Start Tracking <ArrowRight size={20} />
          </button>

          {/* Stop */}
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-2xl py-3 font-semibold flex items-center justify-center gap-2"
            style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <X size={18} /> End Session
          </button>
        </div>
      )}

      {/* Confirm stop */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4 max-w-sm mx-auto">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900 text-center" style={{ letterSpacing: "-0.02em" }}>End group session?</h2>
            <p className="text-sm text-gray-400 text-center">This removes everyone from the session</p>
            <button onClick={handleStop} className="w-full bg-red-500 text-white rounded-2xl py-4 font-semibold active:scale-[0.98] transition-transform">Yes, End Session</button>
            <button onClick={() => setShowConfirm(false)} className="w-full text-gray-400 rounded-2xl py-3 font-semibold">Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cmPulse { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}