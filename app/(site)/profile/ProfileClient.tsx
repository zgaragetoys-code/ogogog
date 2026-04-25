"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "./actions";
import { avatarUrl, randomSeed } from "@/lib/avatar";
import { AVATAR_STYLES, AVATAR_STYLE_LABELS, type Profile, type AvatarStyle } from "@/types/database";
import { COUNTRIES } from "@/data/countries";
import { US_STATES } from "@/data/us-states";

const inputCls =
  "w-full px-3 py-2 border-2 border-black text-sm text-black " +
  "focus:outline-none focus:ring-0";
const labelCls = "block text-xs font-black uppercase tracking-widest text-black mb-1";
const errorCls = "text-red-600 text-xs mt-1 font-bold";

type Props = { profile: Profile | null; email: string; isAdmin?: boolean };

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
  global_chat_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function ProfileClient({ profile: rawProfile, email, isAdmin }: Props) {
  const profile = rawProfile ?? EMPTY_PROFILE;
  const router = useRouter();

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
  const [globalChatEnabled, setGlobalChatEnabled] = useState(profile.global_chat_enabled);
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
    fd.set("global_chat_enabled", globalChatEnabled ? "true" : "false");

    const result = await updateProfile(fd);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      const savedUsername = username.trim() || profile.username;
      if (savedUsername) {
        router.push(`/u/${savedUsername}`);
      } else {
        router.refresh();
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-black">Edit profile</h1>
          {profile.username && (
            <Link
              href={`/u/${profile.username}`}
              className="text-sm font-bold text-black hover:underline"
            >
              ← View profile
            </Link>
          )}
        </div>

        {/* Shortcuts */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/collection"
            className="flex-1 flex items-center justify-between border-2 border-black px-4 py-3 hover:bg-black hover:text-white transition-colors group"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Edit Collection</p>
              <p className="text-xs text-gray-700 group-hover:text-white/70 mt-0.5">Add, pin, and manage cards</p>
            </div>
            <span className="text-sm font-black">→</span>
          </Link>
          <Link
            href="/listings/mine"
            className="flex-1 flex items-center justify-between border-2 border-black px-4 py-3 hover:bg-black hover:text-white transition-colors group"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-widest">My Listings</p>
              <p className="text-xs text-gray-700 group-hover:text-white/70 mt-0.5">View and manage listings</p>
            </div>
            <span className="text-sm font-black">→</span>
          </Link>
        </div>

        {/* Incomplete profile banner */}
        {!profile.username && (
          <div className="bg-yellow-400 border-2 border-black px-4 py-3 mb-6">
            <p className="text-sm font-bold text-black">Set a username to complete your profile and make it public.</p>
          </div>
        )}

        {/* Admin badge */}
        {isAdmin && (
          <div className="bg-red-600 border-2 border-red-600 p-4 mb-6 flex items-center justify-between gap-4">
            <p className="text-sm font-black text-white uppercase tracking-widest">⚡ Admin panel</p>
            <a
              href="/admin/featured"
              className="text-sm bg-white text-red-600 font-black px-4 py-2 hover:bg-red-100 transition-colors shrink-0 uppercase tracking-wide"
            >
              Open →
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* Avatar picker */}
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-base font-semibold text-black mb-1">Avatar</h2>
            <p className="text-xs text-black mb-4">Choose a style — your avatar is generated from your seed.</p>

            <div className="grid grid-cols-5 gap-3 mb-4">
              {AVATAR_STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAvatarStyle(s)}
                  className={`flex flex-col items-center gap-1 p-2 border-2 transition-colors ${
                    avatarStyle === s
                      ? "border-black bg-gray-100"
                      : "border-gray-300 hover:border-black"
                  }`}
                >
                  <img
                    src={avatarUrl(s, avatarSeed)}
                    alt={s}
                    className="keep-round w-12 h-12"
                  />
                  <span className="text-xs text-black leading-tight text-center">{AVATAR_STYLE_LABELS[s]}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-black">Current seed:</span>
                <code className="text-xs bg-gray-100 border border-black px-2 py-0.5 font-mono">{avatarSeed}</code>
              </div>
              <button
                type="button"
                onClick={() => setAvatarSeed(randomSeed())}
                className="text-xs font-bold text-black hover:underline"
              >
                Shuffle seed
              </button>
            </div>
          </div>

          {/* Identity */}
          <div className="bg-white border-2 border-black p-6 space-y-4">
            <h2 className="text-base font-semibold text-black">Identity</h2>
            <div>
              <label htmlFor="username" className={labelCls}>
                Username <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border-2 border-black focus-within:ring-0">
                <span className="pl-3 text-sm text-gray-700 select-none">@</span>
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
              <p className="text-xs text-gray-700 mt-1">3–30 characters. Letters, numbers, underscore, hyphen.</p>
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
          <div className="bg-white border-2 border-black p-6 space-y-4">
            <h2 className="text-base font-semibold text-black">Location</h2>

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
                <div className="absolute z-10 w-full mt-0 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] max-h-52 overflow-y-auto">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onMouseDown={() => selectCountry(c.code, c.name)}
                      className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100 font-medium"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {country && (
              <div>
                <label htmlFor="region" className={labelCls}>
                  {isUS ? "State" : "State / province / region"}{" "}
                  <span className="text-gray-700 font-normal">(optional)</span>
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
          <div className="bg-white border-2 border-black p-6">
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
          <div className="bg-white border-2 border-black p-6 space-y-4">
            <h2 className="text-base font-semibold text-black">Links <span className="font-normal text-sm text-gray-700">(all optional)</span></h2>
            {[
              { id: "collectr_url",     label: "Collectr URL",      value: collectrUrl,      set: setCollectrUrl,      ph: "https://collectr.io/yourname" },
              { id: "tcgplayer_url",    label: "TCGplayer URL",     value: tcgplayerUrl,     set: setTcgplayerUrl,     ph: "https://www.tcgplayer.com/store/..." },
              { id: "ebay_username",    label: "eBay username",     value: ebayUsername,     set: setEbayUsername,     ph: "your_ebay_username" },
              { id: "facebook_url",     label: "Facebook URL",      value: facebookUrl,      set: setFacebookUrl,      ph: "https://facebook.com/yourprofile" },
              { id: "instagram_url",    label: "Instagram URL",     value: instagramUrl,     set: setInstagramUrl,     ph: "https://instagram.com/yourhandle" },
              { id: "discord_username", label: "Discord username",  value: discordUsername,  set: setDiscordUsername,  ph: "yourname or yourname#1234" },
              { id: "website_url",      label: "Website",           value: websiteUrl,       set: setWebsiteUrl,       ph: "https://yoursite.com" },
            ].map(({ id, label, value, set, ph }) => (
              <div key={id}>
                <label htmlFor={id} className={labelCls}>{label}</label>
                <input id={id} type="text" value={value} onChange={(e) => set(e.target.value)} placeholder={ph} className={inputCls} />
              </div>
            ))}
          </div>

          {/* Global chat */}
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-base font-semibold text-black mb-1">Global Chat</h2>
            <p className="text-xs text-gray-700 mb-4">The community chat shown under the Messages tab.</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setGlobalChatEnabled((v) => !v)}
                className={`relative w-11 h-6 border-2 border-black transition-colors shrink-0 cursor-pointer ${
                  globalChatEnabled ? "bg-black" : "bg-white"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white border border-black transition-transform ${
                    globalChatEnabled ? "translate-x-5 bg-white" : "translate-x-0 bg-gray-300"
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-black">
                {globalChatEnabled ? "Enabled — you can send and receive messages" : "Disabled — chat is hidden"}
              </span>
            </label>
          </div>

          {error && <p className={errorCls + " text-sm text-center"}>{error}</p>}

          <div className="flex gap-3">
            <Link
              href={profile.username ? `/u/${profile.username}` : "/browse"}
              className="flex-1 py-3 border-2 border-black text-black text-sm font-bold hover:bg-gray-100 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold transition-colors"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
