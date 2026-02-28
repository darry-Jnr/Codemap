"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MapPin, Compass, Users } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [timeOfDay, setTimeOfDay] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const name = localStorage.getItem("codemap_username")
    if (!name) { router.replace("/"); return }

    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay("Good morning")
    else if (hour < 17) setTimeOfDay("Good afternoon")
    else setTimeOfDay("Good evening")

    setUsername(name)
    setReady(true)
  }, [router])

  // Show subtle loading while we read localStorage
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col min-h-screen pb-32"
      style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <p className="text-sm font-semibold mb-1" style={{ color: "#6366F1", letterSpacing: "0.02em" }}>
          {timeOfDay}
        </p>
        <h1 className="text-4xl font-bold text-gray-900" style={{ letterSpacing: "-0.03em" }}>
          {username} 👋
        </h1>
        <p className="mt-1 text-base text-gray-400" style={{ fontFamily: "'SF Pro Text', system-ui" }}>
          Where are you meeting today?
        </p>
      </div>

      <div className="px-6 flex flex-col gap-4">

        {/* Share */}
        <button
          onClick={() => router.push("/share")}
          className="relative overflow-hidden rounded-3xl p-6 text-left active:scale-[0.98] transition-transform duration-150"
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 60%, #4338CA 100%)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.35)",
            minHeight: "148px",
          }}
        >
          <div className="absolute w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.06)", right: "-16px", top: "-16px" }} />
          <div className="absolute w-20 h-20 rounded-full" style={{ background: "rgba(255,255,255,0.04)", right: "48px", bottom: "-24px" }} />
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.18)" }}>
            <MapPin size={22} color="white" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>Share My Location</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Generate a code · up to 2 hours</p>
        </button>

        {/* Find + Group */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/find")}
            className="relative overflow-hidden rounded-3xl p-5 text-left active:scale-[0.98] transition-transform duration-150"
            style={{
              background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
              border: "1px solid rgba(16,185,129,0.12)",
              boxShadow: "0 4px 16px rgba(16,185,129,0.08)",
              minHeight: "148px",
            }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(16,185,129,0.12)" }}>
              <Compass size={20} style={{ color: "#10B981" }} strokeWidth={2} />
            </div>
            <h2 className="text-base font-bold" style={{ color: "#064E3B", letterSpacing: "-0.02em" }}>Find a Friend</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6EE7B7" }}>Enter a code</p>
          </button>

          <button
            onClick={() => router.push("/group")}
            className="relative overflow-hidden rounded-3xl p-5 text-left active:scale-[0.98] transition-transform duration-150"
            style={{
              background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
              border: "1px solid rgba(249,115,22,0.12)",
              boxShadow: "0 4px 16px rgba(249,115,22,0.08)",
              minHeight: "148px",
            }}
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full" style={{ background: "#F97316" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>NEW</span>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(249,115,22,0.12)" }}>
              <Users size={20} style={{ color: "#F97316" }} strokeWidth={2} />
            </div>
            <h2 className="text-base font-bold" style={{ color: "#7C2D12", letterSpacing: "-0.02em" }}>Group</h2>
            <p className="text-xs mt-0.5" style={{ color: "#FDBA74" }}>Lead up to 10</p>
          </button>
        </div>
      </div>

      {/* Recents preview */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>Recents</h3>
          <button onClick={() => router.push("/recents")} className="text-sm font-semibold" style={{ color: "#6366F1" }}>See all</button>
        </div>
        <div className="rounded-3xl flex flex-col items-center justify-center py-10 gap-2" style={{ background: "#F9FAFB" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1" style={{ background: "#F3F4F6" }}>
            <MapPin size={22} style={{ color: "#D1D5DB" }} />
          </div>
          <p className="text-sm font-medium text-gray-400">No recent sessions</p>
          <p className="text-xs text-gray-300">Your meetups will appear here</p>
        </div>
      </div>
    </div>
  )
}