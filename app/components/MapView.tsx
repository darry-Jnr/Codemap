"use client"

import { useEffect, useState } from "react"

const FUTA_CENTER = { lat: 7.2986, lng: 5.1318 }

export default function MapView() {
  const [coords, setCoords] = useState(FUTA_CENTER)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
        setLoading(false)
      },
      () => {
        // fallback to FUTA
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }, [])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-400">Getting your location...</p>
      </div>
    )
  }

  const mapUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=17&output=embed`

  return (
    <iframe
      src={mapUrl}
      width="100%"
      height="100%"
      style={{ border: 0, display: "block" }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}