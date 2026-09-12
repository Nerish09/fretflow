"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/dashboard",
    label: "Studio",
  },
  {
    href: "/dashboard/songs",
    label: "Setlist",
  },
  {
    href: "/dashboard/exercises",
    label: "Drills",
  },
  {
    href: "/dashboard/practice",
    label: "Practice",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  return (
    <header className="studio-nav">
      <Link
        href="/dashboard"
        className="studio-brand"
      >
        <div className="studio-brand-symbol">
          F/
        </div>

        <div>
          <strong>FretFlow</strong>
          <span>PRACTICE STUDIO</span>
        </div>
      </Link>

      <nav className="studio-nav-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive(link.href)
                ? "studio-nav-link studio-nav-link-active"
                : "studio-nav-link"
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/dashboard/practice"
        className="studio-nav-practice"
      >
        <span className="studio-record-dot" />
        Start session
      </Link>
    </header>
  );
}