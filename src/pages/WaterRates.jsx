
import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  RefreshCw,
  Pencil,
  Power,
  Droplets,
  AlertCircle,
  CheckCircle2,
  X,
  LoaderCircle,
} from 'lucide-react'
import { apiRequest } from '../api/client'

const CUSTOMER_TYPES = [
  { value: 'tenant', label: 'Rental tenants' },
  { value: 'external', label: 'External water customers' },
  { value: 'shop', label: 'Shop sales' },
  { value: 'lorry', label: 'Water lorries' },
]

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'

function formatMoney(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return 'No end date'
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    'en-KE',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )
}

function Notice({ notice, onClose }) {
  if (!notice) return null

  const success = notice.type === 'success'

  return (
    <div
      role="status"
      className={`mb-5 flex items-start gap-3 rounded-xl border p-4 ${
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {success ? (
        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={19} className="mt-0.5 shrink-0" />
      )}
      <p className="flex-1 text-sm">{notice.message}</p>
      <button type="button" onClick={onClose} aria-label="Close notification">
        <X size={18} />
      </button>
    </div>
  )
}

const emptyForm = {
  name: '',
  customer_type: 'tenant',
  unit_price: '',
  effective_from: new Date().toLocaleDateString('en-CA'),
  effective_to: '',
}

export default function WaterRates({ user }) {
  const isOwner = user?.role === 'owner'

  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRate, setEditingRate] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const loadRates = useCallback(async () => {
    setLoading(true)

    try {
      const result = await apiRequest('/water-rates')
      setRates(Array.isArray(result.data) ? result.data : (result.data?.water_rates ?? result.data?.rates ?? []))
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  const visibleRates = rates.filter((rate) => {
    const matchesType =
      filter === 'all' || rate.customer_type === filter
    const matchesStatus = showInactive || rate.is_active
    return matchesType && matchesStatus
  })

  function openCreateForm() {
    setEditingRate(null)
    setForm({ ...emptyForm, effective_from: new Date().toLocaleDateString('en-CA') })
    setNotice(null)
    setShowForm(true)
  }

  function openEditForm(rate) {
    setEditingRate(rate)
    setForm({
      name: rate.name ?? '',
      customer_type: rate.customer_type,
      unit_price: String(rate.unit_price ?? ''),
      effective_from: rate.effective_from?.slice(0, 10) ?? '',
      effective_to: rate.effective_to?.slice(0, 10) ?? '',
    })
    setNotice(null)
    setShowForm(true)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)

    const payload = {
      name: form.name.trim(),
      customer_type: form.customer_type,
      unit_price: Number(form.unit_price),
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
    }

    try {
      if (editingRate) {
        await apiRequest(`/water-rates/${editingRate.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: payload.name,
            unit_price: payload.unit_price,
            effective_from: payload.effective_from,
            effective_to: payload.effective_to,
          }),
        })
      } else {
        await apiRequest('/water-rates', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setShowForm(false)
      setEditingRate(null)
      setForm(emptyForm)
      setNotice({
        type: 'success',
        message: editingRate ? 'Water rate updated.' : 'Water rate created.',
      })
      await loadRates()
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(rate) {
    const action = rate.is_active ? 'deactivate' : 'activate'

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${rate.name}"?`,
      )
    ) {
      return
    }

    setNotice(null)

    try {
      await apiRequest(`/water-rates/${rate.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !rate.is_active }),
      })

      setNotice({
        type: 'success',
        message: `Water rate ${action}d successfully.`,
      })
      await loadRates()
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Water Rates</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage water prices and the dates they apply to.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadRates}
            disabled={loading}
            className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={openCreateForm}
              className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
            >
              <Plus size={17} />
              Add water rate
            </button>
          )}
        </div>
      </div>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      {showForm && isOwner && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              {editingRate ? 'Edit water rate' : 'Create water rate'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Rate name
                <input
                  className={inputClass}
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Residential water rate"
                  required
                  maxLength={120}
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Customer type
                <select
                  className={inputClass}
                  name="customer_type"
                  value={form.customer_type}
                  onChange={updateField}
                  disabled={Boolean(editingRate)}
                  required
                >
                  {CUSTOMER_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {editingRate && (
                  <span className="block text-xs text-slate-500">
                    Customer type cannot be changed when editing.
                  </span>
                )}
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Price per unit (KSh)
                <input
                  className={inputClass}
                  name="unit_price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.unit_price}
                  onChange={updateField}
                  placeholder="e.g. 100"
                  required
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700">
                Effective from
                <input
                  className={inputClass}
                  name="effective_from"
                  type="date"
                  value={form.effective_from}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                Effective until (optional)
                <input
                  className={inputClass}
                  name="effective_to"
                  type="date"
                  value={form.effective_to}
                  onChange={updateField}
                  min={form.effective_from || undefined}
                />
                <span className="block text-xs font-normal text-slate-500">
                  Leave blank if the rate has no planned end date.
                </span>
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`${buttonClass} border border-slate-300 bg-white text-slate-700`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
              >
                {saving ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {saving ? 'Saving...' : 'Save rate'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Customer type
          <select
            className={`${inputClass} sm:w-64`}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All customer types</option>
            {CUSTOMER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
            className="rounded border-slate-300"
          />
          Show inactive rates
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-12 text-slate-500">
          <LoaderCircle size={20} className="animate-spin" />
          Loading water rates...
        </div>
      ) : visibleRates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Droplets size={32} className="mx-auto mb-3 text-slate-400" />
          <h3 className="font-semibold text-slate-800">No water rates found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {isOwner
              ? 'Create a rate for the customer type you want to bill.'
              : 'No rates match the selected filters.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Rate</th>
                <th className="px-5 py-4">Customer type</th>
                <th className="px-5 py-4">Price / unit</th>
                <th className="px-5 py-4">Effective period</th>
                <th className="px-5 py-4">Status</th>
                {isOwner && <th className="px-5 py-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRates.map((rate) => {
                const customerType = CUSTOMER_TYPES.find(
                  (type) => type.value === rate.customer_type,
                )

                return (
                  <tr key={rate.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {rate.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {customerType?.label ?? rate.customer_type}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {formatMoney(rate.unit_price)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{formatDate(rate.effective_from)}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Until {formatDate(rate.effective_to)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          rate.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rate.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(rate)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            title="Edit rate"
                            aria-label={`Edit ${rate.name}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(rate)}
                            className={`rounded-lg border p-2 ${
                              rate.is_active
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={rate.is_active ? 'Deactivate rate' : 'Activate rate'}
                            aria-label={`${rate.is_active ? 'Deactivate' : 'Activate'} ${rate.name}`}
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
