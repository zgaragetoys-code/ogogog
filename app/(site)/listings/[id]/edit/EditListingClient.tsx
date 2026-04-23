"use client";

import { useState } from "react";
import { updateListing } from "./actions";
import {
  RAW_CONDITIONS,
  SEALED_CONDITIONS,
  GRADING_COMPANIES,
  SEALED_PRODUCT_TYPES,
  GRADE_OPTIONS,
  PRICE_TYPES,
  PRICE_TYPE_LABELS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  PRODUCT_TYPE_LABELS,
  CUSTOM_CATEGORIES,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITIONS,
  GENERIC_CONDITION_LABELS,
  type Listing,
  type Card,
  type ConditionType,
  type RawCondition,
  type SealedCondition,
  type GradingCompany,
  type PriceType,
  type CustomCategory,
  type GenericCondition,
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

const inputCls = "w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none";
const labelCls = "block text-xs font-black text-black mb-1 uppercase tracking-widest";
const errorCls = "text-red-600 text-xs mt-1";
const sectionCls = "border-2 border-black p-5";
const sectionTitleCls = "text-xs font-black text-black mb-4 uppercase tracking-widest";

export default function EditListingClient({
  listingId,
  listing,
}: {
  listingId: string;
  listing: Listing & { card?: Card | null };
}) {
  const { card } = listing;
  const isCard = !!card;
  const cardIsSealed = isCard && SEALED_PRODUCT_TYPES.has(card!.product_type);

  // ── Catalog condition state ────────────────────────────────────────────────
  const [conditionType, setConditionType] = useState<ConditionType>(listing.condition_type ?? "raw");
  const [rawCondition, setRawCondition] = useState<RawCondition | "">(listing.raw_condition ?? "");
  const [sealedCondition, setSealedCondition] = useState<SealedCondition | "">(listing.sealed_condition ?? "");
  const [gradingCompany, setGradingCompany] = useState<GradingCompany | "">(listing.grading_company ?? "");
  const [grade, setGrade] = useState(listing.grade ? String(listing.grade) : "");
  const [certNumber, setCertNumber] = useState(listing.cert_number ?? "");

  // ── Custom item state ──────────────────────────────────────────────────────
  const [title, setTitle] = useState(listing.title ?? "");
  const [category, setCategory] = useState<CustomCategory | "">(listing.custom_category ?? "");
  const [conditionGeneric, setConditionGeneric] = useState<GenericCondition | "">(listing.condition_generic ?? "");
  const [listingImageUrl, setListingImageUrl] = useState(listing.listing_image_url ?? "");
  const [setYear, setSetYear] = useState(listing.set_year ? String(listing.set_year) : "");
  const [setSeries, setSetSeries] = useState(listing.set_series ?? "");

  // ── Shared state ───────────────────────────────────────────────────────────
  const [priceType, setPriceType] = useState<PriceType>(listing.price_type);
  const [price, setPrice] = useState(listing.price ? String(listing.price) : "");
  const [notes, setNotes] = useState(listing.notes ?? "");
  const [photoLinks, setPhotoLinks] = useState<string[]>(listing.photo_links ?? []);
  const [photoNotes, setPhotoNotes] = useState(listing.photo_notes ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const gradeChoices = gradingCompany ? GRADE_OPTIONS[gradingCompany] : [];
  const showPriceInput = priceType !== "open_to_offers";

  function resetConditionFields(type: ConditionType) {
    setConditionType(type);
    setRawCondition("");
    setSealedCondition("");
    setGradingCompany("");
    setGrade("");
  }

  function addPhotoLink() { setPhotoLinks((p) => [...p, ""]); }
  function updatePhotoLink(i: number, v: string) { setPhotoLinks((p) => p.map((l, j) => j === i ? v : l)); }
  function removePhotoLink(i: number) { setPhotoLinks((p) => p.filter((_, j) => j !== i)); }

  function validate(): boolean {
    const errs: Errors = {};
    if (isCard) {
      if (conditionType === "raw" && !rawCondition) errs.rawCondition = "Please select a condition grade.";
      if (conditionType === "sealed" && !sealedCondition) errs.sealedCondition = "Please select a sealed condition.";
      if (conditionType === "graded") {
        if (!gradingCompany) errs.gradingCompany = "Please select a grading company.";
        if (!grade) errs.grade = "Please select a grade.";
      }
    } else {
      if (!title.trim()) errs.title = "Title is required.";
      else if (title.length > MAX_TITLE) errs.title = `Max ${MAX_TITLE} characters.`;
      if (!category) errs.category = "Please select a category.";
      if (listingImageUrl.trim() && !isValidHttpUrl(listingImageUrl.trim()))
        errs.listingImageUrl = "Must be a valid http(s):// URL.";
    }
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

    if (isCard) {
      fd.set("condition_type", conditionType);
      if (rawCondition) fd.set("raw_condition", rawCondition);
      if (sealedCondition) fd.set("sealed_condition", sealedCondition);
      if (gradingCompany) fd.set("grading_company", gradingCompany);
      if (grade) fd.set("grade", grade);
      if (certNumber.trim()) fd.set("cert_number", certNumber.trim());
    } else {
      fd.set("title", title.trim());
      if (category) fd.set("custom_category", category);
      if (conditionGeneric) fd.set("condition_generic", conditionGeneric);
      if (listingImageUrl.trim()) fd.set("listing_image_url", listingImageUrl.trim());
      if (setYear) fd.set("set_year", setYear);
      if (setSeries.trim()) fd.set("set_series", setSeries.trim());
    }

    fd.set("price_type", priceType);
    if (price) fd.set("price", price);
    if (notes.trim()) fd.set("notes", notes.trim());
    if (photoNotes.trim()) fd.set("photo_notes", photoNotes.trim());
    fd.set("photo_links", JSON.stringify(photoLinks.map((l) => l.trim()).filter(Boolean)));

    const result = await updateListing(listingId, fd);
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Catalog: card info (read-only) */}
      {isCard && card && (
        <div className={sectionCls}>
          <p className={sectionTitleCls}>Card</p>
          <div className="flex gap-4 items-start">
            {card.image_url && (
              <img src={card.image_url} alt={card.name} className="w-16 h-auto shrink-0" />
            )}
            <div>
              <p className="font-black text-black">{card.name}</p>
              <p className="text-sm text-gray-700">
                {card.set_name} · #{card.card_number} · {PRODUCT_TYPE_LABELS[card.product_type]}
              </p>
              <p className="text-xs text-gray-700 mt-1">Card cannot be changed. Cancel and create a new listing if needed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom: identity + metadata */}
      {!isCard && (
        <div className={sectionCls}>
          <p className={sectionTitleCls}>Details</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className={labelCls}>Title</label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE} className={inputCls} />
              <div className="flex justify-between mt-1">
                {errors.title ? <p className={errorCls}>{errors.title}</p> : <span />}
                <p className="text-xs text-gray-700">{title.length}/{MAX_TITLE}</p>
              </div>
            </div>
            <div>
              <label htmlFor="category" className={labelCls}>Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value as CustomCategory)} className={inputCls}>
                <option value="">Select category…</option>
                {CUSTOM_CATEGORIES.map((c) => <option key={c} value={c}>{CUSTOM_CATEGORY_LABELS[c]}</option>)}
              </select>
              {errors.category && <p className={errorCls}>{errors.category}</p>}
            </div>
            <div>
              <label htmlFor="listing_image_url" className={labelCls}>Image URL <span className="font-normal normal-case tracking-normal">(optional)</span></label>
              <input id="listing_image_url" type="url" value={listingImageUrl} onChange={(e) => setListingImageUrl(e.target.value)}
                placeholder="https://i.imgur.com/example.jpg" className={inputCls} />
              {errors.listingImageUrl && <p className={errorCls}>{errors.listingImageUrl}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="set_year" className={labelCls}>Year <span className="font-normal normal-case tracking-normal">(optional)</span></label>
                <input id="set_year" type="number" value={setYear} onChange={(e) => setSetYear(e.target.value)}
                  placeholder="e.g. 2024" min="1996" max="2030" className={inputCls} />
              </div>
              <div>
                <label htmlFor="set_series" className={labelCls}>Series <span className="font-normal normal-case tracking-normal">(optional)</span></label>
                <input id="set_series" type="text" value={setSeries} onChange={(e) => setSetSeries(e.target.value)}
                  placeholder="e.g. Scarlet & Violet" className={inputCls} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Condition */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Condition</p>
        {isCard ? (
          <>
            <div className="flex gap-2 mb-4">
              {(["raw", "graded", ...(cardIsSealed ? ["sealed"] : [])] as ConditionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => resetConditionFields(type)}
                  className={`px-4 py-2 text-sm font-bold border-2 transition-colors ${
                    conditionType === type
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black hover:bg-gray-100"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {conditionType === "raw" && (
              <div>
                <label htmlFor="raw_condition" className={labelCls}>Condition grade</label>
                <select id="raw_condition" value={rawCondition} onChange={(e) => setRawCondition(e.target.value as RawCondition)} className={inputCls}>
                  <option value="">Select grade…</option>
                  {RAW_CONDITIONS.map((c) => <option key={c} value={c}>{RAW_CONDITION_LABELS[c]}</option>)}
                </select>
                {errors.rawCondition && <p className={errorCls}>{errors.rawCondition}</p>}
              </div>
            )}

            {conditionType === "graded" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="grading_company" className={labelCls}>Grading company</label>
                  <select id="grading_company" value={gradingCompany}
                    onChange={(e) => { setGradingCompany(e.target.value as GradingCompany); setGrade(""); }}
                    className={inputCls}>
                    <option value="">Select company…</option>
                    {GRADING_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.gradingCompany && <p className={errorCls}>{errors.gradingCompany}</p>}
                </div>
                {gradingCompany && (
                  <div>
                    <label htmlFor="grade" className={labelCls}>Grade</label>
                    <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
                      <option value="">Select grade…</option>
                      {gradeChoices.map((g) => <option key={g} value={String(g)}>{g}</option>)}
                    </select>
                    {errors.grade && <p className={errorCls}>{errors.grade}</p>}
                  </div>
                )}
                <div>
                  <label htmlFor="cert_number" className={labelCls}>
                    Cert # <span className="font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="cert_number"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value.slice(0, 20))}
                    placeholder="e.g. 12345678"
                    className={inputCls}
                  />
                  <p className="text-[10px] text-gray-700 mt-1">PSA, CGC, BGS or SGC certification number</p>
                </div>
              </div>
            )}

            {conditionType === "sealed" && (
              <div>
                <label htmlFor="sealed_condition" className={labelCls}>Sealed condition</label>
                <select id="sealed_condition" value={sealedCondition} onChange={(e) => setSealedCondition(e.target.value as SealedCondition)} className={inputCls}>
                  <option value="">Select condition…</option>
                  {SEALED_CONDITIONS.map((c) => <option key={c} value={c}>{SEALED_CONDITION_LABELS[c]}</option>)}
                </select>
                {errors.sealedCondition && <p className={errorCls}>{errors.sealedCondition}</p>}
              </div>
            )}
          </>
        ) : (
          <div>
            <label htmlFor="condition_generic" className={labelCls}>Condition <span className="font-normal normal-case tracking-normal">(optional)</span></label>
            <select id="condition_generic" value={conditionGeneric} onChange={(e) => setConditionGeneric(e.target.value as GenericCondition)} className={inputCls}>
              <option value="">Any condition</option>
              {GENERIC_CONDITIONS.map((c) => <option key={c} value={c}>{GENERIC_CONDITION_LABELS[c]}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Price */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Price</p>
        <div className="flex gap-2 mb-4">
          {PRICE_TYPES.map((type) => (
            <button key={type} type="button"
              onClick={() => { setPriceType(type); if (type === "open_to_offers") setPrice(""); }}
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
          placeholder="Condition details, flaws, shipping info…" rows={4} className={`${inputCls} resize-y`} />
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
          <button type="button" onClick={addPhotoLink} className="mt-3 text-sm font-bold text-black hover:underline">
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
