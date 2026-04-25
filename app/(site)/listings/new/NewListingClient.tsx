"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
  CUSTOM_CATEGORIES,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITIONS,
  GENERIC_CONDITION_LABELS,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  PRICE_TYPES,
  PRICE_TYPE_LABELS,
  type Card,
  type ListingType,
  type ConditionType,
  type RawCondition,
  type SealedCondition,
  type GradingCompany,
  type PriceType,
  type CustomCategory,
  type GenericCondition,
  type ProductType,
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

type Mode = "catalog" | "custom";
type Errors = Record<string, string>;

const inputCls = "w-full px-3 py-2 border-2 border-black text-sm text-black focus:outline-none";
const labelCls = "block text-xs font-black text-black mb-1 uppercase tracking-widest";
const errorCls = "text-red-600 text-xs mt-1";
const sectionCls = "border-2 border-black p-6";
const sectionTitleCls = "text-xs font-black text-black mb-4 uppercase tracking-widest";

export default function NewListingClient({ initialCardId }: { initialCardId?: string }) {
  const [mode, setMode] = useState<Mode>("catalog");

  // Catalog-mode state
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    if (!initialCardId) return;
    const sb = createClient();
    void sb.from("cards").select("id, name, set_name, card_number, image_url, product_type").eq("id", initialCardId).maybeSingle()
      .then(({ data }) => { if (data) setCard(data as Card); });
  }, [initialCardId]);

  // Custom-mode state
  const [title, setTitle] = useState("");
  const [customCategory, setCustomCategory] = useState<CustomCategory | "">("");
  const [productType, setProductType] = useState<ProductType | "">("");
  const [setYear, setSetYear] = useState("");
  const [setSeries, setSetSeries] = useState("");
  const [listingImageUrl, setListingImageUrl] = useState("");

  // Shared state
  const [listingType, setListingType] = useState<ListingType>("for_sale");
  const [conditionType, setConditionType] = useState<ConditionType | "any">("raw");
  const [rawCondition, setRawCondition] = useState<RawCondition | "">("");
  const [sealedCondition, setSealedCondition] = useState<SealedCondition | "">("");
  const [gradingCompany, setGradingCompany] = useState<GradingCompany | "">("");
  const [grade, setGrade] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [conditionGeneric, setConditionGeneric] = useState<GenericCondition | "">("");
  const [priceType, setPriceType] = useState<PriceType>("firm");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [photoLinks, setPhotoLinks] = useState<string[]>([]);
  const [photoNotes, setPhotoNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const isCustomMode = mode === "custom";
  const cardIsSealed = card ? SEALED_PRODUCT_TYPES.has(card.product_type) : false;
  const gradeChoices = gradingCompany ? GRADE_OPTIONS[gradingCompany] : [];
  const showPriceInput = priceType !== "open_to_offers";

  function handleModeSwitch(m: Mode) {
    setMode(m);
    setCard(null);
    setTitle("");
    setCustomCategory("");
    setProductType("");
    setSetYear("");
    setSetSeries("");
    setListingImageUrl("");
    resetCondition("raw");
    setErrors({});
    setServerError("");
  }

  function resetCondition(type: ConditionType | "any") {
    setConditionType(type);
    setRawCondition(""); setSealedCondition(""); setGradingCompany(""); setGrade(""); setConditionGeneric("");
  }

  function handleCardSelect(selected: Card | null) {
    setCard(selected);
    if (selected && !SEALED_PRODUCT_TYPES.has(selected.product_type) && conditionType === "sealed") {
      resetCondition("raw");
    }
    setErrors((prev) => ({ ...prev, card: "" }));
  }

  function validate(): boolean {
    const errs: Errors = {};
    if (mode === "catalog") {
      if (!card) errs.card = "Please select a card.";
    } else {
      if (!title.trim()) errs.title = "Title is required.";
      else if (title.length > MAX_TITLE) errs.title = `Max ${MAX_TITLE} characters.`;
    }

    if (!isCustomMode) {
      // rawCondition blank means "any grade" — valid
      if (conditionType === "sealed" && !sealedCondition) errs.sealedCondition = "Please select a sealed condition.";
      if (conditionType === "graded") {
        if (!gradingCompany) errs.gradingCompany = "Please select a grading company.";
        if (!grade && listingType === "for_sale") errs.grade = "Please select a grade.";
      }
    }
    if (isCustomMode && conditionType !== "any" && !conditionGeneric) errs.conditionGeneric = "Please select a condition.";

    if (showPriceInput) {
      if (!price) errs.price = "Price is required.";
      else {
        const p = parseFloat(price);
        if (isNaN(p) || p <= 0) errs.price = "Enter a valid price.";
        else if (p > MAX_PRICE) errs.price = `Max $${MAX_PRICE.toLocaleString()}.`;
      }
    }

    photoLinks.forEach((link, i) => {
      if (link.trim() && !isValidHttpUrl(link.trim())) errs[`photo_${i}`] = "Must be http:// or https://";
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
    fd.set("mode", mode);
    fd.set("listing_type", listingType);
    if (mode === "catalog") {
      fd.set("card_id", card!.id);
    } else {
      fd.set("title", title.trim());
      if (customCategory) fd.set("custom_category", customCategory);
      if (productType) fd.set("product_type", productType);
      if (setYear) fd.set("set_year", setYear);
      if (setSeries.trim()) fd.set("set_series", setSeries.trim());
      if (listingImageUrl.trim()) fd.set("listing_image_url", listingImageUrl.trim());
    }

    if (!isCustomMode && conditionType !== "any") fd.set("condition_type", conditionType);
    if (rawCondition) fd.set("raw_condition", rawCondition);
    if (sealedCondition) fd.set("sealed_condition", sealedCondition);
    if (gradingCompany) fd.set("grading_company", gradingCompany);
    if (grade) fd.set("grade", grade);
    if (certNumber.trim()) fd.set("cert_number", certNumber.trim());
    if (conditionGeneric) fd.set("condition_generic", conditionGeneric);

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

      {/* 1. Mode selector */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>1. What are you listing?</h2>
        <div className="flex gap-0 border-2 border-black w-fit mb-5">
          {(["catalog", "custom"] as const).map((m) => (
            <button key={m} type="button" onClick={() => handleModeSwitch(m)}
              className={`px-5 py-2.5 text-sm font-bold transition-colors ${mode === m ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}>
              {m === "catalog" ? "Pokemon card / product" : "Custom item"}
            </button>
          ))}
        </div>

        {mode === "catalog" ? (
          <div>
            <label className={labelCls}>Search catalog</label>
            <CardSearch onSelect={handleCardSelect} />
            {errors.card && <p className={errorCls}>{errors.card}</p>}
            {card && (
              <div className="mt-3 flex items-center gap-3 border-2 border-black p-3 bg-gray-50">
                {card.image_url && (
                  <img src={card.image_url} alt={card.name} referrerPolicy="no-referrer" className="h-16 w-auto"
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                )}
                <div>
                  <p className="font-bold text-black text-sm">{card.name}</p>
                  <p className="text-xs text-gray-700">{card.set_name} · #{card.card_number}</p>
                  <p className="text-xs text-gray-700">{PRODUCT_TYPE_LABELS[card.product_type]}</p>
                  {card.release_date && (
                    <p className="text-xs text-gray-700">{new Date(card.release_date).getFullYear()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className={labelCls}>Title <span className="font-normal text-xs">(required)</span></label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE} placeholder="e.g. Ultra Pro 9-pocket binder, red" className={inputCls} />
              <div className="flex justify-between mt-1">
                {errors.title ? <p className={errorCls}>{errors.title}</p> : <span />}
                <p className="text-xs text-black">{title.length}/{MAX_TITLE}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="custom_category" className={labelCls}>Category</label>
                <select id="custom_category" value={customCategory} onChange={(e) => setCustomCategory(e.target.value as CustomCategory)} className={inputCls}>
                  <option value="">Select…</option>
                  {CUSTOM_CATEGORIES.map((c) => <option key={c} value={c}>{CUSTOM_CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="product_type" className={labelCls}>Product type</label>
                <select id="product_type" value={productType} onChange={(e) => setProductType(e.target.value as ProductType)} className={inputCls}>
                  <option value="">Select…</option>
                  {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="set_series" className={labelCls}>Set / product line <span className="font-normal">(optional)</span></label>
                <input id="set_series" type="text" value={setSeries} onChange={(e) => setSetSeries(e.target.value)}
                  placeholder="e.g. Surging Sparks" className={inputCls} />
              </div>
              <div>
                <label htmlFor="set_year" className={labelCls}>Year <span className="font-normal">(optional)</span></label>
                <input id="set_year" type="number" value={setYear} onChange={(e) => setSetYear(e.target.value)}
                  placeholder="2024" min="1996" max="2030" className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="listing_image_url" className={labelCls}>Image URL <span className="font-normal">(optional)</span></label>
              <input id="listing_image_url" type="url" value={listingImageUrl} onChange={(e) => setListingImageUrl(e.target.value)}
                placeholder="https://i.imgur.com/…" className={inputCls} />
            </div>
          </div>
        )}
      </div>

      {/* 2. Listing type */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>2. Listing type</h2>
        <div className="flex gap-3">
          {(["for_sale", "wanted"] as const).map((type) => (
            <button key={type} type="button"
              onClick={() => setListingType(type)}
              className={`flex-1 py-2.5 text-sm font-bold border-2 transition-colors ${listingType === type ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-gray-100"}`}>
              {type === "for_sale" ? "For Sale" : "Wanted"}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Condition */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>3. Condition</h2>

        {isCustomMode ? (
          // Custom items use generic condition (or Any for wanted)
          <div className="space-y-3">
            {listingType === "wanted" && (
              <button type="button" onClick={() => resetCondition("any")}
                className={`px-5 py-2 text-sm font-bold border-2 transition-colors ${conditionType === "any" ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-gray-100"}`}>
                Any condition
              </button>
            )}
            {conditionType !== "any" && (
              <div>
                <label htmlFor="condition_generic" className={labelCls}>Condition</label>
                <select id="condition_generic" value={conditionGeneric} onChange={(e) => setConditionGeneric(e.target.value as GenericCondition)} className={inputCls}>
                  <option value="">Select condition…</option>
                  {GENERIC_CONDITIONS.map((c) => <option key={c} value={c}>{GENERIC_CONDITION_LABELS[c]}</option>)}
                </select>
                {errors.conditionGeneric && <p className={errorCls}>{errors.conditionGeneric}</p>}
              </div>
            )}
          </div>
        ) : (
          // Catalog items use the full condition system
          <>
            <div className="flex flex-wrap gap-3 mb-5">
              {(["raw", "graded", ...(cardIsSealed ? ["sealed"] : []), "any"] as (ConditionType | "any")[]).map(
                (type) => (
                  <button key={type} type="button" onClick={() => resetCondition(type)}
                    className={`px-5 py-2 text-sm font-bold border-2 transition-colors ${conditionType === type ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-gray-100"}`}>
                    {type === "any" ? "Any condition" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                )
              )}
            </div>

            {conditionType === "raw" && (
              <div>
                <label htmlFor="raw_condition" className={labelCls}>Condition grade</label>
                <select id="raw_condition" value={rawCondition} onChange={(e) => setRawCondition(e.target.value as RawCondition)} className={inputCls}>
                  <option value="">Any grade</option>
                  {RAW_CONDITIONS.map((c) => <option key={c} value={c}>{RAW_CONDITION_LABELS[c]}</option>)}
                </select>
                {errors.rawCondition && <p className={errorCls}>{errors.rawCondition}</p>}
              </div>
            )}

            {conditionType === "graded" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="grading_company" className={labelCls}>Grading company</label>
                  <select id="grading_company" value={gradingCompany} onChange={(e) => { setGradingCompany(e.target.value as GradingCompany); setGrade(""); }} className={inputCls}>
                    <option value="">Select company…</option>
                    {GRADING_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.gradingCompany && <p className={errorCls}>{errors.gradingCompany}</p>}
                </div>
                {gradingCompany && (
                  <div>
                    <label htmlFor="grade" className={labelCls}>Grade</label>
                    <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
                      <option value="">{listingType === "wanted" ? "Any grade" : "Select grade…"}</option>
                      {gradeChoices.map((g) => <option key={g} value={String(g)}>{g}</option>)}
                    </select>
                    {errors.grade && <p className={errorCls}>{errors.grade}</p>}
                  </div>
                )}
                <div>
                  <label htmlFor="cert_number" className={labelCls}>
                    Cert # <span className="font-normal">(optional)</span>
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
        )}
      </div>

      {/* 4. Price */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>4. Price</h2>
        <div className="flex gap-2 mb-4">
          {PRICE_TYPES.map((type) => (
            <button key={type} type="button"
              onClick={() => { setPriceType(type); if (type === "open_to_offers") setPrice(""); setErrors((p) => ({ ...p, price: "" })); }}
              className={`flex-1 py-2 text-sm font-bold border-2 transition-colors ${priceType === type ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-gray-100"}`}>
              {PRICE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {showPriceInput ? (
          <div>
            <label htmlFor="price" className={labelCls}>
              {priceType === "obo" ? (listingType === "wanted" ? "Max price" : "Asking price") : "Price"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-black select-none">$</span>
              <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00" min="0.01" max={MAX_PRICE} step="0.01" className={`${inputCls} pl-7`} />
            </div>
            {errors.price && <p className={errorCls}>{errors.price}</p>}
          </div>
        ) : (
          <p className="text-sm text-black">Your listing will show &ldquo;Make an offer&rdquo; — no price displayed.</p>
        )}
      </div>

      {/* 5. Notes */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>5. Notes <span className="font-normal text-sm">(optional)</span></h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Condition details, shipping info, trade preferences…"
          rows={3} className={`${inputCls} resize-y`} />
      </div>

      {/* 6. Photos */}
      <div className={sectionCls}>
        <h2 className={sectionTitleCls}>6. Photos <span className="font-normal text-sm">(optional)</span></h2>
        <p className="text-xs text-black mb-4">Paste links from Imgur, Google Drive, Dropbox, Discord, or any public URL.</p>
        <div className="space-y-2">
          {photoLinks.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <input type="url" value={link} onChange={(e) => setPhotoLinks((p) => p.map((l, j) => j === i ? e.target.value : l))}
                  placeholder="https://i.imgur.com/example.jpg" className={inputCls} />
                {errors[`photo_${i}`] && <p className={errorCls}>{errors[`photo_${i}`]}</p>}
              </div>
              <button type="button" onClick={() => setPhotoLinks((p) => p.filter((_, j) => j !== i))}
                className="py-2 px-1 text-sm text-black hover:text-red-600 transition-colors shrink-0">Remove</button>
            </div>
          ))}
        </div>
        {photoLinks.length < MAX_PHOTO_LINKS && (
          <button type="button" onClick={() => setPhotoLinks((p) => [...p, ""])}
            className="mt-3 text-sm font-bold text-black hover:underline">+ Add photo link</button>
        )}
        {photoLinks.length > 0 && (
          <div className="mt-4">
            <label htmlFor="photo_notes" className={labelCls}>Photo notes <span className="font-normal">(optional)</span></label>
            <input type="text" id="photo_notes" value={photoNotes} onChange={(e) => setPhotoNotes(e.target.value)}
              placeholder="e.g. First photo is front, second is back" className={inputCls} />
          </div>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600 text-center px-4">{serverError}</p>}

      <button type="submit" disabled={submitting}
        className="w-full py-3 bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors">
        {submitting ? "Creating listing…" : "Create listing"}
      </button>
    </form>
  );
}
