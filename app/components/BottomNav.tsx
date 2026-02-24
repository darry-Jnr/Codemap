"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, MapPin, Search } from "lucide-react"

const tabs = [
  { name: "Home", href: "/home", icon: House },
  { name: "Share", href: "/share", icon: MapPin },
  { name: "Find", href: "/find", icon: Search },
]

export default function BottomNav() {
  const pathname = usePathname()

  const hideOn = ["/", "/map"]
  if (hideOn.includes(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-md z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={name}
              href={href}
              className="flex flex-col items-center gap-1"
            >
              <Icon
                size={22}
                className={isActive ? "text-[#6366F1]" : "text-gray-400"}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-[#6366F1]" : "text-gray-400"
                }`}
              >
                {name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}