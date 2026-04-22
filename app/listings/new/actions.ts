"use server";

// Stub — full validation and insert implemented in the next commit.
// Exists now so NewListingClient.tsx compiles cleanly.
export async function createListing(
  _formData: FormData
): Promise<{ error: string } | void> {
  return { error: "Not yet implemented — coming in the next commit." };
}
