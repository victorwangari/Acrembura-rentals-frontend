clear
import { useCallback, useEffect, useState } from 'react'
import {
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock3,
} from 'lucide-react'
import { apiRequest } from '../api/client'

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function StatusBadge({ status }) {
  const accepted = status === 'accepted'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        accepted
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-rose-50 text-rose-700'
      }`}
    >
      {accepted ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {accepted ? 'Accepted' : 'Failed'}
    </span>
  )
}

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
  })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)

  const loadMessages = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '10',
      })

      if (search) params.set('search', search)
      if (status) params.set('status', status)

      const result = await apiRequest(`/messages?${params.toString()}`)
      const data = result.data || {}

      setMessages(Array.isArray(data.items) ? data.items : [])
      setPagination(data.pagination || {
        page: 1,
        per_page: 10,
        total: 0,
        pages: 0,
      })
    } catch (err) {
      setError(err.message || 'Unable to load message history.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, search, status])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function handleStatusChange(event) {
    setPage(1)
    setStatus(event.target.value)
  }

  const acceptedCount = messages.filter(
    (message) => message.status === 'accepted'
  ).length

  const failedCount = messages.filter(
    (message) => message.status === 'failed'
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Review outgoing invoice and payment emails.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Accepted means the email provider accepted the request; it does
            not confirm delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadMessages(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total messages</p>
            <Mail size={19} className="text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {pagination.total}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Matching history records
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Accepted on this page</p>
            <CheckCircle2 size={19} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {acceptedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Accepted by the email provider
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Failed on this page</p>
            <XCircle size={19} className="text-rose-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {failedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Messages requiring review
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search recipient or subject..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </form>

          <div className="flex items-center gap-2">
            <label htmlFor="message-status" className="text-xs text-slate-500">
              Status
            </label>
            <select
              id="message-status"
              value={status}
              onChange={handleStatusChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="">All statuses</option>
              <option value="accepted">Accepted</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadMessages(true)}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-14 text-sm text-slate-500">
            <RefreshCw size={17} className="animate-spin" />
            Loading message history...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Mail size={25} className="text-slate-400" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">
              No messages found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Outgoing email attempts will appear here when available. Try
              changing your search or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Recipient</th>
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-sm font-medium text-slate-800">
                        {message.recipient_email}
                      </td>
                      <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                        <p className="truncate">{message.subject}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium capitalize text-blue-700">
                          {String(message.message_type || 'general').replace(
                            /[_-]/g,
                            ' '
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={message.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        {formatDate(message.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(message)}
                          aria-label={`View details for ${message.subject}`}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <ExternalLink size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing page {pagination.page} of {pagination.pages} ·{' '}
                {pagination.total} messages
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-details-title"
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email history
                </p>
                <h2
                  id="message-details-title"
                  className="mt-1 text-lg font-bold text-slate-900"
                >
                  Message details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-slate-400">Recipient</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-800">
                  {selectedMessage.recipient_email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Subject</p>
                <p className="mt-1 text-sm text-slate-800">
                  {selectedMessage.subject}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selectedMessage.status} />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {selectedMessage.provider || 'Provider unavailable'}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Message type</p>
                  <p className="mt-1 text-sm capitalize text-slate-700">
                    {selectedMessage.message_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Attempted at</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
                    <Clock3 size={14} />
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Accepted at</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {formatDate(selectedMessage.accepted_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Related invoice</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedMessage.invoice_id ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Related payment</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedMessage.payment_id ?? '—'}
                  </p>
                </div>
              </div>

              {selectedMessage.error_message && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold text-rose-700">
                    Error details
                  </p>
                  <p className="mt-1 break-words text-sm text-rose-700">
                    {selectedMessage.error_message}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
