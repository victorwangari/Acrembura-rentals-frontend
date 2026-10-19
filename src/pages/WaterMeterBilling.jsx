
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  Droplets,
  FileText,
  Gauge,
  Plus,
  RefreshCw,
  Search,
  X,
  AlertCircle,
  Mail,
  Eye,
} from 'lucide-react'
import { apiRequest } from '../api/client'

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const today = () => new Date().toLocaleDateString('en-CA')

const money = (value) =>
  `KSh ${Number(value || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const dateLabel = (value) => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-KE', { dateStyle: 'medium' })
}

function Field({ label, children, hint }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function Notice({ notice, onClose }) {
  if (!notice) return null
  const success = notice.type === 'success'
  const Icon = success ? CheckCircle2 : AlertCircle

  return (
    <div
      role="alert"
      className={`mb-5 flex items-start gap-3 rounded-xl border p-4 ${
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm">{notice.message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  )
}

function Panel({ title, description, children, action }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close form"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Empty({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}

export default function WaterMeterBilling({ user }) {
  const [section, setSection] = useState('readings')
  const [tenants, setTenants] = useState([])
  const [customers, setCustomers] = useState([])
  const [connections, setConnections] = useState([])
  const [meters, setMeters] = useState([])
  const [readings, setReadings] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [search, setSearch] = useState('')
  const [invoiceOwner, setInvoiceOwner] = useState('all')
  const [invoiceStatus, setInvoiceStatus] = useState('')
  const [readingStart, setReadingStart] = useState('')
  const [readingEnd, setReadingEnd] = useState('')
  const [connectionFormOpen, setConnectionFormOpen] = useState(false)
  const [meterFormOpen, setMeterFormOpen] = useState(false)
  const [readingFormOpen, setReadingFormOpen] = useState(false)
  const [lastBilling, setLastBilling] = useState(null)

  const [connectionForm, setConnectionForm] = useState({
    owner_type: 'tenant',
    owner_id: '',
    connection_number: '',
    connection_type: 'metered',
    connected_at: today(),
  })

  const [meterForm, setMeterForm] = useState({
    connection_id: '',
    meter_number: '',
    meter_type: 'water',
    opening_reading: '0',
    location: '',
    installed_at: today(),
  })

  const [readingForm, setReadingForm] = useState({
    meter_id: '',
    reading_date: today(),
    opening_reading: '',
    closing_reading: '',
    notes: '',
  })

  const isOwner = user?.role === 'owner'

  const loadData = useCallback(async () => {
    setLoading(true)
    const results = await Promise.allSettled([
      apiRequest('/tenants?status=active'),
      apiRequest('/water-customers?status=active'),
      apiRequest('/water-connections'),
      apiRequest('/water-meters'),
      apiRequest('/meter-readings'),
      apiRequest('/invoices'),
    ])

    const names = [
      'tenants',
      'customers',
      'connections',
      'meters',
      'readings',
      'invoices',
    ]
    const setters = [
      setTenants,
      setCustomers,
      setConnections,
      setMeters,
      setReadings,
      setInvoices,
    ]
    const failures = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        setters[index](Array.isArray(result.value.data) ? result.value.data : [])
      } else {
        setters[index]([])
        failures.push(`${names[index]}: ${result.reason?.message || 'request failed'}`)
      }
    })

    if (failures.length) {
      setNotice({
        type: 'error',
        message: `Some data could not be loaded. ${failures.join('; ')}`,
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const connectionById = useMemo(
    () => new Map(connections.map((item) => [item.id, item])),
    [connections],
  )

  const meterById = useMemo(
    () => new Map(meters.map((item) => [item.id, item])),
    [meters],
  )

  const connectionOwnerLabel = (connection) => {
    if (!connection) return 'Unknown customer'
    if (connection.tenant) {
      return `Tenant: ${connection.tenant.full_name}`
    }
    if (connection.water_customer) {
      return `External: ${connection.water_customer.full_name}`
    }
    return connection.connection_number
  }

  const meterOwnerLabel = (meter) => {
    const connection = connectionById.get(meter?.connection_id) || meter?.connection
    return connectionOwnerLabel(connection)
  }

  const activeMeteredConnections = connections.filter(
    (connection) =>
      connection.status === 'active' &&
      connection.connection_type === 'metered' &&
      !connection.meter,
  )

  const eligibleTenants = tenants.filter((tenant) => tenant.status === 'active')
  const eligibleCustomers = customers.filter((customer) => customer.status === 'active')

  async function submitConnection(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const ownerId = Number(connectionForm.owner_id)
    if (!ownerId || !connectionForm.connection_number.trim()) {
      setSaving(false)
      setNotice({
        type: 'error',
        message: 'Select a customer and enter a connection number.',
      })
      return
    }

    const payload = {
      connection_number: connectionForm.connection_number.trim(),
      connection_type: connectionForm.connection_type,
      connected_at: connectionForm.connected_at
        ? `${connectionForm.connected_at}T00:00:00`
        : undefined,
      ...(connectionForm.owner_type === 'tenant'
        ? { tenant_id: ownerId }
        : { water_customer_id: ownerId }),
    }

    try {
      const response = await apiRequest('/water-connections', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setNotice({ type: 'success', message: response.message })
      setConnectionForm({
        owner_type: 'tenant',
        owner_id: '',
        connection_number: '',
        connection_type: 'metered',
        connected_at: today(),
      })
      setConnectionFormOpen(false)
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function submitMeter(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    if (!Number(meterForm.connection_id) || !meterForm.meter_number.trim() ||
        !meterForm.meter_type.trim() || meterForm.opening_reading === '' ||
        Number(meterForm.opening_reading) < 0) {
      setSaving(false)
      setNotice({ type: 'error', message: 'Complete all required meter fields with valid values.' })
      return
    }

    try {
      const response = await apiRequest('/water-meters', {
        method: 'POST',
        body: JSON.stringify({
          connection_id: Number(meterForm.connection_id),
          meter_number: meterForm.meter_number.trim(),
          meter_type: meterForm.meter_type.trim(),
          opening_reading: Number(meterForm.opening_reading),
          location: meterForm.location.trim() || null,
          installed_at: meterForm.installed_at || undefined,
        }),
      })
      setNotice({ type: 'success', message: response.message })
      setMeterForm({
        connection_id: '',
        meter_number: '',
        meter_type: 'water',
        opening_reading: '0',
        location: '',
        installed_at: today(),
      })
      setMeterFormOpen(false)
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function submitReading(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    setLastBilling(null)

    const meterId = Number(readingForm.meter_id)
    const closing = Number(readingForm.closing_reading)
    const opening = readingForm.opening_reading === ''
      ? undefined
      : Number(readingForm.opening_reading)

    if (!meterId || !readingForm.reading_date ||
        readingForm.closing_reading === '' ||
        !Number.isFinite(closing) || closing < 0 ||
        (opening !== undefined && (!Number.isFinite(opening) || opening < 0))) {
      setSaving(false)
      setNotice({ type: 'error', message: 'Enter a meter, date, and valid non-negative reading.' })
      return
    }

    try {
      const response = await apiRequest('/meter-readings', {
        method: 'POST',
        body: JSON.stringify({
          meter_id: meterId,
          reading_date: readingForm.reading_date,
          closing_reading: closing,
          ...(opening === undefined ? {} : { opening_reading: opening }),
          notes: readingForm.notes.trim() || null,
        }),
      })

      const result = response.data || {}
      setLastBilling(result)
      const billingSucceeded = result.billing?.success === true
      const emailSucceeded = result.email?.success === true

      setNotice({
        type: billingSucceeded && emailSucceeded
          ? 'success'
          : billingSucceeded
            ? 'success'
            : 'error',
        message: billingSucceeded
          ? `${response.message} Invoice ${result.billing?.invoice_number || ''}; balance ${money(result.billing?.balance)}. ${
              emailSucceeded
                ? `Email accepted for ${result.email?.recipient || 'the customer'}.`
                : `Email was not confirmed: ${result.email?.message || 'check the invoice email status.'}`
            }`
          : `${response.message} ${result.billing?.message || 'Invoice generation needs attention.'}`,
      })

      setReadingForm({
        meter_id: '',
        reading_date: today(),
        opening_reading: '',
        closing_reading: '',
        notes: '',
      })
      setReadingFormOpen(false)
      await loadData()
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function viewInvoicePdf(invoice) {
    setNotice(null)
    try {
      const token = localStorage.getItem('acrembura_access_token')
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${baseUrl}/invoices/${invoice.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message || 'Could not open invoice PDF.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const opened = window.open(url, '_blank', 'noopener,noreferrer')
      if (!opened) {
        URL.revokeObjectURL(url)
        throw new Error('Allow pop-ups to view the invoice PDF.')
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    }
  }

  const filteredReadings = readings.filter((reading) => {
    const term = search.trim().toLowerCase()
    const meter = meterById.get(reading.meter_id) || reading.meter
    const connection = connectionById.get(meter?.connection_id) || connectionById.get(reading.meter?.connection_id)
    const haystack = [
      meter?.meter_number,
      connection?.connection_number,
      connection?.tenant?.full_name,
      connection?.water_customer?.full_name,
      reading.notes,
    ].filter(Boolean).join(' ').toLowerCase()

    const withinStart = !readingStart || reading.reading_date >= readingStart
    const withinEnd = !readingEnd || reading.reading_date <= readingEnd
    return (!term || haystack.includes(term)) && withinStart && withinEnd
  })

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesOwner =
      invoiceOwner === 'all' ||
      (invoiceOwner === 'tenant' && invoice.tenant_id) ||
      (invoiceOwner === 'external' && invoice.water_customer_id)
    const matchesStatus = !invoiceStatus || invoice.status === invoiceStatus
    return matchesOwner && matchesStatus
  })

  const selectedMeter = meterById.get(Number(readingForm.meter_id))
  const selectedConnection = selectedMeter
    ? connectionById.get(selectedMeter.connection_id) || selectedMeter.connection
    : null

  const tabs = [
    { id: 'readings', label: 'Meter readings', icon: Activity },
    { id: 'connections', label: 'Connections & meters', icon: Gauge },
    { id: 'invoices', label: 'Water invoices', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900">Meter Readings & Billing</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage metered water connections, record consumption, and review invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Active connections', value: connections.filter((item) => item.status === 'active').length, icon: Droplets },
          { label: 'Active meters', value: meters.filter((item) => item.status === 'active').length, icon: Gauge },
          { label: 'Outstanding water invoices', value: invoices.filter((item) => Number(item.balance) > 0).length, icon: FileText },
        ].map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{metric.label}</p>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={20} /></div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{metric.value}</p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((item) => {
          const Icon = item.icon
          const active = section === item.id
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => { setSection(item.id); setNotice(null) }}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${
                active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={17} /> {item.label}
            </button>
          )
        })}
      </div>

      {section === 'readings' && (
        <div className="space-y-5">
          <Panel
            title="Record a meter reading"
            description="Saving a reading triggers monthly invoice generation and an email attempt in the backend."
            action={
              <button
                type="button"
                onClick={() => setReadingFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} /> Record reading
              </button>
            }
          >
            {lastBilling && (
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Latest billing result</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div><p className="text-xs text-slate-500">Invoice</p><p className="mt-1 font-semibold">{lastBilling.billing?.invoice_number || 'Not generated'}</p></div>
                  <div><p className="text-xs text-slate-500">Billing period</p><p className="mt-1 font-semibold">{lastBilling.billing?.billing_period || '—'}</p></div>
                  <div><p className="text-xs text-slate-500">Total</p><p className="mt-1 font-semibold">{money(lastBilling.billing?.total_amount)}</p></div>
                  <div><p className="text-xs text-slate-500">Outstanding</p><p className="mt-1 font-semibold">{money(lastBilling.billing?.balance)}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 font-semibold ${lastBilling.billing?.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    Billing: {lastBilling.billing?.success ? 'Generated' : 'Needs attention'}
                  </span>
                  <span className={`rounded-full px-3 py-1 font-semibold ${lastBilling.email?.success ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    Email: {lastBilling.email?.success ? 'Accepted' : 'Not confirmed'}
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-sm text-slate-500">Readings recorded</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{readings.length}</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-4">
                <p className="text-sm text-slate-500">Total recorded consumption</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {readings.reduce((sum, reading) => sum + Number(reading.consumption || 0), 0).toLocaleString('en-KE')} units
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Reading history" description="Search readings by customer, connection, meter, or notes.">
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Search">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Customer, meter..." />
                </div>
              </Field>
              <Field label="From date">
                <input type="date" className={inputClass} value={readingStart} max={readingEnd || undefined} onChange={(event) => setReadingStart(event.target.value)} />
              </Field>
              <Field label="To date">
                <input type="date" className={inputClass} value={readingEnd} min={readingStart || undefined} onChange={(event) => setReadingEnd(event.target.value)} />
              </Field>
            </div>

            {loading ? <Empty>Loading reading history…</Empty> : filteredReadings.length === 0 ? <Empty>No meter readings match your filters.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>{['Date', 'Customer', 'Meter', 'Opening', 'Closing', 'Consumption', 'Notes'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReadings.map((reading) => {
                      const meter = meterById.get(reading.meter_id) || reading.meter
                      const connection = connectionById.get(meter?.connection_id) || connectionById.get(reading.meter?.connection_id)
                      return (
                        <tr key={reading.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-4 py-3">{dateLabel(reading.reading_date)}</td>
                          <td className="px-4 py-3">{connectionOwnerLabel(connection)}</td>
                          <td className="px-4 py-3 font-medium">{meter?.meter_number || `Meter #${reading.meter_id}`}</td>
                          <td className="px-4 py-3">{reading.opening_reading}</td>
                          <td className="px-4 py-3">{reading.closing_reading}</td>
                          <td className="px-4 py-3 font-semibold">{reading.consumption}</td>
                          <td className="max-w-[180px] truncate px-4 py-3" title={reading.notes || ''}>{reading.notes || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {section === 'connections' && (
        <div className="space-y-5">
          <Panel
            title="Water connections"
            description="Create a connection for one active tenant or external water customer."
            action={
              <button type="button" onClick={() => setConnectionFormOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus size={16} /> Add connection
              </button>
            }
          >
            {connections.length === 0 ? <Empty>No water connections have been registered yet.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>{['Connection', 'Customer', 'Type', 'Status', 'Meter', 'Actions'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {connections.map((connection) => (
                      <tr key={connection.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold">{connection.connection_number}</td>
                        <td className="px-4 py-3">{connectionOwnerLabel(connection)}</td>
                        <td className="px-4 py-3 capitalize">{connection.connection_type}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${connection.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{connection.status}</span></td>
                        <td className="px-4 py-3">{connection.meter?.meter_number || 'No meter'}</td>
                        <td className="px-4 py-3">
                          {connection.status === 'active' && connection.connection_type === 'metered' && !connection.meter && (
                            <button type="button" onClick={() => { setMeterForm((prev) => ({ ...prev, connection_id: String(connection.id) })); setMeterFormOpen(true) }} className="text-sm font-semibold text-blue-700 hover:underline">
                              Add meter
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            title="Water meters"
            description="One meter is permitted per connection. The opening reading is the meter's starting value."
            action={
              <button type="button" onClick={() => setMeterFormOpen(true)} disabled={activeMeteredConnections.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <Plus size={16} /> Add meter
              </button>
            }
          >
            {meters.length === 0 ? <Empty>No meters registered yet.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>{['Meter number', 'Customer', 'Connection', 'Type', 'Opening reading', 'Status'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {meters.map((meter) => {
                      const connection = connectionById.get(meter.connection_id) || meter.connection
                      return (
                        <tr key={meter.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold">{meter.meter_number}</td>
                          <td className="px-4 py-3">{connectionOwnerLabel(connection)}</td>
                          <td className="px-4 py-3">{connection?.connection_number || `#${meter.connection_id}`}</td>
                          <td className="px-4 py-3">{meter.meter_type}</td>
                          <td className="px-4 py-3">{meter.opening_reading}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meter.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{meter.status}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {section === 'invoices' && (
        <Panel title="Water invoices" description="Review bills generated from meter readings. Open an invoice PDF for printing or sharing.">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Field label="Customer type">
              <select className={inputClass} value={invoiceOwner} onChange={(event) => setInvoiceOwner(event.target.value)}>
                <option value="all">All customers</option>
                <option value="tenant">Tenants</option>
                <option value="external">External customers</option>
              </select>
            </Field>
            <Field label="Invoice status">
              <select className={inputClass} value={invoiceStatus} onChange={(event) => setInvoiceStatus(event.target.value)}>
                <option value="">All statuses</option>
                {Array.from(new Set(invoices.map((invoice) => invoice.status).filter(Boolean))).sort().map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </Field>
          </div>

          {loading ? <Empty>Loading invoices…</Empty> : filteredInvoices.length === 0 ? <Empty>No invoices match your filters.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>{['Invoice', 'Customer type', 'Period', 'Invoice date', 'Total', 'Paid', 'Balance', 'Status', 'PDF'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold">{invoice.invoice_number}</td>
                      <td className="px-4 py-3">{invoice.tenant_id ? 'Tenant' : invoice.water_customer_id ? 'External' : 'Other'}</td>
                      <td className="px-4 py-3">{invoice.billing_period || '—'}</td>
                      <td className="px-4 py-3">{dateLabel(invoice.invoice_date)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{money(invoice.total_amount)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{money(invoice.amount_paid)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">{money(invoice.balance)}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize">{invoice.status}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => viewInvoicePdf(invoice)} className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
                          <Eye size={15} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {connectionFormOpen && (
        <Modal title="Add water connection" onClose={() => setConnectionFormOpen(false)}>
          <form onSubmit={submitConnection} className="space-y-4 p-5">
            <Field label="Customer type">
              <select className={inputClass} value={connectionForm.owner_type} onChange={(event) => setConnectionForm((prev) => ({ ...prev, owner_type: event.target.value, owner_id: '' }))}>
                <option value="tenant">Tenant</option>
                <option value="external">External water customer</option>
              </select>
            </Field>
            <Field label={connectionForm.owner_type === 'tenant' ? 'Active tenant' : 'Active external customer'}>
              <select className={inputClass} required value={connectionForm.owner_id} onChange={(event) => setConnectionForm((prev) => ({ ...prev, owner_id: event.target.value }))}>
                <option value="">Select customer</option>
                {(connectionForm.owner_type === 'tenant' ? eligibleTenants : eligibleCustomers).map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.full_name}{customer.phone ? ` — ${customer.phone}` : ''}</option>
                ))}
              </select>
              {(connectionForm.owner_type === 'tenant' ? eligibleTenants : eligibleCustomers).length === 0 && (
                <span className="mt-1 block text-xs text-amber-700">
                  {connectionForm.owner_type === 'tenant' ? 'No active tenants found.' : 'Register the external customer in the Water Customers tab first.'}
                </span>
              )}
            </Field>
            <Field label="Connection number">
              <input className={inputClass} required value={connectionForm.connection_number} onChange={(event) => setConnectionForm((prev) => ({ ...prev, connection_number: event.target.value }))} placeholder="e.g. CON-001" />
            </Field>
            <Field label="Connection type">
              <select className={inputClass} value={connectionForm.connection_type} onChange={(event) => setConnectionForm((prev) => ({ ...prev, connection_type: event.target.value }))}>
                <option value="metered">Metered — bill from readings</option>
                <option value="unmetered">Unmetered</option>
              </select>
            </Field>
            <Field label="Connected date">
              <input type="date" className={inputClass} value={connectionForm.connected_at} onChange={(event) => setConnectionForm((prev) => ({ ...prev, connected_at: event.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setConnectionFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Create connection'}</button>
            </div>
          </form>
        </Modal>
      )}

      {meterFormOpen && (
        <Modal title="Register water meter" onClose={() => setMeterFormOpen(false)}>
          <form onSubmit={submitMeter} className="space-y-4 p-5">
            <Field label="Active metered connection">
              <select className={inputClass} required value={meterForm.connection_id} onChange={(event) => setMeterForm((prev) => ({ ...prev, connection_id: event.target.value }))}>
                <option value="">Select connection</option>
                {activeMeteredConnections.map((connection) => (
                  <option key={connection.id} value={connection.id}>{connection.connection_number} — {connectionOwnerLabel(connection)}</option>
                ))}
              </select>
              {activeMeteredConnections.length === 0 && <span className="mt-1 block text-xs text-amber-700">Create an active metered connection without a meter first.</span>}
            </Field>
            <Field label="Meter number">
              <input className={inputClass} required value={meterForm.meter_number} onChange={(event) => setMeterForm((prev) => ({ ...prev, meter_number: event.target.value }))} placeholder="e.g. MTR-001" />
            </Field>
            <Field label="Meter type">
              <input className={inputClass} required value={meterForm.meter_type} onChange={(event) => setMeterForm((prev) => ({ ...prev, meter_type: event.target.value }))} placeholder="e.g. mechanical, digital" />
            </Field>
            <Field label="Opening reading" hint="Use the meter's current reading when it is installed.">
              <input type="number" min="0" step="any" required className={inputClass} value={meterForm.opening_reading} onChange={(event) => setMeterForm((prev) => ({ ...prev, opening_reading: event.target.value }))} />
            </Field>
            <Field label="Meter location">
              <input className={inputClass} value={meterForm.location} onChange={(event) => setMeterForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="e.g. outside unit 2" />
            </Field>
            <Field label="Installation date">
              <input type="date" className={inputClass} value={meterForm.installed_at} onChange={(event) => setMeterForm((prev) => ({ ...prev, installed_at: event.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setMeterFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button disabled={saving || activeMeteredConnections.length === 0} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Register meter'}</button>
            </div>
          </form>
        </Modal>
      )}

      {readingFormOpen && (
        <Modal title="Record meter reading" onClose={() => setReadingFormOpen(false)}>
          <form onSubmit={submitReading} className="space-y-4 p-5">
            <Field label="Active meter">
              <select className={inputClass} required value={readingForm.meter_id} onChange={(event) => setReadingForm((prev) => ({ ...prev, meter_id: event.target.value, opening_reading: '' }))}>
                <option value="">Select meter</option>
                {meters.filter((meter) => meter.status === 'active' && (connectionById.get(meter.connection_id)?.status === 'active')).map((meter) => (
                  <option key={meter.id} value={meter.id}>{meter.meter_number} — {meterOwnerLabel(meter)}</option>
                ))}
              </select>
            </Field>
            {selectedMeter && (
              <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-semibold">{meterOwnerLabel(selectedMeter)}</p>
                <p className="mt-1">Connection: {selectedConnection?.connection_number || '—'}</p>
                <p className="mt-1">Meter opening value: {selectedMeter.opening_reading}</p>
              </div>
            )}
            <Field label="Reading date">
              <input type="date" required className={inputClass} value={readingForm.reading_date} onChange={(event) => setReadingForm((prev) => ({ ...prev, reading_date: event.target.value }))} />
            </Field>
            <Field label="Opening reading (optional)" hint="Leave blank after the first reading to use the previous closing value.">
              <input type="number" min="0" step="any" className={inputClass} value={readingForm.opening_reading} onChange={(event) => setReadingForm((prev) => ({ ...prev, opening_reading: event.target.value }))} />
            </Field>
            <Field label="Closing reading">
              <input type="number" min="0" step="any" required className={inputClass} value={readingForm.closing_reading} onChange={(event) => setReadingForm((prev) => ({ ...prev, closing_reading: event.target.value }))} />
            </Field>
            <Field label="Notes">
              <textarea rows={3} className={inputClass} value={readingForm.notes} onChange={(event) => setReadingForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Optional notes about this reading" />
            </Field>
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Submitting a reading triggers automatic monthly invoice generation. If billing fails, the reading may still be saved and will need follow-up.
            </p>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setReadingFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button disabled={saving || meters.filter((meter) => meter.status === 'active').length === 0} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save reading & bill'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
