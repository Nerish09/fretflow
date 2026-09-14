"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/dashboard",
    label: "Home",
  },
  {
    href: "/dashboard/today",
    label: "Today",
  },
  {
    href: "/dashboard/songs",
    label: "Songs",
  },
  {
    href: "/dashboard/exercises",
    label: "Drills",
  },
  {
    href: "/dashboard/practice",
    label: "Practice",
  },
  {
    href: "/dashboard/progress",
    label: "Progress",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(
    href: string
  ) {
    if (
      href === "/dashboard"
    ) {
      return (
        pathname ===
        "/dashboard"
      );
    }

    return pathname.startsWith(
      href
    );
  }

  return (
    <header className="ff-nav">
      <div className="ff-nav-inner">
        <Link
          href="/dashboard"
          className="ff-brand"
        >
          <span className="ff-brand-mark">
            F/
          </span>

          <div>
            <strong>
              FretFlow
            </strong>

            <small>
              GUITAR PRACTICE
            </small>
          </div>
        </Link>

        <nav className="ff-nav-links">
          {links.map(
            (link) => (
              <Link
                key={
                  link.href
                }
                href={
                  link.href
                }
                className={
                  isActive(
                    link.href
                  )
                    ? "ff-nav-link ff-nav-link-active"
                    : "ff-nav-link"
                }
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <Link
          href="/dashboard/practice"
          className="ff-button ff-button-primary ff-nav-start"
        >
          ▶ Practice
        </Link>
      </div>
    </header>
  );
}