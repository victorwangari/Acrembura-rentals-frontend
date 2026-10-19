import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  FileBarChart,
  LoaderCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiRequest } from '../api/client'

const today = new Date()
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

const dateToInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const currency = (value) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const numberValue = (value) => Number(value || 0)

const formatDate = (value) => {
  if (!value) return 'All dates'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const MetricCard = ({
  title,
  amount,
  description,
  icon: Icon,
  tone = 'blue',
}) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    red: 'bg-rose-50 text-rose-700 ring-rose-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {currency(amount)}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
        <div className={`rounded-xl p-3 ring-1 ${tones[tone] || tones.blue}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

const StatusCard = ({ label, value, tone }) => {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-3 inline-flex rounded-lg px-3 py-1.5 text-xl font-bold ${styles[tone]}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-400">Invoices in selected period</p>
    </div>
  )
}

export default function FinancialReports() {
  const [startDate, setStartDate] = useState(dateToInput(firstDay))
  const [endDate, setEndDate] = useState(dateToInput(today))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [periodError, setPeriodError] = useState('')

  const loadReport = useCallback(async ({ quiet = false } = {}) => {
    if (startDate && endDate && startDate > endDate) {
      setPeriodError('The start date cannot be later than the end date.')
      return
    }

    setPeriodError('')
    setError('')

    if (quiet) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const query = params.toString()
      const result = await apiRequest(
        `/reports/payments${query ? `?${query}` : ''}`
      )

      setReport(result.data)
    } catch (err) {
      setError(err.message || 'Unable to load the financial report.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const metrics = useMemo(() => {
    if (!report) return null

    const totalPaid = numberValue(report.total_paid)
    const waterSales = numberValue(report.total_water_sales)
    const expenses = numberValue(report.total_expenses)

    return {
      totalPaid,
      waterSales,
      expenses,
      totalReceived: totalPaid + waterSales,
      netCashFlow: numberValue(report.net_cash_flow),
    }
  }, [report])

  const exportCsv = () => {
    if (!report) return

    const rows = [
      ['AcreMbura Water & Rentals - Financial Report'],
      ['Start date', report.start_date || 'All dates'],
      ['End date', report.end_date || 'All dates'],
      [],
      ['Metric', 'Amount (KES)'],
      ['Total invoiced', report.total_invoiced],
      ['Invoice payments received', report.total_paid],
      ['Direct water sales', report.total_water_sales],
      ['Total received', metrics.totalReceived.toFixed(2)],
      ['Total expenses', report.total_expenses],
      ['Net cash flow', report.net_cash_flow],
      ['Outstanding in selected period', report.total_outstanding],
      ['Outstanding across all periods', report.total_outstanding_all_periods],
      [],
      ['Invoice status', 'Count'],
      ['Paid invoices', report.paid_invoices],
      ['Partially paid invoices', report.partially_paid_invoices],
      ['Unpaid invoices', report.unpaid_invoices],
    ]

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '')
            return `"${value.replace(/"/g, '""')}"`
          })
          .join(',')
      )
      .join('\r\n')

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `acrembura-financial-report-${startDate || 'all'}-to-${endDate || 'all'}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-blue-600" size={34} />
          <p className="mt-3 text-sm text-slate-500">
            Loading financial report...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <FileBarChart size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Financial Reports
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Monitor income received, expenses, cash flow and outstanding invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={!report}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={19} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900">Report period</h2>
        </div>

        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            loadReport()
          }}
        >
          <div>
            <label htmlFor="report-start-date" className="mb-1.5 block text-sm font-medium text-slate-600">
              Start date
            </label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="report-end-date" className="mb-1.5 block text-sm font-medium text-slate-600">
              End date
            </label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={refreshing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 lg:w-auto"
            >
              {refreshing ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <RefreshCw size={17} />
              )}
              Apply filters
            </button>
          </div>
        </form>

        {periodError && (
          <p className="mt-3 text-sm text-rose-600">{periodError}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Showing:</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
            {formatDate(startDate)}
          </span>
          <span>to</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
            {formatDate(endDate)}
          </span>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Unable to load financial data</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => loadReport()}
              className="mt-3 text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {report && metrics && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Total invoiced"
              amount={report.total_invoiced}
              description="Invoices issued in the selected period"
              icon={FileBarChart}
              tone="blue"
            />
            <MetricCard
              title="Invoice payments received"
              amount={metrics.totalPaid}
              description="Payments received during the selected period"
              icon={Wallet}
              tone="green"
            />
            <MetricCard
              title="Direct water sales"
              amount={metrics.waterSales}
              description="Shop and other direct water sales"
              icon={CircleDollarSign}
              tone="cyan"
            />
            <MetricCard
              title="Total received"
              amount={metrics.totalReceived}
              description="Invoice payments plus direct water sales"
              icon={TrendingUp}
              tone="green"
            />
            <MetricCard
              title="Total expenses"
              amount={metrics.expenses}
              description="Expenses recorded during the selected period"
              icon={TrendingDown}
              tone="red"
            />
            <MetricCard
              title="Net cash flow"
              amount={metrics.netCashFlow}
              description="Total received minus recorded expenses"
              icon={metrics.netCashFlow >= 0 ? ArrowUpRight : ArrowDownRight}
              tone={metrics.netCashFlow >= 0 ? 'green' : 'red'}
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Outstanding balances
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Unpaid invoice balances, regardless of whether they are fully or partially paid.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
                <p className="text-sm font-medium text-amber-800">
                  Outstanding in selected period
                </p>
                <p className="mt-3 text-2xl font-bold text-amber-950">
                  {currency(report.total_outstanding)}
                </p>
                <p className="mt-2 text-xs text-amber-800">
                  Based on invoices issued in this period
                </p>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-5">
                <p className="text-sm font-medium text-rose-800">
                  Total outstanding across all periods
                </p>
                <p className="mt-3 text-2xl font-bold text-rose-950">
                  {currency(report.total_outstanding_all_periods)}
                </p>
                <p className="mt-2 text-xs text-rose-800">
                  Includes unpaid balances from previous periods
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Invoice status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Invoice counts based on invoice issue date.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatusCard
                label="Paid"
                value={report.paid_invoices}
                tone="green"
              />
              <StatusCard
                label="Partially paid"
                value={report.partially_paid_invoices}
                tone="amber"
              />
              <StatusCard
                label="Unpaid"
                value={report.unpaid_invoices}
                tone="red"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Cash flow summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Based on cash received and expenses recorded in the selected period.
                </p>
              </div>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                metrics.netCashFlow >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {metrics.netCashFlow >= 0 ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                {metrics.netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Invoice payments received</span>
                  <span className="font-semibold text-slate-900">{currency(metrics.totalPaid)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${metrics.totalReceived > 0 ? Math.min(100, (metrics.totalPaid / metrics.totalReceived) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Direct water sales</span>
                  <span className="font-semibold text-slate-900">{currency(metrics.waterSales)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{
                      width: `${metrics.totalReceived > 0 ? Math.min(100, (metrics.waterSales / metrics.totalReceived) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Expenses</span>
                  <span className="font-semibold text-rose-700">{currency(metrics.expenses)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{
                      width: `${Math.max(metrics.totalReceived, metrics.expenses) > 0 ? Math.min(100, (metrics.expenses / Math.max(metrics.totalReceived, metrics.expenses)) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-500">Net cash flow for this period</p>
                <p className="mt-1 text-xs text-slate-400">
                  Payments + direct sales − expenses
                </p>
              </div>
              <p className={`text-xl font-bold ${metrics.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {currency(metrics.netCashFlow)}
              </p>
            </div>
          </section>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-900">
            <p className="font-semibold">About these figures</p>
            <p className="mt-1">
              Total invoiced uses invoice dates. Payments, direct water sales and expenses
              use their respective transaction dates. Outstanding across all periods includes
              balances from older invoices. Direct water sales are counted separately from
              invoice payments.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
