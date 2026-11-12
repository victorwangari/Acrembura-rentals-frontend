import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Building2,
  Droplets,
  UserRound,
  X,
} from 'lucide-react'
import { apiRequest } from '../api/client'

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
        <Icon size={20} />
      </span>
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
      {children}
    </div>
  )
}

export default function UserAssignments({ users = [] }) {
  const [properties, setProperties] = useState([])
  const [connections, setConnections] = useState([])
  const [assignments, setAssignments] = useState({
    properties: [],
    water_connections: [],
    permissions: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [propertySearch, setPropertySearch] = useState('')
  const [connectionSearch, setConnectionSearch] = useState('')

  const receptionists = useMemo(
    () => users.filter((user) => user.role === 'receptionist'),
    [users]
  )

  const activeReceptionists = useMemo(
    () => receptionists.filter((user) => user.is_active),
    [receptionists]
  )

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [assignmentResult, propertyResult, connectionResult] =
        await Promise.all([
          apiRequest('/assignments'),
          apiRequest('/properties?include_inactive=true'),
          apiRequest('/water-connections'),
        ])

      setAssignments({
        properties: assignmentResult.data?.properties || [],
        water_connections: assignmentResult.data?.water_connections || [],
        permissions: assignmentResult.data?.permissions || [],
      })
      setProperties(Array.isArray(propertyResult.data) ? propertyResult.data : [])
      setConnections(
        Array.isArray(connectionResult.data) ? connectionResult.data : []
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  function showResult(message) {
    setError('')
    setNotice(message)
  }

  async function updatePermission(user, permission, enabled) {
    const key = `permission-${user.id}-${permission}`
    setSaving(key)
    setError('')
    setNotice('')

    try {
      await apiRequest(`/assignments/permissions/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ permission, enabled }),
      })

      showResult(
        `${permission === 'water_point' ? 'Water-point sales' : 'Home connections'} access ${
          enabled ? 'granted to' : 'revoked from'
        } ${user.full_name}.`
      )
      await loadAssignments()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving('')
    }
  }

  async function updatePropertyAssignment(property, receptionistId) {
    const existing = assignments.properties.find(
      (item) => item.property_id === property.id
    )

    if (!receptionistId && !existing) return

    const key = `property-${property.id}`
    setSaving(key)
    setError('')
    setNotice('')

    try {
      if (receptionistId) {
        await apiRequest(`/assignments/properties/${property.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            receptionist_id: Number(receptionistId),
          }),
        })
        showResult(`Assignment for ${property.name} saved successfully.`)
      } else {
        await apiRequest(`/assignments/properties/${property.id}`, {
          method: 'DELETE',
        })
        showResult(`Assignment for ${property.name} removed.`)
      }

      await loadAssignments()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving('')
    }
  }

  async function updateConnectionAssignment(connection, receptionistId) {
    const existing = assignments.water_connections.find(
      (item) => item.connection_id === connection.id
    )

    if (!receptionistId && !existing) return

    const key = `connection-${connection.id}`
    setSaving(key)
    setError('')
    setNotice('')

    try {
      if (receptionistId) {
        await apiRequest(`/assignments/connections/${connection.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            receptionist_id: Number(receptionistId),
          }),
        })
        showResult(
          `Connection ${connection.connection_number} assigned successfully.`
        )
      } else {
        await apiRequest(`/assignments/connections/${connection.id}`, {
          method: 'DELETE',
        })
        showResult(
          `Assignment for connection ${connection.connection_number} removed.`
        )
      }

      await loadAssignments()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving('')
    }
  }

  const filteredProperties = properties.filter((property) => {
    const query = propertySearch.trim().toLowerCase()
    return (
      !query ||
      [property.name, property.location]
        .some((value) => String(value || '').toLowerCase().includes(query))
    )
  })

  const filteredConnections = connections.filter((connection) => {
    // Tenant-linked connections inherit access through property assignments.
    // Only external water-customer connections need individual assignment.
    if (!connection.water_customer || connection.tenant) return false

    const query = connectionSearch.trim().toLowerCase()
    const customerName = connection.water_customer.full_name || ''

    return (
      !query ||
      [
        connection.connection_number,
        connection.connection_type,
        connection.status,
        customerName,
        connection.meter?.meter_number,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    )
  })

  function assignedReceptionist(list, field, id) {
    return list.find((item) => item[field] === id)
  }

  function getConnectionCustomer(connection) {
    if (connection.tenant?.full_name) {
      return `Tenant: ${connection.tenant.full_name}`
    }

    if (connection.water_customer?.full_name) {
      return `Customer: ${connection.water_customer.full_name}`
    }

    return 'No customer linked'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Receptionist assignments
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Control which properties, water connections and operations each
            receptionist can access.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAssignments}
          disabled={loading || Boolean(saving)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh assignments
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
          <LoaderCircle size={19} className="animate-spin" />
          Loading assignment information...
        </div>
      ) : (
        <>
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon={ShieldCheck}
              title="Receptionist permissions"
              description="Grant access to water-point sales and independently managed home water connections."
            />

            {receptionists.length === 0 ? (
              <EmptyState>
                No receptionist accounts found. Create a receptionist account
                first.
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Receptionist</th>
                      <th className="px-4 py-3 font-semibold">Water-point sales</th>
                      <th className="px-4 py-3 font-semibold">Home connections</th>
                      <th className="px-4 py-3 font-semibold">Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receptionists.map((user) => {
                      const permissionNames = assignments.permissions
                        .filter((item) => item.receptionist_id === user.id)
                        .map((item) => item.permission)

                      return (
                        <tr key={user.id}>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {user.full_name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {user.email}
                            </p>
                          </td>

                          {['water_point', 'home_connections'].map((permission) => {
                            const enabled = permissionNames.includes(permission)
                            const key = `permission-${user.id}-${permission}`

                            return (
                              <td className="px-4 py-4" key={permission}>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    disabled={!user.is_active || saving === key}
                                    onChange={(event) =>
                                      updatePermission(
                                        user,
                                        permission,
                                        event.target.checked
                                      )
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                                  />
                                  <span>
                                    {saving === key ? 'Saving...' : enabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </label>
                              </td>
                            )
                          })}

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                user.is_active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon={Building2}
              title="Property assignments"
              description="Each property can be assigned to one receptionist. A receptionist may manage multiple properties."
            />

            <input
              type="search"
              value={propertySearch}
              onChange={(event) => setPropertySearch(event.target.value)}
              placeholder="Search properties by name or location..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 sm:max-w-md"
            />

            {filteredProperties.length === 0 ? (
              <EmptyState>No properties found.</EmptyState>
            ) : (
              <div className="space-y-3">
                {filteredProperties.map((property) => {
                  const assignment = assignedReceptionist(
                    assignments.properties,
                    'property_id',
                    property.id
                  )
                  const assignedUser = receptionists.find(
                    (user) => user.id === assignment?.receptionist_id
                  )
                  const key = `property-${property.id}`

                  return (
                    <div
                      key={property.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800">
                            {property.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              property.is_active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {property.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {property.location || 'No location provided'}
                        </p>
                        {assignedUser && !assignedUser.is_active && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Currently assigned to an inactive receptionist.
                          </p>
                        )}
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[260px]">
                        <select
                          value={assignment?.receptionist_id || ''}
                          disabled={
                            !property.is_active ||
                            activeReceptionists.length === 0 ||
                            saving === key
                          }
                          onChange={(event) =>
                            updatePropertyAssignment(property, event.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">Unassigned</option>
                          {assignedUser && !assignedUser.is_active && (
                            <option value={assignedUser.id} disabled>
                              {assignedUser.full_name} (Inactive)
                            </option>
                          )}
                          {activeReceptionists.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.full_name}
                            </option>
                          ))}
                        </select>

                        {saving === key && (
                          <span className="text-xs text-slate-500">
                            Saving assignment...
                          </span>
                        )}

                        {assignment && (
                          <button
                            type="button"
                            disabled={Boolean(saving)}
                            onClick={() =>
                              updatePropertyAssignment(property, '')
                            }
                            className="inline-flex items-center justify-center gap-1.5 self-start text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                          >
                            <X size={14} />
                            Remove assignment
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon={Droplets}
              title="Individual water-connection assignments"
              description="Assign external customer water connections individually. Receptionists also need the Home connections permission."
            />

            <input
              type="search"
              value={connectionSearch}
              onChange={(event) => setConnectionSearch(event.target.value)}
              placeholder="Search connection number, customer or meter..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 sm:max-w-md"
            />

            {filteredConnections.length === 0 ? (
              <EmptyState>No water connections found.</EmptyState>
            ) : (
              <div className="space-y-3">
                {filteredConnections.map((connection) => {
                  const assignment = assignedReceptionist(
                    assignments.water_connections,
                    'connection_id',
                    connection.id
                  )
                  const assignedUser = receptionists.find(
                    (user) => user.id === assignment?.receptionist_id
                  )
                  const key = `connection-${connection.id}`

                  return (
                    <div
                      key={connection.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800">
                            {connection.connection_number}
                          </p>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold capitalize text-blue-700">
                            {connection.connection_type}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              connection.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {connection.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          {getConnectionCustomer(connection)}
                        </p>
                        {connection.water_customer?.phone && (
                          <p className="mt-1 text-xs text-slate-500">
                            {connection.water_customer.phone}
                          </p>
                        )}
                        {connection.meter?.meter_number && (
                          <p className="mt-1 text-xs text-slate-500">
                            Meter: {connection.meter.meter_number}
                          </p>
                        )}
                        {assignedUser && !assignedUser.is_active && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Currently assigned to an inactive receptionist.
                          </p>
                        )}
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[260px]">
                        <select
                          value={assignment?.receptionist_id || ''}
                          disabled={
                            activeReceptionists.length === 0 || saving === key
                          }
                          onChange={(event) =>
                            updateConnectionAssignment(
                              connection,
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">Unassigned</option>
                          {assignedUser && !assignedUser.is_active && (
                            <option value={assignedUser.id} disabled>
                              {assignedUser.full_name} (Inactive)
                            </option>
                          )}
                          {activeReceptionists.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.full_name}
                            </option>
                          ))}
                        </select>

                        {saving === key && (
                          <span className="text-xs text-slate-500">
                            Saving assignment...
                          </span>
                        )}

                        {assignment && (
                          <button
                            type="button"
                            disabled={Boolean(saving)}
                            onClick={() =>
                              updateConnectionAssignment(connection, '')
                            }
                            className="inline-flex items-center justify-center gap-1.5 self-start text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                          >
                            <X size={14} />
                            Remove assignment
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <UserRound size={18} className="mt-0.5 shrink-0" />
              <p>
                Tenant-linked water connections automatically follow their
                property's assignment. Only external customer connections
                require individual assignment. Receptionists need the Home
                connections permission and an individual assignment to access
                external customer connections.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
