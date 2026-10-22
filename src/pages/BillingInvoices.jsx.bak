
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    AlertCircle,
    ArrowDownToLine,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    Clock3,
    CreditCard,
    Eye,
    FileText,
    LoaderCircle,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    UserRound,
    Users,
    Wallet,
    Waves,
    X,
} from 'lucide-react'
import { apiRequest } from '../api/client'

const today = () => new Date().toISOString().slice(0, 10)

const money = (value) =>
    new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0))

const shortDate = (value) => {
    if (!value) return '—'
    const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`)
    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString('en-KE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
}

const statusStyles = {
    draft: 'bg-slate-100 text-slate-600',
    unpaid: 'bg-rose-50 text-rose-700',
    partially_paid: 'bg-amber-50 text-amber-700',
    paid: 'bg-emerald-50 text-emerald-700',
    overdue: 'bg-rose-100 text-rose-800',
}

const statusLabel = (status) => {
    if (!status) return 'Unknown'
    return status.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const initialInvoiceForm = {
    customer_type: 'tenant',
    customer_id: '',
    invoice_date: today(),
    due_date: '',
    billing_period: new Date().toISOString().slice(0, 7),
    previous_balance: '0',
}

const initialItemForm = {
    item_type: 'rent',
    description: '',
    quantity: '1',
    unit_price: '',
}

const initialPaymentForm = {
    amount: '',
    payment_date: today(),
    payment_method: 'mpesa',
    reference_number: '',
    notes: '',
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status] || 'bg-slate-100 text-slate-600'
                }`}
        >
            {statusLabel(status)}
        </span>
    )
}

