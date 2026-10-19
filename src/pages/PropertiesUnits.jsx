
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  X,
  Home,
  CheckCircle2,
  Wrench,
  DoorOpen,
  MapPin,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'
import { apiRequest } from '../api/client'

const emptyProperty = {
  name: '',
  location: '',
  description: '',
}

const emptyUnit = {
  property_id: '',
  unit_number: '',
  unit_type: '',
  monthly_rent: '',
  status: 'vacant',
}

const statusStyles = {
  vacant: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  occupied: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  maintenance: 'bg-amber-50 text-amber-700 ring-amber-600/20',
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        statusStyles[status] || 'bg-slate-100 text-slate-600 ring-slate-300'
      }`}
    >
      {status}
    </span>
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
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
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

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10'

export default function PropertiesUnits({ user }) {
  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [selectedProperty, setSelectedProperty] = useState('all')
  const [tab, setTab] = useState('units')
  const [modal, setModal] = useState(null)
  const [propertyForm, setPropertyForm] = useState(emptyProperty)
  const [unitForm, setUnitForm] = useState(emptyUnit)

  const isOwner = user?.role === 'owner'

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [propertyResult, unitResult] = await Promise.all([
        apiRequest('/properties'),
        apiRequest('/units?include_inactive_properties=true'),
      ])

      setProperties(Array.isArray(propertyResult.data) ? propertyResult.data : [])
      setUnits(Array.isArray(unitResult.data) ? unitResult.data : [])
    } catch (err) {
      setError(err.message || 'Unable to load properties and units.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const visibleUnits = useMemo(() => {
    const query = search.trim().toLowerCase()

    return units.filter((unit) => {
      const matchesProperty =
        selectedProperty === 'all' ||
        String(unit.property_id) === selectedProperty

      const matchesSearch =
        !query ||
        [
          unit.unit_number,
          unit.unit_type,
          unit.property?.name,
          unit.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      return matchesProperty && matchesSearch
    })
  }, [units, selectedProperty, search])

  const visibleProperties = useMemo(() => {
    const query = search.trim().toLowerCase()

    return properties.filter((property) => {
      if (!query) return true

      return [property.name, property.location, property.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [properties, search])

  const stats = useMemo(
    () => ({
      properties: properties.filter((property) => property.is_active).length,
      units: units.length,
      occupied: units.filter((unit) => unit.status === 'occupied').length,
      vacant: units.filter((unit) => unit.status === 'vacant').length,
      maintenance: units.filter((unit) => unit.status === 'maintenance').length,
    }),
    [properties, units],
  )

  function openCreateProperty() {
    setError('')
    setNotice('')
    setPropertyForm(emptyProperty)
    setModal({ type: 'property', mode: 'create' })
  }

  function openEditProperty(property) {
    setError('')
    setNotice('')
    setPropertyForm({
      name: property.name || '',
      location: property.location || '',
      description: property.description || '',
    })
    setModal({ type: 'property', mode: 'edit', record: property })
  }

  function openCreateUnit() {
    setError('')
    setNotice('')
    setUnitForm({
      ...emptyUnit,
      property_id:
        selectedProperty !== 'all'
          ? selectedProperty
          : properties.find((property) => property.is_active)?.id?.toString() || '',
    })
    setModal({ type: 'unit', mode: 'create' })
  }

  function openEditUnit(unit) {
    setError('')
    setNotice('')
    setUnitForm({
      property_id: String(unit.property_id),
      unit_number: unit.unit_number || '',
      unit_type: unit.unit_type || '',
      monthly_rent: String(unit.monthly_rent ?? ''),
      status: unit.status || 'vacant',
    })
    setModal({ type: 'unit', mode: 'edit', record: unit })
  }

  async function submitProperty(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const payload = {
      name: propertyForm.name.trim(),
      location: propertyForm.location.trim() || null,
      description: propertyForm.description.trim() || null,
    }

    try {
      const isEdit = modal.mode === 'edit'
      const path = isEdit
        ? `/properties/${modal.record.id}`
        : '/properties'

      await apiRequest(path, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })

      setModal(null)
      setNotice(isEdit ? 'Property updated successfully.' : 'Property created successfully.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to save the property.')
    } finally {
      setSaving(false)
    }
  }

  async function submitUnit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const payload = {
      property_id: Number(unitForm.property_id),
      unit_number: unitForm.unit_number.trim(),
      unit_type: unitForm.unit_type.trim() || null,
      monthly_rent: Number(unitForm.monthly_rent || 0),
      ...(modal.mode === 'create' ? { status: unitForm.status } : {}),
    }

    try {
      const isEdit = modal.mode === 'edit'
      const path = isEdit ? `/units/${modal.record.id}` : '/units'

      await apiRequest(path, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })

      setModal(null)
      setNotice(isEdit ? 'Unit updated successfully.' : 'Unit created successfully.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to save the unit.')
    } finally {
      setSaving(false)
    }
  }

  async function changePropertyStatus(property) {
    const nextStatus = !property.is_active
    const confirmed = window.confirm(
      `${nextStatus ? 'Activate' : 'Deactivate'} "${property.name}"?`,
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await apiRequest(`/properties/${property.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: nextStatus }),
      })
      setNotice('Property status updated successfully.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to update property status.')
    }
  }

  async function changeUnitStatus(unit, status) {
    setError('')
    setNotice('')

    try {
      await apiRequest(`/units/${unit.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setNotice(`Unit status changed to ${status}.`)
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to update unit status.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Manage rental properties, unit details, and occupancy.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Information is loaded from the AcreMbura API.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateProperty}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Building2 size={16} />
            Add property
          </button>
          <button
            type="button"
            onClick={openCreateUnit}
            disabled={!properties.some((property) => property.is_active)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add unit
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

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          { label: 'Active properties', value: stats.properties, icon: Building2, color: 'blue' },
          { label: 'Total units', value: stats.units, icon: Home, color: 'violet' },
          { label: 'Occupied', value: stats.occupied, icon: CheckCircle2, color: 'emerald' },
          { label: 'Vacant', value: stats.vacant, icon: DoorOpen, color: 'sky' },
          { label: 'Maintenance', value: stats.maintenance, icon: Wrench, color: 'amber' },
        ].map((stat) => {
          const Icon = stat.icon
          const colorStyles = {
            blue: 'bg-blue-50 text-blue-600',
            violet: 'bg-violet-50 text-violet-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            sky: 'bg-sky-50 text-sky-600',
            amber: 'bg-amber-50 text-amber-600',
          }

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${colorStyles[stat.color]}`}>
                <Icon size={20} />
              </div>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
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
            <button
              type="button"
              onClick={() => setTab('units')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === 'units' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Units ({units.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('properties')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === 'properties' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Properties ({properties.length})
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {tab === 'units' && (
              <select
                value={selectedProperty}
                onChange={(event) => setSelectedProperty(event.target.value)}
                className={inputClass + ' sm:w-52'}
                aria-label="Filter units by property"
              >
                <option value="all">All properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={String(property.id)}>
                    {property.name}{property.is_active ? '' : ' (inactive)'}
                  </option>
                ))}
              </select>
            )}

            <label className="relative block sm:w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tab === 'units' ? 'Search units...' : 'Search properties...'}
                className={inputClass + ' pl-9'}
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={28} className="animate-spin text-blue-600" />
            <p className="text-sm">Loading properties and units...</p>
          </div>
        ) : tab === 'units' ? (
          visibleUnits.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Unit</th>
                      <th className="px-5 py-4 font-semibold">Property</th>
                      <th className="px-5 py-4 font-semibold">Type</th>
                      <th className="px-5 py-4 font-semibold">Monthly rent</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleUnits.map((unit) => (
                      <tr key={unit.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{unit.unit_number}</p>
                          <p className="mt-1 text-xs text-slate-400">Unit #{unit.id}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {unit.property?.name || '—'}
                        </td>
                        <td className="px-5 py-4 text-sm capitalize text-slate-600">
                          {unit.unit_type || 'Not specified'}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                          {formatMoney(unit.monthly_rent)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={unit.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditUnit(unit)}
                              aria-label={`Edit unit ${unit.unit_number}`}
                              className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil size={16} />
                            </button>
                            {isOwner && (
                              <select
                                value={unit.status}
                                onChange={(event) => changeUnitStatus(unit, event.target.value)}
                                aria-label={`Change status for unit ${unit.unit_number}`}
                                className="max-w-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600"
                              >
                                <option value="vacant">Vacant</option>
                                <option value="occupied">Occupied</option>
                                <option value="maintenance">Maintenance</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {visibleUnits.map((unit) => (
                  <article key={unit.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800">{unit.unit_number}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Building2 size={13} />
                          {unit.property?.name || '—'}
                        </p>
                      </div>
                      <StatusBadge status={unit.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">{unit.unit_type || 'Unit'}</p>
                        <p className="mt-1 font-semibold text-slate-800">{formatMoney(unit.monthly_rent)} / month</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditUnit(unit)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    </div>
                    {isOwner && (
                      <select
                        value={unit.status}
                        onChange={(event) => changeUnitStatus(unit, event.target.value)}
                        className={inputClass}
                        aria-label={`Change status for unit ${unit.unit_number}`}
                      >
                        <option value="vacant">Vacant</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="px-5 py-16 text-center">
              <Home size={30} className="mx-auto text-slate-300" />
              <h3 className="mt-3 font-semibold text-slate-700">No units found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Add a unit or adjust your search and filters.
              </p>
            </div>
          )
        ) : visibleProperties.length ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProperties.map((property) => {
              const propertyUnits = units.filter(
                (unit) => unit.property_id === property.id,
              )

              return (
                <article key={property.id} className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-200 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Building2 size={21} />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      property.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {property.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-800">{property.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={14} />
                    {property.location || 'Location not provided'}
                  </p>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                    {property.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">Units</p>
                      <p className="mt-1 text-lg font-bold text-slate-800">{propertyUnits.length}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProperty(String(property.id))
                          setTab('units')
                        }}
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        View units
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditProperty(property)}
                        aria-label={`Edit ${property.name}`}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      >
                        <Pencil size={16} />
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => changePropertyStatus(property)}
                          title={property.is_active ? 'Deactivate property' : 'Activate property'}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        >
                          {property.is_active ? <X size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <Building2 size={30} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-700">No properties found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create a property or adjust your search.
            </p>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Showing {tab === 'units' ? visibleUnits.length : visibleProperties.length}{' '}
          {tab === 'units' ? 'units' : 'properties'}
        </div>
      </section>

      {modal?.type === 'property' && (
        <Modal
          title={modal.mode === 'edit' ? 'Edit property' : 'Add property'}
          onClose={() => !saving && setModal(null)}
        >
          <form onSubmit={submitProperty} className="space-y-4">
            <Field label="Property name" required>
              <input
                required
                autoFocus
                maxLength={150}
                value={propertyForm.name}
                onChange={(event) =>
                  setPropertyForm({ ...propertyForm, name: event.target.value })
                }
                placeholder="e.g. AcreMbura Apartments"
                className={inputClass}
              />
            </Field>

            <Field label="Location">
              <input
                maxLength={255}
                value={propertyForm.location}
                onChange={(event) =>
                  setPropertyForm({ ...propertyForm, location: event.target.value })
                }
                placeholder="Property location"
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                maxLength={2000}
                value={propertyForm.description}
                onChange={(event) =>
                  setPropertyForm({ ...propertyForm, description: event.target.value })
                }
                placeholder="Additional property details"
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
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                {modal.mode === 'edit' ? 'Save changes' : 'Create property'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'unit' && (
        <Modal
          title={modal.mode === 'edit' ? 'Edit unit' : 'Add unit'}
          onClose={() => !saving && setModal(null)}
        >
          <form onSubmit={submitUnit} className="space-y-4">
            <Field label="Property" required>
              <select
                required
                disabled={modal.mode === 'edit'}
                value={unitForm.property_id}
                onChange={(event) =>
                  setUnitForm({ ...unitForm, property_id: event.target.value })
                }
                className={inputClass}
              >
                <option value="">Select property</option>
                {properties.filter((property) => property.is_active).map((property) => (
                  <option key={property.id} value={String(property.id)}>
                    {property.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Unit number" required>
                <input
                  required
                  maxLength={50}
                  value={unitForm.unit_number}
                  onChange={(event) =>
                    setUnitForm({ ...unitForm, unit_number: event.target.value })
                  }
                  placeholder="e.g. A-01"
                  className={inputClass}
                />
              </Field>
              <Field label="Unit type">
                <input
                  maxLength={100}
                  value={unitForm.unit_type}
                  onChange={(event) =>
                    setUnitForm({ ...unitForm, unit_type: event.target.value })
                  }
                  placeholder="e.g. Bedsitter"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Monthly rent (KES)" required>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={unitForm.monthly_rent}
                onChange={(event) =>
                  setUnitForm({ ...unitForm, monthly_rent: event.target.value })
                }
                placeholder="0.00"
                className={inputClass}
              />
            </Field>

            {modal.mode === 'create' && (
              <Field label="Initial status" required>
                <select
                  required
                  value={unitForm.status}
                  onChange={(event) =>
                    setUnitForm({ ...unitForm, status: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </Field>
            )}

            {modal.mode === 'edit' && (
              <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                Unit status is managed separately. Only the owner can change it.
              </p>
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
                disabled={saving || !properties.some((property) => property.is_active)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                {modal.mode === 'edit' ? 'Save changes' : 'Create unit'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
