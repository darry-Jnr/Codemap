"use client"

import { useRouter } from "next/navigation"
import { Compass, Users } from "lucide-react"

export default function GroupPage() {
  const router = useRouter()

  return (
    <div
      className="flex flex-col px-6 py-8 pb-28 min-h-screen"
      style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="mb-10">
        <p className="text-sm font-semibold mb-1" style={{ color: "#F97316", letterSpacing: "0.02em" }}>
          GROUP SESSION
        </p>
        <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.03em" }}>
          Group Tracking
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Lead up to 10 people or join a group
        </p>
      </div>

      <div className="flex flex-col gap-4">

        {/* Start a Group — leader */}
        <button
          onClick={() => router.push("/group/start")}
          className="relative overflow-hidden rounded-3xl p-6 text-left active:scale-[0.98] transition-transform duration-150"
          style={{
            background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
            boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
            minHeight: "148px",
          }}
        >
          <div className="absolute w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.06)", right: "-16px", top: "-16px" }} />
          <div className="absolute w-20 h-20 rounded-full" style={{ background: "rgba(255,255,255,0.04)", right: "48px", bottom: "-24px" }} />
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <Compass size={22} color="white" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
            Start a Group
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
            You're the leader · share your code
          </p>
        </button>

        {/* Join a Group — member */}
        <button
          onClick={() => router.push("/group/join")}
          className="relative overflow-hidden rounded-3xl p-6 text-left active:scale-[0.98] transition-transform duration-150"
          style={{
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
            border: "1.5px solid rgba(249,115,22,0.15)",
            boxShadow: "0 4px 16px rgba(249,115,22,0.08)",
            minHeight: "148px",
          }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(249,115,22,0.12)" }}
          >
            <Users size={22} style={{ color: "#F97316" }} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: "#7C2D12", letterSpacing: "-0.02em" }}>
            Join a Group
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#FDBA74" }}>
            Enter a code · follow the leader
          </p>
        </button>

        {/* How it works */}
        <div className="rounded-2xl p-4 mt-2" style={{ background: "#F9FAFB" }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">How it works</p>
          <div className="flex flex-col gap-2.5">
            {[
              { emoji: "🧭", text: "Leader shares their live location with everyone" },
              { emoji: "👥", text: "Members see the leader on the map with a direction arrow" },
              { emoji: "🎉", text: "Tap \"I'm Here\" when you arrive — leader sees who's made it" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base flex-shrink-0">{item.emoji}</span>
                <p className="text-sm text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}