function Field({ label, children, hint }) {
    return (
        <label className="block min-w-0 space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">
                {label}
            </span>
            {children}
            {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
        </label>
    )
}

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

function Modal({ title, subtitle, onClose, children, wide = false }) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 py-6 backdrop-blur-[2px] sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <section
                className={`my-auto w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} overflow-hidden rounded-2xl bg-white shadow-2xl`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">{title}</h2>
                        {subtitle && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>
                </header>
                <div className="p-5 sm:p-6">{children}</div>
            </section>
        </div>
    )
}

function MetricCard({ label, value, detail, icon: Icon, color }) {
    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                        {value}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
                </div>
                <div className={`rounded-xl p-3 ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
        </article>
    )
}

export default function BillingInvoices() {
    const [invoices, setInvoices] = useState([])
    const [tenants, setTenants] = useState([])
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [customerFilter, setCustomerFilter] = useState('all')
    const [modal, setModal] = useState(null)
    const [saving, setSaving] = useState(false)
    const [emailingInvoice, setEmailingInvoice] = useState(false)
    const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm)
    const [itemForm, setItemForm] = useState(initialItemForm)
    const [paymentForm, setPaymentForm] = useState(initialPaymentForm)
    const [selectedInvoice, setSelectedInvoice] = useState(null)
    const [payments, setPayments] = useState([])
    const [paymentsLoading, setPaymentsLoading] = useState(false)

    const loadData = useCallback(async (quiet = false) => {
        if (quiet) setRefreshing(true)
        else setLoading(true)

        setError('')

        try {
            const [invoiceResult, tenantResult, customerResult] = await Promise.all([
                apiRequest('/invoices'),
                apiRequest('/tenants'),
                apiRequest('/water-customers?status=active'),
            ])

            setInvoices(Array.isArray(invoiceResult.data) ? invoiceResult.data : [])
            setTenants(
                (Array.isArray(tenantResult.data) ? tenantResult.data : []).filter(
                    (tenant) => tenant.status === 'active',
                ),
            )
            setCustomers(
                Array.isArray(customerResult.data) ? customerResult.data : [],
            )
        } catch (err) {
            setError(err.message || 'Unable to load billing information.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        loadData()

        // Refresh invoices whenever the user returns to this page.
        const handleFocus = () => {
            if (document.visibilityState === 'visible') {
                loadData(true)
            }
        }

        window.addEventListener('focus', handleFocus)
        document.addEventListener('visibilitychange', handleFocus)

        // Check for newly generated invoices every 15 seconds.
        const intervalId = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadData(true)
            }
        }, 15000)

        return () => {
            window.removeEventListener('focus', handleFocus)
            document.removeEventListener('visibilitychange', handleFocus)
            window.clearInterval(intervalId)
        }
    }, [loadData])

    const tenantById = useMemo(
        () => new Map(tenants.map((tenant) => [String(tenant.id), tenant])),
        [tenants],
    )

    const customerById = useMemo(
        () => new Map(customers.map((customer) => [String(customer.id), customer])),
        [customers],
    )

    const getCustomer = useCallback(
        (invoice) => {
            if (invoice.tenant_id != null) {
                const tenant = tenantById.get(String(invoice.tenant_id))
                return tenant?.full_name || `Tenant #${invoice.tenant_id}`
            }

            if (invoice.water_customer_id != null) {
                const customer = customerById.get(String(invoice.water_customer_id))
                return customer?.full_name || `Water customer #${invoice.water_customer_id}`
            }

            return 'Unknown customer'
        },
        [tenantById, customerById],
    )

    const visibleInvoices = useMemo(() => {
        const query = search.trim().toLowerCase()

        return invoices.filter((invoice) => {
            const customerName = getCustomer(invoice).toLowerCase()
            const matchesSearch =
                !query ||
                String(invoice.invoice_number || '').toLowerCase().includes(query) ||
                customerName.includes(query) ||
                String(invoice.billing_period || '').toLowerCase().includes(query)

            const matchesStatus =
                statusFilter === 'all' || invoice.status === statusFilter

            const matchesCustomer =
                customerFilter === 'all' ||
                (customerFilter === 'tenant' && invoice.tenant_id != null) ||
                (customerFilter === 'water_customer' && invoice.water_customer_id != null)

            return matchesSearch && matchesStatus && matchesCustomer
        })
    }, [invoices, search, statusFilter, customerFilter, getCustomer])

    const metrics = useMemo(() => {
        const outstanding = invoices.reduce(
            (total, invoice) =>
                invoice.status === 'draft' ? total : total + Number(invoice.balance || 0),
            0,
        )

        const collected = invoices.reduce(
            (total, invoice) => total + Number(invoice.amount_paid || 0),
            0,
        )

        const unpaidCount = invoices.filter(
            (invoice) =>
                invoice.status === 'unpaid' || invoice.status === 'partially_paid',
        ).length

        return {
            total: invoices.length,
            outstanding,
            collected,
            unpaidCount,
            drafts: invoices.filter((invoice) => invoice.status === 'draft').length,
        }
    }, [invoices])

    function openCreateInvoice() {
        setError('')
        setNotice('')
        setInvoiceForm(initialInvoiceForm)
        setModal({ type: 'create' })
    }

    function openMonthlyBilling() {
        setError('')
        setNotice('')
        setInvoiceForm({
            ...initialInvoiceForm,
            customer_type: 'tenant',
        })
        setModal({ type: 'monthly' })
    }

    async function openInvoice(invoice) {
        setError('')
        setNotice('')
        setSelectedInvoice(invoice)
        setModal({ type: 'details' })

        try {
            const result = await apiRequest(`/invoices/${invoice.id}`)
            setSelectedInvoice(result.data)
        } catch (err) {
            setError(err.message || 'Unable to retrieve invoice details.')
        }
    }

    async function createInvoice(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        setNotice('')

        const customerId = Number(invoiceForm.customer_id)

        if (!customerId || !Number.isInteger(customerId)) {
            setError('Select a customer before creating the invoice.')
            setSaving(false)
            return
        }

        const payload = {
            invoice_date: invoiceForm.invoice_date || today(),
            due_date: invoiceForm.due_date || undefined,
            billing_period: invoiceForm.billing_period || undefined,
            previous_balance: Number(invoiceForm.previous_balance || 0),
            tenant_id: invoiceForm.customer_type === 'tenant' ? customerId : null,
            water_customer_id:
                invoiceForm.customer_type === 'water_customer' ? customerId : null,
        }

        try {
            const result = await apiRequest('/invoices', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            await loadData(true)
            setSelectedInvoice(result.data)
            setModal({ type: 'details' })
            setNotice('Draft invoice created. Add line items before finalizing it.')
        } catch (err) {
            setError(err.message || 'Unable to create invoice.')
        } finally {
            setSaving(false)
        }
    }

    async function generateMonthlyInvoice(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        setNotice('')

        const tenantId = Number(invoiceForm.customer_id)

        if (!tenantId || !Number.isInteger(tenantId)) {
            setError('Select an active tenant.')
            setSaving(false)
            return
        }

        try {
            const result = await apiRequest('/invoices/monthly', {
                method: 'POST',
                body: JSON.stringify({
                    tenant_id: tenantId,
                    billing_period: invoiceForm.billing_period,
                    invoice_date: invoiceForm.invoice_date || today(),
                    due_date: invoiceForm.due_date || undefined,
                }),
            })

            await loadData(true)
            setSelectedInvoice(result.data)
            setModal({ type: 'details' })
            setNotice('Monthly invoice generated successfully.')
        } catch (err) {
            setError(err.message || 'Unable to generate monthly invoice.')
        } finally {
            setSaving(false)
        }
    }

    async function addItem(event) {
        event.preventDefault()
        if (!selectedInvoice) return

        setSaving(true)
        setError('')
        setNotice('')

        try {
            await apiRequest(`/invoices/${selectedInvoice.id}/items`, {
                method: 'POST',
                body: JSON.stringify({
                    item_type: itemForm.item_type,
                    description: itemForm.description,
                    quantity: Number(itemForm.quantity),
                    unit_price: Number(itemForm.unit_price),
                }),
            })

            const result = await apiRequest(`/invoices/${selectedInvoice.id}`)
            setSelectedInvoice(result.data)
            setItemForm(initialItemForm)
            await loadData(true)
            setNotice('Line item added successfully.')
        } catch (err) {
            setError(err.message || 'Unable to add invoice item.')
        } finally {
            setSaving(false)
        }
    }

    async function finalizeInvoice() {
        if (!selectedInvoice) return

        const confirmed = window.confirm(
            `Finalize invoice ${selectedInvoice.invoice_number}? You will not be able to add more line items afterward.`,
        )

        if (!confirmed) return

        setSaving(true)
        setError('')
        setNotice('')

        try {
            const result = await apiRequest(`/invoices/${selectedInvoice.id}/finalize`, {
                method: 'POST',
            })

            setSelectedInvoice(result.data)
            await loadData(true)
            setNotice('Invoice finalized successfully.')
        } catch (err) {
            setError(err.message || 'Unable to finalize invoice.')
        } finally {
            setSaving(false)
        }
    }

    async function loadPayments(invoiceId) {
        setPaymentsLoading(true)
        setError('')

        try {
            const result = await apiRequest(`/invoices/${invoiceId}/payments`)
            setPayments(Array.isArray(result.data) ? result.data : [])
        } catch (err) {
            setError(err.message || 'Unable to load payment history.')
        } finally {
            setPaymentsLoading(false)
        }
    }

    function openPayment(invoice) {
        setSelectedInvoice(invoice)
        setPaymentForm({
            ...initialPaymentForm,
            amount: String(invoice.balance || ''),
        })
        setError('')
        setNotice('')
        setModal({ type: 'payment' })
    }

    async function recordPayment(event) {
        event.preventDefault()
        if (!selectedInvoice) return

        setSaving(true)
        setError('')
        setNotice('')

        try {
            const result = await apiRequest(
                `/invoices/${selectedInvoice.id}/payments`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        amount: Number(paymentForm.amount),
                        payment_date: paymentForm.payment_date || undefined,
                        payment_method: paymentForm.payment_method,
                        reference_number: paymentForm.reference_number || null,
                        notes: paymentForm.notes || null,
                    }),
                },
            )

            setSelectedInvoice(result.data.invoice)
            await loadData(true)
            setNotice('Payment recorded successfully.')
            setModal({ type: 'details' })
        } catch (err) {
            setError(err.message || 'Unable to record payment.')
        } finally {
            setSaving(false)
        }
    }

    async function openPayments(invoice) {
        setSelectedInvoice(invoice)
        setPayments([])
        setError('')
        setNotice('')
        setModal({ type: 'payments' })
        await loadPayments(invoice.id)
    }

    async function emailInvoice(invoice) {
        if (!invoice || invoice.status === 'draft') return

        setError('')
        setNotice('')
        setEmailingInvoice(true)

        try {
            const result = await apiRequest(`/invoices/${invoice.id}/email`, {
                method: 'POST',
                body: JSON.stringify({}),
            })

            setNotice(
                result.message ||
                `Invoice ${invoice.invoice_number} emailed successfully.`,
            )

            const refreshed = await apiRequest(`/invoices/${invoice.id}`)
            if (refreshed.data) {
                setSelectedInvoice(refreshed.data)
                setInvoices((current) =>
                    current.map((item) =>
                        item.id === refreshed.data.id ? refreshed.data : item,
                    ),
                )
            }
        } catch (err) {
            setError(err.message || 'Unable to email invoice.')
        } finally {
            setEmailingInvoice(false)
        }
    }

    async function openPdf(path, filename) {
        setError('')
        setNotice('')

        try {
            const token = localStorage.getItem('acrembura_access_token')
            const response = await fetch(`/api${path}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })

            if (!response.ok) {
                let message = 'Unable to open PDF.'
                try {
                    const result = await response.json()
                    message = result.message || message
                } catch {
                    // The server may return a non-JSON error response.
                }
                if (response.status === 401) {
                    window.dispatchEvent(new Event('acrembura:unauthorized'))
                }
                throw new Error(message)
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const opened = window.open(url, '_blank', 'noopener,noreferrer')

            if (!opened) {
                const link = document.createElement('a')
                link.href = url
                link.download = filename
                document.body.appendChild(link)
                link.click()
                link.remove()
            }

            window.setTimeout(() => URL.revokeObjectURL(url), 60000)
        } catch (err) {
            setError(err.message || 'Unable to open PDF.')
        }
    }

    function closeModal() {
        setModal(null)
        setSelectedInvoice(null)
        setPayments([])
        setError('')
        setNotice('')
    }

    const customersForForm =
        invoiceForm.customer_type === 'tenant' ? tenants : customers

    return (
        <div className="space-y-6">
            <section className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#10243a] to-[#174b70] p-5 text-white shadow-sm sm:flex-row sm:items-center sm:p-7">
                <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-100">
                        <Receipt size={14} />
                        Billing workspace
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Billing &amp; Invoices
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                        Manage rent and water invoices, track outstanding balances, and
                        record customer payments.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={openMonthlyBilling}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                        <CalendarDays size={16} />
                        Monthly billing
                    </button>
                    <button
                        type="button"
                        onClick={openCreateInvoice}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#10243a] transition hover:bg-blue-50"
                    >
                        <Plus size={16} />
                        Create invoice
                    </button>
                </div>
            </section>

            {error && !modal && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="flex-1">{error}</p>
                    <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
                        <X size={16} />
                    </button>
                </div>
            )}

            {notice && !modal && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <p>{notice}</p>
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    label="Total invoices"
                    value={metrics.total}
                    detail={`${metrics.drafts} draft invoices`}
                    icon={FileText}
                    color="bg-blue-50 text-blue-700"
                />
                <MetricCard
                    label="Outstanding balance"
                    value={money(metrics.outstanding)}
                    detail={`${metrics.unpaidCount} invoices with balances`}
                    icon={Clock3}
                    color="bg-amber-50 text-amber-700"
                />
                <MetricCard
                    label="Payments recorded"
                    value={money(metrics.collected)}
                    detail="Across the loaded invoices"
                    icon={Wallet}
                    color="bg-emerald-50 text-emerald-700"
                />
                <MetricCard
                    label="Draft invoices"
                    value={metrics.drafts}
                    detail="Awaiting finalization"
                    icon={Receipt}
                    color="bg-violet-50 text-violet-700"
                />
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Invoice register</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Search invoices and open one to manage its items and payments.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
                    >
                        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 md:grid-cols-[minmax(0,1fr)_180px_190px] sm:p-5">
                    <label className="relative block">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search invoice number, customer, period..."
                            className={`${inputClass} pl-9`}
                        />
                    </label>
                    <label>
                        <span className="sr-only">Filter by status</span>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">All statuses</option>
                            <option value="draft">Draft</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partially_paid">Partially paid</option>
                            <option value="paid">Paid</option>
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Filter by customer type</span>
                        <select
                            value={customerFilter}
                            onChange={(event) => setCustomerFilter(event.target.value)}
                            className={inputClass}
                        >
                            <option value="all">All customers</option>
                            <option value="tenant">Tenants</option>
                            <option value="water_customer">External water customers</option>
                        </select>
                    </label>
                </div>

                {loading ? (
                    <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500">
                        <LoaderCircle size={20} className="animate-spin text-blue-600" />
                        Loading invoices...
                    </div>
                ) : visibleInvoices.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <FileText size={25} />
                        </div>
                        <h4 className="mt-4 text-sm font-bold text-slate-700">
                            No invoices found
                        </h4>
                        <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                            {invoices.length
                                ? 'Try changing your search or filters.'
                                : 'Create an invoice or generate a monthly tenant invoice to get started.'}
                        </p>
                        {!invoices.length && (
                            <button
                                type="button"
                                onClick={openCreateInvoice}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                <Plus size={15} />
                                Create invoice
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[900px] text-left">
                                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3.5 font-semibold">Invoice</th>
                                        <th className="px-5 py-3.5 font-semibold">Customer</th>
                                        <th className="px-5 py-3.5 font-semibold">Dates</th>
                                        <th className="px-5 py-3.5 text-right font-semibold">Total</th>
                                        <th className="px-5 py-3.5 text-right font-semibold">Paid</th>
                                        <th className="px-5 py-3.5 text-right font-semibold">Balance</th>
                                        <th className="px-5 py-3.5 font-semibold">Status</th>
                                        <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visibleInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => openInvoice(invoice)}
                                                    className="text-left text-xs font-bold text-blue-700 hover:text-blue-900"
                                                >
                                                    {invoice.invoice_number}
                                                </button>
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    {invoice.billing_period || 'No billing period'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-xs font-semibold text-slate-700">{getCustomer(invoice)}</p>
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    {invoice.tenant_id != null ? 'Tenant' : 'External water customer'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-600">
                                                <p>{shortDate(invoice.invoice_date)}</p>
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    Due {shortDate(invoice.due_date)}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-right text-xs font-semibold text-slate-700">
                                                {money(invoice.total_amount)}
                                            </td>
                                            <td className="px-5 py-4 text-right text-xs text-emerald-700">
                                                {money(invoice.amount_paid)}
                                            </td>
                                            <td className="px-5 py-4 text-right text-xs font-semibold text-slate-700">
                                                {money(invoice.balance)}
                                            </td>
                                            <td className="px-5 py-4"><StatusBadge status={invoice.status} /></td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openInvoice(invoice)}
                                                        title="View invoice"
                                                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {invoice.status !== 'draft' && invoice.status !== 'paid' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openPayment(invoice)}
                                                            title="Record payment"
                                                            className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50"
                                                        >
                                                            <CircleDollarSign size={15} />
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
                            {visibleInvoices.map((invoice) => (
                                <article key={invoice.id} className="space-y-3 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => openInvoice(invoice)}
                                                className="break-all text-left text-xs font-bold text-blue-700"
                                            >
                                                {invoice.invoice_number}
                                            </button>
                                            <p className="mt-1 text-sm font-semibold text-slate-700">{getCustomer(invoice)}</p>
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                Due {shortDate(invoice.due_date)}
                                            </p>
                                        </div>
                                        <StatusBadge status={invoice.status} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400">Total</p>
                                            <p className="mt-1 break-words text-xs font-semibold text-slate-700">{money(invoice.total_amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400">Paid</p>
                                            <p className="mt-1 break-words text-xs font-semibold text-emerald-700">{money(invoice.amount_paid)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400">Balance</p>
                                            <p className="mt-1 break-words text-xs font-semibold text-slate-700">{money(invoice.balance)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openInvoice(invoice)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                                        >
                                            <Eye size={14} /> View details
                                        </button>
                                        {invoice.status !== 'draft' && invoice.status !== 'paid' && (
                                            <button
                                                type="button"
                                                onClick={() => openPayment(invoice)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                                            >
                                                <CircleDollarSign size={14} /> Record payment
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>

                        <footer className="border-t border-slate-100 px-4 py-3.5 text-[11px] text-slate-400 sm:px-5">
                            Showing {visibleInvoices.length} of {invoices.length} invoices
                        </footer>
                    </>
                )}
            </section>

            {modal?.type === 'create' && (
                <Modal
                    title="Create invoice"
                    subtitle="Create a draft invoice for one active tenant or external water customer."
                    onClose={closeModal}
                >
                    <form onSubmit={createInvoice} className="space-y-4">
                        {error && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>
                        )}
                        <Field label="Customer category">
                            <select
                                value={invoiceForm.customer_type}
                                onChange={(event) =>
                                    setInvoiceForm({ ...invoiceForm, customer_type: event.target.value, customer_id: '' })
                                }
                                className={inputClass}
                            >
                                <option value="tenant">Tenant</option>
                                <option value="water_customer">External water customer</option>
                            </select>
                        </Field>
                        <Field label="Customer">
                            <select
                                required
                                value={invoiceForm.customer_id}
                                onChange={(event) => setInvoiceForm({ ...invoiceForm, customer_id: event.target.value })}
                                className={inputClass}
                            >
                                <option value="">Select a customer</option>
                                {customersForForm.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.full_name}
                                        {customer.phone ? ` · ${customer.phone}` : ''}
                                    </option>
                                ))}
                            </select>
                            {!customersForForm.length && (
                                <span className="block text-[11px] text-amber-700">
                                    No active records found for this customer category.
                                </span>
                            )}
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Invoice date">
                                <input
                                    type="date"
                                    required
                                    value={invoiceForm.invoice_date}
                                    onChange={(event) => setInvoiceForm({ ...invoiceForm, invoice_date: event.target.value })}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Due date" hint="Defaults to 10 days after the invoice date.">
                                <input
                                    type="date"
                                    min={invoiceForm.invoice_date}
                                    value={invoiceForm.due_date}
                                    onChange={(event) => setInvoiceForm({ ...invoiceForm, due_date: event.target.value })}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Billing period" hint="For example, 2026-10">
                                <input
                                    value={invoiceForm.billing_period}
                                    onChange={(event) => setInvoiceForm({ ...invoiceForm, billing_period: event.target.value })}
                                    placeholder="YYYY-MM"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Previous balance (KES)">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={invoiceForm.previous_balance}
                                    onChange={(event) => setInvoiceForm({ ...invoiceForm, previous_balance: event.target.value })}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                            <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">
                                Cancel
                            </button>
                            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                                {saving && <LoaderCircle size={15} className="animate-spin" />}
                                Create draft
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal?.type === 'monthly' && (
                <Modal
                    title="Generate monthly tenant invoice"
                    subtitle="Use the backend monthly billing service to prepare a tenant's invoice for a billing period."
                    onClose={closeModal}
                >
                    <form onSubmit={generateMonthlyInvoice} className="space-y-4">
                        {error && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>
                        )}
                        <Field label="Active tenant">
                            <select
                                required
                                value={invoiceForm.customer_id}
                                onChange={(event) => setInvoiceForm({ ...invoiceForm, customer_id: event.target.value })}
                                className={inputClass}
                            >
                                <option value="">Select tenant</option>
                                {tenants.map((tenant) => (
                                    <option key={tenant.id} value={tenant.id}>
                                        {tenant.full_name}
                                        {tenant.unit?.unit_number ? ` · Unit ${tenant.unit.unit_number}` : ''}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Billing period">
                            <input
                                required
                                value={invoiceForm.billing_period}
                                onChange={(event) => setInvoiceForm({ ...invoiceForm, billing_period: event.target.value })}
                                placeholder="YYYY-MM"
                                className={inputClass}
                            />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Invoice date">
                                <input
                                    type="date"
                                    required
                                    value={invoiceForm.invoice_date}
                                    onChange={(event) => setInvoiceForm({ ...invoiceForm, invoice_date: event.target.value })}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Due date" hint="Leave blank to use the backend default.">
                                <input
                                    type="date"
                                    min={invoiceForm.invoice_date}
                                    value={invoiceForm.due_date}
                                    onChange={(event) => setInvoiceForm({ ...invoiceForm, due_date: event.target.value })}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                            The backend decides which rent and water charges are included. If a required meter reading is missing, the server will return an error.
                        </p>
                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                            <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">
                                Cancel
                            </button>
                            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                                {saving && <LoaderCircle size={15} className="animate-spin" />}
                                Generate invoice
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal?.type === 'details' && selectedInvoice && (
                <Modal
                    title={selectedInvoice.invoice_number || 'Invoice details'}
                    subtitle={`${getCustomer(selectedInvoice)} · ${selectedInvoice.billing_period || 'No billing period'}`}
                    onClose={closeModal}
                    wide
                >
                    {error && (
                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>
                    )}
                    {notice && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                            <CheckCircle2 size={16} className="shrink-0" /> {notice}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] text-slate-500">Invoice total</p>
                            <p className="mt-1 text-sm font-bold text-slate-800">{money(selectedInvoice.total_amount)}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3">
                            <p className="text-[11px] text-emerald-700">Amount paid</p>
                            <p className="mt-1 text-sm font-bold text-emerald-800">{money(selectedInvoice.amount_paid)}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-3">
                            <p className="text-[11px] text-amber-700">Balance</p>
                            <p className="mt-1 text-sm font-bold text-amber-800">{money(selectedInvoice.balance)}</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-3">
                            <p className="text-[11px] text-blue-700">Status</p>
                            <div className="mt-2"><StatusBadge status={selectedInvoice.status} /></div>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Invoice items</h3>
                            <p className="mt-1 text-[11px] text-slate-500">Items can only be added while the invoice is a draft.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedInvoice.status !== 'draft' && (
                                <button
                                    type="button"
                                    onClick={() => emailInvoice(selectedInvoice)}
                                    disabled={emailingInvoice}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {emailingInvoice ? (
                                        <LoaderCircle size={14} className="animate-spin" />
                                    ) : (
                                        <Receipt size={14} />
                                    )}
                                    {emailingInvoice ? 'Sending email...' : 'Email Invoice'}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => openPdf(`/invoices/${selectedInvoice.id}/pdf`, `${selectedInvoice.invoice_number}.pdf`)}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <ArrowDownToLine size={14} /> Invoice PDF
                            </button>
                            {selectedInvoice.status !== 'draft' && selectedInvoice.status !== 'paid' && (
                                <button
                                    type="button"
                                    onClick={() => openPayment(selectedInvoice)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                    <CircleDollarSign size={14} /> Record payment
                                </button>
                            )}
                            {selectedInvoice.status !== 'draft' && (
                                <button
                                    type="button"
                                    onClick={() => openPayments(selectedInvoice)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    <CreditCard size={14} /> Payment history
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[560px] text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-3 py-3 font-semibold">Description</th>
                                    <th className="px-3 py-3 text-right font-semibold">Qty</th>
                                    <th className="px-3 py-3 text-right font-semibold">Unit price</th>
                                    <th className="px-3 py-3 text-right font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(selectedInvoice.items || []).map((item) => (
                                    <tr key={item.id}>

                                        <td className="px-3 py-3">
                                            <p className="text-xs font-semibold text-slate-700">
                                                {item.description}
                                            </p>

                                            <p className="mt-1 text-[10px] capitalize text-slate-400">
                                                {item.item_type}
                                            </p>

                                            {item.meter_reading_id != null && (
                                                <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-2">
                                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                                                        Water meter readings
                                                    </p>

                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500">
                                                                Opening
                                                            </p>
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                {item.opening_reading ?? '—'}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] text-slate-500">
                                                                Closing
                                                            </p>
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                {item.closing_reading ?? '—'}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] text-slate-500">
                                                                Consumption
                                                            </p>
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                {item.consumption ?? '—'} units
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {item.reading_date && (
                                                        <p className="mt-2 text-[10px] text-slate-500">
                                                            Reading date: {item.reading_date}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-right text-xs text-slate-600">{item.quantity}</td>
                                        <td className="px-3 py-3 text-right text-xs text-slate-600">{money(item.unit_price)}</td>
                                        <td className="px-3 py-3 text-right text-xs font-semibold text-slate-700">{money(item.amount)}</td>
                                    </tr>
                                ))}
                                {!selectedInvoice.items?.length && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                                            No line items have been added yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan={3} className="px-3 py-3 text-right text-xs font-semibold text-slate-600">Subtotal</td>
                                    <td className="px-3 py-3 text-right text-xs font-bold text-slate-800">{money(selectedInvoice.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-3 pb-3 text-right text-xs text-slate-500">Previous balance</td>
                                    <td className="px-3 pb-3 text-right text-xs text-slate-600">{money(selectedInvoice.previous_balance)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {selectedInvoice.status === 'draft' && (
                        <form onSubmit={addItem} className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                            <h3 className="text-sm font-bold text-slate-800">Add line item</h3>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <Field label="Item type">
                                    <select value={itemForm.item_type} onChange={(event) => setItemForm({ ...itemForm, item_type: event.target.value })} className={inputClass}>
                                        <option value="rent">Rent</option>
                                        <option value="water">Water</option>
                                        <option value="previous_balance">Previous balance</option>
                                        <option value="other">Other</option>
                                    </select>
                                </Field>
                                <Field label="Description">
                                    <input required value={itemForm.description} onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })} placeholder="e.g. October rent" className={inputClass} />
                                </Field>
                                <Field label="Quantity">
                                    <input required type="number" min="0.001" step="0.001" value={itemForm.quantity} onChange={(event) => setItemForm({ ...itemForm, quantity: event.target.value })} className={inputClass} />
                                </Field>
                                <Field label="Unit price (KES)">
                                    <input required type="number" min="0" step="0.01" value={itemForm.unit_price} onChange={(event) => setItemForm({ ...itemForm, unit_price: event.target.value })} className={inputClass} />
                                </Field>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs text-slate-500">
                                    Line total: <strong className="text-slate-800">{money(Number(itemForm.quantity || 0) * Number(itemForm.unit_price || 0))}</strong>
                                </p>
                                <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
                                    Add item
                                </button>
                            </div>
                        </form>
                    )}

                    {selectedInvoice.status === 'draft' && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <p className="max-w-md text-[11px] leading-5 text-slate-500">
                                Finalizing locks the invoice items and makes it available for payment recording.
                            </p>
                            <button
                                type="button"
                                onClick={finalizeInvoice}
                                disabled={saving || !selectedInvoice.items?.length}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                                Finalize invoice
                            </button>
                        </div>
                    )}
                </Modal>
            )}

            {modal?.type === 'payment' && selectedInvoice && (
                <Modal
                    title="Record payment"
                    subtitle={`${selectedInvoice.invoice_number} · Outstanding ${money(selectedInvoice.balance)}`}
                    onClose={closeModal}
                >
                    {error && (
                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>
                    )}
                    <form onSubmit={recordPayment} className="space-y-4">
                        <Field label="Payment amount (KES)">
                            <input
                                type="number"
                                min="0.01"
                                max={Number(selectedInvoice.balance || 0)}
                                step="0.01"
                                required
                                value={paymentForm.amount}
                                onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Payment date">
                                <input
                                    type="date"
                                    required
                                    value={paymentForm.payment_date}
                                    onChange={(event) => setPaymentForm({ ...paymentForm, payment_date: event.target.value })}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Payment method">
                                <select
                                    required
                                    value={paymentForm.payment_method}
                                    onChange={(event) => setPaymentForm({ ...paymentForm, payment_method: event.target.value })}
                                    className={inputClass}
                                >
                                    <option value="mpesa">M-Pesa</option>
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="other">Other</option>
                                </select>
                            </Field>
                        </div>
                        <Field label="Reference number" hint="Optional: M-Pesa code, cheque number, or bank reference.">
                            <input
                                value={paymentForm.reference_number}
                                onChange={(event) => setPaymentForm({ ...paymentForm, reference_number: event.target.value })}
                                placeholder="e.g. QWE123ABC"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Notes">
                            <textarea
                                rows={2}
                                value={paymentForm.notes}
                                onChange={(event) => setPaymentForm({ ...paymentForm, notes: event.target.value })}
                                placeholder="Optional payment notes"
                                className={inputClass}
                            />
                        </Field>
                        <div className="rounded-xl bg-emerald-50 p-3">
                            <p className="text-xs text-emerald-800">
                                Remaining balance after payment:{' '}
                                <strong>{money(Math.max(0, Number(selectedInvoice.balance || 0) - Number(paymentForm.amount || 0)))}</strong>
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                            <button type="button" onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">
                                Cancel
                            </button>
                            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                                {saving && <LoaderCircle size={15} className="animate-spin" />}
                                Record payment
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal?.type === 'payments' && selectedInvoice && (
                <Modal
                    title="Payment history"
                    subtitle={`Recorded payments for ${selectedInvoice.invoice_number}`}
                    onClose={closeModal}
                    wide
                >
                    {error && (
                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>
                    )}
                    {paymentsLoading ? (
                        <div className="flex justify-center gap-2 py-12 text-sm text-slate-500">
                            <LoaderCircle size={18} className="animate-spin" /> Loading payments...
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="py-10 text-center text-sm text-slate-500">
                            No payments have been recorded against this invoice.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[620px] text-left">
                                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold">Method</th>
                                        <th className="px-4 py-3 font-semibold">Reference</th>
                                        <th className="px-4 py-3 text-right font-semibold">Amount</th>
                                        <th className="px-4 py-3 text-right font-semibold">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td className="px-4 py-3 text-xs text-slate-600">{shortDate(payment.payment_date)}</td>
                                            <td className="px-4 py-3 text-xs capitalize text-slate-600">{payment.payment_method}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{payment.reference_number || '—'}</td>
                                            <td className="px-4 py-3 text-right text-xs font-semibold text-slate-800">{money(payment.amount)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openPdf(`/invoices/payments/${payment.id}/receipt`, `RCPT-${String(payment.id).padStart(6, '0')}.pdf`)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                                                >
                                                    <ArrowDownToLine size={13} /> Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="mt-4 flex justify-end">
                        <button type="button" onClick={() => loadPayments(selectedInvoice.id)} disabled={paymentsLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                            <RefreshCw size={14} className={paymentsLoading ? 'animate-spin' : ''} /> Refresh history
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
