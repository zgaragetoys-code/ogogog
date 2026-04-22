"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import { avatarUrl, randomSeed } from "@/lib/avatar";
import { AVATAR_STYLES, AVATAR_STYLE_LABELS, type Profile, type AvatarStyle } from "@/types/database";
import { COUNTRIES } from "@/data/countries";
import { US_STATES } from "@/data/us-states";

const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelCls = "block text-sm font-medium text-black mb-1";
const errorCls = "text-red-600 text-xs mt-1";

// External prop — allows null so callers don't need a fallback
type Props = { profile: Profile | null; email: string };
// Internal prop — null already resolved to EMPTY_PROFILE before passing to sub-components
type InternalProps = { profile: Profile; email: string };

const EMPTY_PROFILE: Profile = {
  id: "",
  username: null,
  display_name: null,
  avatar_seed: null,
  avatar_style: null,
  country: null,
  region: null,
  notes: null,
  collectr_url: null,
  facebook_url: null,
  instagram_url: null,
  ebay_username: null,
  discord_username: null,
  tcgplayer_url: null,
  website_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ── View mode ──────────────────────────────────────────────────────────────

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
    >
      {label}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

function ProfileView({ profile, email, onEdit }: InternalProps & { onEdit: () => void }) {
  const seed = profile.avatar_seed ?? profile.id;
  const style = profile.avatar_style ?? "identicon";
  const displayName = profile.display_name ?? profile.username ?? email;

  const socialLinks = [
    profile.tcgplayer_url && { href: profile.tcgplayer_url, label: "TCGplayer" },
    profile.ebay_username && { href: `https://www.ebay.com/usr/${profile.ebay_username}`, label: `eBay: ${profile.ebay_username}` },
    profile.facebook_url && { href: profile.facebook_url, label: "Facebook" },
    profile.instagram_url && { href: profile.instagram_url, label: "Instagram" },
    profile.discord_username && { href: "#", label: `Discord: ${profile.discord_username}` },
    profile.website_url && { href: profile.website_url, label: "Website" },
  ].filter(Boolean) as { href: string; label: string }[];

  const location = [profile.region, profile.country ? COUNTRIES.find(c => c.code === profile.country)?.name : null]
    .filter(Boolean).join(", ");

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Avatar + identity */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-5">
        <img
          src={avatarUrl(style as AvatarStyle, seed)}
          alt={displayName}
          className="w-20 h-20 rounded-full shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-black truncate">{displayName}</h2>
          {profile.username && (
            <p className="text-sm text-gray-500">@{profile.username}</p>
          )}
          {location && <p className="text-sm text-black mt-1">{location}</p>}
          <p className="text-xs text-gray-500 mt-1">Member since {memberSince}</p>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shrink-0 text-black"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Collectr collection */}
      {profile.collectr_url && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-black">My Collection</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{profile.collectr_url}</p>
          </div>
          <a
            href={profile.collectr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium shrink-0"
          >
            View on Collectr
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Notes */}
      {profile.notes && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-black mb-2">About</h3>
          <p className="text-sm text-black whitespace-pre-wrap">{profile.notes}</p>
        </div>
      )}

      {/* Social / marketplace links */}
      {socialLinks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-black mb-3">Links</h3>
          <div className="space-y-2">
            {socialLinks.map((l) => (
              <SocialLink key={l.label} href={l.href} label={l.label} />
            ))}
          </div>
        </div>
      )}

      {/* Public profile link */}
      {profile.username && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <span className="text-sm text-black truncate">
            Your public profile: <span className="font-medium">/u/{profile.username}</span>
          </span>
          <CopyButton path={`/u/${profile.username}`} />
        </div>
      )}
    </div>
  );
}

function CopyButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(window.location.origin + path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="text-sm text-blue-600 hover:underline shrink-0 whitespace-nowrap">
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

// ── Edit mode ──────────────────────────────────────────────────────────────

function ProfileEditForm({ profile, email, onCancel, onSaved }: InternalProps & { onCancel: () => void; onSaved: () => void }) {
  const [username, setUsername] = useState(profile.username ?? "");
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>(
    profile.avatar_style ?? "identicon"
  );
  const [avatarSeed, setAvatarSeed] = useState(profile.avatar_seed ?? profile.id);
  const [country, setCountry] = useState(profile.country ?? "");
  const [region, setRegion] = useState(profile.region ?? "");
  const [notes, setNotes] = useState(profile.notes ?? "");
  const [collectrUrl, setCollectrUrl] = useState(profile.collectr_url ?? "");
  const [facebookUrl, setFacebookUrl] = useState(profile.facebook_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(profile.instagram_url ?? "");
  const [ebayUsername, setEbayUsername] = useState(profile.ebay_username ?? "");
  const [discordUsername, setDiscordUsername] = useState(profile.discord_username ?? "");
  const [tcgplayerUrl, setTcgplayerUrl] = useState(profile.tcgplayer_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "");
  const [countrySearch, setCountrySearch] = useState(
    profile.country ? (COUNTRIES.find(c => c.code === profile.country)?.name ?? "") : ""
  );
  const [showCountryList, setShowCountryList] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isUS = country === "US";
  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  function selectCountry(code: string, name: string) {
    setCountry(code);
    setCountrySearch(name);
    setShowCountryList(false);
    if (code !== "US") setRegion("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const fd = new FormData();
    fd.set("username", username);
    fd.set("display_name", displayName);
    fd.set("avatar_seed", avatarSeed);
    fd.set("avatar_style", avatarStyle);
    fd.set("country", country);
    fd.set("region", region);
    fd.set("notes", notes);
    fd.set("collectr_url", collectrUrl);
    fd.set("facebook_url", facebookUrl);
    fd.set("instagram_url", instagramUrl);
    fd.set("ebay_username", ebayUsername);
    fd.set("discord_username", discordUsername);
    fd.set("tcgplayer_url", tcgplayerUrl);
    fd.set("website_url", websiteUrl);

    const result = await updateProfile(fd);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      onSaved();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* Avatar picker */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-black mb-1">Avatar</h2>
        <p className="text-xs text-black mb-4">Choose a style — your avatar is generated from your seed.</p>

        <div className="grid grid-cols-5 gap-3 mb-4">
          {AVATAR_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setAvatarStyle(s)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-colors ${
                avatarStyle === s
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={avatarUrl(s, avatarSeed)}
                alt={s}
                className="w-12 h-12 rounded-full"
              />
              <span className="text-xs text-black leading-tight text-center">{AVATAR_STYLE_LABELS[s]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-black">Current seed:</span>
            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{avatarSeed}</code>
          </div>
          <button
            type="button"
            onClick={() => setAvatarSeed(randomSeed())}
            className="text-xs text-blue-600 hover:underline"
          >
            Shuffle seed
          </button>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-black">Identity</h2>
        <div>
          <label htmlFor="username" className={labelCls}>
            Username <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
            <span className="pl-3 text-sm text-gray-400 select-none">@</span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              maxLength={30}
              className="flex-1 px-2 py-2 text-sm text-black bg-transparent focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">3–30 characters. Letters, numbers, underscore, hyphen.</p>
        </div>

        <div>
          <label htmlFor="display_name" className={labelCls}>Display name</label>
          <input
            id="display_name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you appear across the site"
            maxLength={50}
            className={inputCls}
          />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-black">Location</h2>

        {/* Country searchable dropdown */}
        <div className="relative">
          <label htmlFor="country_search" className={labelCls}>
            Country <span className="text-red-500">*</span>
          </label>
          <input
            id="country_search"
            type="text"
            value={countrySearch}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              setShowCountryList(true);
              if (!e.target.value) setCountry("");
            }}
            onFocus={() => setShowCountryList(true)}
            placeholder="Search country…"
            className={inputCls}
            autoComplete="off"
          />
          {showCountryList && filteredCountries.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onMouseDown={() => selectCountry(c.code, c.name)}
                  className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Region */}
        {country && (
          <div>
            <label htmlFor="region" className={labelCls}>
              {isUS ? "State" : "State / province / region"}{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {isUS ? (
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={inputCls}
              >
                <option value="">Select state…</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.name}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input
                id="region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Ontario, Bayern, Queensland"
                className={inputCls}
              />
            )}
          </div>
        )}
      </div>

      {/* About */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-black mb-1">About</h2>
        <p className="text-xs text-black mb-3">Collecting focus, trading preferences, anything you want buyers/sellers to know.</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Focusing on Base Set and Jungle. I only trade within the US. Quick shipper."
          rows={4}
          maxLength={2000}
          className={`${inputCls} resize-y`}
        />
        <p className="text-xs text-black mt-1 text-right">{notes.length}/2000</p>
      </div>

      {/* Social + marketplace links */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-black">Links <span className="font-normal text-sm text-gray-400">(all optional)</span></h2>
        {[
          { id: "collectr_url",   label: "Collectr URL",      value: collectrUrl,      set: setCollectrUrl,      ph: "https://collectr.io/yourname" },
          { id: "tcgplayer_url",  label: "TCGplayer URL",     value: tcgplayerUrl,     set: setTcgplayerUrl,     ph: "https://www.tcgplayer.com/store/..." },
          { id: "ebay_username",  label: "eBay username",     value: ebayUsername,     set: setEbayUsername,     ph: "your_ebay_username" },
          { id: "facebook_url",   label: "Facebook URL",      value: facebookUrl,      set: setFacebookUrl,      ph: "https://facebook.com/yourprofile" },
          { id: "instagram_url",  label: "Instagram URL",     value: instagramUrl,     set: setInstagramUrl,     ph: "https://instagram.com/yourhandle" },
          { id: "discord_username", label: "Discord username", value: discordUsername, set: setDiscordUsername,  ph: "yourname or yourname#1234" },
          { id: "website_url",    label: "Website",           value: websiteUrl,       set: setWebsiteUrl,       ph: "https://yoursite.com" },
        ].map(({ id, label, value, set, ph }) => (
          <div key={id}>
            <label htmlFor={id} className={labelCls}>{label}</label>
            <input id={id} type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={ph} className={inputCls} />
          </div>
        ))}
      </div>

      {error && <p className={errorCls + " text-sm text-center"}>{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 text-black text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export default function ProfileClient({ profile: rawProfile, email }: Props) {
  const profile = rawProfile ?? EMPTY_PROFILE;
  const [mode, setMode] = useState<"view" | "edit">(
    !profile.username ? "edit" : "view"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-black mb-6">
          {mode === "edit" ? "Edit profile" : "My profile"}
        </h1>

        {mode === "view" ? (
          <ProfileView
            profile={profile}
            email={email}
            onEdit={() => setMode("edit")}
          />
        ) : (
          <ProfileEditForm
            profile={profile}
            email={email}
            onCancel={() => setMode("view")}
            onSaved={() => setMode("view")}
          />
        )}
      </main>
    </div>
  );
}
