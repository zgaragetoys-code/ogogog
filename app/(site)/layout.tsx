import NavBarServer from "@/components/NavBarServer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBarServer />
      {children}
    </>
  );
}
