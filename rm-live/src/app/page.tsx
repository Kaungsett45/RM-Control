import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const logout = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/login");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <main className="w-full max-w-2xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-2xl shadow-2xl">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            RM Control Center
          </h1>
          <p className="text-lg text-foreground/60">
            Welcome back, <span className="font-semibold text-blue-400">{user.email}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-6 border border-white/5 transition-hover hover:bg-white/10">
            <h3 className="font-semibold text-foreground">Live Streaming</h3>
            <p className="text-sm text-foreground/40">Start your broadcast now</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-6 border border-white/5 transition-hover hover:bg-white/10">
            <h3 className="font-semibold text-foreground">Video Library</h3>
            <p className="text-sm text-foreground/40">Manage your recordings</p>
          </div>
        </div>

        <form action={logout} className="pt-8">
          <button className="rounded-full bg-red-500/10 px-8 py-2.5 text-sm font-medium text-red-500 border border-red-500/20 transition-all hover:bg-red-500 hover:text-white">
            Log Out
          </button>
        </form>
      </main>
    </div>
  );
}

