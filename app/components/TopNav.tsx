import Image from "next/image"

export default function TopNav() {
  return (
    <nav className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
      {/* Logo placeholder — we'll add proper SVG later */}
      <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
        <span className="text-white text-xs font-bold">C</span>
      </div>
      <span className="text-[#6366F1] font-bold text-lg">CodeMap</span>
    </nav>
  )
}