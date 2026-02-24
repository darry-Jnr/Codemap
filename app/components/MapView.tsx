"use client"

import { useEffect, useRef, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, updateDoc, GeoPoint } from "firebase/firestore"
import "maplibre-gl/dist/maplibre-gl.css"

interface MapViewProps {
  sessionId: string
  isOwner: boolean
  friendName: string
}

export default function MapView({ sessionId, isOwner, friendName }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const myMarkerRef = useRef<any>(null)
  const friendMarkerRef = useRef<any>(null)
  const [bearing, setBearing] = useState<number>(0)
  const [distance, setDistance] = useState<string>("--")
  const myLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const friendLocationRef = useRef<{ lat: number; lng: number } | null>(null)

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const getBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(dLng)
    const b = (Math.atan2(y, x) * 180) / Math.PI
    return (b + 360) % 360
  }

  const updateArrow = () => {
    if (!myLocationRef.current || !friendLocationRef.current) return
    const { lat: myLat, lng: myLng } = myLocationRef.current
    const { lat: fLat, lng: fLng } = friendLocationRef.current
    const dist = getDistance(myLat, myLng, fLat, fLng)
    const bear = getBearing(myLat, myLng, fLat, fLng)
    setBearing(bear)
    setDistance(dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`)
  }

  const updateLine = (map: any) => {
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
    if (map.getSource("line-source")) {
      map.getSource("line-source").setData(geojson)
    }
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const initMap = async () => {
      const maplibregl = (await import("maplibre-gl")).default

      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [5.1318, 7.2986],
        zoom: 17,
        attributionControl: false,
      })

      mapRef.current = map

      map.on("load", () => {
        // Add line source and layer
        map.addSource("line-source", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [],
            },
            properties: {},
          },
        })

        map.addLayer({
          id: "line-layer",
          type: "line",
          source: "line-source",
          paint: {
            "line-color": "#6366F1",
            "line-width": 3,
            "line-dasharray": [2, 2],
          },
        })

        // My marker — blue
        const myEl = document.createElement("div")
        myEl.style.cssText = `
          width: 20px;
          height: 20px;
          background: #6366F1;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `
        myMarkerRef.current = new maplibregl.Marker({ element: myEl })

        // Friend marker — green
        const friendEl = document.createElement("div")
        friendEl.style.cssText = `
          width: 20px;
          height: 20px;
          background: #10B981;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `
        friendMarkerRef.current = new maplibregl.Marker({ element: friendEl })
      })
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Watch my GPS and update Firestore + map
  useEffect(() => {
    if (!sessionId) return

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        myLocationRef.current = { lat: latitude, lng: longitude }

        const locationField = isOwner ? "ownerLocation" : "finderLocation"
        await updateDoc(doc(db, "sessions", sessionId), {
          [locationField]: new GeoPoint(latitude, longitude),
        })

        if (myMarkerRef.current && mapRef.current) {
          myMarkerRef.current.setLngLat([longitude, latitude]).addTo(mapRef.current)
          mapRef.current.easeTo({ center: [longitude, latitude] })
        }

        updateArrow()
        if (mapRef.current) updateLine(mapRef.current)
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 3000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [sessionId, isOwner])

  // Listen to friend's location from Firestore
  useEffect(() => {
    if (!sessionId) return

    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      const data = snap.data()
      if (!data) return

      const friendLocation = isOwner ? data.finderLocation : data.ownerLocation
      if (!friendLocation) return

      const lat = friendLocation.latitude
      const lng = friendLocation.longitude
      friendLocationRef.current = { lat, lng }

      if (friendMarkerRef.current && mapRef.current) {
        friendMarkerRef.current.setLngLat([lng, lat]).addTo(mapRef.current)
      }

      updateArrow()
      if (mapRef.current) updateLine(mapRef.current)
    })

    return () => unsub()
  }, [sessionId, isOwner])

  return (
    <div className="relative w-full h-full">

      {/* Map */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Arrow compass overlay */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1">
        <div
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center"
          style={{ transform: `rotate(${bearing}deg)`, transition: "transform 0.5s ease" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#6366F1">
            <path d="M12 2L8 10h3v10h2V10h3L12 2z" />
          </svg>
        </div>
        <div className="bg-white px-3 py-1 rounded-full shadow text-sm font-bold text-[#6366F1]">
          {distance}
        </div>
      </div>

    </div>
  )
}