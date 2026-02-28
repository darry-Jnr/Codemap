"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, updateDoc, GeoPoint } from "firebase/firestore"
import "maplibre-gl/dist/maplibre-gl.css"
import { Locate, Maximize2, AlertCircle, Navigation } from "lucide-react"
import {
  notifyTracking,
  cancelTrackingNotification,
  notifyArrival,
  requestNotificationPermission,
} from "@/lib/notifications"

interface MapViewProps {
  sessionId: string
  isOwner: boolean
  friendName: string
}

function throttle<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let last = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - last >= ms) { last = now; fn(...args) }
  }
}

const ARRIVAL_METRES = 50

export default function MapView({ sessionId, isOwner, friendName }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const myMarkerRef = useRef<any>(null)
  const friendMarkerRef = useRef<any>(null)
  const myLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const friendLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const arrivedSentRef = useRef(false)
  const trackingNotifSentRef = useRef(false)

  const [bearing, setBearing] = useState(0)
  const [distance, setDistance] = useState("--")
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [bothLoaded, setBothLoaded] = useState(false)
  const [nearbyReady, setNearbyReady] = useState(false)
  const [iAmHereSent, setIAmHereSent] = useState(false)
  const [arrivalBanner, setArrivalBanner] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const getBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(dLng)
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

  const updateArrow = useCallback(() => {
    if (!myLocationRef.current || !friendLocationRef.current) return
    const { lat: myLat, lng: myLng } = myLocationRef.current
    const { lat: fLat, lng: fLng } = friendLocationRef.current
    const dist = getDistance(myLat, myLng, fLat, fLng)
    setBearing(getBearing(myLat, myLng, fLat, fLng))
    setDistance(dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`)
    setNearbyReady(dist <= ARRIVAL_METRES && !arrivedSentRef.current)
  }, [])

  const updateLine = useCallback((map: any) => {
    if (!myLocationRef.current || !friendLocationRef.current) return
    const geojson = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [myLocationRef.current.lng, myLocationRef.current.lat],
          [friendLocationRef.current.lng, friendLocationRef.current.lat],
        ],
      },
    }
    if (map.getSource("line-source")) map.getSource("line-source").setData(geojson)
  }, [])

  const fitBoth = useCallback(() => {
    if (!mapRef.current || !myLocationRef.current || !friendLocationRef.current) return
    mapRef.current.fitBounds(
      [
        [Math.min(myLocationRef.current.lng, friendLocationRef.current.lng), Math.min(myLocationRef.current.lat, friendLocationRef.current.lat)],
        [Math.max(myLocationRef.current.lng, friendLocationRef.current.lng), Math.max(myLocationRef.current.lat, friendLocationRef.current.lat)],
      ],
      { padding: 80, maxZoom: 17, duration: 800 }
    )
  }, [])

  const recenterMe = useCallback(() => {
    if (!mapRef.current || !myLocationRef.current) return
    mapRef.current.easeTo({ center: [myLocationRef.current.lng, myLocationRef.current.lat], zoom: 17, duration: 600 })
  }, [])

  const handleIAmHere = async () => {
    try {
      const myName = localStorage.getItem("codemap_username") || "Your friend"
      await updateDoc(doc(db, "sessions", sessionId), {
        arrivedName: myName,
        arrivedAt: new Date(),
      })
      arrivedSentRef.current = true
      setIAmHereSent(true)
      setNearbyReady(false)
    } catch (err) {
      console.error("Arrival ping failed:", err)
    }
  }

  // Request permission + send tracking notification on mount
  useEffect(() => {
    const setup = async () => {
      await requestNotificationPermission()
      if (!trackingNotifSentRef.current && friendName) {
        await notifyTracking(friendName)
        trackingNotifSentRef.current = true
      }
    }
    setup()
    return () => { cancelTrackingNotification() }
  }, [friendName])

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
        map.addSource("line-source", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        })
        map.addLayer({
          id: "line-layer", type: "line", source: "line-source",
          paint: { "line-color": "#6366F1", "line-width": 2, "line-dasharray": [3, 3], "line-opacity": 0.5 },
        })

        // My marker
        const myEl = document.createElement("div")
        myEl.style.cssText = `width:18px;height:18px;background:#6366F1;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(99,102,241,0.5);position:relative;`
        const pulse = document.createElement("div")
        pulse.style.cssText = `position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(99,102,241,0.2);top:-9px;left:-9px;animation:cmPulse 2s ease-out infinite;`
        const styleEl = document.createElement("style")
        styleEl.textContent = `@keyframes cmPulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.8);opacity:0}}`
        document.head.appendChild(styleEl)
        myEl.appendChild(pulse)
        myMarkerRef.current = new maplibregl.Marker({ element: myEl, anchor: "center" })

        // Friend marker
        const friendEl = document.createElement("div")
        friendEl.style.cssText = `width:18px;height:18px;background:#10B981;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(16,185,129,0.5);position:relative;`
        const label = document.createElement("div")
        label.textContent = friendName
        label.style.cssText = `position:absolute;bottom:24px;left:50%;transform:translateX(-50%);background:white;color:#10B981;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);`
        friendEl.appendChild(label)
        friendMarkerRef.current = new maplibregl.Marker({ element: friendEl, anchor: "center" })
      })
    }

    initMap()
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [friendName])

  // GPS watch
  useEffect(() => {
    if (!sessionId) return
    if (!navigator.geolocation) { setGpsError("GPS not available on this device"); return }

    const locationField = isOwner ? "ownerLocation" : "finderLocation"
    const throttledUpdate = throttle(async (lat: number, lng: number) => {
      try {
        await updateDoc(doc(db, "sessions", sessionId), { [locationField]: new GeoPoint(lat, lng) })
      } catch (err) { console.error(err) }
    }, 5000)

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        myLocationRef.current = { lat: latitude, lng: longitude }
        setGpsError(null)
        setIsTracking(true)
        if (myMarkerRef.current && mapRef.current) {
          myMarkerRef.current.setLngLat([longitude, latitude]).addTo(mapRef.current)
        }
        throttledUpdate(latitude, longitude)
        updateArrow()
        if (mapRef.current) updateLine(mapRef.current)
        if (friendLocationRef.current && !bothLoaded) {
          setBothLoaded(true)
          setTimeout(() => fitBoth(), 500)
        } else if (!friendLocationRef.current) {
          mapRef.current?.easeTo({ center: [longitude, latitude], zoom: 17 })
        }
      },
      (err) => {
        setIsTracking(false)
        if (err.code === err.PERMISSION_DENIED) setGpsError("Location access denied — please allow it in your browser settings")
        else if (err.code === err.POSITION_UNAVAILABLE) setGpsError("GPS signal unavailable — try moving outside")
        else setGpsError("Couldn't get your location — retrying...")
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [sessionId, isOwner, updateArrow, updateLine, fitBoth, bothLoaded])

  // Friend location + arrival listener
  useEffect(() => {
    if (!sessionId) return
    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      const data = snap.data()
      if (!data) return

      const friendLocation = isOwner ? data.finderLocation : data.ownerLocation
      if (friendLocation) {
        const lat = friendLocation.latitude
        const lng = friendLocation.longitude
        friendLocationRef.current = { lat, lng }
        if (friendMarkerRef.current && mapRef.current) {
          friendMarkerRef.current.setLngLat([lng, lat]).addTo(mapRef.current)
        }
        updateArrow()
        if (mapRef.current) updateLine(mapRef.current)
        if (myLocationRef.current && !bothLoaded) {
          setBothLoaded(true)
          setTimeout(() => fitBoth(), 500)
        }
      }

      // Friend arrived
      if (data.arrivedName && data.arrivedName !== localStorage.getItem("codemap_username")) {
        const name = data.arrivedName
        setArrivalBanner(name)
        notifyArrival(name)
        setTimeout(() => setArrivalBanner(null), 6000)
      }
    })
    return () => unsub()
  }, [sessionId, isOwner, updateArrow, updateLine, fitBoth, bothLoaded])

  return (
    <div className="relative w-full h-full">

      {/* Map */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* ── Persistent tracking banner ── */}
      <div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4"
        style={{
          background: isTracking ? "rgba(99,102,241,0.92)" : "rgba(239,68,68,0.92)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 bg-white"
          style={{ animation: isTracking ? "cmPulse 1.5s ease-out infinite" : "none" }}
        />
        <p className="text-white text-xs font-semibold tracking-wide">
          {isTracking
            ? `📍 Sharing location with ${friendName}`
            : "⚠️ Location sharing paused"}
        </p>
      </div>

      {/* ── GPS Error ── */}
      {gpsError && (
        <div className="absolute left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-2 shadow-sm" style={{ top: "44px" }}>
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600 font-medium">{gpsError}</p>
        </div>
      )}

      {/* ── Arrival banner ── */}
      {arrivalBanner && (
        <div
          className="absolute left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg bg-white"
          style={{ top: "48px", border: "1.5px solid #D1FAE5", animation: "slideDown 0.3s ease" }}
        >
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-bold text-gray-900">{arrivalBanner} has arrived!</p>
            <p className="text-xs text-gray-400">They're nearby — check the map</p>
          </div>
        </div>
      )}

      {/* ── Direction arrow + distance ── */}
      {!gpsError && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1" style={{ top: "52px" }}>
          <div
            className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center"
            style={{ transform: `rotate(${bearing}deg)`, transition: "transform 0.5s ease" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#6366F1">
              <path d="M12 2L8 10h3v10h2V10h3L12 2z" />
            </svg>
          </div>
          <div className="bg-white px-3 py-1 rounded-full shadow text-sm font-bold text-[#6366F1]">
            {distance}
          </div>
        </div>
      )}

      {/* ── Map controls ── */}
      <div className="absolute right-4 z-50 flex flex-col gap-2" style={{ bottom: "200px" }}>
        <button onClick={fitBoth} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform">
          <Maximize2 size={18} className="text-gray-600" />
        </button>
        <button onClick={recenterMe} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform">
          <Locate size={18} className="text-[#6366F1]" />
        </button>
      </div>

      {/* ── I'm Here button ── */}
      {nearbyReady && !iAmHereSent && (
        <div className="absolute left-4 right-4 z-50" style={{ bottom: "200px", animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <button
            onClick={handleIAmHere}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 text-base active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              boxShadow: "0 8px 24px rgba(16,185,129,0.4)",
            }}
          >
            <Navigation size={20} />
            I'm Here! 🎉
          </button>
        </div>
      )}

      {/* ── Sent confirmation ── */}
      {iAmHereSent && (
        <div className="absolute left-4 right-4 z-50" style={{ bottom: "200px" }}>
          <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold" style={{ background: "#D1FAE5", color: "#065F46" }}>
            ✓ {friendName} has been notified
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

    </div>
  )
}