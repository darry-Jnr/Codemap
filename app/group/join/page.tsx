"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, Timestamp } from "firebase/firestore"

export default function GroupJoinPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCodeChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8)
    setCode(cleaned)
    setError(null)
  }

  const handleJoin = async () => {
    if (code.length < 8) { setError("Code must be 8 characters"); return }
    setLoading(true); setError(null)

    try {
      const userId = localStorage.getItem("codemap_user_id")
      const userName = localStorage.getItem("codemap_username")
      if (!userId || !userName) { router.push("/"); return }

      // Find group session by code
      const q = query(
        collection(db, "sessions"),
        where("code", "==", code),
        where("type", "==", "group"),
        where("status", "==", "active")
      )
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setError("Group not found — check the code or ask your leader")
        setLoading(false); return
      }

      const sessionDoc = snapshot.docs[0]
      const sessionData = sessionDoc.data()

      // Check expiry
      if (sessionData.expiresAt.toDate() < new Date()) {
        setError("This session has expired — ask the leader to start a new one")
        setLoading(false); return
      }

      // Check if already a member
      const alreadyIn = sessionData.members?.some((m: any) => m.id === userId)
      if (alreadyIn) {
        // Already joined — just go to map
        localStorage.setItem("codemap_session_id", sessionDoc.id)
        localStorage.setItem("codemap_role", "member")
        router.push("/group-map?role=member")
        return
      }

      // Check if leader
      if (sessionData.ownerId === userId) {
        setError("You're the leader of this group! Open it from Group → Start")
        setLoading(false); return
      }

      // Check full
      if (sessionData.members?.length >= sessionData.maxMembers) {
        setError("This group is full — ask the leader to increase the limit")
        setLoading(false); return
      }

      // Join — add to members array
      await updateDoc(doc(db, "sessions", sessionDoc.id), {
        members: arrayUnion({
          id: userId,
          name: userName,
          joinedAt: Timestamp.now(),
        }),
      })

      localStorage.setItem("codemap_session_id", sessionDoc.id)
      localStorage.setItem("codemap_role", "member")
      router.push("/group-map?role=member")

    } catch (err) {
      console.error(err)
      setError("Something went wrong — try again")
    } finally { setLoading(false) }
  }

  const isReady = code.length === 8 && !loading
  const part1 = code.slice(0, 4)
  const part2 = code.slice(4, 8)

  return (
    <div
      className="flex flex-col px-6 py-8 pb-28 min-h-screen"
      style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
    >
      <div className="mb-10">
        <p className="text-sm font-semibold mb-1" style={{ color: "#F97316", letterSpacing: "0.02em" }}>JOIN GROUP</p>
        <h1 className="text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.03em" }}>Join a Group</h1>
        <p className="text-gray-400 mt-1 text-sm">Enter the code your leader shared</p>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Group code</label>

        {/* Split visual */}
        <div className="flex items-center gap-3 justify-center mb-1">
          <div
            className="flex-1 flex items-center justify-center h-16 rounded-2xl transition-all duration-200"
            style={{ background: part1 ? "#FFF7ED" : "#F9FAFB", border: `2px solid ${part1 ? "rgba(249,115,22,0.3)" : "#E5E7EB"}` }}
          >
            <span className="text-2xl font-bold tracking-[0.2em]" style={{ color: part1 ? "#F97316" : "#D1D5DB", fontFamily: "monospace" }}>
              {part1 || "····"}
            </span>
          </div>
          <div className="w-4 h-0.5 bg-gray-200 rounded-full flex-shrink-0" />
          <div
            className="flex-1 flex items-center justify-center h-16 rounded-2xl transition-all duration-200"
            style={{ background: part2 ? "#FFF7ED" : "#F9FAFB", border: `2px solid ${part2 ? "rgba(249,115,22,0.3)" : "#E5E7EB"}` }}
          >
            <span className="text-2xl font-bold tracking-[0.2em]" style={{ color: part2 ? "#F97316" : "#D1D5DB", fontFamily: "monospace" }}>
              {part2 || "····"}
            </span>
          </div>
        </div>

        <input
          type="text" inputMode="text" value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          maxLength={8} placeholder="Type code here..."
          className="w-full border rounded-2xl px-5 py-4 text-center text-lg font-bold tracking-widest outline-none uppercase transition-colors"
          style={{ color: "#F97316", fontFamily: "monospace", borderColor: code.length > 0 ? "rgba(249,115,22,0.4)" : "#E5E7EB", background: "#F9FAFB" }}
        />

        <div className="flex items-center justify-between px-1">
          {error
            ? <span className="text-sm text-red-400 font-medium">{error}</span>
            : <span className="text-xs text-gray-300">{code.length > 0 ? `${code.length} of 8 characters` : "8 characters needed"}</span>
          }
          {code.length > 0 && <button onClick={() => { setCode(""); setError(null) }} className="text-xs text-gray-400 underline">Clear</button>}
        </div>
      </div>

      <button
        onClick={handleJoin} disabled={!isReady}
        className="w-full rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150"
        style={{
          background: isReady ? "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" : "#F3F4F6",
          color: isReady ? "white" : "#D1D5DB",
          boxShadow: isReady ? "0 8px 24px rgba(249,115,22,0.3)" : "none",
        }}
      >
        {loading
          ? <span className="flex gap-1.5"><span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0ms]" /><span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:150ms]" /><span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" /></span>
          : <>Join Group <ArrowRight size={20} /></>
        }
      </button>

      <p className="text-center text-xs text-gray-300 mt-4">
        You'll see the leader's live location on the map instantly
      </p>
    </div>
  )
}