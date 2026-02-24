"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  Timestamp,
  setDoc,
  getDoc,
} from "firebase/firestore"
import { Check, X } from "lucide-react"

export default function IncomingRequest() {
  const router = useRouter()
  const [request, setRequest] = useState<{
    sessionId: string
    fromName: string
  } | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem("codemap_user_id")
    if (!userId) return

    // Listen to incoming requests on this user's doc
    const unsub = onSnapshot(
      doc(db, "users", userId, "requests", "incoming"),
      (snap) => {
        if (!snap.exists()) return
        const data = snap.data()
        if (!data) return
        setRequest({
          sessionId: data.sessionId,
          fromName: data.fromName,
        })
      }
    )

    return () => unsub()
  }, [])

  const handleAccept = async () => {
    if (!request) return

    try {
      const userId = localStorage.getItem("codemap_user_id")
      const userName = localStorage.getItem("codemap_username")
      if (!userId || !userName) return

      // Get session to find owner info
      const sessionSnap = await getDoc(doc(db, "sessions", request.sessionId))
      const sessionData = sessionSnap.data()
      if (!sessionData) return

      // Mark session active
      await updateDoc(doc(db, "sessions", request.sessionId), {
        status: "active",
        acceptedAt: Timestamp.now(),
      })

      // Save friendship both ways
      await setDoc(
        doc(db, "users", userId, "friends", sessionData.ownerId),
        { displayName: sessionData.ownerName, lastConnected: Timestamp.now() },
        { merge: true }
      )
      await setDoc(
        doc(db, "users", sessionData.ownerId, "friends", userId),
        { displayName: userName, lastConnected: Timestamp.now() },
        { merge: true }
      )

      // Clear the incoming request
      await deleteDoc(doc(db, "users", userId, "requests", "incoming"))

      localStorage.setItem("codemap_session_id", request.sessionId)
      localStorage.setItem("codemap_role", "finder")

      setRequest(null)
      router.push("/map?role=finder")

    } catch (err) {
      console.error(err)
    }
  }

  const handleDecline = async () => {
    if (!request) return

    try {
      const userId = localStorage.getItem("codemap_user_id")
      if (!userId) return

      await updateDoc(doc(db, "sessions", request.sessionId), {
        status: "declined",
      })

      await deleteDoc(doc(db, "users", userId, "requests", "incoming"))

      setRequest(null)
    } catch (err) {
      console.error(err)
    }
  }

  if (!request) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center">
            {request.fromName} wants to meet up!
          </h2>
          <p className="text-sm text-gray-400 text-center">
            Accept to share your location with each other
          </p>
        </div>

        <button
          onClick={handleAccept}
          className="w-full bg-[#10B981] text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2"
        >
          <Check size={20} />
          Accept
        </button>

        <button
          onClick={handleDecline}
          className="w-full bg-red-500 text-white rounded-2xl py-3 font-semibold flex items-center justify-center gap-2"
        >
          <X size={20} />
          Decline
        </button>
      </div>
    </div>
  )
}