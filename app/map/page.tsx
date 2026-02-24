"use client"

import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"
import { useState, Suspense, useEffect, useRef } from "react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  ),
})

function MapContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role")
  const isOwner = role === "owner"
  const [showConfirm, setShowConfirm] = useState(false)
  const [friendName, setFriendName] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>("--:--")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showStoppedModal, setShowStoppedModal] = useState(false)
  const expiresAtRef = useRef<Date | null>(null)

  // Countdown timer — runs every second independently
  useEffect(() => {
    const interval = setInterval(() => {
      if (!expiresAtRef.current) return

      const diff = expiresAtRef.current.getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft("0:00")
        clearInterval(interval)
        router.push("/home")
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [router])

  // Firestore listener — watches for status changes
  useEffect(() => {
    const id = localStorage.getItem("codemap_session_id")
    if (!id) {
      router.push("/home")
      return
    }
    setSessionId(id)

    const unsub = onSnapshot(doc(db, "sessions", id), (snap) => {
      const data = snap.data()
      if (!data) return

      setFriendName(isOwner ? data.finderName : data.ownerName)

      // Store expiry for the countdown timer
      if (data.expiresAt) {
        expiresAtRef.current = data.expiresAt.toDate()
      }

      // Session was cancelled by owner
      if (data.status === "cancelled") {
        if (!isOwner) {
          // Finder sees the stopped modal
          setShowStoppedModal(true)
        } else {
          router.push("/home")
        }
      }
    })

    return () => unsub()
  }, [isOwner, router])

  const handleStopSharing = async () => {
    try {
      if (sessionId) {
        await updateDoc(doc(db, "sessions", sessionId), {
          status: "cancelled",
        })
      }
      localStorage.removeItem("codemap_session_id")
      localStorage.removeItem("codemap_role")
      router.push("/home")
    } catch (err) {
      console.error(err)
    }
  }

  const handleLeave = () => {
    localStorage.removeItem("codemap_session_id")
    localStorage.removeItem("codemap_role")
    router.push("/home")
  }

  return (
    <div className="relative w-full h-screen">

      {/* Full screen map */}
      <div className="absolute inset-0 w-full h-full">
        <MapView />
      </div>

      {/* Back arrow */}
      <button
        onClick={() => router.push("/home")}
        className="absolute top-4 left-4 z-50 bg-white rounded-full p-2 shadow-md"
      >
        <ArrowLeft size={20} className="text-gray-700" />
      </button>

      {/* Floating bottom card */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl px-6 py-5 flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Connected with</p>
            <p className="text-lg font-bold text-gray-900">
              {friendName ?? "..."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Session ends in</p>
            <p className="text-lg font-bold text-[#6366F1]">{timeLeft}</p>
          </div>
        </div>

        {isOwner ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-red-500 text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2"
          >
            <X size={20} />
            Stop Sharing
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="w-full border border-gray-200 text-gray-600 rounded-2xl py-3 font-semibold"
          >
            Leave Session
          </button>
        )}

      </div>

      {/* Stop sharing confirmation — owner only */}
      {showConfirm && (
        <div className="absolute inset-0 z-[100] bg-black/50 flex items-end">
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

      {/* Friend stopped sharing modal — finder only */}
      {showStoppedModal && (
        <div className="absolute inset-0 z-[100] bg-black/50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4 items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <X size={24} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">
              {friendName} stopped sharing
            </h2>
            <p className="text-sm text-gray-400 text-center">
              The session has ended
            </p>
            <button
              onClick={handleLeave}
              className="w-full bg-[#6366F1] text-white rounded-2xl py-3 font-semibold"
            >
              Go Home
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense>
      <MapContent />
    </Suspense>
  )
}