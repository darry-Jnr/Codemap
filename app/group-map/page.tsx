"use client"

import { useEffect, useRef, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, updateDoc, GeoPoint } from "firebase/firestore"
import "maplibre-gl/dist/maplibre-gl.css"
import { Locate, Maximize2, AlertCircle, ArrowLeft, X, Navigation } from "lucide-react"
import { notifyTracking, cancelTrackingNotification, notifyArrival, requestNotificationPermission } from "@/lib/notifications"

function throttle<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let last = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - last >= ms) { last = now; fn(...args) }
  }
}

const MEMBER_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#84CC16"]
const ARRIVAL_METRES = 50

function GroupMapContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOwner = searchParams.get("role") === "owner"

  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const myMarkerRef = useRef<any>(null)
  const memberMarkersRef = useRef<Map<string, any>>(new Map())
  const myLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const leaderLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const arrivedSentRef = useRef(false)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [ownerName, setOwnerName] = useState("")
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [timeLeft, setTimeLeft] = useState("--:--")
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [bearing, setBearing] = useState(0)
  const [distance, setDistance] = useState("--")
  const [nearbyReady, setNearbyReady] = useState(false)
  const [iAmHereSent, setIAmHereSent] = useState(false)
  const [arrivalBanner, setArrivalBanner] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showStoppedModal, setShowStoppedModal] = useState(false)
  const expiresAtRef = useRef<Date | null>(null)

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const getBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
    const x = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) - Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng)
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

  // Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (!expiresAtRef.current) return
      const diff = expiresAtRef.current.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft("0:00"); router.push("/home"); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

  // Notification setup
  useEffect(() => {
    requestNotificationPermission()
    if (ownerName) notifyTracking(ownerName)
    return () => { cancelTrackingNotification() }
  }, [ownerName])

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    const initMap = async () => {
      const maplibregl = (await import("maplibre-gl")).default
      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [3.3792, 6.5244],
        zoom: 13,
        attributionControl: false,
      })
      mapRef.current = map

      map.on("load", () => {
        // My marker
        const myEl = document.createElement("div")
        myEl.style.cssText = `width:20px;height:20px;background:${isOwner ? "#F97316" : "#6366F1"};border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.3);position:relative;`
        const pulse = document.createElement("div")
        pulse.style.cssText = `position:absolute;width:38px;height:38px;border-radius:50%;background:${isOwner ? "rgba(249,115,22,0.2)" : "rgba(99,102,241,0.2)"};top:-9px;left:-9px;animation:cmPulse 2s ease-out infinite;`
        const styleEl = document.createElement("style")
        styleEl.textContent = `@keyframes cmPulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.8);opacity:0}}`
        document.head.appendChild(styleEl)
        myEl.appendChild(pulse)

        // "You" label
        const youLabel = document.createElement("div")
        youLabel.textContent = "You"
        youLabel.style.cssText = `position:absolute;bottom:24px;left:50%;transform:translateX(-50%);background:white;color:${isOwner ? "#F97316" : "#6366F1"};font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);`
        myEl.appendChild(youLabel)
        myMarkerRef.current = new maplibregl.Marker({ element: myEl, anchor: "center" })
      })
    }
    initMap()
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [isOwner])

  // Session listener
  useEffect(() => {
    const id = localStorage.getItem("codemap_session_id")
    if (!id) { router.push("/home"); return }
    setSessionId(id)

    const unsub = onSnapshot(doc(db, "sessions", id), (snap) => {
      const data = snap.data()
      if (!data) return

      setOwnerName(data.ownerName || "")
      if (data.expiresAt) expiresAtRef.current = data.expiresAt.toDate()
      if (data.members) setMembers(data.members)

      // Leader location (for members)
      if (!isOwner && data.ownerLocation) {
        const lat = data.ownerLocation.latitude
        const lng = data.ownerLocation.longitude
        leaderLocationRef.current = { lat, lng }

        if (mapRef.current && myLocationRef.current) {
          // Update bearing and distance to leader
          const dist = getDistance(myLocationRef.current.lat, myLocationRef.current.lng, lat, lng)
          setBearing(getBearing(myLocationRef.current.lat, myLocationRef.current.lng, lat, lng))
          setDistance(dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`)
          setNearbyReady(dist <= ARRIVAL_METRES && !arrivedSentRef.current)

          // Update or create leader marker
          if (!memberMarkersRef.current.has("leader")) {
            import("maplibre-gl").then(({ default: maplibregl }) => {
              const leaderEl = document.createElement("div")
              leaderEl.style.cssText = `width:22px;height:22px;background:#F97316;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(249,115,22,0.5);position:relative;`
              const lLabel = document.createElement("div")
              lLabel.textContent = data.ownerName || "Leader"
              lLabel.style.cssText = `position:absolute;bottom:26px;left:50%;transform:translateX(-50%);background:white;color:#F97316;font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);`
              leaderEl.appendChild(lLabel)
              const marker = new maplibregl.Marker({ element: leaderEl, anchor: "center" })
              marker.setLngLat([lng, lat]).addTo(mapRef.current)
              memberMarkersRef.current.set("leader", marker)
            })
          } else {
            memberMarkersRef.current.get("leader")?.setLngLat([lng, lat])
          }
        }
      }

      // Member locations (for leader)
      if (isOwner && data.memberLocations) {
        Object.entries(data.memberLocations).forEach(([memberId, loc]: [string, any]) => {
          const member = data.members?.find((m: any) => m.id === memberId)
          if (!member) return
          const lat = loc.latitude; const lng = loc.longitude
          const colorIdx = data.members.findIndex((m: any) => m.id === memberId) % MEMBER_COLORS.length

          if (!memberMarkersRef.current.has(memberId)) {
            import("maplibre-gl").then(({ default: maplibregl }) => {
              const el = document.createElement("div")
              el.style.cssText = `width:18px;height:18px;background:${MEMBER_COLORS[colorIdx]};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.2);position:relative;`
              const lbl = document.createElement("div")
              lbl.textContent = member.name
              lbl.style.cssText = `position:absolute;bottom:22px;left:50%;transform:translateX(-50%);background:white;color:${MEMBER_COLORS[colorIdx]};font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);`
              el.appendChild(lbl)
              const marker = new maplibregl.Marker({ element: el, anchor: "center" })
              marker.setLngLat([lng, lat]).addTo(mapRef.current)
              memberMarkersRef.current.set(memberId, marker)
            })
          } else {
            memberMarkersRef.current.get(memberId)?.setLngLat([lng, lat])
          }
        })
      }

      // Arrival notification
      if (data.arrivedName && data.arrivedName !== localStorage.getItem("codemap_username")) {
        setArrivalBanner(data.arrivedName)
        notifyArrival(data.arrivedName)
        setTimeout(() => setArrivalBanner(null), 6000)
      }

      // Session ended
      if (data.status === "cancelled") {
        if (!isOwner) setShowStoppedModal(true)
        else { localStorage.removeItem("codemap_session_id"); localStorage.removeItem("codemap_role"); router.push("/home") }
      }
    })
    return () => unsub()
  }, [isOwner, router])

  // GPS watch
  useEffect(() => {
    if (!sessionId) return
    if (!navigator.geolocation) { setGpsError("GPS not available"); return }

    const locationField = isOwner ? "ownerLocation" : `memberLocations.${localStorage.getItem("codemap_user_id")}`
    const throttledUpdate = throttle(async (lat: number, lng: number) => {
      try {
        await updateDoc(doc(db, "sessions", sessionId), { [locationField]: new GeoPoint(lat, lng) })
      } catch (err) { console.error(err) }
    }, 5000)

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        myLocationRef.current = { lat: latitude, lng: longitude }
        setGpsError(null); setIsTracking(true)
        if (myMarkerRef.current && mapRef.current) myMarkerRef.current.setLngLat([longitude, latitude]).addTo(mapRef.current)
        throttledUpdate(latitude, longitude)

        // Member: update arrow to leader
        if (!isOwner && leaderLocationRef.current) {
          const dist = getDistance(latitude, longitude, leaderLocationRef.current.lat, leaderLocationRef.current.lng)
          setBearing(getBearing(latitude, longitude, leaderLocationRef.current.lat, leaderLocationRef.current.lng))
          setDistance(dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`)
          setNearbyReady(dist <= ARRIVAL_METRES && !arrivedSentRef.current)
        }
      },
      (err) => {
        setIsTracking(false)
        if (err.code === err.PERMISSION_DENIED) setGpsError("Location access denied — allow in browser settings")
        else setGpsError("Couldn't get your location")
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [sessionId, isOwner])

  const handleIAmHere = async () => {
    if (!sessionId) return
    const myName = localStorage.getItem("codemap_username") || "Someone"
    await updateDoc(doc(db, "sessions", sessionId), { arrivedName: myName, arrivedAt: new Date() })
    arrivedSentRef.current = true; setIAmHereSent(true); setNearbyReady(false)
  }

  const handleEnd = async () => {
    if (sessionId) await updateDoc(doc(db, "sessions", sessionId), { status: "cancelled" })
    localStorage.removeItem("codemap_session_id"); localStorage.removeItem("codemap_role")
    router.push("/home")
  }

  const handleLeave = () => {
    localStorage.removeItem("codemap_session_id"); localStorage.removeItem("codemap_role")
    router.push("/home")
  }

  const fitAll = useCallback(() => {
    if (!mapRef.current) return
    const allPoints: [number, number][] = []
    if (myLocationRef.current) allPoints.push([myLocationRef.current.lng, myLocationRef.current.lat])
    if (!isOwner && leaderLocationRef.current) allPoints.push([leaderLocationRef.current.lng, leaderLocationRef.current.lat])
    if (allPoints.length < 2) return
    mapRef.current.fitBounds(
      [[Math.min(...allPoints.map(p => p[0])), Math.min(...allPoints.map(p => p[1]))],
       [Math.max(...allPoints.map(p => p[0])), Math.max(...allPoints.map(p => p[1]))]],
      { padding: 80, maxZoom: 17, duration: 800 }
    )
  }, [isOwner])

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Tracking banner */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4"
        style={{ background: isTracking ? (isOwner ? "rgba(249,115,22,0.92)" : "rgba(99,102,241,0.92)") : "rgba(239,68,68,0.92)", backdropFilter: "blur(8px)" }}>
        <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" style={{ animation: isTracking ? "cmPulse 1.5s ease-out infinite" : "none" }} />
        <p className="text-white text-xs font-semibold tracking-wide">
          {isOwner
            ? `📍 Leading group · ${members.length} member${members.length !== 1 ? "s" : ""}`
            : isTracking ? `📍 Following ${ownerName}` : "⚠️ Location paused"}
        </p>
      </div>

      {/* Back button */}
      <button onClick={() => router.push("/home")} className="absolute top-10 left-4 z-50 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
        <ArrowLeft size={18} className="text-gray-700" />
      </button>

      {/* GPS error */}
      {gpsError && (
        <div className="absolute left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-2 shadow-sm" style={{ top: "52px" }}>
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600 font-medium">{gpsError}</p>
        </div>
      )}

      {/* Arrival banner */}
      {arrivalBanner && (
        <div className="absolute left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg bg-white" style={{ top: "52px", border: "1.5px solid #D1FAE5", animation: "slideDown 0.3s ease" }}>
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-bold text-gray-900">{arrivalBanner} has arrived!</p>
            <p className="text-xs text-gray-400">They're nearby</p>
          </div>
        </div>
      )}

      {/* Member: direction arrow to leader */}
      {!isOwner && !gpsError && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1" style={{ top: "56px" }}>
          <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center"
            style={{ transform: `rotate(${bearing}deg)`, transition: "transform 0.5s ease" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#F97316"><path d="M12 2L8 10h3v10h2V10h3L12 2z" /></svg>
          </div>
          <div className="bg-white px-3 py-1 rounded-full shadow text-sm font-bold" style={{ color: "#F97316" }}>{distance}</div>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute right-4 z-50 flex flex-col gap-2" style={{ bottom: "220px" }}>
        <button onClick={fitAll} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform">
          <Maximize2 size={18} className="text-gray-600" />
        </button>
        <button onClick={() => { if (mapRef.current && myLocationRef.current) mapRef.current.easeTo({ center: [myLocationRef.current.lng, myLocationRef.current.lat], zoom: 17, duration: 600 }) }}
          className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform">
          <Locate size={18} style={{ color: isOwner ? "#F97316" : "#6366F1" }} />
        </button>
      </div>

      {/* Member: I'm Here button */}
      {!isOwner && nearbyReady && !iAmHereSent && (
        <div className="absolute left-4 right-4 z-50" style={{ bottom: "220px", animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <button onClick={handleIAmHere}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", boxShadow: "0 8px 24px rgba(16,185,129,0.4)" }}>
            <Navigation size={20} />I'm Here! 🎉
          </button>
        </div>
      )}
      {!isOwner && iAmHereSent && (
        <div className="absolute left-4 right-4 z-50" style={{ bottom: "220px" }}>
          <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold" style={{ background: "#D1FAE5", color: "#065F46" }}>
            ✓ {ownerName} has been notified
          </div>
        </div>
      )}

      {/* Bottom card */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl px-6 py-5 flex flex-col gap-4"
        style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{isOwner ? "Group session" : `Following`}</p>
            <p className="text-lg font-bold text-gray-900">{isOwner ? `${members.length} member${members.length !== 1 ? "s" : ""}` : ownerName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Ends in</p>
            <p className="text-lg font-bold" style={{ color: "#F97316" }}>{timeLeft}</p>
          </div>
        </div>

        {/* Leader: member avatars */}
        {isOwner && members.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {members.map((m, i) => (
              <div key={m.id} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length], fontSize: "11px", fontWeight: 700, color: "white" }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {isOwner ? (
          <button onClick={() => setShowConfirm(true)}
            className="w-full rounded-2xl py-3 font-semibold flex items-center justify-center gap-2"
            style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }}>
            <X size={18} /> End Group Session
          </button>
        ) : (
          <button onClick={handleLeave}
            className="w-full rounded-2xl py-3 font-semibold text-gray-500"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            Leave Session
          </button>
        )}
      </div>

      {/* End confirmation */}
      {showConfirm && (
        <div className="absolute inset-0 z-[100] flex items-end" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900 text-center" style={{ letterSpacing: "-0.02em" }}>End session?</h2>
            <p className="text-sm text-gray-400 text-center">This removes all {members.length} members from the session</p>
            <button onClick={handleEnd} className="w-full bg-red-500 text-white rounded-2xl py-4 font-semibold">Yes, End Session</button>
            <button onClick={() => setShowConfirm(false)} className="w-full text-gray-400 py-3 font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {/* Session stopped by leader */}
      {showStoppedModal && (
        <div className="absolute inset-0 z-[100] flex items-end" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white w-full rounded-t-3xl px-6 py-8 flex flex-col gap-4 items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <X size={24} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">{ownerName} ended the session</h2>
            <p className="text-sm text-gray-400 text-center">The group session has ended</p>
            <button onClick={handleLeave} className="w-full rounded-2xl py-3 font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}>Go Home</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cmPulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.8);opacity:0}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  )
}

export default function GroupMapPage() {
  return <Suspense><GroupMapContent /></Suspense>
}