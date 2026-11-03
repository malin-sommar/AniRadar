import {
  CalendarDaysIcon,
  CircleUserRoundIcon,
  CompassIcon,
  HouseIcon,
  ListVideoIcon,
  type LucideIcon,
} from "lucide-react"
import type { Route } from "next"

export interface NavItem {
  href: Route
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: HouseIcon },
  { href: "/browse", label: "Browse", icon: CompassIcon },
  { href: "/schedule", label: "Schedule", icon: CalendarDaysIcon },
  { href: "/list", label: "My List", icon: ListVideoIcon },
  { href: "/me", label: "Me", icon: CircleUserRoundIcon },
]

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
