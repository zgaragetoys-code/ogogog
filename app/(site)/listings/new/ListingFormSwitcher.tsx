import NewListingClient from "./NewListingClient";

export default function ListingFormSwitcher({ initialCardId }: { initialCardId?: string }) {
  return <NewListingClient initialCardId={initialCardId} />;
}
