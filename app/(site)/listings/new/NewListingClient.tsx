"use client";

import { useState } from "react";
import CardSearch from "@/components/CardSearch";
import { createListing } from "./actions";
import {
  RAW_CONDITIONS,
  SEALED_CONDITIONS,
  GRADING_COMPANIES,
  SEALED_PRODUCT_TYPES,
  GRADE_OPTIONS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  PRICE_TYPES,
  PRICE_TYPE_LABELS,
  type Card,
  type ListingType,
  type ConditionType,
  type RawCondition,
  type SealedCondition,
  type GradingCompany,
  type PriceType,
} from "@/types/database";

const MAX_PHOTO_LINKS = 10;
const MAX_PRICE = 100_000;

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

export default function NewListingClient() {
  const [card, setCard] = useState<Card | null>(null);
  const [listingType, setListingType] = useState<ListingType>("for_sale");
  const [conditionType, setConditionType] = useState<ConditionType>("raw");
  const [rawCondition, setRawCondition] = useState<RawCondition | "">("");
  const [sealedCondition, setSealedCondition] = useState<SealedCondition | "">("");
  const [gradingCompany, setGradingCompany] = useState<GradingCompany | "">("");
  const [grade, setGrade] = useState("");
  const [priceType, setPriceType] = useState<PriceType>("firm");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [photoLinks, setPhotoLinks] = useState<string[]>([]);
  const [photoNotes, setPhotoNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const cardIsSealed = card ? SEALED_PRODUCT_TYPES.has(card.product_type) : false;
  const gradeChoices = gradingCompany ? GRADE_OPTIONS[gradingCompany] : [];
  const showPriceInput = priceType !== "open_to_offers";

  function handleCardSelect(selected: Card | null) {
    setCard(selected);
    if (selected && !SEALED_PRODUCT_TYPES.has(selected.product_type) && conditionType === "sealed") {
      resetConditionFields("raw");
    }
    setErrors((prev) => ({ ...prev, card: "" }));
  }

  function resetConditionFields(type: ConditionType) {
    setConditionType(type);
    setRawCondition("");
    setSealedCondition("");
    setGradingCompany("");
    setGrade("");
  }

  function handleGradingCompanyChange(company: GradingCompany | "") {
    setGradingCompany(company);
    setGrade("");
  }

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

    if (!card) errs.card = "Please select a card.";

    if (conditionType === "raw" && !rawCondition) {
      errs.rawCondition = "Please select a condition grade.";
    }
    if (conditionType === "sealed" && !sealedCondition) {
      errs.sealedCondition = "Please select a sealed condition.";
    }
    if (conditionType === "graded") {
      if (!gradingCompany) errs.gradingCompany = "Please select a grading company.";
      if (!grade) errs.grade = "Please select a grade.";
    }

    if (showPriceInput) {
      if (!price) {
        errs.price = "Price is required for this pricing type.";
      } else {
        const p = parseFloat(price);
        if (isNaN(p) || p <= 0) {
          errs.price = "Please enter a valid price.";
        } else if (p > MAX_PRICE) {
          errs.price = `Max price is $${MAX_PRICE.toLocaleString()}.`;
        }
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
    fd.set("card_id", card!.id);
    fd.set("listing_type", listingType);
    fd.set("condition_type", conditionType);
    if (rawCondition) fd.set("raw_condition", rawCondition);
    if (sealedCondition) fd.set("sealed_condition", sealedCondition);
    if (gradingCompany) fd.set("grading_company", gradingCompany);
    if (grade) fd.set("grade", grade);
    fd.set("price_type", priceType);
    if (price) fd.set("price", price);
    if (notes.trim()) fd.set("notes", notes.trim());
    if (photoNotes.trim()) fd.set("photo_notes", photoNotes.trim());
    fd.set("photo_links", JSON.stringify(photoLinks.map((l) => l.trim()).filter(Boolean)));

    const result = await createListing(fd);
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* 1. Card search */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>1. Find the card you want to list</h2>
        <CardSearch onSelect={handleCardSelect} />
        {errors.card && <p className={errorCls}>{errors.card}</p>}
      </div>

      {card && (
        <>
          {/* 2. Listing type */}
          <div className={sectionCls}>
            <h2 className={sectionTitleCls}>2. Listing type</h2>
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

          {/* 3. Condition */}
          <div className={sectionCls}>
            <h2 className={sectionTitleCls}>3. Condition</h2>

            <div className="flex gap-3 mb-5">
              {(["raw", "graded", ...(cardIsSealed ? ["sealed"] : [])] as ConditionType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => resetConditionFields(type)}
                    className={`px-5 py-2 text-sm font-bold border-2 transition-colors ${
                      conditionType === type
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black hover:bg-gray-100"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                )
              )}
            </div>

            {conditionType === "raw" && (
              <div>
                <label htmlFor="raw_condition" className={labelCls}>Condition grade</label>
                <select
                  id="raw_condition"
                  value={rawCondition}
                  onChange={(e) => setRawCondition(e.target.value as RawCondition)}
                  className={inputCls}
                >
                  <option value="">Select grade…</option>
                  {RAW_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{RAW_CONDITION_LABELS[c]}</option>
                  ))}
                </select>
                {errors.rawCondition && <p className={errorCls}>{errors.rawCondition}</p>}
              </div>
            )}

            {conditionType === "graded" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="grading_company" className={labelCls}>Grading company</label>
                  <select
                    id="grading_company"
                    value={gradingCompany}
                    onChange={(e) => handleGradingCompanyChange(e.target.value as GradingCompany)}
                    className={inputCls}
                  >
                    <option value="">Select company…</option>
                    {GRADING_COMPANIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.gradingCompany && <p className={errorCls}>{errors.gradingCompany}</p>}
                </div>

                {gradingCompany && (
                  <div>
                    <label htmlFor="grade" className={labelCls}>Grade</label>
                    <select
                      id="grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select grade…</option>
                      {gradeChoices.map((g) => (
                        <option key={g} value={String(g)}>{g}</option>
                      ))}
                    </select>
                    {errors.grade && <p className={errorCls}>{errors.grade}</p>}
                  </div>
                )}
              </div>
            )}

            {conditionType === "sealed" && (
              <div>
                <label htmlFor="sealed_condition" className={labelCls}>Sealed condition</label>
                <select
                  id="sealed_condition"
                  value={sealedCondition}
                  onChange={(e) => setSealedCondition(e.target.value as SealedCondition)}
                  className={inputCls}
                >
                  <option value="">Select condition…</option>
                  {SEALED_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{SEALED_CONDITION_LABELS[c]}</option>
                  ))}
                </select>
                {errors.sealedCondition && <p className={errorCls}>{errors.sealedCondition}</p>}
              </div>
            )}
          </div>

          {/* 4. Price */}
          <div className={sectionCls}>
            <h2 className={sectionTitleCls}>4. Price</h2>

            {/* Three-state selector */}
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
            <h2 className={sectionTitleCls}>5. Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the card's condition, any flaws, shipping details, or anything else buyers should know…"
              rows={4}
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
              Paste links from Imgur, Google Drive, Dropbox, Discord, or any
              publicly accessible URL. Direct image links (ending in .jpg, .png,
              .webp) will show as thumbnails on your listing.
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
                  placeholder="e.g. First photo is front, second is back under UV light"
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
        </>
      )}
    </form>
  );
}
