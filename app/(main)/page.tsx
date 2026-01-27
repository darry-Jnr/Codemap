"use client"

import React, { useState, useRef } from 'react'

const Page = () => {
  const [code, setCode] = useState(new Array(6).fill(""))
  // This ref stores our 6 input elements for focus management
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (element: HTMLInputElement, index: number) => {
    // Alphanumeric check: Allows letters and numbers for your campus codes
    const value = element.value.toUpperCase();
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Automatically move to next box if a character is entered
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move back on backspace if the current field is empty
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen p-6 pt-24 flex flex-col items-center ">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black tracking-tighter text-black uppercase italic">
          CODE <span className="text-green-500 underline decoration-green-900">MAP</span>
        </h1>
        <p className="text-slate-500 text-[10px] mt-2 tracking-[0.3em] font-bold">
          LINK TO THE GREEN GRID
        </p>
      </div>

      {/* The 6 OTP-Style Boxes */}
      <div className="flex gap-2 sm:gap-4 mb-10">
        {code.map((data, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            // FIXED: Braces added to ensure the function returns void
            ref={(el) => { inputRefs.current[index] = el; }}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-12 h-16 sm:w-16 sm:h-20 text-center text-3xl font-black border-2 border-slate-800 text-green-400 rounded-xl focus:border-green-500 focus:ring-0 focus:outline-none transition-all uppercase shadow-lg shadow-green-500/5"
          />
        ))}
      </div>

      {/* Primary Action */}
      <button className="w-full max-w-xs bg-green-500 text-black font-black py-4 rounded-2xl hover:bg-green-400 active:scale-95 transition-all shadow-[0_0_40px_rgba(34,197,94,0.2)]">
        TRACK LOCATION
      </button>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-slate-600 text-[10px] tracking-widest uppercase">
          No invite code?
        </p>
        <button className="text-green-600 text-xs font-bold hover:text-green-400 transition underline underline-offset-4">
          GENERATE MY CAMPUS CODE
        </button>
      </div>
    </div>
  )
}

export default Page