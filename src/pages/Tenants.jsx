
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Phone,
  Mail,
  Building2,
  CalendarDays,
  LogOut,
  Droplets,
} from 'lucide-react'
import { apiRequest } from '../api/client'

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  unit_id: '',
  full_name: '',
  phone: '',
  email: '',
  id_number: '',
  move_in_date: today(),
  has_water_meter: false,
  current_meter_reading: '',
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10'

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-300',
}

function formatDate(value) {
  if (!value) return '—'

  const date = String(value).slice(0, 10)
  const [year, month, day] = date.split('-')

  if (!year || !month || !day) return value

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function money(value) {
  return Number(value || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getUnitLabel(unit) {
  const property =
    unit.property?.name ||
    unit.property_name ||
    unit.property?.property_name ||
    'Property'

  return `${property} — ${unit.unit_number || `Unit ${unit.id}`}`
}

function getUnitLocation(unit) {
  const property =
    unit.property?.name ||
    unit.property_name ||
    unit.property?.property_name ||
    'Property'

  return `${property} - ${unit.unit_number || `Unit ${unit.id}`}`
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        statusStyles[status] || statusStyles.inactive
      }`}
    >
      {status || 'unknown'}
    </span>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </section>
    </div>
  )
}

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [units, setUnits] = useState([])
  const [waterConnections, setWaterConnections] = useState([])
  const [waterMeters, setWaterMeters] = useState([])
  const [meterReadings, setMeterReadings] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [readingForm, setReadingForm] = useState({
    reading_date: today(),
    opening_reading: '',
    closing_reading: '',
    notes: '',
  })

  const [moveOutDate, setMoveOutDate] = useState(today())

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [tenantResult, unitResult] = await Promise.all([
        apiRequest('/tenants'),
        apiRequest('/units?include_inactive_properties=true'),
      ])

      setTenants(
        Array.isArray(tenantResult.data) ? tenantResult.data : [],
      )

      setUnits(Array.isArray(unitResult.data) ? unitResult.data : [])

      const waterResults = await Promise.allSettled([
        apiRequest('/water-connections'),
        apiRequest('/water-meters'),
        apiRequest('/meter-readings'),
      ])

      setWaterConnections(
        waterResults[0].status === 'fulfilled' &&
          Array.isArray(waterResults[0].value.data)
          ? waterResults[0].value.data
          : [],
      )

      setWaterMeters(
        waterResults[1].status === 'fulfilled' &&
          Array.isArray(waterResults[1].value.data)
          ? waterResults[1].value.data
          : [],
      )

      setMeterReadings(
        waterResults[2].status === 'fulfilled' &&
          Array.isArray(waterResults[2].value.data)
          ? waterResults[2].value.data
          : [],
      )
    } catch (err) {
      setError(err.message || 'Unable to load tenants.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const activeTenants = useMemo(
    () => tenants.filter((tenant) => tenant.status === 'active'),
    [tenants],
  )

  const availableUnits = useMemo(
    () =>
      units.filter((unit) => {
        const occupied = activeTenants.some(
          (tenant) => Number(tenant.unit_id) === Number(unit.id),
        )

        return !occupied && unit.status !== 'maintenance'
      }),
    [units, activeTenants],
  )

  const visibleTenants = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tenants.filter((tenant) => {
      const matchesStatus =
        statusFilter === 'all' || tenant.status === statusFilter

      const matchesSearch =
        !query ||
        [
          tenant.full_name,
          tenant.phone,
          tenant.email,
          tenant.id_number,
          tenant.unit?.unit_number,
          tenant.unit?.property_name,
          tenant.unit?.property?.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [tenants, search, statusFilter])

  function openCreate() {
    setError('')
    setNotice('')

    setForm({
      ...emptyForm,
      unit_id: availableUnits[0]?.id?.toString() || '',
    })

    setModal({ mode: 'create' })
  }

  function openEdit(tenant) {
    setError('')
    setNotice('')

    setForm({
      ...emptyForm,
      unit_id: String(tenant.unit_id || ''),
      full_name: tenant.full_name || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      id_number: tenant.id_number || '',
      move_in_date: tenant.move_in_date || today(),
    })

    setModal({ mode: 'edit', record: tenant })
  }

  function getTenantMeter(tenantId) {
    const connection = waterConnections.find(
      (item) =>
        Number(item.tenant_id ?? item.tenant?.id) ===
          Number(tenantId) && item.status === 'active',
    )

    if (!connection) return null

    return (
      waterMeters.find(
        (meter) =>
          Number(meter.connection_id) === Number(connection.id) &&
          meter.status === 'active',
      ) || null
    )
  }

  async function createWaterSetup(tenant, selectedUnit) {
    const timestamp = Date.now()
    const suffix = `${timestamp}-${tenant.id}`

    const connectionNumber = `CON-${suffix}`
    const meterNumber = `MTR-${suffix}`

    const connectionResponse = await apiRequest('/water-connections', {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: Number(tenant.id),
        connection_number: connectionNumber,
        connection_type: 'metered',
        connected_at: `${form.move_in_date}T00:00:00`,
      }),
    })

    const connectionId = connectionResponse.data?.id

    if (!connectionId) {
      throw new Error(
        'The tenant was saved, but the API did not return a water connection ID. Check the water connections before retrying.',
      )
    }

    await apiRequest('/water-meters', {
      method: 'POST',
      body: JSON.stringify({
        connection_id: Number(connectionId),
        meter_number: meterNumber,
        meter_type: 'water',
        opening_reading: Number(form.current_meter_reading),
        location: getUnitLocation(selectedUnit),
        installed_at: form.move_in_date || today(),
      }),
    })

    return { connectionNumber, meterNumber }
  }

  async function submitTenant(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setNotice('')

    const isEdit = modal.mode === 'edit'

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      id_number: form.id_number.trim() || null,
      move_in_date: form.move_in_date,
    }

    if (!isEdit) {
      payload.unit_id = Number(form.unit_id)
    }

    if (
      !isEdit &&
      form.has_water_meter &&
      (form.current_meter_reading === '' ||
        !Number.isFinite(Number(form.current_meter_reading)) ||
        Number(form.current_meter_reading) < 0)
    ) {
      setError('Enter a valid non-negative current meter reading.')
      setSaving(false)
      return
    }

    try {
      const response = await apiRequest(
        isEdit ? `/tenants/${modal.record.id}` : '/tenants',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        },
      )

      const tenant = response.data

      if (!tenant?.id) {
        throw new Error(
          'The tenant request completed, but the API did not return the tenant ID. Refresh the tenant list before retrying.',
        )
      }

      let waterMessage = ''

      if (!isEdit && form.has_water_meter) {
        const selectedUnit = units.find(
          (unit) => Number(unit.id) === Number(form.unit_id),
        )

        if (!selectedUnit) {
          throw new Error(
            'The tenant was registered, but the assigned unit could not be found. Refresh the page and check the tenant before retrying.',
          )
        }

        const identifiers = await createWaterSetup(tenant, selectedUnit)

        waterMessage =
          ` Water billing was set up. Connection: ${identifiers.connectionNumber}; ` +
          `meter: ${identifiers.meterNumber}. The opening reading was saved. No invoice was generated.`
      }

      setModal(null)

      setNotice(
        isEdit
          ? 'Tenant details updated successfully.'
          : `Tenant registered successfully.${waterMessage}`,
      )

      await loadData()
    } catch (err) {
      setError(
        err.message ||
          'Unable to save the tenant. Check the records before trying again.',
      )
    } finally {
      setSaving(false)
    }
  }

  function openReading(tenant) {
    const meter = getTenantMeter(tenant.id)

    if (!meter) {
      setError(
        `No active water meter was found for ${tenant.full_name}. Check the water connections and meters.`,
      )
      return
    }

    const previousReading = meterReadings
      .filter(
        (reading) => Number(reading.meter_id) === Number(meter.id),
      )
      .sort((a, b) =>
        String(b.reading_date).localeCompare(String(a.reading_date)),
      )[0]

    const opening =
      previousReading?.closing_reading ?? meter.opening_reading ?? ''

    setError('')
    setNotice('')

    setReadingForm({
      reading_date: today(),
      opening_reading: String(opening),
      closing_reading: '',
      notes: '',
    })

    setModal({
      mode: 'reading',
      record: tenant,
      meter,
    })
  }

  async function submitReading(event) {
    event.preventDefault()

    const opening = Number(readingForm.opening_reading)
    const closing = Number(readingForm.closing_reading)

    if (
      readingForm.opening_reading === '' ||
      readingForm.closing_reading === '' ||
      !Number.isFinite(opening) ||
      !Number.isFinite(closing) ||
      opening < 0 ||
      closing < opening
    ) {
      setError(
        'Enter valid readings. The closing reading must be greater than or equal to the opening reading.',
      )
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await apiRequest('/meter-readings', {
        method: 'POST',
        body: JSON.stringify({
          meter_id: Number(modal.meter.id),
          reading_date: readingForm.reading_date,
          opening_reading: opening,
          closing_reading: closing,
          notes: readingForm.notes.trim() || null,
        }),
      })

      const result = response.data || {}
      const billing = result.billing || {}
      const email = result.email || {}

      const consumption =
        result.consumption !== undefined
          ? result.consumption
          : closing - opening

      let message = `Water reading saved. Consumption: ${consumption} units. `

      if (billing.success) {
        message +=
          `Invoice ${billing.invoice_number || ''} generated. ` +
          `Outstanding balance: KSh ${money(billing.balance)}. `

        message += email.success
          ? 'The invoice email was reported as sent.'
          : `Invoice email was not confirmed: ${
              email.message || 'check email delivery.'
            }`
      } else {
        message +=
          `However, billing needs attention: ${
            billing.message || 'invoice generation did not complete.'
          }`
      }

      setModal(null)
      setNotice(message)

      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to save the water reading.')
    } finally {
      setSaving(false)
    }
  }

  function openMoveOut(tenant) {
    setError('')
    setNotice('')
    setMoveOutDate(today())

    setModal({
      mode: 'move-out',
      record: tenant,
    })
  }

  async function submitMoveOut(event) {
    event.preventDefault()

    const tenant = modal.record

    if (!moveOutDate) {
      setError('Select a move-out date.')
      return
    }

    if (tenant.move_in_date && moveOutDate < tenant.move_in_date) {
      setError('Move-out date cannot be before the move-in date.')
      return
    }

    if (
      !window.confirm(
        `Mark ${tenant.full_name} as moved out?`,
      )
    ) {
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      await apiRequest(`/tenants/${tenant.id}/move-out`, {
        method: 'PATCH',
        body: JSON.stringify({
          move_out_date: moveOutDate,
        }),
      })

      setModal(null)
      setNotice(`${tenant.full_name} has been marked as moved out.`)

      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to move out tenant.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Register tenants, manage contact details, and track occupancy.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Tenant records are loaded from the AcreMbura API.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={loading || availableUnits.length === 0}
            title={
              availableUnits.length === 0
                ? 'No available rental units. Add or vacate a unit first.'
                : 'Register a tenant'
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Register tenant
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2 size={19} className="shrink-0" />
          <div className="flex-1">{notice}</div>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: 'Total tenants',
            value: tenants.length,
            icon: Users,
            color: 'blue',
          },
          {
            label: 'Active tenants',
            value: activeTenants.length,
            icon: CheckCircle2,
            color: 'emerald',
          },
          {
            label: 'Moved out',
            value: tenants.filter(
              (tenant) => tenant.status === 'inactive',
            ).length,
            icon: LogOut,
            color: 'slate',
          },
          {
            label: 'Available units',
            value: availableUnits.length,
            icon: Building2,
            color: 'violet',
          },
        ].map((stat) => {
          const Icon = stat.icon

          const colorStyles = {
            blue: 'bg-blue-50 text-blue-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            slate: 'bg-slate-100 text-slate-600',
            violet: 'bg-violet-50 text-violet-600',
          }

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${colorStyles[stat.color]}`}
              >
                <Icon size={20} />
              </div>

              <p className="text-xs font-medium text-slate-500">
                {stat.label}
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
                {loading ? '—' : stat.value}
              </p>
            </article>
          )
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {[
              { value: 'all', label: 'All tenants' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Moved out' },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  statusFilter === filter.value
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <label className="relative block sm:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tenants, phone, unit..."
              className={`${inputClass} pl-9`}
            />
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <LoaderCircle
              size={28}
              className="animate-spin text-blue-600"
            />
            <p className="text-sm">Loading tenants...</p>
          </div>
        ) : visibleTenants.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Tenant</th>
                    <th className="px-5 py-4 font-semibold">
                      Unit / property
                    </th>
                    <th className="px-5 py-4 font-semibold">Move-in date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {tenant.full_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {tenant.phone || 'No phone provided'}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {tenant.email || 'No email provided'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {tenant.unit?.unit_number || '—'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {tenant.unit?.property_name ||
                            tenant.unit?.property?.name ||
                            '—'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(tenant.move_in_date)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={tenant.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(tenant)}
                            aria-label={`Edit ${tenant.full_name}`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={16} />
                          </button>

                          {tenant.status === 'active' &&
                            getTenantMeter(tenant.id) && (
                              <button
                                type="button"
                                onClick={() => openReading(tenant)}
                                title="Record water reading"
                                aria-label={`Record water reading for ${tenant.full_name}`}
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              >
                                <Droplets size={16} />
                              </button>
                            )}

                          {tenant.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => openMoveOut(tenant)}
                              aria-label={`Move out ${tenant.full_name}`}
                              title="Move out tenant"
                              className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <LogOut size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {visibleTenants.map((tenant) => (
                <article key={tenant.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {tenant.full_name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 size={13} />
                        {tenant.unit?.property_name ||
                          tenant.unit?.property?.name ||
                          '—'}{' '}
                        · {tenant.unit?.unit_number || '—'}
                      </p>
                    </div>

                    <StatusBadge status={tenant.status} />
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-500">
                    {tenant.phone && (
                      <p className="flex items-center gap-2">
                        <Phone size={14} /> {tenant.phone}
                      </p>
                    )}

                    {tenant.email && (
                      <p className="flex items-center gap-2">
                        <Mail size={14} /> {tenant.email}
                      </p>
                    )}

                    <p className="flex items-center gap-2">
                      <CalendarDays size={14} />
                      Moved in {formatDate(tenant.move_in_date)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(tenant)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                    >
                      <Pencil size={14} /> Edit
                    </button>

                    {tenant.status === 'active' &&
                      getTenantMeter(tenant.id) && (
                        <button
                          type="button"
                          onClick={() => openReading(tenant)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700"
                        >
                          <Droplets size={14} /> Record reading
                        </button>
                      )}

                    {tenant.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => openMoveOut(tenant)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700"
                      >
                        <LogOut size={14} /> Move out
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <Users size={30} className="mx-auto text-slate-300" />

            <h3 className="mt-3 font-semibold text-slate-700">
              No tenants found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {tenants.length
                ? 'Adjust your search or status filter.'
                : 'Register a tenant to get started.'}
            </p>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Showing {visibleTenants.length} of {tenants.length} tenants
        </div>
      </section>

      {(modal?.mode === 'create' || modal?.mode === 'edit') && (
        <Modal
          title={modal.mode === 'edit' ? 'Edit tenant' : 'Register tenant'}
          onClose={() => !saving && setModal(null)}
        >
          <form onSubmit={submitTenant} className="space-y-4">
            {modal.mode === 'create' && (
              <Field label="Rental unit" required>
                <select
                  required
                  value={form.unit_id}
                  onChange={(event) =>
                    setForm({ ...form, unit_id: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Select an available unit</option>

                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={String(unit.id)}>
                      {getUnitLabel(unit)}
                    </option>
                  ))}
                </select>

                {availableUnits.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    There are no available units. Add a unit or check existing
                    tenant assignments before registering another tenant.
                  </p>
                )}
              </Field>
            )}

            {modal.mode === 'edit' && (
              <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                Editing contact and tenant details does not change the tenant's
                assigned unit.
              </div>
            )}

            <Field label="Full name" required>
              <input
                required
                maxLength={120}
                value={form.full_name}
                onChange={(event) =>
                  setForm({ ...form, full_name: event.target.value })
                }
                placeholder="Tenant's full name"
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone number">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  placeholder="Phone number"
                  className={inputClass}
                />
              </Field>

              <Field label="Email address">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="tenant@example.com"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Identification number">
              <input
                maxLength={50}
                value={form.id_number}
                onChange={(event) =>
                  setForm({ ...form, id_number: event.target.value })
                }
                placeholder="Identification number"
                className={inputClass}
              />
            </Field>

            <Field label="Move-in date" required>
              <input
                type="date"
                required
                value={form.move_in_date}
                onChange={(event) =>
                  setForm({ ...form, move_in_date: event.target.value })
                }
                className={inputClass}
              />
            </Field>

            {modal.mode === 'create' && (
              <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.has_water_meter}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        has_water_meter: event.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Set up water billing
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Record the current reading for the meter installed at
                      this house.
                    </span>
                  </span>
                </label>

                {form.has_water_meter && (
                  <>
                    <Field label="Current meter reading" required>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={form.current_meter_reading}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            current_meter_reading: event.target.value,
                          })
                        }
                        placeholder="Enter current meter reading"
                        className={inputClass}
                      />
                    </Field>

                    <p className="rounded-lg border border-blue-100 bg-white p-3 text-xs leading-5 text-blue-800">
                      The connection and meter identifiers will be generated
                      automatically. The assigned unit will be used as the
                      meter location. This reading becomes the opening
                      baseline; no invoice is generated during registration.
                    </p>
                  </>
                )}
              </section>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  !form.full_name.trim() ||
                  (modal.mode === 'create' && !form.unit_id)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}

                {modal.mode === 'edit'
                  ? 'Save changes'
                  : 'Register tenant'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.mode === 'reading' && (
        <Modal
          title={`Record water reading — ${modal.record.full_name}`}
          onClose={() => !saving && setModal(null)}
        >
          <form onSubmit={submitReading} className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">
                {modal.record.unit?.property_name ||
                  modal.record.unit?.property?.name ||
                  'Property'}{' '}
                · {modal.record.unit?.unit_number || 'Unit'}
              </p>

              <p className="mt-1">Meter: {modal.meter.meter_number}</p>
            </div>

            <Field label="Reading date" required>
              <input
                type="date"
                required
                value={readingForm.reading_date}
                onChange={(event) =>
                  setReadingForm({
                    ...readingForm,
                    reading_date: event.target.value,
                  })
                }
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Previous meter reading" required>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={readingForm.opening_reading}
                  onChange={(event) =>
                    setReadingForm({
                      ...readingForm,
                      opening_reading: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Current meter reading" required>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={readingForm.closing_reading}
                  onChange={(event) =>
                    setReadingForm({
                      ...readingForm,
                      closing_reading: event.target.value,
                    })
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-500">
                Calculated water consumption
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {readingForm.opening_reading !== '' &&
                readingForm.closing_reading !== '' &&
                Number(readingForm.closing_reading) >=
                  Number(readingForm.opening_reading)
                  ? (
                      Number(readingForm.closing_reading) -
                      Number(readingForm.opening_reading)
                    ).toLocaleString('en-KE', {
                      maximumFractionDigits: 3,
                    })
                  : '—'}{' '}
                units
              </p>
            </div>

            <Field label="Notes">
              <textarea
                rows={2}
                value={readingForm.notes}
                onChange={(event) =>
                  setReadingForm({
                    ...readingForm,
                    notes: event.target.value,
                  })
                }
                placeholder="Optional notes"
                className={inputClass}
              />
            </Field>

            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Saving the reading triggers the backend's billing process and an
              invoice email attempt. Check the result after saving.
            </p>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}

                {saving ? 'Saving reading…' : 'Save reading & generate invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.mode === 'move-out' && (
        <Modal
          title="Move out tenant"
          onClose={() => !saving && setModal(null)}
        >
          <form onSubmit={submitMoveOut} className="space-y-4">
            <div className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              You are moving out <strong>{modal.record.full_name}</strong> from
              unit{' '}
              <strong>{modal.record.unit?.unit_number || '—'}</strong>. The
              tenant will become inactive.
            </div>

            <Field label="Move-out date" required>
              <input
                type="date"
                required
                min={modal.record.move_in_date || undefined}
                value={moveOutDate}
                onChange={(event) => setMoveOutDate(event.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || !moveOutDate}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving && (
                  <LoaderCircle size={16} className="animate-spin" />
                )}

                Confirm move-out
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
