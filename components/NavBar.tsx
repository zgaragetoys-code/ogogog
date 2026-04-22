"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";

type UserInfo = {
  email: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

type Props = {
  user: UserInfo | null;
};

const SHARED_LINKS = [
  { label: "Browse listings", href: "/browse" },
  { label: "Featured", href: "/featured" },
];

const GUEST_ONLY_LINKS = [{ label: "How it works", href: "/how-it-works" }];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavLink({
  href,
  label,
  pathname,
  onClick,
  mobile,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const active = isActive(pathname, href);
  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`block py-2 text-sm ${active ? "text-black font-semibold" : "text-gray-500"}`}
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active ? "text-black font-semibold" : "text-gray-500 hover:text-black"
      }`}
    >
      {label}
    </Link>
  );
}

export default function NavBar({ user }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const guestLinks = [...SHARED_LINKS, ...GUEST_ONLY_LINKS];
  const userLinks = [
    ...SHARED_LINKS,
    { label: "My listings", href: "/listings/mine" },
    { label: "Messages", href: "/messages" },
  ];
  const links = user ? userLinks : guestLinks;

  const newListingActive = isActive(pathname, "/listings/new");
  const displayLabel = user
    ? (user.displayName ?? user.username ?? user.email)
    : null;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-black text-lg tracking-tight shrink-0">
          ogogog
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(({ label, href }) => (
            <NavLink key={href} href={href} label={label} pathname={pathname} />
          ))}
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/listings/new"
                className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                  newListingActive
                    ? "bg-blue-700 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                + New listing
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
                >
                  {user.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt={displayLabel ?? ""}
                      className="w-7 h-7 rounded-full shrink-0"
                    />
                  )}
                  <span className="max-w-[120px] truncate">{displayLabel}</span>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-black hover:bg-gray-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/feature-your-listing"
                        className="block px-4 py-2 text-sm text-black hover:bg-gray-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        Feature your listing
                      </Link>
                      <div className="my-1 border-t border-gray-100" />
                      <form action={signOut}>
                        <button
                          type="submit"
                          className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-black hover:underline">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1 text-black"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-0.5">
          {links.map(({ label, href }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              pathname={pathname}
              onClick={() => setMenuOpen(false)}
              mobile
            />
          ))}
          {user ? (
            <div className="border-t border-gray-100 mt-2 pt-2 space-y-0.5">
              {/* Mobile: avatar + name at top */}
              {user.avatarUrl && (
                <div className="flex items-center gap-2 py-2">
                  <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                  <span className="text-sm text-black truncate">{displayLabel}</span>
                </div>
              )}
              <Link
                href="/profile"
                className={`block py-2 text-sm ${isActive(pathname, "/profile") ? "text-black font-semibold" : "text-gray-500"}`}
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/feature-your-listing"
                className={`block py-2 text-sm ${isActive(pathname, "/feature-your-listing") ? "text-black font-semibold" : "text-gray-500"}`}
                onClick={() => setMenuOpen(false)}
              >
                Feature your listing
              </Link>
              <Link
                href="/listings/new"
                className="block w-full text-center text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-2"
                onClick={() => setMenuOpen(false)}
              >
                + New listing
              </Link>
              <form action={signOut} className="pt-1">
                <button type="submit" className="w-full text-left py-2 text-sm text-black">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="border-t border-gray-100 mt-2 pt-2 flex gap-3">
              <Link href="/auth/login" className="text-sm text-black" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
