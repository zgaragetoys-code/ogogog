"use client";

import { useState } from "react";
import NewListingClient from "./NewListingClient";
import CustomListingClient from "./CustomListingClient";

type Mode = "card" | "custom";

export default function ListingFormSwitcher() {
  const [mode, setMode] = useState<Mode>("card");

  return (
    <>
      <div className="mb-6 text-sm text-black">
        {mode === "card" ? (
          <>
            Looking for something not in our catalog?{" "}
            <button
              type="button"
              onClick={() => setMode("custom")}
              className="text-blue-600 hover:underline font-medium"
            >
              Create a custom listing
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMode("card")}
            className="text-blue-600 hover:underline font-medium"
          >
            ← Back to card listing
          </button>
        )}
      </div>

      {mode === "card" ? <NewListingClient /> : <CustomListingClient />}
    </>
  );
}
