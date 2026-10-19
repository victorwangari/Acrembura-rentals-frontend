
import { useState } from 'react'
import { Droplets, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-white">
      <section className="flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Droplets size={27} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                AcreMbura
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                WATER & RENTALS
              </p>
            </div>
          </div>

          <p className="text-sm font-semibold text-blue-600">
            MANAGEMENT PORTAL
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Sign in to manage your properties, water sales, billing, and payments.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in to your account'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Authorized users only. Contact the system owner if you need account assistance.
          </p>

          <p className="mt-10 text-center text-xs text-slate-400">
            © 2026 AcreMbura Water & Rentals
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-[#10243a] lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative max-w-lg px-12 py-16 text-white xl:px-20">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <Droplets size={34} />
          </div>

          <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            One place for your
            <span className="mt-2 block text-blue-300">
              water and rental business.
            </span>
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-300">
            Manage tenants, track water operations, record payments, and keep your financial records organized from a single dashboard.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold">Rental management</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Properties, tenants, and monthly billing.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold">Water operations</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Meter readings, production, and sales.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
