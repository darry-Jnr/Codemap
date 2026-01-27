"use client"

import React from 'react'

const TrackPage = () => {
  return (
    <div className="min-h-screen bg-white p-6 pt-24 pb-32 flex flex-col items-center justify-center">
      
      {/* 1. Header Section */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
          TRACK <span className="text-green-600">FRIENDS</span>
        </h1>
        <div className="h-1 w-20 bg-green-500 mx-auto mt-2 rounded-full" />
      </div>

      {/* 2. Main Status Message */}
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-400 italic">
          Coming Soon...
        </p>
        <p className="text-sm text-slate-500 mt-4 max-w-xs mx-auto">
          Our real-time campus radar is currently being optimized for the Benin City grid.
        </p>
      </div>

      {/* 3. Status Indicator */}
      <div className="mt-12 flex items-center gap-3 px-6 py-2 border border-slate-200 rounded-full shadow-sm">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Calibrating Satellite
        </span>
      </div>

    </div>
  )
}

export default TrackPage