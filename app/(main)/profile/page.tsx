"use client"

import React from 'react'

const ProfilePage = () => {
  // Geometric style for the profile avatar
  const hexagonStyle = {
    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
  };

  return (
    <div className="min-h-screen bg-black p-6 pt-24 pb-32 flex flex-col items-center">
      {/* 1. Identity Header */}
      <div className="flex flex-col items-center mb-8">
        <div 
          style={hexagonStyle} 
          className="w-24 h-24 bg-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)] mb-4"
        >
          <span className="text-black text-3xl font-black italic">D</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Darry Jnr</h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Beta Tester • Akure City</p>
      </div>

      {/* 2. Your Active Code (The "Hero" Card) */}
      <div className="w-full max-w-sm bg-slate-900/50 border border-green-500/20 rounded-3xl p-6 mb-6 text-center">
        <p className="text-slate-500 text-[10px] uppercase font-bold mb-2">Your Current Green Code</p>
        <div className="text-3xl font-black text-green-400 tracking-[0.3em] mb-4">
          G3-X92
        </div>
        <button className="text-xs font-bold text-slate-300 hover:text-white transition underline underline-offset-4">
          REGENERATE CODE
        </button>
      </div>

      {/* 3. Stats Grid (Matching the 6-box style) */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[9px] text-slate-500 uppercase font-bold">Times Located</p>
          <p className="text-lg font-bold text-white">42</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-[9px] text-slate-500 uppercase font-bold">Accuracy</p>
          <p className="text-lg font-bold text-green-500">98%</p>
        </div>
      </div>

      {/* 4. Action List */}
      <div className="w-full max-w-sm space-y-3">
        <button className="w-full flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-2xl hover:bg-slate-800 transition group">
          <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Privacy Settings</span>
          <span className="text-slate-600">→</span>
        </button>
        <button className="w-full flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-2xl hover:bg-slate-800 transition group">
          <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Campus Map Data</span>
          <span className="text-slate-600">→</span>
        </button>
        <button className="w-full p-4 text-red-900/80 text-xs font-bold uppercase tracking-widest hover:text-red-500 transition">
          Deactivate Signal
        </button>
      </div>
    </div>
  )
}

export default ProfilePage;