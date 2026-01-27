"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const BottomNav = () => {
  const pathname = usePathname()

  const wideHexStyle = {
    clipPath: "polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)"
  };

  // Helper function to style active links
  const getLinkStyle = (path: string) => 
    pathname === path ? "bg-green-500 text-black" : "bg-slate-900 text-slate-400 border-slate-700";

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50">
      <nav className="flex items-center justify-between w-full max-w-md backdrop-blur-md border border-green-500 p-3 rounded-3xl shadow-2xl">
        
        {/* 1. HOME LINK */}
        <Link href="/" style={wideHexStyle} 
          className={`flex items-center justify-center w-24 h-12 transition active:scale-95 group  ${getLinkStyle('/')}`}>
          <span className="font-bold text-[10px] tracking-tighter group-hover:text-white transition">
            HOME
          </span>
        </Link>

        {/* 2. TRACK LINK (Center Action) */}
        <Link href="/track" style={wideHexStyle} 
          className={`flex items-center justify-center w-24 h-12 transition active:scale-95 group  ${getLinkStyle('/track')}`}>
          <span className="font-bold text-[10px] tracking-tighter group-hover:text-white transition">
            TRACK
          </span>
        </Link>

        {/* 3. PROFILE LINK */}
        <Link href="/profile" style={wideHexStyle} 
          className={`flex items-center justify-center w-24 h-12 transition active:scale-95 group  ${getLinkStyle('/profile')}`}>
          <span className="font-bold text-[10px] tracking-tighter group-hover:text-white transition">
            PROFILE
          </span>
        </Link>

      </nav>
    </div>
  )
}

export default BottomNav