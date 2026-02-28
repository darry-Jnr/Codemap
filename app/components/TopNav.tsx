export default function TopNav() {
  return (
    <nav className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
      {/* CodeMap logo — matches app icon */}
      <div className="w-8 h-8">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Indigo rounded background */}
          <rect width="512" height="512" rx="112" fill="#6366F1" />

          {/* Outer signal ring */}
          <circle cx="256" cy="220" r="140" fill="none" stroke="white" strokeWidth="18" opacity="0.2" />

          {/* Middle signal ring */}
          <circle cx="256" cy="220" r="110" fill="none" stroke="white" strokeWidth="18" opacity="0.35" />

          {/* White pin circle */}
          <circle cx="256" cy="220" r="80" fill="white" />

          {/* Pin tail */}
          <path d="M226 288 Q226 360 256 390 Q286 360 286 288Z" fill="white" />

          {/* Indigo inner dot */}
          <circle cx="256" cy="220" r="36" fill="#6366F1" />
        </svg>
      </div>

      <span className="text-[#6366F1] font-bold text-lg">CodeMap</span>
    </nav>
  )
}