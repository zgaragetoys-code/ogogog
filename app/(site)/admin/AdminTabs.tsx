"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/featured", label: "Featured" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/bots", label: "Bots 🤖" },
];

export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1">
      {TABS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 text-sm font-black uppercase tracking-wide transition-colors ${
              active
                ? "bg-white text-red-600"
                : "text-white hover:bg-red-700"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
