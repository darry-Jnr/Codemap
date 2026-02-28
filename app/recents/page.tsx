"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, doc, setDoc, Timestamp } from "firebase/firestore"
import { MapPin, Users, Radio, Clock } from "lucide-react"

interface RecentPerson {
  username: string
  displayName: string
  lastConnected: Date
}

export default function RecentsPage() {
  const router = useRouter()
  const [recents, setRecents] = useState<RecentPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const userId = localStorage.getItem("codemap_user_id")
      if (!userId) { router.push("/"); return }
      try {
        const snap = await getDocs(collection(db, "users", userId, "friends"))
        const list: RecentPerson[] = snap.docs.map((d) => ({
          username: d.id,
          displayName: d.data().displayName,
          lastConnected: d.data().lastConnected?.toDate(),
        }))
        list.sort((a, b) => (b.lastConnected?.getTime() || 0) - (a.lastConnected?.getTime() || 0))
        setRecents(list)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [router])

  const handleConnect = async (person: RecentPerson) => {
    setConnecting(person.username)
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
        finderId: person.username, finderName: person.displayName,
      })

      await setDoc(doc(db, "users", person.username, "requests", "incoming"), {
        sessionId: docRef.id, fromId: ownerId, fromName: ownerName, createdAt: Timestamp.now(),
      })

      localStorage.setItem("codemap_session_id", docRef.id)
      localStorage.setItem("codemap_role", "owner")
      router.push(`/waiting?sessionId=${docRef.id}&friendName=${person.displayName}`)
    } catch (err) { console.error(err) }
    finally { setConnecting(null) }
  }

  const formatTime = (date: Date) => {
    if (!date) return ""
    const diff = Date.now() - date.getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    return `${d}d ago`
  }

  return (
    <div
      className="flex flex-col px-6 py-8 pb-28 min-h-screen"
      style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold mb-1" style={{ color: "#6366F1", letterSpacing: "0.02em" }}>HISTORY</p>
        <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.03em" }}>Recents</h1>
        <p className="text-gray-400 mt-1 text-sm">People you've connected with</p>
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
          <p className="font-semibold text-gray-400">No recent sessions</p>
          <p className="text-sm text-gray-300 text-center">People you meet up with will appear here for quick reconnect</p>
        </div>
      )}

      {!loading && recents.length > 0 && (
        <div className="flex flex-col gap-3">
          {recents.map((person) => (
            <div
              key={person.username}
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)" }}
                >
                  <span className="text-base font-bold" style={{ color: "#6366F1" }}>
                    {person.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{person.displayName}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {formatTime(person.lastConnected)}
                  </p>
                </div>
              </div>

              {/* Connect button */}
              <button
                onClick={() => handleConnect(person)}
                disabled={connecting === person.username}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
                }}
              >
                <Radio size={14} />
                {connecting === person.username ? "..." : "Meet"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}