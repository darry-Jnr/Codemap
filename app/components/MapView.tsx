"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"

// Fix Leaflet CSS
import "leaflet/dist/leaflet.css"

// Fix broken marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// FUTA coordinates
const FUTA_CENTER: [number, number] = [7.2986, 5.1318]

export default function MapView() {
  const [userLocation, setUserLocation] = useState<[number, number]>(FUTA_CENTER)

  useEffect(() => {
    // Get real GPS location
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude,
        ])
      },
      (err) => {
        console.error("Location error:", err)
        // Falls back to FUTA center if GPS denied
      }
    )
  }, [])

  return (
    <MapContainer
      center={userLocation}
      zoom={17}
      className="w-full h-full z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={userLocation}>
        <Popup>You are here</Popup>
      </Marker>
    </MapContainer>
  )
}