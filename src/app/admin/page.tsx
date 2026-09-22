import nextDynamic from "next/dynamic";

const Admin = nextDynamic(() => import("@/views/Admin"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Loading admin...
    </div>
  ),
});

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <Admin />;
}
