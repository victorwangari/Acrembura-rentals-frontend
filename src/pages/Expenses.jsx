import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  LoaderCircle,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
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

const EXPENSE_CATEGORIES = [
  'Rent',
  'Water Supply',
  'Electricity',
  'Internet',
  'Repairs & Maintenance',
  'Salaries & Wages',
  'Transport',
  'Fuel',
  'Cleaning',
  'Office Supplies',
  'Equipment',
  'Licences & Permits',
  'Marketing',
  'Security',
  'Other',
];

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );
  return localDate.toISOString().slice(0, 10);
};

const emptyForm = {
  category: 'Water Supply',
  description: '',
  amount: '',
  expense_date: today(),
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

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const readableMethod = (method) =>
  PAYMENT_METHODS.find((item) => item.value === method)?.label ||
  String(method || 'Other').replaceAll('_', ' ');

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
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

export default function Expenses({ user }) {
  const isOwner = user?.role === 'owner';

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [period, setPeriod] = useState('month');

  const loadExpenses = useCallback(
    async (background = false) => {
      if (!isOwner) return;

      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const result = await apiRequest('/expenses');
        setExpenses(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(err.message || 'Unable to load expenses.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isOwner],
  );

  useEffect(() => {
    if (isOwner) {
      loadExpenses();
    } else {
      setLoading(false);
    }
  }, [isOwner, loadExpenses]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openForm = () => {
    setForm({ ...emptyForm, expense_date: today() });
    setFormError('');
    setNotice('');
    setShowForm(true);
  };

  const submitExpense = async (event) => {
    event.preventDefault();
    setFormError('');
    setNotice('');

    if (!form.category.trim()) {
      setFormError('Please select an expense category.');
      return;
    }

    if (!form.description.trim()) {
      setFormError('Please enter an expense description.');
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }

    if (!form.expense_date) {
      setFormError('Please select the expense date.');
      return;
    }

    setSaving(true);

    try {
      await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category: form.category.trim(),
          description: form.description.trim(),
          amount,
          expense_date: form.expense_date,
          payment_method: form.payment_method,
          reference_number: form.reference_number.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      setShowForm(false);
      setForm(emptyForm);
      setNotice('Expense recorded successfully.');

      if (isOwner) {
        await loadExpenses(true);
      }
    } catch (err) {
      setFormError(err.message || 'Unable to record this expense.');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (expense) => {
    const confirmed = window.confirm(
      `Delete the expense "${expense.description}" (${money(expense.amount)})? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(expense.id);
    setError('');
    setNotice('');

    try {
      await apiRequest(`/expenses/${expense.id}`, {
        method: 'DELETE',
      });

      setExpenses((current) =>
        current.filter((item) => item.id !== expense.id),
      );
      setNotice('Expense deleted successfully.');
    } catch (err) {
      setError(err.message || 'Unable to delete this expense.');
    } finally {
      setDeletingId(null);
    }
  };

  const now = new Date();
  const currentMonth = today().slice(0, 7);
  const currentYear = today().slice(0, 4);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const expenseDate = String(expense.expense_date || '').slice(0, 10);

      const matchesSearch =
        !query ||
        [
          expense.description,
          expense.category,
          expense.reference_number,
          expense.notes,
          expense.id,
          readableMethod(expense.payment_method),
        ].some((value) => String(value || '').toLowerCase().includes(query));

      const matchesCategory =
        categoryFilter === 'all' || expense.category === categoryFilter;

      const matchesMethod =
        methodFilter === 'all' || expense.payment_method === methodFilter;

      const matchesFrom = !dateFrom || expenseDate >= dateFrom;
      const matchesTo = !dateTo || expenseDate <= dateTo;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMethod &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    expenses,
    search,
    categoryFilter,
    methodFilter,
    dateFrom,
    dateTo,
  ]);

  const periodExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const date = String(expense.expense_date || '');

        if (period === 'month') return date.startsWith(currentMonth);
        if (period === 'year') return date.startsWith(currentYear);

        return true;
      }),
    [expenses, period, currentMonth, currentYear],
  );

  const totalForPeriod = periodExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0,
  );

  const currentMonthTotal = expenses
    .filter((expense) =>
      String(expense.expense_date || '').startsWith(currentMonth),
    )
    .reduce((total, expense) => total + Number(expense.amount || 0), 0);

  const allTimeTotal = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0,
  );

  const categoriesUsed = new Set(
    expenses.map((expense) => expense.category),
  ).size;

  const availableCategories = useMemo(
    () =>
      [...new Set([
        ...EXPENSE_CATEGORIES,
        ...expenses.map((expense) => expense.category).filter(Boolean),
      ])].sort((a, b) => a.localeCompare(b)),
    [expenses],
  );

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setMethodFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-orange-600">
            Finance / Expense tracking
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record business spending and keep track of where the money goes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={() => loadExpenses(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          )}

          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
          >
            <Plus size={17} />
            Record expense
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
            aria-label="Dismiss error message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isOwner ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="All-time expenses"
              value={money(allTimeTotal)}
              description={`${expenses.length} recorded expense(s)`}
            />
            <StatCard
              icon={CircleDollarSign}
              label="This month"
              value={money(currentMonthTotal)}
              description="Spending in the current month"
            />
            <StatCard
              icon={Receipt}
              label="Categories used"
              value={categoriesUsed}
              description="Different expense categories"
            />
            <StatCard
              icon={ChevronDown}
              label={period === 'month' ? 'Month total' : period === 'year' ? 'Year total' : 'All-time total'}
              value={money(totalForPeriod)}
              description="Based on the selected period"
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold text-slate-900">Expense history</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Search, filter, and review recorded expenses.
                  </p>
                </div>

                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  aria-label="Summary period"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                >
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                  <option value="all">All time</option>
                </select>
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
                    placeholder="Search description, reference..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  aria-label="Filter by category"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                >
                  <option value="all">All categories</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={methodFilter}
                  onChange={(event) => setMethodFilter(event.target.value)}
                  aria-label="Filter by payment method"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                >
                  <option value="all">All methods</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    aria-label="Expenses from date"
                    className="min-w-0 rounded-xl border border-slate-200 px-2 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                    aria-label="Expenses to date"
                    className="min-w-0 rounded-xl border border-slate-200 px-2 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {(search ||
                categoryFilter !== 'all' ||
                methodFilter !== 'all' ||
                dateFrom ||
                dateTo) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 text-sm font-semibold text-orange-700 hover:text-orange-800"
                >
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
                <LoaderCircle size={22} className="animate-spin text-orange-600" />
                Loading expenses...
              </div>
            ) : expenses.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Receipt size={32} className="mx-auto text-slate-300" />
                <h3 className="mt-3 font-semibold text-slate-900">
                  No expenses recorded yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Record your first expense to start tracking business spending.
                </p>
                <button
                  type="button"
                  onClick={openForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <Plus size={16} />
                  Record first expense
                </button>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Search size={28} className="mx-auto text-slate-300" />
                <h3 className="mt-3 font-semibold text-slate-900">
                  No matching expenses
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Change the search terms or filters and try again.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Date</th>
                      <th className="px-5 py-3.5 font-semibold">Expense</th>
                      <th className="px-5 py-3.5 font-semibold">Category</th>
                      <th className="px-5 py-3.5 font-semibold">Method</th>
                      <th className="px-5 py-3.5 font-semibold">Reference</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Amount</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {dateLabel(expense.expense_date)}
                        </td>
                        <td className="max-w-xs px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {expense.description}
                          </p>
                          {expense.notes && (
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {expense.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {readableMethod(expense.payment_method)}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {expense.reference_number || '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold tabular-nums text-slate-900">
                          {money(expense.amount)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => deleteExpense(expense)}
                            disabled={deletingId === expense.id}
                            aria-label={`Delete expense ${expense.description}`}
                            title="Delete expense"
                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {deletingId === expense.id ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td colSpan={5} className="px-5 py-4 text-right font-semibold text-slate-600">
                        Filtered total
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                        {money(
                          filteredExpenses.reduce(
                            (sum, expense) => sum + Number(expense.amount || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {!loading && expenses.length > 0 && (
              <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
                Showing {filteredExpenses.length} of {expenses.length} expenses.
                All amounts are in Kenyan shillings (KES).
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Receipt size={26} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Record a business expense
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use this form to record business spending. Expense history,
              totals, and deletion are restricted to the owner.
            </p>
            <button
              type="button"
              onClick={openForm}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              <Plus size={17} />
              Record expense
            </button>
          </div>
        </section>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="expense-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Record expense
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the details of the business expense.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close expense form"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitExpense} className="space-y-5 p-5 sm:p-6">
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="expense-category"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="expense-category"
                    required
                    value={form.category}
                    onChange={(event) => updateForm('category', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    {EXPENSE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="expense-description"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="expense-description"
                    type="text"
                    required
                    maxLength={255}
                    value={form.description}
                    onChange={(event) => updateForm('description', event.target.value)}
                    placeholder="e.g. Electricity bill"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="expense-amount"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Amount (KES) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="expense-amount"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => updateForm('amount', event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="expense-date"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Expense date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    required
                    max={today()}
                    value={form.expense_date}
                    onChange={(event) => updateForm('expense_date', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="expense-method"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Payment method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="expense-method"
                    required
                    value={form.payment_method}
                    onChange={(event) => updateForm('payment_method', event.target.value)}
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
                    htmlFor="expense-reference"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Reference number
                  </label>
                  <input
                    id="expense-reference"
                    type="text"
                    maxLength={100}
                    value={form.reference_number}
                    onChange={(event) => updateForm('reference_number', event.target.value)}
                    placeholder="Receipt or transaction reference"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="expense-notes"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Notes
                </label>
                <textarea
                  id="expense-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                  placeholder="Optional additional details..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <LoaderCircle size={17} className="animate-spin" />}
                  {saving ? 'Saving expense...' : 'Save expense'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
