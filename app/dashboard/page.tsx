import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getScalesByOwner } from "@/lib/scales-query";
import { ScaleRow } from "@/components/dashboard/ScaleRow";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login?redirect=/dashboard");

  const scales = await getScalesByOwner(user.id);

  return (
    <div className="flex min-h-screen flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold">Your scales</h1>

      {scales === null ? (
        // Shown when loading the scales failed — different from the empty
        // state below, so someone who actually has saved scales never sees
        // a false "you have none" message.
        <div className="surface flex flex-col items-start gap-3 p-8">
          <p className="text-sm text-red-600">
            Couldn&apos;t load your scales — try refreshing.
          </p>
        </div>
      ) : scales.length === 0 ? (
        <div className="surface flex flex-col items-start gap-3 p-8">
          <p className="text-sm text-muted-foreground">
            No scales yet — start with a classic Major Third.
          </p>
          <Link
            href="/editor"
            className="rounded-sm border border-accent px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-accent/10"
          >
            Open the editor
          </Link>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 font-normal">Name</th>
              <th className="py-2 font-normal">Last edited</th>
              <th className="py-2 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scales.map((scale) => (
              <ScaleRow key={scale.id} scale={scale} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
