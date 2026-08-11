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
        // Distinct from the empty state below: this is a fetch failure, not
        // "you have zero scales" — collapsing the two would tell a user with
        // saved scales that they have none, with a cheery CTA to start over.
        <div className="flex flex-col items-start gap-3 rounded border border-dashed border-red-300 p-8">
          <p className="text-sm text-red-600">
            Couldn&apos;t load your scales — try refreshing.
          </p>
        </div>
      ) : scales.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded border border-dashed border-gray-300 p-8">
          <p className="text-sm text-gray-600">
            No scales yet — start with a classic Major Third.
          </p>
          <Link
            href="/editor"
            className="rounded border border-gray-900 px-3 py-1.5 text-sm font-semibold"
          >
            Open the editor
          </Link>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
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
