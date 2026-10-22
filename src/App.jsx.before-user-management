import { useCallback, useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Droplets,
  FileText,
  CreditCard,
  Receipt,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Mail,
  Menu,
  X,
  Plus,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Clock3,
  ChevronDown,
  CalendarDays,
  CircleDollarSign,
  Waves,
  Truck,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PropertiesUnits from './pages/PropertiesUnits';
import Tenants from './pages/Tenants';
import WaterManagement from './pages/WaterManagement';
import BillingInvoices from './pages/BillingInvoices';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import FinancialReports from './pages/FinancialReports';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import { apiRequest } from './api/client';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Properties & Units', icon: Building2 },
  { label: 'Tenants', icon: Users },
  { label: 'Water Management', icon: Droplets },
  { label: 'Billing & Invoices', icon: FileText },
  { label: 'Payments', icon: CreditCard },
  { label: 'Expenses', icon: Receipt },
  { label: 'Financial Reports', icon: ChartNoAxesCombined },
  { label: 'Messages', icon: Mail },
  { label: 'Notifications', icon: Bell },
]

const salesData = [
  { month: 'May', water: 38000, rent: 145000 },
  { month: 'Jun', water: 45000, rent: 158000 },
  { month: 'Jul', water: 41000, rent: 152000 },
  { month: 'Aug', water: 56000, rent: 168000 },
  { month: 'Sep', water: 52000, rent: 172000 },
  { month: 'Oct', water: 68000, rent: 185000 },
]

const transactions = [
  {
    name: 'Grace Wanjiku',
    description: 'Monthly rent · Unit A04',
    date: 'Today, 10:42 AM',
    amount: 15000,
    method: 'M-Pesa',
    status: 'Completed',
    initials: 'GW',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'ABC Transport',
    description: 'Lorry water sale · KDA 123A',
    date: 'Today, 09:25 AM',
    amount: 10000,
    method: 'Cash',
    status: 'Completed',
    initials: 'AT',
    color: 'bg-cyan-100 text-cyan-700',
  },
  {
    name: 'Peter Mwangi',
    description: 'Water bill · Unit B02',
    date: 'Yesterday, 04:15 PM',
    amount: 1850,
    method: 'M-Pesa',
    status: 'Pending',
    initials: 'PM',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    name: 'Mary Njeri',
    description: 'Monthly rent · Unit C01',
    date: 'Yesterday, 11:30 AM',
    amount: 12000,
    method: 'Bank',
    status: 'Completed',
    initials: 'MN',
    color: 'bg-amber-100 text-amber-700',
  },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount)

