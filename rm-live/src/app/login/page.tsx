import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string; error: string }>
}) {
  const { message, error } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Sign in to start streaming and chatting
          </p>
        </div>

        <form className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-500 border border-emerald-500/20">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-foreground placeholder-white/20 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" title="password" className="block text-sm font-medium text-foreground/80">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-foreground placeholder-white/20 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              formAction={login}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              Sign In
            </button>
            <button
              formAction={signup}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
