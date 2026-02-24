"use client"

import { MapPin, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function HomePage() {
  const router = useRouter()
  const [username, setUsername] = useState("")

  useEffect(() => {
    const name = localStorage.getItem("codemap_username")
    if (!name) {
      router.push("/")
      return
    }
    setUsername(name)
  }, [router])

  return (
    <div className="flex flex-col px-6 py-8 pb-24 gap-8">

      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hey {username} 👋</h1>
        <p className="text-gray-400 mt-1">Ready to meet up?</p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push("/share")}
          className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-[#6366F1]/10 rounded-xl flex items-center justify-center">
            <MapPin size={24} className="text-[#6366F1]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Share My Location</h2>
            <p className="text-sm text-gray-400">Share your location for a meetup</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/find")}
          className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
            <Search size={24} className="text-[#10B981]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Find a Friend</h2>
            <p className="text-sm text-gray-400">Connect using a friend's code</p>
          </div>
        </button>
      </div>

    </div>
  )
}