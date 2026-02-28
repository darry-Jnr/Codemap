"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import {
  collection, getDocs, addDoc, doc,
  setDoc, Timestamp, query, orderBy, limit
} from "firebase/firestore"
import { Clock, Radio, Users, MapPin } from "lucide-react"

interface RecentSession {
  id: string
  type: "quick" | "hangout" | "group"
  // 1v1 fields
  friendId?: string
  friendName?: string
  // group fields
  ownerName?: string
  memberCount?: number
  wasLeader?: boolean
  // shared
  createdAt: Date
  role: "owner" | "finder" | "member"
}

export default function RecentsPage() {
  const router = useRouter()
  const [recents, setRecents] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecents = async () => {
      const userId = localStorage.getItem("codemap_user_id")
      if (!userId) { router.push("/"); return }

      try {
        // Pull friends list for 1v1 recents
        const friendsSnap = await getDocs(collection(db, "users", userId, "friends"))
        const friends = friendsSnap.docs.map((d) => ({
          id: d.id,
          displayName: d.data().displayName,
          lastConnected: d.data().lastConnected?.toDate(),
        }))
        friends.sort((a, b) => (b.lastConnected?.getTime() || 0) - (a.lastConnected?.getTime() || 0))

        // Build recents list
        const list: RecentSession[] = friends.map((f) => ({
          id: f.id,
          type: "quick",
          friendId: f.id,
          friendName: f.displayName,
          createdAt: f.lastConnected,
          role: "owner",
        }))

        setRecents(list)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecents()
  }, [router])

  const handleConnect = async (friendId: string, friendName: string) => {
    setConnecting(friendId)
    try {
      const ownerId = localStorage.getItem("codemap_user_id")
      const ownerName = localStorage.getItem("codemap_username")
      if (!ownerId || !ownerName) { router.push("/"); return }

      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000))

      const docRef = await addDoc(collection(db, "sessions"), {
        code: randomCode, ownerId, ownerName,
        status: "pending", expiresAt,
        createdAt: Timestamp.now(), type: "quick",
        finderId: friendId, finderName: friendName,
      })

      await setDoc(doc(db, "users", friendId, "requests", "incoming"), {
        sessionId: docRef.id, fromId: ownerId,
        fromName: ownerName, createdAt: Timestamp.now(),
      })

      localStorage.setItem("codemap_session_id", docRef.id)
      localStorage.setItem("codemap_role", "owner")
      router.push(`/waiting?sessionId=${docRef.id}&friendName=${friendName}`)
    } catch (err) {
      console.error(err)
    } finally {
      setConnecting(null) }
  }

  const formatTime = (date: Date) => {
    if (!date) return ""
    const diff = Date.now() - date.getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 1) return "Just now"
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    if (d < 7) return `${d}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const isGroup = (r: RecentSession) => r.type === "group"

  return (
    <div
      className="flex flex-col px-6 py-8 pb-28 min-h-screen"
      style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold mb-1" style={{ color: "#6366F1", letterSpacing: "0.02em" }}>HISTORY</p>
        <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.03em" }}>Recents</h1>
        <p className="text-gray-400 mt-1 text-sm">Your past meetups and group sessions</p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {!loading && recents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-2" style={{ background: "#F3F4F6" }}>
            <Clock size={28} style={{ color: "#D1D5DB" }} />
          </div>
          <p className="font-semibold text-gray-400">No sessions yet</p>
          <p className="text-sm text-gray-300 text-center px-6">
            Your meetups and group sessions will show up here
          </p>
          <button
            onClick={() => router.push("/home")}
            className="mt-2 px-6 py-2.5 rounded-2xl font-semibold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}
          >
            Start a session
          </button>
        </div>
      )}

      {!loading && recents.length > 0 && (
        <div className="flex flex-col gap-3">
          {recents.map((session) => {
            const group = isGroup(session)

            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">

                  {/* Avatar / icon */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: group
                        ? "linear-gradient(135deg, #FFF7ED, #FFEDD5)"
                        : "linear-gradient(135deg, #EEF2FF, #E0E7FF)",
                    }}
                  >
                    {group
                      ? <Users size={18} style={{ color: "#F97316" }} />
                      : <span className="text-base font-bold" style={{ color: "#6366F1" }}>
                          {session.friendName?.charAt(0).toUpperCase()}
                        </span>
                    }
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {group
                          ? (session.wasLeader ? `You led a group` : `${session.ownerName}'s group`)
                          : session.friendName
                        }
                      </p>
                      {/* Badge */}
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: group ? "#FFF7ED" : "#EEF2FF",
                          color: group ? "#F97316" : "#6366F1",
                        }}
                      >
                        {group
                          ? (session.wasLeader ? "Leader" : `${session.memberCount || 0} members`)
                          : (session.role === "owner" ? "You shared" : "You joined")
                        }
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {formatTime(session.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Connect button — 1v1 only */}
                {!group && session.friendId && (
                  <button
                    onClick={() => handleConnect(session.friendId!, session.friendName!)}
                    disabled={connecting === session.friendId}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm ml-3 flex-shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                      color: "white",
                      boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
                    }}
                  >
                    <Radio size={14} />
                    {connecting === session.friendId ? "..." : "Meet"}
                  </button>
                )}

                {/* Group — no connect button, just a label */}
                {group && (
                  <div
                    className="flex items-center gap-1 px-3 py-2 rounded-xl ml-3 flex-shrink-0"
                    style={{ background: "#FFF7ED" }}
                  >
                    <MapPin size={13} style={{ color: "#F97316" }} />
                    <span className="text-xs font-semibold" style={{ color: "#F97316" }}>Group</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}