import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { apiRequest } from '../api/client';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'bank', label: 'Bank' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  invoice_id: '',
  amount: '',
  payment_date: today(),
  payment_method: 'mpesa',
  reference_number: '',
  notes: '',
};

const money = (value) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const dateLabel = (value) => {
  if (!value) return '—';

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const normalise = (value) => String(value ?? '').toLowerCase();

function StatusBadge({ status }) {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    partially_paid: 'bg-amber-50 text-amber-700 ring-amber-200',
    unpaid: 'bg-rose-50 text-rose-700 ring-rose-200',
    draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  };

  const label = {
    paid: 'Paid',
    partially_paid: 'Partially paid',
    unpaid: 'Unpaid',
    draft: 'Draft',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles.draft
      }`}
    >
      {label[status] || String(status || 'Unknown').replaceAll('_', ' ')}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function Payments() {
  const [invoices, setInvoices] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [waterCustomers, setWaterCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(null);

  const getCustomerName = useCallback(
    (invoice) => {
      const tenant = tenants.find(
        (item) => Number(item.id) === Number(invoice.tenant_id),
      );

      const customer = waterCustomers.find(
        (item) => Number(item.id) === Number(invoice.water_customer_id),
      );

      return (
        tenant?.full_name ||
        tenant?.name ||
        customer?.full_name ||
        customer?.name ||
        (invoice.tenant_id
          ? `Tenant #${invoice.tenant_id}`
          : invoice.water_customer_id
            ? `Water customer #${invoice.water_customer_id}`
            : 'Customer not linked')
      );
    },
    [tenants, waterCustomers],
  );

  const loadData = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const [invoiceResult, tenantResult, customerResult] =
        await Promise.all([
          apiRequest('/invoices'),
          apiRequest('/tenants'),
          apiRequest('/water-customers?status=active'),
        ]);

      const invoiceRows = Array.isArray(invoiceResult.data)
        ? invoiceResult.data
        : [];
      const tenantRows = Array.isArray(tenantResult.data)
        ? tenantResult.data
        : [];
      const customerRows = Array.isArray(customerResult.data)
        ? customerResult.data
        : [];

      setInvoices(invoiceRows);
      setTenants(tenantRows);
      setWaterCustomers(customerRows);

      const eligibleInvoices = invoiceRows.filter(
        (invoice) =>
          invoice.status !== 'draft' &&
          Number(invoice.amount_paid || 0) > 0,
      );

      const historyResults = await Promise.allSettled(
        eligibleInvoices.map(async (invoice) => {
          const result = await apiRequest(
            `/invoices/${invoice.id}/payments`,
          );

          const rows = Array.isArray(result.data) ? result.data : [];

          return rows.map((payment) => ({
            ...payment,
            invoice_number: invoice.invoice_number,
            invoice_status: invoice.status,
            invoice_balance: invoice.balance,
            customer_name:
              tenantRows.find(
                (item) => Number(item.id) === Number(invoice.tenant_id),
              )?.full_name ||
              tenantRows.find(
                (item) => Number(item.id) === Number(invoice.tenant_id),
              )?.name ||
              customerRows.find(
                (item) =>
                  Number(item.id) === Number(invoice.water_customer_id),
              )?.full_name ||
              customerRows.find(
                (item) =>
                  Number(item.id) === Number(invoice.water_customer_id),
              )?.name ||
              (invoice.tenant_id
                ? `Tenant #${invoice.tenant_id}`
                : invoice.water_customer_id
                  ? `Water customer #${invoice.water_customer_id}`
                  : 'Customer not linked'),
          }));
        }),
      );

      const failedRequests = historyResults.filter(
        (result) => result.status === 'rejected',
      );

      const allTransactions = historyResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)
        .sort(
          (a, b) =>
            new Date(b.payment_date || b.created_at || 0).getTime() -
            new Date(a.payment_date || a.created_at || 0).getTime(),
        );

      setTransactions(allTransactions);

      if (failedRequests.length > 0) {
        setError(
          `Payment history could not be loaded for ${failedRequests.length} invoice(s). Other transactions are displayed.`,
        );
      }
    } catch (err) {
      setError(err.message || 'Unable to load payment information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const outstandingInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.status !== 'draft' &&
          invoice.status !== 'paid' &&
          Number(invoice.balance || 0) > 0,
      ),
    [invoices],
  );

  const totalCollected = useMemo(
    () =>
      transactions.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0,
      ),
    [transactions],
  );

  const outstandingTotal = useMemo(
    () =>
      outstandingInvoices.reduce(
        (total, invoice) => total + Number(invoice.balance || 0),
        0,
      ),
    [outstandingInvoices],
  );

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((payment) => {
      const matchesSearch =
        !query ||
        [
          payment.customer_name,
          payment.invoice_number,
          payment.reference_number,
          payment.payment_method,
          payment.id,
          payment.notes,
        ].some((value) => normalise(value).includes(query));

      const matchesMethod =
        methodFilter === 'all' || payment.payment_method === methodFilter;

      const paymentDate = String(
        payment.payment_date || payment.created_at || '',
      ).slice(0, 10);

      const matchesFrom = !dateFrom || paymentDate >= dateFrom;
      const matchesTo = !dateTo || paymentDate <= dateTo;

      return matchesSearch && matchesMethod && matchesFrom && matchesTo;
    });
  }, [transactions, search, methodFilter, dateFrom, dateTo]);

  const selectedInvoice = outstandingInvoices.find(
    (invoice) => String(invoice.id) === String(form.invoice_id),
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openPaymentModal = () => {
    setForm({
      ...emptyForm,
      invoice_id: outstandingInvoices[0]
        ? String(outstandingInvoices[0].id)
        : '',
      amount: outstandingInvoices[0]
        ? String(outstandingInvoices[0].balance || '')
        : '',
    });
    setFormError('');
    setNotice('');
    setShowModal(true);
  };

  const handleInvoiceChange = (invoiceId) => {
    const invoice = outstandingInvoices.find(
      (item) => String(item.id) === String(invoiceId),
    );

    setForm((current) => ({
      ...current,
      invoice_id: invoiceId,
      amount: invoice ? String(invoice.balance || '') : '',
    }));
  };

  const recordPayment = async (event) => {
    event.preventDefault();
    setFormError('');
    setNotice('');

    if (!form.invoice_id) {
      setFormError('Please select an outstanding invoice.');
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter a valid payment amount greater than zero.');
      return;
    }

    if (amount > Number(selectedInvoice?.balance || 0)) {
      setFormError('The payment cannot exceed the outstanding balance.');
      return;
    }

    setSaving(true);

    try {
      const result = await apiRequest(
        `/invoices/${form.invoice_id}/payments`,
        {
          method: 'POST',
          body: JSON.stringify({
            amount,
            payment_date: form.payment_date,
            payment_method: form.payment_method,
            reference_number: form.reference_number.trim() || null,
            notes: form.notes.trim() || null,
          }),
        },
      );

      const paymentId = result.data?.payment?.id;

      setShowModal(false);
      setNotice(
        paymentId
          ? `Payment recorded successfully. Transaction #${paymentId}.`
          : 'Payment recorded successfully.',
      );

      await loadData(true);
    } catch (err) {
      setFormError(err.message || 'Unable to record payment.');
    } finally {
      setSaving(false);
    }
  };

  const downloadReceipt = async (payment) => {
    setReceiptLoading(payment.id);
    setError('');

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const token = localStorage.getItem('acrembura_access_token');

      const response = await fetch(
        `${baseUrl}/invoices/payments/${payment.id}/receipt`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        },
      );

      if (!response.ok) {
        let message = 'Unable to download the receipt.';

        try {
          const payload = await response.json();
          message = payload.message || message;
        } catch {
          // Keep the default message for non-JSON errors.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = `RCPT-${String(payment.id).padStart(6, '0')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Unable to download the receipt.');
    } finally {
      setReceiptLoading(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setMethodFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <LoaderCircle className="animate-spin text-orange-600" size={30} />
        <span className="ml-3 text-sm text-slate-500">
          Loading payments...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-orange-600">
            Finance / Transactions
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Payments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record invoice payments, track collections, and download receipts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openPaymentModal}
            disabled={outstandingInvoices.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Record payment
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{notice}</p>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="ml-auto"
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total collected"
          value={money(totalCollected)}
          description="Payments in the loaded transaction history"
        />
        <StatCard
          icon={Receipt}
          label="Transactions"
          value={transactions.length.toLocaleString('en-KE')}
          description="Recorded invoice payments"
        />
        <StatCard
          icon={CreditCard}
          label="Outstanding balance"
          value={money(outstandingTotal)}
          description={`${outstandingInvoices.length} invoice(s) awaiting payment`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Fully paid invoices"
          value={invoices.filter((invoice) => invoice.status === 'paid').length}
          description="Invoices with no remaining balance"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-bold text-slate-900">Payment history</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search transactions and download payment receipts.
              </p>
            </div>
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {filteredTransactions.length}
              </span>{' '}
              of {transactions.length} transactions
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, invoice, reference..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
            >
              <option value="all">All payment methods</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              aria-label="Payment date from"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              aria-label="Payment date to"
              min={dateFrom || undefined}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
            />
          </div>

          {(search || methodFilter !== 'all' || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Clear filters
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Receipt size={25} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No payments recorded yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Once a payment is recorded against an invoice, it will appear
              here with its details and downloadable receipt.
            </p>
            {outstandingInvoices.length > 0 && (
              <button
                type="button"
                onClick={openPaymentModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
              >
                <Plus size={16} />
                Record first payment
              </button>
            )}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Search size={28} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-900">
              No matching transactions
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Transaction</th>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Invoice</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Method</th>
                  <th className="px-5 py-3.5 font-semibold">Reference</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3.5 font-semibold">Invoice status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      PAY-{String(payment.id).padStart(5, '0')}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {payment.customer_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {payment.notes || 'No notes'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {payment.invoice_number || `Invoice #${payment.invoice_id}`}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {dateLabel(payment.payment_date || payment.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold capitalize text-slate-700">
                        {String(payment.payment_method || 'other').replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {payment.reference_number || '—'}
                    </td>
                    <td className="px-5 py-4 text-right font-bold tabular-nums text-slate-900">
                      {money(payment.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={payment.invoice_status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => downloadReceipt(payment)}
                        disabled={receiptLoading === payment.id}
                        title="Download PDF receipt"
                        aria-label={`Download receipt for payment ${payment.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-60"
                      >
                        {receiptLoading === payment.id ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <ArrowDownToLine size={15} />
                        )}
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowModal(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="payment-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Record payment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record money received against an existing invoice.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close payment form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={recordPayment} className="space-y-5 p-5 sm:p-6">
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {formError}
                </div>
              )}

              {outstandingInvoices.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  There are no outstanding finalized invoices available for
                  payment.
                </div>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="payment-invoice"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Invoice <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="payment-invoice"
                      required
                      value={form.invoice_id}
                      onChange={(event) =>
                        handleInvoiceChange(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">Select an invoice</option>
                      {outstandingInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number || `Invoice #${invoice.id}`} —{' '}
                          {getCustomerName(invoice)} — Balance:{' '}
                          {money(invoice.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedInvoice && (
                    <div className="grid gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Customer</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {getCustomerName(selectedInvoice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Invoice total</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {money(selectedInvoice.total_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Balance due</p>
                        <p className="mt-1 text-sm font-bold text-orange-700">
                          {money(selectedInvoice.balance)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="payment-amount"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Amount (KES) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="payment-amount"
                        type="number"
                        required
                        min="0.01"
                        max={selectedInvoice?.balance || undefined}
                        step="0.01"
                        value={form.amount}
                        onChange={(event) =>
                          updateForm('amount', event.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      />
                      {selectedInvoice && (
                        <button
                          type="button"
                          onClick={() =>
                            updateForm(
                              'amount',
                              String(selectedInvoice.balance || ''),
                            )
                          }
                          className="mt-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800"
                        >
                          Use full outstanding balance
                        </button>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="payment-date"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Payment date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="payment-date"
                        type="date"
                        required
                        max={today()}
                        value={form.payment_date}
                        onChange={(event) =>
                          updateForm('payment_date', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="payment-method"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Payment method <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="payment-method"
                        required
                        value={form.payment_method}
                        onChange={(event) =>
                          updateForm('payment_method', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="payment-reference"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Reference number
                      </label>
                      <input
                        id="payment-reference"
                        type="text"
                        maxLength={120}
                        value={form.reference_number}
                        onChange={(event) =>
                          updateForm('reference_number', event.target.value)
                        }
                        placeholder="M-Pesa code, bank reference..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="payment-notes"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Notes
                    </label>
                    <textarea
                      id="payment-notes"
                      rows={3}
                      maxLength={1000}
                      value={form.notes}
                      onChange={(event) =>
                        updateForm('notes', event.target.value)
                      }
                      placeholder="Optional payment notes..."
                      className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || outstandingInvoices.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <LoaderCircle size={17} className="animate-spin" />}
                  {saving ? 'Recording payment...' : 'Save payment'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
