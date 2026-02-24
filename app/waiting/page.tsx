"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { Suspense } from "react"

function WaitingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  const friendName = searchParams.get("friendName")

  useEffect(() => {
    if (!sessionId) return

    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      const data = snap.data()
      if (!data) return

      if (data.status === "active") {
        router.push("/map?role=owner")
      }

      if (data.status === "declined") {
        router.push("/friends")
      }

      if (data.status === "cancelled") {
        router.push("/friends")
      }
    })

    return () => unsub()
  }, [sessionId, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
      <div className="flex gap-1">
        <span className="w-3 h-3 bg-[#6366F1] rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-3 h-3 bg-[#6366F1] rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-3 h-3 bg-[#6366F1] rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Waiting for {friendName}...
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          They'll get a notification to accept
        </p>
      </div>
      <button
        onClick={() => router.push("/friends")}
        className="text-sm text-gray-400 underline"
      >
        Cancel
      </button>
    </div>
  )
}

export default function WaitingPage() {
  return (
    <Suspense>
      <WaitingContent />
    </Suspense>
  )
}