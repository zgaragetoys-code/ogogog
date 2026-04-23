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

type NavLinkDef = { label: string; href: string; badge?: number };

type Props = {
  user: UserInfo | null;
  unreadCount: number;
};

const SHARED_LINKS: NavLinkDef[] = [
  { label: "Featured", href: "/featured" },
  { label: "Browse", href: "/browse" },
];

const GUEST_ONLY_LINKS: NavLinkDef[] = [{ label: "How it works", href: "/how-it-works" }];

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
  badge,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
  mobile?: boolean;
  badge?: number;
}) {
  const active = isActive(pathname, href);
  const badgeEl = badge ? (
    <span className="keep-round ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-black text-white">
      {badge > 9 ? "9+" : badge}
    </span>
  ) : null;

  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center py-2.5 text-sm font-medium border-b border-black/10 ${
          active ? "text-black font-bold" : "text-black"
        }`}
      >
        {label}{badgeEl}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`relative flex items-center text-sm font-medium transition-colors pb-0.5 ${
        active
          ? "text-black border-b-2 border-black"
          : "text-gray-500 hover:text-black"
      }`}
    >
      {label}{badgeEl}
    </Link>
  );
}

export default function NavBar({ user, unreadCount }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const userLinks: NavLinkDef[] = [
    ...SHARED_LINKS,
    { label: "My Listings", href: "/listings/mine" },
    { label: "Messages", href: "/messages", badge: unreadCount || undefined },
  ];
  const guestLinks = [...SHARED_LINKS, ...GUEST_ONLY_LINKS];
  const links = user ? userLinks : guestLinks;

  const displayLabel = user
    ? (user.displayName ?? user.username ?? user.email)
    : null;

  return (
    <nav className="bg-white border-b-2 border-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">

        {/* Logo */}
        <Link href="/" className="font-black text-black text-xl tracking-tight shrink-0 uppercase">
          ogogog
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {links.map(({ label, href, badge }) => (
            <NavLink key={href} href={href} label={label} pathname={pathname} badge={badge} />
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                href="/listings/new"
                className="text-sm px-4 py-2 bg-black text-white font-bold hover:bg-zinc-800 transition-colors"
              >
                + New listing
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 text-sm font-medium text-black hover:bg-gray-100 px-3 py-2 transition-colors"
                >
                  {user.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt={displayLabel ?? ""}
                      className="keep-round w-7 h-7 shrink-0"
                    />
                  )}
                  <span className="max-w-[120px] truncate">{displayLabel}</span>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-0 w-52 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] py-1 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2.5 text-sm font-medium text-black hover:bg-black hover:text-white transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/collection"
                        className="block px-4 py-2.5 text-sm font-medium text-black hover:bg-black hover:text-white transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        My Collection
                      </Link>
                      <Link
                        href="/feature-your-listing"
                        className="block px-4 py-2.5 text-sm font-medium text-black hover:bg-black hover:text-white transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        Feature a listing
                      </Link>
                      <div className="my-1 border-t-2 border-black/10" />
                      <form action={signOut}>
                        <button
                          type="submit"
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-black hover:bg-black hover:text-white transition-colors"
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
              <Link href="/auth/login" className="text-sm font-medium text-black px-3 py-2 hover:bg-gray-100 transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-bold bg-black text-white px-4 py-2 hover:bg-zinc-800 transition-colors"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t-2 border-black bg-white px-4 py-2">
          {links.map(({ label, href, badge }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              pathname={pathname}
              onClick={() => setMenuOpen(false)}
              mobile
              badge={badge}
            />
          ))}
          {user ? (
            <div className="border-t-2 border-black mt-2 pt-2 space-y-0">
              {user.avatarUrl && (
                <div className="flex items-center gap-2 py-2.5 border-b border-black/10">
                  <img src={user.avatarUrl} alt="" className="keep-round w-7 h-7" />
                  <span className="text-sm font-bold text-black truncate">{displayLabel}</span>
                </div>
              )}
              <Link href="/profile" className="flex py-2.5 text-sm font-medium border-b border-black/10" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link href="/collection" className="flex py-2.5 text-sm font-medium border-b border-black/10" onClick={() => setMenuOpen(false)}>My Collection</Link>
              <Link href="/feature-your-listing" className="flex py-2.5 text-sm font-medium border-b border-black/10" onClick={() => setMenuOpen(false)}>Feature a listing</Link>
              <Link
                href="/listings/new"
                className="flex w-full text-center justify-center text-sm bg-black text-white font-bold px-4 py-2.5 mt-3 hover:bg-zinc-800 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                + New listing
              </Link>
              <form action={signOut} className="pt-2">
                <button type="submit" className="w-full text-left py-2.5 text-sm font-medium text-black border-t border-black/10">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="border-t-2 border-black mt-2 pt-2 flex gap-2">
              <Link href="/auth/login" className="text-sm font-medium text-black px-4 py-2 border-2 border-black" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/auth/signup" className="text-sm font-bold bg-black text-white px-4 py-2" onClick={() => setMenuOpen(false)}>Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
