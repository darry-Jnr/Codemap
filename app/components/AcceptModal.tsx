"use client"

import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, updateDoc, Timestamp } from "firebase/firestore"
import { Check, X } from "lucide-react"

interface AcceptModalProps {
  sessionId: string
  finderName: string
  onClose: () => void
}

export default function AcceptModal({ sessionId, finderName, onClose }: AcceptModalProps) {
  const router = useRouter()

  const handleAccept = async () => {
    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        status: "active",
        acceptedAt: Timestamp.now(),
      })
      router.push("/map?role=owner")
    } catch (err) {
      console.error(err)
    }
  }

  const handleDecline = async () => {
    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        status: "declined",
      })
      onClose()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4">

        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center">
            {finderName} wants to meet up!
          </h2>
          <p className="text-sm text-gray-400 text-center">
            Accept to share your location with each other
          </p>
        </div>

        {/* Buttons */}
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