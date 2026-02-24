"use client"

import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useState, Suspense } from "react"
import "leaflet/dist/leaflet.css"
const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
})

function MapContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") // "owner" or "finder"
  const isOwner = role === "owner"
  const [showConfirm, setShowConfirm] = useState(false)

  const handleStopSharing = () => {
    // later we kill Firebase session here
    router.push("/home")
  }

  const handleLeave = () => {
    // finder just leaves, session stays alive
    router.push("/home")
  }

  return (
    <div className="relative w-full h-screen">

      {/* Full screen map */}
      <div className="absolute inset-0 w-full h-full" style={{ height: "100vh" }}>
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

        {/* Friend info + timer */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Connected with</p>
            <p className="text-lg font-bold text-gray-900">Darryl</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Session ends in</p>
            <p className="text-lg font-bold text-[#6366F1]">29:48</p>
          </div>
        </div>

        {/* Owner sees Stop Sharing, Finder sees Leave */}
        {isOwner ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-red-500 text-white rounded-2xl py-3 font-semibold"
          >
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

      {/* Confirmation popup — owner only */}
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

    </div>
  )
}

// Suspense needed because useSearchParams requires it in Next.js
export default function MapPage() {
  return (
    <Suspense>
      <MapContent />
    </Suspense>
  )
}