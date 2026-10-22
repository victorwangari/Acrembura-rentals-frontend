import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UserRoundX,
  X,
} from 'lucide-react'
import { apiRequest } from '../api/client'

const initialForm = {
  full_name: '',
  email: '',
  password: '',
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  minLength,
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  )
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(initialForm)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiRequest('/users')
      setUsers(Array.isArray(result.data) ? result.data : [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  function openCreate() {
    setForm(initialForm)
    setError('')
    setNotice('')
    setModal({ type: 'create' })
  }

  function openEdit(user) {
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
    })
    setError('')
    setNotice('')
    setModal({ type: 'edit', user })
  }

  function openPasswordReset(user) {
    setForm({ ...initialForm, password: '' })
    setError('')
    setNotice('')
    setModal({ type: 'password', user })
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!modal) return

    setSaving(true)
    setError('')
    setNotice('')

    try {
      if (modal.type === 'create') {
        await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
          }),
        })
        setNotice('Receptionist account created successfully.')
      } else if (modal.type === 'edit') {
        await apiRequest(`/users/${modal.user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
          }),
        })
        setNotice('User details updated successfully.')
      } else if (modal.type === 'password') {
        await apiRequest(`/users/${modal.user.id}/password`, {
          method: 'PATCH',
          body: JSON.stringify({ password: form.password }),
        })
        setNotice('Password reset successfully.')
      }

      setModal(null)
      await loadUsers()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(user) {
    const action = user.is_active ? 'deactivate' : 'activate'
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.full_name}?`
    )
    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await apiRequest(`/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.is_active }),
      })
      setNotice(`${user.full_name} has been ${action}d.`)
      await loadUsers()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase()
    return (
      !query ||
      [user.full_name, user.email, user.role]
        .some((value) => String(value || '').toLowerCase().includes(query))
    )
  })

  const activeCount = users.filter((user) => user.is_active).length
  const inactiveCount = users.length - activeCount

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Manage access to the AcreMbura system.
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-800">
            Users & access
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />
            Add receptionist
          </button>
        </div>
      </div>

      {error && !modal && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {notice && !modal && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total accounts</p>
            <UserRound size={19} className="text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Active accounts</p>
            <ShieldCheck size={19} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Inactive accounts</p>
            <UserRoundX size={19} className="text-slate-500" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{inactiveCount}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h3 className="font-bold text-slate-800">System users</h3>
            <p className="mt-1 text-xs text-slate-500">
              Only the owner can create or manage user accounts.
            </p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 sm:max-w-xs"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" />
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UserRound size={30} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No users found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or add a receptionist account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">User</th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {user.full_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge active={user.is_active} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Edit user details"
                          aria-label={`Edit ${user.full_name}`}
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Reset password"
                          aria-label={`Reset password for ${user.full_name}`}
                          onClick={() => openPasswordReset(user)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <KeyRound size={16} />
                        </button>
                        {user.role === 'receptionist' && (
                          <button
                            type="button"
                            title={user.is_active ? 'Deactivate user' : 'Activate user'}
                            onClick={() => toggleStatus(user)}
                            className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${
                              user.is_active
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <Modal
          title={
            modal.type === 'create'
              ? 'Add receptionist'
              : modal.type === 'edit'
                ? 'Edit user details'
                : 'Reset user password'
          }
          onClose={() => {
            if (!saving) {
              setModal(null)
              setError('')
            }
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {modal.type === 'password' ? (
              <>
                <p className="text-sm text-slate-500">
                  Set a new password for{' '}
                  <span className="font-semibold text-slate-700">
                    {modal.user.full_name}
                  </span>
                  .
                </p>
                <FormField
                  label="New password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="At least 12 characters"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </>
            ) : (
              <>
                <FormField
                  label="Full name"
                  name="full_name"
                  value={form.full_name}
                  onChange={updateField}
                  placeholder="Enter full name"
                  required
                  autoComplete="name"
                />
                <FormField
                  label="Email address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                />
                {modal.type === 'create' && (
                  <FormField
                    label="Temporary password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={updateField}
                    placeholder="At least 12 characters"
                    required
                    minLength={12}
                    autoComplete="new-password"
                  />
                )}
              </>
            )}

            {error && (
              <div role="alert" className="flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setModal(null)
                  setError('')
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                {saving
                  ? 'Saving...'
                  : modal.type === 'create'
                    ? 'Create account'
                    : modal.type === 'edit'
                      ? 'Save changes'
                      : 'Reset password'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
