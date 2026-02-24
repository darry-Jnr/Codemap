"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { Loader2, X } from "lucide-react"

interface WaitingModalProps {
  sessionId: string
  ownerName: string
  onClose: () => void
}

export default function WaitingModal({ sessionId, ownerName, onClose }: WaitingModalProps) {
  const router = useRouter()
  const [status, setStatus] = useState("pending")

  useEffect(() => {
    // Listen to session changes in realtime
    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      const data = snap.data()
      if (!data) return

      if (data.status === "active") {
        // Owner accepted — go to map
        router.push("/map?role=finder")
      }

      if (data.status === "declined") {
        setStatus("declined")
        setTimeout(() => onClose(), 2000)
      }

      if (data.status === "cancelled") {
        setStatus("cancelled")
        setTimeout(() => onClose(), 2000)
      }
    })

    return () => unsub()
  }, [sessionId, router, onClose])

  const handleCancel = async () => {
    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        status: "waiting",
        finderId: null,
        finderName: null,
      })
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4 items-center">

        {status === "pending" && (
          <>
            <Loader2 size={40} className="text-[#6366F1] animate-spin" />
            <h2 className="text-lg font-bold text-gray-900 text-center">
              Waiting for {ownerName} to accept...
            </h2>
            <p className="text-sm text-gray-400 text-center">
              Hang tight — they'll get a notification now
            </p>
            <button
              onClick={handleCancel}
              className="w-full border border-gray-200 text-gray-600 rounded-2xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <X size={18} />
              Cancel Request
            </button>
          </>
        )}

        {status === "declined" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <X size={24} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">
              Request Declined
            </h2>
            <p className="text-sm text-gray-400 text-center">
              {ownerName} declined your request
            </p>
          </>
        )}

        {status === "cancelled" && (
          <>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <X size={24} className="text-gray-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">
              Session Ended
            </h2>
            <p className="text-sm text-gray-400 text-center">
              The owner stopped sharing
            </p>
          </>
        )}

      </div>
    </div>
  )
}