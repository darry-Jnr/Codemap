"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const slides = [
  {
    id: 0,
    illustration: (
      <svg viewBox="0 0 240 240" className="w-full h-full" fill="none">
        {/* Soft background glow */}
        <circle cx="120" cy="120" r="90" fill="#6366F1" opacity="0.06" />
        <circle cx="120" cy="120" r="60" fill="#6366F1" opacity="0.06" />

        {/* Two phones side by side */}
        <rect x="52" y="70" width="52" height="88" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <rect x="56" y="78" width="44" height="60" rx="4" fill="#F9FAFB" />
        {/* Pin on left phone */}
        <circle cx="78" cy="102" r="8" fill="#6366F1" opacity="0.2" />
        <circle cx="78" cy="102" r="5" fill="#6366F1" />
        <path d="M78 107 L78 114" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />

        <rect x="136" y="70" width="52" height="88" rx="10" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <rect x="140" y="78" width="44" height="60" rx="4" fill="#F9FAFB" />
        {/* Pin on right phone */}
        <circle cx="162" cy="102" r="8" fill="#10B981" opacity="0.2" />
        <circle cx="162" cy="102" r="5" fill="#10B981" />
        <path d="M162 107 L162 114" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

        {/* Dashed line connecting */}
        <line x1="104" y1="108" x2="136" y2="108" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />

        {/* Distance badge */}
        <rect x="100" y="100" width="40" height="16" rx="8" fill="#6366F1" />
        <text x="120" y="111" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="system-ui">340m</text>
      </svg>
    ),
    eyebrow: "WELCOME TO CODEMAP",
    headline: "Meet up,\nno fuss.",
    body: "Share a code. Your friend enters it. You both see each other live on a map. Done.",
  },
  {
    id: 1,
    illustration: (
      <svg viewBox="0 0 240 240" className="w-full h-full" fill="none">
        <circle cx="120" cy="120" r="90" fill="#6366F1" opacity="0.06" />

        {/* Code card */}
        <rect x="50" y="75" width="140" height="90" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />

        {/* Code text */}
        <text x="120" y="122" textAnchor="middle" fill="#6366F1" fontSize="22" fontWeight="800" fontFamily="monospace" letterSpacing="6">A4X9</text>
        <text x="120" y="144" textAnchor="middle" fill="#6366F1" fontSize="22" fontWeight="800" fontFamily="monospace" letterSpacing="6">KM2Z</text>

        {/* Timer */}
        <rect x="88" y="152" width="64" height="20" rx="10" fill="#F3F4F6" />
        <text x="120" y="165" textAnchor="middle" fill="#9CA3AF" fontSize="8" fontWeight="600" fontFamily="system-ui">Expires in 29:58</text>

        {/* Copy icon */}
        <rect x="163" y="78" width="20" height="20" rx="5" fill="#6366F1" opacity="0.1" />
        <rect x="167" y="82" width="10" height="10" rx="2" stroke="#6366F1" strokeWidth="1.5" fill="none" />
        <rect x="170" y="85" width="10" height="10" rx="2" stroke="#6366F1" strokeWidth="1.5" fill="white" />
      </svg>
    ),
    eyebrow: "HOW IT WORKS",
    headline: "One code.\nThat's all.",
    body: "You get an 8-character code. Send it over WhatsApp, text — however you like. Your friend types it in and requests to connect.",
  },
  {
    id: 2,
    illustration: (
      <svg viewBox="0 0 240 240" className="w-full h-full" fill="none">
        <circle cx="120" cy="120" r="90" fill="#10B981" opacity="0.06" />
        <circle cx="120" cy="120" r="55" fill="#10B981" opacity="0.05" />

        {/* Shield / privacy icon */}
        <path d="M120 58 L158 74 L158 112 Q158 148 120 168 Q82 148 82 112 L82 74 Z" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1.5" />

        {/* Lock */}
        <rect x="108" y="118" width="24" height="20" rx="4" fill="#10B981" opacity="0.15" />
        <rect x="111" y="121" width="18" height="14" rx="3" fill="#10B981" />
        <path d="M113 118 Q113 110 120 110 Q127 110 127 118" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="120" cy="128" r="2.5" fill="white" />

        {/* Checkmarks */}
        <text x="78" y="186" fill="#10B981" fontSize="8" fontWeight="600" fontFamily="system-ui" opacity="0.8">✓ No account needed</text>
        <text x="78" y="198" fill="#10B981" fontSize="8" fontWeight="600" fontFamily="system-ui" opacity="0.6">✓ Session ends, tracking ends</text>
      </svg>
    ),
    eyebrow: "YOUR PRIVACY",
    headline: "Gone when\nyou're done.",
    body: "No account. No permanent tracking. The moment a session ends, your location disappears. We only know where you are when you want us to.",
  },
]

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const isLast = current === slides.length - 1

  const goNext = () => {
    if (animating) return
    if (isLast) {
      onDone()
      return
    }
    setDirection("forward")
    setAnimating(true)
    setTimeout(() => {
      setCurrent((c) => c + 1)
      setAnimating(false)
    }, 300)
  }

  const goTo = (idx: number) => {
    if (animating || idx === current) return
    setDirection(idx > current ? "forward" : "back")
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 300)
  }

  const slide = slides[current]

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col">

      {/* Skip */}
      <div className="flex justify-end px-6 pt-14 pb-4">
        <button
          onClick={onDone}
          className="text-sm font-medium text-gray-400 active:text-gray-600 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Illustration */}
      <div
        className="flex-1 flex items-center justify-center px-12 transition-all duration-300"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating
            ? `translateY(${direction === "forward" ? "-8px" : "8px"})`
            : "translateY(0)",
        }}
      >
        <div className="w-56 h-56">
          {slide.illustration}
        </div>
      </div>

      {/* Text content */}
      <div
        className="px-8 pb-6 flex flex-col gap-3 transition-all duration-300"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating
            ? `translateY(${direction === "forward" ? "8px" : "-8px"})`
            : "translateY(0)",
        }}
      >
        {/* Eyebrow */}
        <p
          className="text-xs font-bold tracking-[0.2em] text-[#6366F1]"
          style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif" }}
        >
          {slide.eyebrow}
        </p>

        {/* Headline */}
        <h1
          className="text-4xl font-bold text-gray-900 leading-tight whitespace-pre-line"
          style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif", letterSpacing: "-0.02em" }}
        >
          {slide.headline}
        </h1>

        {/* Body */}
        <p
          className="text-base text-gray-500 leading-relaxed"
          style={{ fontFamily: "'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif" }}
        >
          {slide.body}
        </p>
      </div>

      {/* Bottom — dots + button */}
      <div className="px-8 pb-14 flex flex-col gap-6">

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === current ? "24px" : "8px",
                height: "8px",
                background: i === current ? "#6366F1" : "#E5E7EB",
              }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={goNext}
          className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all duration-150 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            fontFamily: "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {isLast ? "Let's go →" : "Continue"}
        </button>
      </div>

    </div>
  )
}