"use client";

import { useState } from "react";
import { updateCustomListing } from "./actions";
import {
  CUSTOM_CATEGORIES,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITIONS,
  GENERIC_CONDITION_LABELS,
  PRICE_TYPES,
  PRICE_TYPE_LABELS,
  type CustomListing,
  type CustomCategory,
  type GenericCondition,
  type PriceType,
} from "@/types/database";

const MAX_PHOTO_LINKS = 10;
const MAX_PRICE = 100_000;
const MAX_TITLE = 100;

function isValidHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch { return false; }
}

type Errors = Record<string, string>;

const inputCls =
  "w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none";
const labelCls = "block text-xs font-black text-black mb-1 uppercase tracking-widest";
const errorCls = "text-red-600 text-xs mt-1";
const sectionCls = "border-2 border-black p-5";
const sectionTitleCls = "text-xs font-black text-black mb-4 uppercase tracking-widest";

export default function EditCustomListingClient({
  listingId,
  listing,
}: {
  listingId: string;
  listing: CustomListing;
}) {
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description ?? "");
  const [category, setCategory] = useState<CustomCategory | "">(listing.custom_category);
  const [condition, setCondition] = useState<GenericCondition | "">(listing.condition_generic);
  const [priceType, setPriceType] = useState<PriceType>(listing.price_type);
  const [price, setPrice] = useState(listing.price ? String(listing.price) : "");
  const [notes, setNotes] = useState(listing.notes ?? "");
  const [photoLinks, setPhotoLinks] = useState<string[]>(listing.photo_links ?? []);
  const [photoNotes, setPhotoNotes] = useState(listing.photo_notes ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const showPriceInput = priceType !== "open_to_offers";

  function addPhotoLink() { setPhotoLinks((p) => [...p, ""]); }
  function updatePhotoLink(i: number, v: string) { setPhotoLinks((p) => p.map((l, j) => j === i ? v : l)); }
  function removePhotoLink(i: number) { setPhotoLinks((p) => p.filter((_, j) => j !== i)); }

  function validate(): boolean {
    const errs: Errors = {};
    if (!title.trim()) errs.title = "Title is required.";
    else if (title.length > MAX_TITLE) errs.title = `Max ${MAX_TITLE} characters.`;
    if (!category) errs.category = "Please select a category.";
    if (!condition) errs.condition = "Please select a condition.";
    if (showPriceInput) {
      if (!price) errs.price = "Price is required.";
      else {
        const p = parseFloat(price);
        if (isNaN(p) || p <= 0) errs.price = "Enter a valid price.";
        else if (p > MAX_PRICE) errs.price = `Max $${MAX_PRICE.toLocaleString()}.`;
      }
    }
    photoLinks.forEach((link, i) => {
      if (link.trim() && !isValidHttpUrl(link.trim())) errs[`photo_${i}`] = "Must be a valid https:// URL.";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");

    const fd = new FormData();
    fd.set("title", title.trim());
    if (description.trim()) fd.set("description", description.trim());
    fd.set("custom_category", category);
    fd.set("condition_generic", condition);
    fd.set("price_type", priceType);
    if (price) fd.set("price", price);
    if (notes.trim()) fd.set("notes", notes.trim());
    if (photoNotes.trim()) fd.set("photo_notes", photoNotes.trim());
    fd.set("photo_links", JSON.stringify(photoLinks.map((l) => l.trim()).filter(Boolean)));

    const result = await updateCustomListing(listingId, fd);
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Title + description */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Details</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className={labelCls}>Title</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE} className={inputCls} />
            <div className="flex justify-between mt-1">
              {errors.title ? <p className={errorCls}>{errors.title}</p> : <span />}
              <p className="text-xs text-gray-500">{title.length}/{MAX_TITLE}</p>
            </div>
          </div>
          <div>
            <label htmlFor="description" className={labelCls}>Description <span className="font-normal normal-case tracking-normal">(optional)</span></label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} className={`${inputCls} resize-y`} />
          </div>
        </div>
      </div>

      {/* Category + condition */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Category &amp; condition</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="category" className={labelCls}>Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as CustomCategory)} className={inputCls}>
              <option value="">Select category…</option>
              {CUSTOM_CATEGORIES.map((c) => <option key={c} value={c}>{CUSTOM_CATEGORY_LABELS[c]}</option>)}
            </select>
            {errors.category && <p className={errorCls}>{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="condition" className={labelCls}>Condition</label>
            <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value as GenericCondition)} className={inputCls}>
              <option value="">Select condition…</option>
              {GENERIC_CONDITIONS.map((c) => <option key={c} value={c}>{GENERIC_CONDITION_LABELS[c]}</option>)}
            </select>
            {errors.condition && <p className={errorCls}>{errors.condition}</p>}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Price</p>
        <div className="flex gap-2 mb-4">
          {PRICE_TYPES.map((type) => (
            <button key={type} type="button" onClick={() => { setPriceType(type); if (type === "open_to_offers") setPrice(""); }}
              className={`flex-1 py-2 text-sm font-bold border-2 transition-colors ${
                priceType === type ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-gray-100"
              }`}>
              {PRICE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {showPriceInput ? (
          <div>
            <label htmlFor="price" className={labelCls}>Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-black select-none">$</span>
              <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00" min="0.01" max={MAX_PRICE} step="0.01" className={`${inputCls} pl-7`} />
            </div>
            {errors.price && <p className={errorCls}>{errors.price}</p>}
          </div>
        ) : (
          <p className="text-sm text-black">Listing will show &ldquo;Make an offer&rdquo;.</p>
        )}
      </div>

      {/* Notes */}
      <div className={sectionCls}>
        <label htmlFor="notes" className={sectionTitleCls}>Notes <span className="font-normal normal-case tracking-normal">(optional)</span></label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Extra details, shipping info…" rows={3} className={`${inputCls} resize-y`} />
      </div>

      {/* Photos */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Photos <span className="font-normal normal-case tracking-normal">(optional)</span></p>
        <div className="space-y-2">
          {photoLinks.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <input type="url" value={link} onChange={(e) => updatePhotoLink(i, e.target.value)}
                  placeholder="https://i.imgur.com/example.jpg" className={inputCls} />
                {errors[`photo_${i}`] && <p className={errorCls}>{errors[`photo_${i}`]}</p>}
              </div>
              <button type="button" onClick={() => removePhotoLink(i)}
                className="py-2 px-2 text-sm font-bold text-black hover:text-red-600 transition-colors shrink-0">
                ✕
              </button>
            </div>
          ))}
        </div>
        {photoLinks.length < MAX_PHOTO_LINKS && (
          <button type="button" onClick={addPhotoLink}
            className="mt-3 text-sm font-bold text-black hover:underline">
            + Add photo link
          </button>
        )}
        {photoLinks.length > 0 && (
          <div className="mt-4">
            <label htmlFor="photo_notes" className={labelCls}>Photo notes <span className="font-normal normal-case tracking-normal">(optional)</span></label>
            <input type="text" id="photo_notes" value={photoNotes} onChange={(e) => setPhotoNotes(e.target.value)}
              placeholder="e.g. Front / back / UV" className={inputCls} />
          </div>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600 font-bold text-center">{serverError}</p>}

      <button type="submit" disabled={submitting}
        className="w-full py-3 bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors">
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