function Sidebar({
  activePage,
  setActivePage,
  open,
  onClose,
  user,
  logout,
}) {
  const visibleNavigation =
    user?.role === 'receptionist'
      ? navigation.filter(
          (item) =>
            item.label !== 'Financial Reports' &&
            item.label !== 'Messages'
        )
      : navigation

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen h-dvh w-64 flex-col overflow-hidden bg-[#10243a] text-white transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Fixed brand header */}
        <div className="flex h-[84px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-950/30">
            <Droplets size={25} strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight">AcreMbura</p>
            <p className="mt-0.5 text-[11px] tracking-[0.15em] text-slate-400">
              WATER & RENTALS
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Scrollable navigation and operations area */}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1">
            {visibleNavigation.map(({ label, icon: Icon }) => {
              const active = activePage === label

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setActivePage(label)
                    onClose()
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium transition ${active
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-950/20'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span className="min-w-0 flex-1">{label}</span>

                  {label === 'Billing & Invoices' && (
                    <span className="shrink-0 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                      8
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Water operations card now scrolls with navigation */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                <Waves size={17} />
              </div>
              <p className="text-xs font-semibold">Water operations</p>
            </div>

            <p className="text-[11px] leading-5 text-slate-400">
              Keep track of water sales, meter readings, and daily production.
            </p>

            <button
              type="button"
              onClick={() => {
                setActivePage('Water Management')
                onClose()
              }}
              className="mt-3 text-left text-xs font-semibold text-blue-300 hover:text-blue-200"
            >
              Open water management →
            </button>
          </div>

          {user?.role === 'owner' && (
            <button
              type="button"
              onClick={() => {
                setActivePage('Settings')
                onClose()
              }}
              className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/[0.06] hover:text-white"
            >
              <Settings size={18} />
              Settings
            </button>
          )}
        </div>

        {/* Fixed account section */}
        <div className="shrink-0 border-t border-white/10 bg-[#10243a] p-3 sm:p-4">
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-800">
              {(user?.full_name || 'AM')
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {user?.full_name || 'AcreMbura User'}
              </p>
              <p className="mt-0.5 text-xs capitalize text-slate-400">
                {user?.role || 'user'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

function SummaryCard({
  title,
  amount,
  change,
  description,
  icon: Icon,
  tone,
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-700',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">
          {title}
        </p>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-800 sm:text-[28px]">
        {amount}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
          <ArrowUpRight size={14} />
          {change}
        </span>
        <span className="text-slate-400">{description}</span>
      </div>
    </article>
  )
}

function StatusBadge({ status }) {
  const completed = status === 'Completed'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${completed
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-amber-50 text-amber-700'
        }`}
    >
      {completed ? (
        <CheckCircle2 size={12} />
      ) : (
        <Clock3 size={12} />
      )}
      {status}
    </span>
  )
}

function DashboardContent({ onNewInvoice }) {
  const [period, setPeriod] = useState('Last 6 months')
  const [dashboardData, setDashboardData] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [recentTransactions, setRecentTransactions] = useState([])
  const [dateFilter, setDateFilter] = useState('today')

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true)
    setDashboardError('')

    try {
      const [
        propertiesResult,
        unitsResult,
        invoicesResult,
        salesResult,
        connectionsResult,
        tenantsResult,
        customersResult,
      ] = await Promise.all([
        apiRequest('/properties'),
        apiRequest('/units'),
        apiRequest('/invoices'),
        apiRequest('/water-sales'),
        apiRequest('/water-connections'),
        apiRequest('/tenants'),
        apiRequest('/water-customers?status=active'),
      ])

      const properties = Array.isArray(propertiesResult.data)
        ? propertiesResult.data : []
      const units = Array.isArray(unitsResult.data)
        ? unitsResult.data : []
      const invoices = Array.isArray(invoicesResult.data)
        ? invoicesResult.data : []
      const sales = Array.isArray(salesResult.data)
        ? salesResult.data : []
      const connections = Array.isArray(connectionsResult.data)
        ? connectionsResult.data : []
      const tenants = Array.isArray(tenantsResult.data)
        ? tenantsResult.data : []
      const customers = Array.isArray(customersResult.data)
        ? customersResult.data : []

      setDashboardData({ properties, units, invoices, sales, connections })

      const eligibleInvoices = invoices.filter(
        (invoice) =>
          invoice.status !== 'draft' &&
          Number(invoice.amount_paid || 0) > 0,
      )

      const historyResults = await Promise.allSettled(
        eligibleInvoices.map(async (invoice) => {
          const result = await apiRequest(
            `/invoices/${invoice.id}/payments`,
          )
          const payments = Array.isArray(result.data) ? result.data : []

          const tenant = tenants.find(
            (item) => Number(item.id) === Number(invoice.tenant_id),
          )
          const customer = customers.find(
            (item) =>
              Number(item.id) === Number(invoice.water_customer_id),
          )

          const customerName =
            tenant?.full_name ||
            tenant?.name ||
            customer?.full_name ||
            customer?.name ||
            (invoice.tenant_id
              ? `Tenant #${invoice.tenant_id}`
              : invoice.water_customer_id
                ? `Water customer #${invoice.water_customer_id}`
                : 'Customer not linked')

          return payments.map((payment) => ({
            id: `payment-${payment.id}`,
            name: customerName,
            description: `Invoice ${invoice.invoice_number || `#${invoice.id}`}`,
            date: payment.payment_date || payment.created_at,
            amount: Number(payment.amount || 0),
            method: payment.payment_method || 'Not specified',
            status: 'Completed',
            kind: 'payment',
          }))
        }),
      )

      const paymentTransactions = historyResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)

      const saleTransactions = sales.map((sale) => ({
        id: `sale-${sale.id}`,
        name:
          sale.customer_name ||
          sale.lorry_registration_number ||
          'Water customer',
        description:
          sale.sale_type === 'lorry'
            ? `Lorry water sale${sale.lorry_registration_number ? ` · ${sale.lorry_registration_number}` : ''}`
            : 'Direct water sale',
        date: sale.sale_date || sale.created_at,
        amount: Number(sale.total_amount || 0),
        method: sale.payment_method || 'Not specified',
        status: 'Completed',
        kind: 'sale',
      }))

      const combinedTransactions = [
        ...paymentTransactions,
        ...saleTransactions,
      ]
        .sort(
          (a, b) =>
            new Date(b.date || 0).getTime() -
            new Date(a.date || 0).getTime(),
        )
        .slice(0, 5)

      setRecentTransactions(combinedTransactions)

      const failedRequests = historyResults.filter(
        (result) => result.status === 'rejected',
      )

      if (failedRequests.length > 0) {
        setDashboardError(
          `Some payment histories could not be loaded (${failedRequests.length} invoice(s)). Other dashboard data is available.`,
        )
      }
    } catch (error) {
      setDashboardError(
        error.message || 'Unable to load dashboard data.',
      )
    } finally {
      setDashboardLoading(false)
    }
  }, [])
  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const properties = dashboardData?.properties || []
  const units = dashboardData?.units || []
  const invoices = dashboardData?.invoices || []
  const waterSales = dashboardData?.sales || []
  const connections = dashboardData?.connections || []

  const activeProperties = properties.filter(
    (property) => property.is_active,
  )

  const occupiedUnits = units.filter(
    (unit) => unit.status?.toLowerCase() === 'occupied',
  )

  const activeConnections = connections.filter(
    (connection) => connection.status === 'active',
  )

  const totalOutstanding = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance || 0),
    0,
  )

  const totalInvoiced = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total_amount || 0),
    0,
  )

  const totalWaterSales = waterSales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0,
  )

  const totalInvoicePayments = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount_paid || 0),
    0,
  )

  const totalReceived = totalInvoicePayments + totalWaterSales

  const dateFilteredTransactions = recentTransactions.filter((transaction) => {
    if (dateFilter === 'all') return true
    if (!transaction.date) return false

    const transactionDate = new Date(transaction.date)
    if (Number.isNaN(transactionDate.getTime())) return false

    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    if (dateFilter === 'week') {
      const day = (start.getDay() + 6) % 7
      start.setDate(start.getDate() - day)
    } else if (dateFilter === 'month') {
      start.setDate(1)
    }

    return transactionDate >= start && transactionDate <= now
  })

  const chartMonths = (() => {
    const now = new Date()
    const count = period === 'Last 3 months'
      ? 3
      : period === 'This year'
        ? now.getMonth() + 1
        : 6

    const startMonth = period === 'This year'
      ? 0
      : now.getMonth() - count + 1

    return Array.from({ length: count }, (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        startMonth + index,
        1,
      )

      const year = monthDate.getFullYear()
      const month = monthDate.getMonth()

      const monthInvoices = invoices.filter((invoice) => {
        if (!invoice.invoice_date) return false
        const date = new Date(invoice.invoice_date)
        return date.getFullYear() === year && date.getMonth() === month
      })

      const rent = monthInvoices.reduce(
        (sum, invoice) =>
          sum + (invoice.items || [])
            .filter((item) => item.item_type === 'rent')
            .reduce((itemSum, item) => itemSum + Number(item.amount || 0), 0),
        0,
      )

      const invoicedWater = monthInvoices.reduce(
        (sum, invoice) =>
          sum + (invoice.items || [])
            .filter((item) => item.item_type === 'water')
            .reduce((itemSum, item) => itemSum + Number(item.amount || 0), 0),
        0,
      )

      const directWaterSales = waterSales
        .filter((sale) => {
          const date = new Date(sale.sale_date)
          return date.getFullYear() === year && date.getMonth() === month
        })
        .reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

      return {
        month: monthDate.toLocaleDateString('en-KE', { month: 'short' }),
        rent,
        water: invoicedWater + directWaterSales,
      }
    })
  })()

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-slate-500">
            Dashboard overview
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 sm:text-[30px]">
            Welcome to AcreMbura
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Monitor rental management and water operations from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
            <CalendarDays size={16} />
            <select
              aria-label="Filter recent transactions by date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="max-w-[125px] bg-transparent text-sm outline-none"
            >
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
            </select>
            <ChevronDown size={14} />
          </label>

          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus size={17} />
            New invoice
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total received"
          amount={formatCurrency(totalReceived)}
          change={dashboardLoading ? 'Loading...' : 'Live data'}
          description="Payments and direct water sales"
          icon={Wallet}
          tone="blue"
        />

        <SummaryCard
          title="Rent & water invoiced"
          amount={formatCurrency(totalInvoiced)}
          change={dashboardLoading ? 'Loading...' : `${invoices.length} invoices`}
          description="Total amount billed"
          icon={Building2}
          tone="green"
        />

        <SummaryCard
          title="Direct water sales"
          amount={formatCurrency(totalWaterSales)}
          change={dashboardLoading ? 'Loading...' : `${waterSales.length} sales`}
          description="Recorded water sales"
          icon={Droplets}
          tone="cyan"
        />

        <SummaryCard
          title="Outstanding bills"
          amount={formatCurrency(totalOutstanding)}
          change={dashboardLoading ? 'Loading...' : `${invoices.filter((invoice) => Number(invoice.balance || 0) > 0).length} invoices`}
          description="Unpaid invoice balances"
          icon={AlertCircle}
          tone="orange"
        />
      </section>

      {dashboardError && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{dashboardError}</span>
          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Revenue overview
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Rental income and water sales over time
              </p>
            </div>

            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-blue-400"
            >
              <option>Last 6 months</option>
              <option>Last 3 months</option>
              <option>This year</option>
            </select>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <div>
              <p className="text-xs text-slate-500">
                Combined revenue
              </p>
              <p className="mt-1 text-xl font-bold text-slate-800">
                {formatCurrency(
                  chartMonths.reduce(
                    (sum, item) =>
                      sum + Number(item.rent || 0) + Number(item.water || 0),
                    0,
                  ),
                )}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {period}
            </span>
          </div>

          <div className="mt-5 h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartMonths}
                margin={{ top: 10, right: 5, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="rentFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#2563eb"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="#2563eb"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                  <linearGradient
                    id="waterFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#06b6d4"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="#06b6d4"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#eef2f7"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'rent' ? 'Rent' : 'Water sales',
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rent"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#rentFill)"
                />
                <Area
                  type="monotone"
                  dataKey="water"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#waterFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center gap-5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Rental income
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
              Water sales
            </span>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Quick overview
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Live operational status
              </p>
            </div>
            <span className="rounded-lg bg-slate-50 p-2 text-slate-500">
              <ChartNoAxesCombined size={19} />
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Occupied units</span>
                <span className="text-sm font-bold text-slate-800">
                  {occupiedUnits.length} / {units.length}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${units.length ? (occupiedUnits.length / units.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {units.length
                  ? `${Math.round((occupiedUnits.length / units.length) * 100)}% occupancy`
                  : 'No units recorded yet'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Rent collection</span>
                <span className="text-sm font-bold text-slate-800">
                  {totalInvoiced
                    ? `${Math.round((totalInvoicePayments / totalInvoiced) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${totalInvoiced
                      ? Math.min(100, (totalInvoicePayments / totalInvoiced) * 100)
                      : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Payments received against invoices
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Water connections</span>
                <span className="text-sm font-bold text-slate-800">
                  {activeConnections.length} active
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan-500"
                  style={{
                    width: `${connections.length
                      ? (activeConnections.length / connections.length) * 100
                      : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {connections.length} total connections
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-xl border border-orange-100 bg-orange-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                <Clock3 size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Outstanding invoices
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {invoices.filter((invoice) => Number(invoice.balance || 0) > 0).length} invoices have an outstanding balance of{' '}
                  {formatCurrency(totalOutstanding)}.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Recent transactions
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Latest recorded payments and direct water sales
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] text-left">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dateFilteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${transaction.color}`}
                        >
                          {transaction.initials}
                        </div>
                        <div>
                          <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                            {transaction.name}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-xs text-slate-400">
                            {transaction.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                      {transaction.date
                        ? new Date(transaction.date).toLocaleString('en-KE', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Date unavailable'}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {transaction.method}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-800">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={transaction.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-6 py-4">
            <p className="text-xs text-slate-400">
              {dashboardLoading
                ? 'Loading recent transactions...'
                : dateFilteredTransactions.length > 0
                  ? `Showing ${dateFilteredTransactions.length} latest transaction(s) for ${
                      dateFilter === 'today' ? 'today' :
                      dateFilter === 'week' ? 'this week' :
                      dateFilter === 'month' ? 'this month' : 'all time'
                    }.`
                  : 'No recorded transactions found for this date range.'}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Water operations
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Example activity snapshot
              </p>
            </div>
            <Droplets size={20} className="text-cyan-600" />
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-cyan-50/70 p-3.5">
              <div className="rounded-lg bg-white p-2.5 text-cyan-700 shadow-sm">
                <Truck size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Lorry sales
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Registration tracked per sale
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-blue-50/70 p-3.5">
              <div className="rounded-lg bg-white p-2.5 text-blue-700 shadow-sm">
                <Droplets size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Shop sales
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Walk-in water purchases
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-emerald-50/70 p-3.5">
              <div className="rounded-lg bg-white p-2.5 text-emerald-700 shadow-sm">
                <CircleDollarSign size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Connected customers
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Metered water billing
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/80 py-5 text-xs text-slate-400 sm:flex-row">
        <p>© 2026 AcreMbura Water & Rentals Management System</p>
        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Frontend · API integration in progress
        </p>
      </footer>
    </>
  )
}

function PlaceholderPage({ title }) {
  const icons = {
    'Properties & Units': Building2,
    Tenants: Users,
    'Water Management': Droplets,
    'Billing & Invoices': FileText,
    Payments: CreditCard,
    Expenses: Receipt,
    'Financial Reports': ChartNoAxesCombined,
    Settings,
  }

  const Icon = icons[title] || LayoutDashboard

  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon size={30} />
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-800">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This section will be implemented and connected to the AcreMbura backend.
        </p>
      </div>
    </div>
  )
}

function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState('Dashboard')
  const [invoiceCreateRequest, setInvoiceCreateRequest] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadUnreadNotificationCount() {
      try {
        const result = await apiRequest('/notifications/unread-count')
        if (!cancelled) {
          setUnreadNotificationCount(
            Number(result.data?.unread_count ?? 0)
          )
        }
      } catch {
        if (!cancelled) setUnreadNotificationCount(0)
      }
    }

    if (user) loadUnreadNotificationCount()

    return () => {
      cancelled = true
    }
  }, [user])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        logout={handleLogout}
      />

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="hidden text-[11px] font-medium uppercase tracking-[0.13em] text-slate-400 sm:block">
                AcreMbura Management
              </p>
              <h1 className="truncate text-sm font-bold text-slate-800 sm:mt-1 sm:text-base">
                {activePage}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <label className="relative hidden md:block">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search anything..."
                className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white lg:w-64"
              />
            </label>

            <button
              type="button"
              aria-label={`Notifications${
                unreadNotificationCount > 0
                  ? `, ${unreadNotificationCount} unread`
                  : ''
              }`}
              onClick={() => setActivePage('Notifications')}
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
            >
              <Bell size={18} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadNotificationCount > 99
                    ? '99+'
                    : unreadNotificationCount}
                </span>
              )}
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold uppercase text-blue-800">
                {(user?.full_name || 'AM')
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-700">
                  {user?.full_name}
                </p>
                <p className="mt-0.5 text-[10px] capitalize text-slate-400">
                  {user?.role}
                </p>
              </div>
              <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">

          {activePage === 'Dashboard' ? (
            <DashboardContent
              onNewInvoice={() => {
                setActivePage('Billing & Invoices')
                setInvoiceCreateRequest((count) => count + 1)
              }}
            />
          ) : activePage === 'Properties & Units' ? (
            <PropertiesUnits user={user} />
          ) : activePage === 'Tenants' ? (
            <Tenants />
          ) : activePage === 'Water Management' ? (
            <WaterManagement user={user} />
          ) : activePage === 'Billing & Invoices' ? (
            <BillingInvoices openCreateRequest={invoiceCreateRequest} />
          ) : activePage === 'Payments' ? (
            <Payments />
          ) : activePage === 'Expenses' ? (
            <Expenses user={user} />
          ) : activePage === 'Financial Reports' && user?.role === 'owner' ? (
            <FinancialReports />
          ) : activePage === 'Messages' && user?.role === 'owner' ? (
            <Messages />
          ) : activePage === 'Notifications' ? (
            <Notifications onUnreadCountChange={setUnreadNotificationCount} />
          ) : (
            <PlaceholderPage title={activePage} />
          )}

        </main>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="mt-4 text-sm text-slate-500">
          Restoring your session...
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/"
        element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={<Navigate to={user ? '/' : '/login'} replace />}
      />
    </Routes>
  )
}
