"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { MapPin, Users, ChevronRight } from "lucide-react"

interface SessionState {
  id: string
  role: string
  type: string
  friendName: string
  ownerName: string
  status: string
}

const HIDE_ON = ["/", "/map", "/group-map", "/waiting"]

export default function ActiveSessionBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [sessionData, setSessionData] = useState<SessionState | null>(null)

  // Step 1 — wait for client mount before touching localStorage
  useEffect(() => {
    setMounted(true)
  }, [])

  // Step 2 — only after mount, read localStorage and set up Firestore listener
  useEffect(() => {
    if (!mounted) return

    const sessionId = localStorage.getItem("codemap_session_id")
    const role = localStorage.getItem("codemap_role")

    if (!sessionId || !role) {
      setSessionData(null)
      return
    }

    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      const data = snap.data()
      if (!data) { setSessionData(null); return }

      const isAlive = ["active", "waiting", "pending"].includes(data.status)
      if (!isAlive) {
        setSessionData(null)
        localStorage.removeItem("codemap_session_id")
        localStorage.removeItem("codemap_role")
        return
      }

      setSessionData({
        id: sessionId,
        role,
        type: data.type || "quick",
        friendName: role === "owner" ? (data.finderName || "") : data.ownerName,
        ownerName: data.ownerName,
        status: data.status,
      })
    })

    return () => unsub()
  }, [mounted, pathname])

  // Don't render anything until client is ready
  if (!mounted) return null

  // Hide on map/landing pages
  if (HIDE_ON.includes(pathname)) return null

  // No active session
  if (!sessionData) return null

  const isGroup = sessionData.type === "group"
  const isOwner = sessionData.role === "owner"

  const handleTap = () => {
    if (isGroup) router.push(`/group-map?role=${isOwner ? "owner" : "member"}`)
    else router.push(`/map?role=${isOwner ? "owner" : "finder"}`)
  }

  const label = isGroup
    ? isOwner
      ? "Leading group session"
      : `Following ${sessionData.ownerName}`
    : isOwner
      ? sessionData.friendName
        ? `Sharing with ${sessionData.friendName}`
        : "Waiting for someone..."
      : `${sessionData.friendName || "Someone"} is sharing with you`

  const bannerColor = isGroup
    ? "rgba(249,115,22,0.95)"
    : "rgba(99,102,241,0.95)"

  return (
    <button
      onClick={handleTap}
      className="fixed left-0 right-0 z-40 mx-auto flex items-center gap-3 px-4 py-3 active:scale-[0.98] transition-transform max-w-sm"
      style={{
        bottom: "64px",
        background: bannerColor,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "0.5px solid rgba(255,255,255,0.15)",
        borderBottom: "0.5px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Pulse dot */}
      <span
        className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0"
        style={{ animation: "cmPulse 1.5s ease-out infinite" }}
      />

      {/* Icon */}
      {isGroup
        ? <Users size={16} color="rgba(255,255,255,0.9)" className="flex-shrink-0" />
        : <MapPin size={16} color="rgba(255,255,255,0.9)" className="flex-shrink-0" />
      }

      {/* Label */}
      <p className="flex-1 text-sm font-semibold text-white truncate text-left"
        style={{ fontFamily: "'SF Pro Text', system-ui" }}>
        {label}
      </p>

      {/* Return hint */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Return</span>
        <ChevronRight size={14} color="rgba(255,255,255,0.7)" />
      </div>

      <style>{`@keyframes cmPulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.8);opacity:0}}`}</style>
    </button>
  )
}