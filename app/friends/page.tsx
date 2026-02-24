"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  addDoc,
  doc,
  Timestamp,
} from "firebase/firestore"
import { Users, Radio } from "lucide-react"

interface Friend {
  username: string
  displayName: string
  lastConnected: Date
}

export default function FriendsPage() {
  const router = useRouter()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    const fetchFriends = async () => {
      const userId = localStorage.getItem("codemap_user_id")
      if (!userId) {
        router.push("/")
        return
      }

      try {
        const friendsRef = collection(db, "users", userId, "friends")
        const snapshot = await getDocs(friendsRef)

        const list: Friend[] = snapshot.docs.map((doc) => ({
          username: doc.id,
          displayName: doc.data().displayName,
          lastConnected: doc.data().lastConnected?.toDate(),
        }))

        // Sort by most recently connected
        list.sort((a, b) => b.lastConnected?.getTime() - a.lastConnected?.getTime())
        setFriends(list)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchFriends()
  }, [router])

  const handleConnect = async (friend: Friend) => {
    setConnecting(friend.username)

    try {
      const ownerId = localStorage.getItem("codemap_user_id")
      const ownerName = localStorage.getItem("codemap_username")

      if (!ownerId || !ownerName) {
        router.push("/")
        return
      }

      // Auto generate a code
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 30 * 60 * 1000) // 30 min default
      )

      // Create session
      const docRef = await addDoc(collection(db, "sessions"), {
        code: randomCode,
        ownerId,
        ownerName,
        status: "waiting",
        expiresAt,
        createdAt: Timestamp.now(),
        type: "quick",
        // Pre-fill the friend so they get notified
        targetFriendId: friend.username,
        targetFriendName: friend.displayName,
      })

      localStorage.setItem("codemap_session_id", docRef.id)
      localStorage.setItem("codemap_role", "owner")

      // Go to share page to wait for accept
      router.push(`/share?sessionId=${docRef.id}&friendName=${friend.displayName}`)

    } catch (err) {
      console.error(err)
    } finally {
      setConnecting(null)
    }
  }

  const formatLastSeen = (date: Date) => {
    if (!date) return ""
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="flex flex-col px-6 py-8 pb-24 gap-6">

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
        <p className="text-gray-400 mt-1">People you've connected with</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && friends.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Users size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-400 text-center text-sm">
            No friends yet — connect with someone using a code and they'll appear here
          </p>
        </div>
      )}

      {/* Friends list */}
      {!loading && friends.length > 0 && (
        <div className="flex flex-col gap-3">
          {friends.map((friend) => (
            <div
              key={friend.username}
              className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 shadow-sm"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                  <span className="text-[#6366F1] font-bold text-sm">
                    {friend.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{friend.displayName}</p>
                  <p className="text-xs text-gray-400">
                    Last connected {formatLastSeen(friend.lastConnected)}
                  </p>
                </div>
              </div>

              {/* Connect button */}
              <button
                onClick={() => handleConnect(friend)}
                disabled={connecting === friend.username}
                className="flex items-center gap-1 bg-[#6366F1] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                <Radio size={14} />
                {connecting === friend.username ? "..." : "Connect"}
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}