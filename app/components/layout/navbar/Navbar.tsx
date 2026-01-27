"use client"


const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-900/20 bg-white backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight ">
            CODE<span className="text-green-500">MAP</span>
          </span>
        </div>

        {/* Action Button - For sharing codes later */}
        <div className="flex items-center gap-4">
          <button className="rounded-lg bg-green-500 px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-green-400">
           Login
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar