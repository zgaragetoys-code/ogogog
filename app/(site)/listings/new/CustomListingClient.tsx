"use client";

import { useState } from "react";
import { createCustomListing } from "./customActions";
import {
  LISTING_TYPES,
  CUSTOM_CATEGORIES,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITIONS,
  GENERIC_CONDITION_LABELS,
  PRICE_TYPES,
  PRICE_TYPE_LABELS,
  type ListingType,
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
  } catch {
    return false;
  }
}

type Errors = Record<string, string>;

const inputCls =
  "w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none";
const labelCls = "block text-xs font-black text-black mb-1 uppercase tracking-widest";
const errorCls = "text-red-600 text-xs mt-1";
const sectionCls = "border-2 border-black p-6";
const sectionTitleCls = "text-xs font-black text-black mb-4 uppercase tracking-widest";

export default function CustomListingClient() {
  const [listingType, setListingType] = useState<ListingType>("for_sale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CustomCategory | "">("");
  const [condition, setCondition] = useState<GenericCondition | "">("");
  const [priceType, setPriceType] = useState<PriceType>("firm");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [photoLinks, setPhotoLinks] = useState<string[]>([]);
  const [photoNotes, setPhotoNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const showPriceInput = priceType !== "open_to_offers";

  function handlePriceTypeChange(type: PriceType) {
    setPriceType(type);
    if (type === "open_to_offers") setPrice("");
    setErrors((prev) => ({ ...prev, price: "" }));
  }

  function addPhotoLink() {
    setPhotoLinks((prev) => [...prev, ""]);
  }

  function updatePhotoLink(i: number, val: string) {
    setPhotoLinks((prev) => prev.map((l, j) => (j === i ? val : l)));
  }

  function removePhotoLink(i: number) {
    setPhotoLinks((prev) => prev.filter((_, j) => j !== i));
  }

  function validate(): boolean {
    const errs: Errors = {};

    if (!title.trim()) errs.title = "Title is required.";
    else if (title.length > MAX_TITLE) errs.title = `Max ${MAX_TITLE} characters.`;

    if (!description.trim()) errs.description = "Description is required.";
    if (!category) errs.category = "Please select a category.";
    if (!condition) errs.condition = "Please select a condition.";

    if (showPriceInput) {
      if (!price) {
        errs.price = "Price is required for this pricing type.";
      } else {
        const p = parseFloat(price);
        if (isNaN(p) || p <= 0) errs.price = "Please enter a valid price.";
        else if (p > MAX_PRICE) errs.price = `Max price is $${MAX_PRICE.toLocaleString()}.`;
      }
    }

    photoLinks.forEach((link, i) => {
      if (link.trim() && !isValidHttpUrl(link.trim())) {
        errs[`photo_${i}`] = "Must be a valid http:// or https:// URL.";
      }
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
    fd.set("listing_type", listingType);
    fd.set("title", title.trim());
    fd.set("description", description.trim());
    fd.set("custom_category", category);
    fd.set("condition_generic", condition);
    fd.set("price_type", priceType);
    if (price) fd.set("price", price);
    if (notes.trim()) fd.set("notes", notes.trim());
    if (photoNotes.trim()) fd.set("photo_notes", photoNotes.trim());
    fd.set("photo_links", JSON.stringify(photoLinks.map((l) => l.trim()).filter(Boolean)));

    const result = await createCustomListing(fd);
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* 1. Listing type */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>1. Listing type</h2>
        <div className="flex gap-3">
          {(["for_sale", "wanted"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setListingType(type)}
              className={`flex-1 py-2.5 text-sm font-bold border-2 transition-colors ${
                listingType === type
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black hover:bg-gray-100"
              }`}
            >
              {type === "for_sale" ? "For Sale" : "Wanted"}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Title + description */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>2. What are you listing?</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className={labelCls}>Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE}
              placeholder="e.g. Ultra Pro 9-pocket binder, red"
              className={inputCls}
            />
            <div className="flex justify-between mt-1">
              {errors.title
                ? <p className={errorCls}>{errors.title}</p>
                : <span />}
              <p className="text-xs text-black">{title.length}/{MAX_TITLE}</p>
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelCls}>Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item — condition details, size, compatibility, quantity, anything relevant…"
              rows={4}
              className={`${inputCls} resize-y`}
            />
            {errors.description && <p className={errorCls}>{errors.description}</p>}
          </div>
        </div>
      </div>

      {/* 3. Category + condition */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>3. Category &amp; condition</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="category" className={labelCls}>Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CustomCategory)}
              className={inputCls}
            >
              <option value="">Select category…</option>
              {CUSTOM_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CUSTOM_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            {errors.category && <p className={errorCls}>{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="condition" className={labelCls}>Condition</label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as GenericCondition)}
              className={inputCls}
            >
              <option value="">Select condition…</option>
              {GENERIC_CONDITIONS.map((c) => (
                <option key={c} value={c}>{GENERIC_CONDITION_LABELS[c]}</option>
              ))}
            </select>
            {errors.condition && <p className={errorCls}>{errors.condition}</p>}
          </div>
        </div>
      </div>

      {/* 4. Price */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>4. Price</h2>

        <div className="flex gap-2 mb-4">
          {PRICE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handlePriceTypeChange(type)}
              className={`flex-1 py-2 text-sm font-bold border-2 transition-colors ${
                priceType === type
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black hover:bg-gray-100"
              }`}
            >
              {PRICE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {priceType === "open_to_offers" ? (
          <p className="text-sm text-black">
            Your listing will show &ldquo;Make an offer&rdquo; — no price displayed.
          </p>
        ) : (
          <div>
            <label htmlFor="price" className={labelCls}>
              {priceType === "obo"
                ? listingType === "wanted"
                  ? "Maximum price (starting point)"
                  : "Asking price (starting point)"
                : "Price"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-black select-none">
                $
              </span>
              <input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0.01"
                max={MAX_PRICE}
                step="0.01"
                className={`${inputCls} pl-7`}
              />
            </div>
            {errors.price && <p className={errorCls}>{errors.price}</p>}
          </div>
        )}
      </div>

      {/* 5. Notes */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>5. Notes <span className="font-normal text-sm">(optional)</span></h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any extra details, shipping info, trade preferences…"
          rows={3}
          className={`${inputCls} resize-y`}
        />
        <p className="text-xs text-black mt-1 text-right">{notes.length} characters</p>
      </div>

      {/* 6. Photos */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>
          6. Photos <span className="font-normal text-sm">(optional)</span>
        </h2>
        <p className="text-xs text-black mb-4">
          Paste links from Imgur, Google Drive, Dropbox, Discord, or any publicly
          accessible URL. Direct image links will show as thumbnails.
        </p>

        {photoLinks.length >= MAX_PHOTO_LINKS && (
          <p className="text-xs font-bold text-black border-2 border-black px-3 py-2 mb-3">
            {photoLinks.length} links added — most listings only need a few.
          </p>
        )}

        <div className="space-y-2">
          {photoLinks.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updatePhotoLink(i, e.target.value)}
                  placeholder="https://i.imgur.com/example.jpg"
                  className={inputCls}
                />
                {errors[`photo_${i}`] && (
                  <p className={errorCls}>{errors[`photo_${i}`]}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removePhotoLink(i)}
                className="py-2 px-1 text-sm text-black hover:text-red-600 transition-colors shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addPhotoLink}
          className="mt-3 text-sm font-bold text-black hover:underline"
        >
          + Add photo link
        </button>

        {photoLinks.length > 0 && (
          <div className="mt-4">
            <label htmlFor="photo_notes" className={labelCls}>
              Photo notes <span className="font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="photo_notes"
              value={photoNotes}
              onChange={(e) => setPhotoNotes(e.target.value)}
              placeholder="e.g. First photo is front, second is back"
              className={inputCls}
            />
          </div>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-red-600 text-center px-4">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Creating listing…" : "Create listing"}
      </button>
    </form>
  );
}
