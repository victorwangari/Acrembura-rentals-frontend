import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CheckCheck,
  Check,
  CircleAlert,
  CreditCard,
  RefreshCw,
  Search,
  Clock,
  Inbox,
} from 'lucide-react'
import { apiRequest } from '../api/client'

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function notificationIcon(category = '') {
  const value = category.toLowerCase()

  if (value.includes('payment')) return CreditCard
  if (value.includes('overdue') || value.includes('invoice')) {
    return CircleAlert
  }

  return Bell
}

export default function Notifications({ onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const [listResult, countResult] = await Promise.all([
        apiRequest('/notifications'),
        apiRequest('/notifications/unread-count'),
      ])

      setNotifications(
        Array.isArray(listResult.data) ? listResult.data : []
      )
      const nextUnreadCount = Number(
        countResult.data?.unread_count ?? 0
      )
      setUnreadCount(nextUnreadCount)
      onUnreadCountChange?.(nextUnreadCount)
    } catch (err) {
      setError(err.message || 'Unable to load notifications.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [onUnreadCountChange])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase()

    return notifications.filter((notification) => {
      if (filter === 'unread' && notification.is_read) return false
      if (filter === 'read' && !notification.is_read) return false

      if (!query) return true

      return [
        notification.title,
        notification.message,
        notification.category,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [notifications, filter, search])

  async function toggleRead(notification) {
    setUpdatingId(notification.id)
    setError('')

    try {
      const action = notification.is_read ? 'unread' : 'read'

      const result = await apiRequest(
        `/notifications/${notification.id}/${action}`,
        { method: 'PATCH' }
      )

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? result.data : item
        )
      )

      const nextUnreadCount = Math.max(
        0,
        unreadCount + (notification.is_read ? 1 : -1)
      )
      setUnreadCount(nextUnreadCount)
      onUnreadCountChange?.(nextUnreadCount)
    } catch (err) {
      setError(err.message || 'Unable to update notification.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) return

    setMarkingAll(true)
    setError('')

    try {
      await apiRequest('/notifications/read-all', {
        method: 'PATCH',
      })

      const readAt = new Date().toISOString()

      setNotifications((current) =>
        current.map((item) =>
          item.is_read
            ? item
            : { ...item, is_read: true, read_at: readAt }
        )
      )

      setUnreadCount(0)
      onUnreadCountChange?.(0)
    } catch (err) {
      setError(err.message || 'Unable to mark notifications as read.')
    } finally {
      setMarkingAll(false)
    }
  }

  const unread = notifications.filter((item) => !item.is_read).length
  const read = notifications.length - unread

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Stay informed about payments and overdue invoices.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {unreadCount} unread
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {notifications.length} total
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadNotifications(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={16} />
            {markingAll ? 'Updating...' : 'Mark all as read'}
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">All notifications</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {notifications.length}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-medium text-blue-700">Unread</p>
          <p className="mt-2 text-2xl font-bold text-blue-800">{unread}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Read</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{read}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  filter === item.value
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox size={26} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">
              {notifications.length === 0
                ? 'No notifications yet'
                : 'No matching notifications'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {notifications.length === 0
                ? 'Payment and overdue-invoice alerts will appear here when generated.'
                : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => {
              const Icon = notificationIcon(notification.category)

              return (
                <article
                  key={notification.id}
                  className={`flex gap-3 p-4 transition sm:gap-4 sm:p-5 ${
                    notification.is_read ? 'bg-white' : 'bg-blue-50/40'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      notification.is_read
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} />
                        {formatDate(notification.created_at)}
                      </span>
                      {notification.category && (
                        <span className="rounded-md bg-slate-100 px-2 py-1 capitalize text-slate-600">
                          {notification.category.replaceAll('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRead(notification)}
                    disabled={updatingId === notification.id}
                    aria-label={
                      notification.is_read
                        ? 'Mark as unread'
                        : 'Mark as read'
                    }
                    title={
                      notification.is_read
                        ? 'Mark as unread'
                        : 'Mark as read'
                    }
                    className="flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                  >
                    <Check size={15} />
                    <span className="hidden sm:inline">
                      {updatingId === notification.id
                        ? 'Updating'
                        : notification.is_read
                          ? 'Unread'
                          : 'Mark read'}
                    </span>
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
