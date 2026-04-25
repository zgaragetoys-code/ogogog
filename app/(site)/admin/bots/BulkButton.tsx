"use client";

import { useFormStatus } from "react-dom";

export function BulkButton({
  children,
  variant = "outline",
  formAction,
}: {
  children: React.ReactNode;
  variant?: "solid" | "outline";
  formAction?: string | ((formData: FormData) => void | Promise<void>);
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formAction={formAction as never}
      disabled={pending}
      className={`text-xs px-3 py-1.5 font-bold transition-colors disabled:opacity-40 ${
        variant === "solid"
          ? "bg-black text-white hover:bg-zinc-800"
          : "border-2 border-black text-black hover:bg-black hover:text-white"
      }`}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
