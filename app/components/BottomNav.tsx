"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, MapPin, Compass, Clock } from "lucide-react"

const tabs = [
  { name: "Home",    href: "/home",    icon: House },
  { name: "Share",   href: "/share",   icon: MapPin },
  { name: "Find",    href: "/find",    icon: Compass },
  { name: "Recents", href: "/recents", icon: Clock },
]

export default function BottomNav() {
  const pathname = usePathname()
  const hideOn = ["/", "/map", "/waiting"]
  if (hideOn.includes(pathname)) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "0.5px solid rgba(0,0,0,0.08)",
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-sm mx-auto px-2">
        {tabs.map(({ name, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={name}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
            >
              {/* Active pill background */}
              {isActive && (
                <span
                  className="absolute top-2 rounded-2xl"
                  style={{
                    width: "44px",
                    height: "32px",
                    background: "rgba(99,102,241,0.1)",
                  }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                style={{
                  color: isActive ? "#6366F1" : "#9CA3AF",
                  position: "relative",
                  zIndex: 1,
                  transition: "color 0.2s ease, transform 0.2s ease",
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#6366F1" : "#9CA3AF",
                  letterSpacing: "0.01em",
                  fontFamily: "'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif",
                  transition: "color 0.2s ease",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {name}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Safe area spacer for iPhone home indicator */}
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  )
}