import { useState } from 'react';
import { DollarSign, CreditCard, TrendingUp, AlertCircle, Download, Search, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'failed';

type PaymentRecord = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerType: 'member' | 'tenant' | 'visitor';
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  description: string;
  paymentMethod?: 'card' | 'bank-transfer' | 'cash';
};

const mockPayments: PaymentRecord[] = [
  {
    id: 'PAY-001',
    invoiceNumber: 'INV-2026-001',
    customerName: 'Sarah Johnson',
    customerType: 'member',
    amount: 250.00,
    status: 'paid',
    dueDate: 'May 15, 2026',
    paidDate: 'May 14, 2026',
    description: 'Monthly membership - May 2026',
    paymentMethod: 'card',
  },
  {
    id: 'PAY-002',
    invoiceNumber: 'INV-2026-002',
    customerName: 'TechCorp Solutions',
    customerType: 'tenant',
    amount: 1200.00,
    status: 'paid',
    dueDate: 'May 10, 2026',
    paidDate: 'May 9, 2026',
    description: 'Office space rental - May 2026',
    paymentMethod: 'bank-transfer',
  },
  {
    id: 'PAY-003',
    invoiceNumber: 'INV-2026-003',
    customerName: 'Mike Chen',
    customerType: 'member',
    amount: 300.00,
    status: 'pending',
    dueDate: 'May 20, 2026',
    description: 'Monthly membership + meeting room hours',
  },
  {
    id: 'PAY-004',
    invoiceNumber: 'INV-2026-004',
    customerName: 'Emma Davis',
    customerType: 'member',
    amount: 180.00,
    status: 'overdue',
    dueDate: 'May 5, 2026',
    description: 'Monthly membership - May 2026',
  },
  {
    id: 'PAY-005',
    invoiceNumber: 'INV-2026-005',
    customerName: 'StartupXYZ',
    customerType: 'tenant',
    amount: 850.00,
    status: 'paid',
    dueDate: 'May 12, 2026',
    paidDate: 'May 11, 2026',
    description: 'Dedicated desk package - May 2026',
    paymentMethod: 'card',
  },
  {
    id: 'PAY-006',
    invoiceNumber: 'INV-2026-006',
    customerName: 'James Wilson',
    customerType: 'visitor',
    amount: 45.00,
    status: 'failed',
    dueDate: 'May 16, 2026',
    description: 'Day pass + meeting room (2 hours)',
  },
  {
    id: 'PAY-007',
    invoiceNumber: 'INV-2026-007',
    customerName: 'Lisa Brown',
    customerType: 'member',
    amount: 275.00,
    status: 'pending',
    dueDate: 'May 18, 2026',
    description: 'Monthly membership - May 2026',
  },
];

const statusConfig = {
  paid: {
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  pending: {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  overdue: {
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle,
  },
  failed: {
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
};

const customerTypeColors = {
  member: 'bg-[#ccefeb] text-[#007d6f]',
  tenant: 'bg-purple-100 text-purple-700',
  visitor: 'bg-orange-100 text-orange-700',
};

export function BillingPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: mockPayments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
    pending: mockPayments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    overdue: mockPayments
      .filter((p) => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0),
    totalInvoices: mockPayments.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <DollarSign className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Total Revenue (Paid)</p>
          <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <Clock className="w-8 h-8 text-yellow-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
          <p className="text-3xl font-bold text-gray-900">${stats.pending.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Overdue</p>
          <p className="text-3xl font-bold text-gray-900">${stats.overdue.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <TrendingUp className="w-8 h-8 text-[#009689] mb-2" />
          <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalInvoices}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] outline-none transition-all"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="failed">Failed</option>
            </select>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#009689] text-white rounded-lg hover:bg-[#007d6f] transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Payment Records */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Invoice #</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Payment Method</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment, index) => {
                const StatusIcon = statusConfig[payment.status].icon;
                return (
                  <tr key={`payment-${index}-${payment.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{payment.invoiceNumber}</p>
                      <p className="text-xs text-gray-500">{payment.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{payment.customerName}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${customerTypeColors[payment.customerType]}`}>
                        {payment.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs">{payment.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-bold text-green-600">${payment.amount.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {payment.dueDate}
                      </div>
                      {payment.paidDate && (
                        <p className="text-xs text-gray-500 mt-1">Paid: {payment.paidDate}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${statusConfig[payment.status].color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-xs font-medium capitalize">{payment.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {payment.paymentMethod ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 capitalize">
                            {payment.paymentMethod.replace('-', ' ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-[#e6f7f5] text-[#009689] rounded-lg hover:bg-[#ccefeb] transition-colors text-sm">
                          View
                        </button>
                        {payment.status === 'pending' || payment.status === 'overdue' ? (
                          <button className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm">
                            Mark Paid
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No payment records found</p>
        </div>
      )}

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-gray-900 font-semibold text-lg mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#e6f7f5] rounded-lg">
              <span className="text-sm text-gray-700">Member Payments</span>
              <span className="text-lg font-bold text-[#009689]">
                ${mockPayments.filter((p) => p.customerType === 'member' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700">Tenant Payments</span>
              <span className="text-lg font-bold text-purple-600">
                ${mockPayments.filter((p) => p.customerType === 'tenant' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-gray-700">Visitor Payments</span>
              <span className="text-lg font-bold text-orange-600">
                ${mockPayments.filter((p) => p.customerType === 'visitor' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-gray-900 font-semibold text-lg mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Credit/Debit Card</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {mockPayments.filter((p) => p.paymentMethod === 'card').length} payments
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Bank Transfer</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {mockPayments.filter((p) => p.paymentMethod === 'bank-transfer').length} payments
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Cash</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {mockPayments.filter((p) => p.paymentMethod === 'cash').length} payments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
