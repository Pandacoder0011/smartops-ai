import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  Users,
  MapPin,
  FileSpreadsheet,
  Check,
  RefreshCw,
  ShoppingBag,
  Percent,
  PlusCircle,
  MinusCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { salesService, productsService, customersService, employeesService } from '../services/api';

const Sales = () => {
  // --- State Variables ---
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Lists for dropdown selections in modal
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortBy, setSortBy] = useState('date:desc');

  // Modals & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form states (Multi-step invoice checkout)
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    customer: '',
    employee: '',
    paymentMethod: 'card',
    region: 'North America',
    status: 'completed',
    date: new Date().toISOString().slice(0, 10),
    products: [] // Array of { product: id, quantity: 1, priceAtSale: 0, _productName: '', _maxStock: 0 }
  });
  const [formErrors, setFormErrors] = useState({});

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    salesCount: 0,
    totalProfit: 0,
    marginPercentage: 0
  });

  // --- Search Debouncing ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // --- Fetch Sales Data ---
  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        paymentMethod: paymentFilter,
        region: regionFilter,
        sort: sortBy
      };
      const response = await salesService.getAll(params);
      if (response.success) {
        setSales(response.data);
        setTotalSales(response.pagination.total);
        setTotalPages(response.pagination.pages);

        // Update local stats from sales database
        calculateStats();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load transaction invoices 🛡️');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [currentPage, debouncedSearch, statusFilter, paymentFilter, regionFilter, sortBy]);

  const calculateStats = async () => {
    try {
      const response = await salesService.getAll({ limit: 1000 });
      if (response.success) {
        const allItems = response.data;
        const total = allItems.length;
        const revenue = allItems.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const profit = allItems.reduce((sum, s) => sum + (s.profit || 0), 0);
        const margin = revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0;
        
        setStats({
          totalRevenue: revenue,
          salesCount: total,
          totalProfit: profit,
          marginPercentage: margin
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Load Form Options (Products, Customers, Employees) ---
  const loadFormOptions = async () => {
    try {
      const [pRes, cRes, eRes] = await Promise.all([
        productsService.getAll({ limit: 100, status: 'active' }),
        customersService.getAll({ limit: 100 }),
        employeesService.getAll({ limit: 100 })
      ]);
      
      if (pRes.success) setProductsList(pRes.data);
      if (cRes.success) setCustomersList(cRes.data);
      if (eRes.success) setEmployeesList(eRes.data);
    } catch (e) {
      console.error('Failed to pre-fetch drop-down resources', e);
    }
  };

  useEffect(() => {
    loadFormOptions();
  }, []);

  // --- Form Auto-Save Draft ---
  useEffect(() => {
    if (isModalOpen) {
      localStorage.setItem('smartops_sale_draft', JSON.stringify(formData));
    }
  }, [formData, isModalOpen]);

  const loadDraft = () => {
    const draft = localStorage.getItem('smartops_sale_draft');
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
        toast.success('Form draft restored 📝');
      } catch (e) {
        console.error(e);
      }
    } else {
      toast.error('No draft found to restore 🔍');
    }
  };

  // --- Action Handlers ---
  const handleSort = (column) => {
    const [field, order] = sortBy.split(':');
    if (field === column) {
      setSortBy(`${column}:${order === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setSortBy(`${column}:asc`);
    }
    setCurrentPage(1);
  };

  const openFormModal = () => {
    setFormStep(1);
    setFormErrors({});
    setFormData({
      customer: '',
      employee: '',
      paymentMethod: 'card',
      region: 'North America',
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
      products: []
    });
    setIsModalOpen(true);
  };

  // Line Item Handlers
  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { product: '', quantity: 1, priceAtSale: 0, _productName: '', _maxStock: 0 }]
    }));
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateLineItem = (index, key, val) => {
    const newProducts = [...formData.products];
    if (key === 'product') {
      const selected = productsList.find(p => p._id === val);
      if (selected) {
        newProducts[index] = {
          product: val,
          quantity: 1,
          priceAtSale: selected.price,
          _productName: selected.name,
          _maxStock: selected.stock
        };
      }
    } else {
      newProducts[index][key] = val;
    }
    setFormData(prev => ({ ...prev, products: newProducts }));
  };

  const calculateInvoiceTotal = () => {
    return formData.products.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customer) errors.customer = 'Please select a customer';
    if (!formData.employee) errors.employee = 'Please select a sales associate';
    if (!formData.region) errors.region = 'Please specify sales region';
    
    if (formData.products.length === 0) {
      errors.products = 'Invoice must contain at least one line item';
    } else {
      const productErrors = formData.products.map((item, idx) => {
        if (!item.product) return `Item ${idx+1}: Choose a product`;
        if (item.quantity > item._maxStock) return `Item ${idx+1}: Stock insufficient (Available: ${item._maxStock})`;
        if (item.quantity <= 0) return `Item ${idx+1}: Quantity must be at least 1`;
        return null;
      }).filter(Boolean);
      
      if (productErrors.length > 0) {
        errors.products = productErrors.join('. ');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors 🚨');
      return;
    }

    const payload = {
      customer: formData.customer,
      employee: formData.employee,
      paymentMethod: formData.paymentMethod,
      region: formData.region,
      status: formData.status,
      date: formData.date,
      products: formData.products.map(p => ({
        product: p.product,
        quantity: parseInt(p.quantity),
        priceAtSale: parseFloat(p.priceAtSale)
      }))
    };

    try {
      const res = await salesService.create(payload);
      if (res.success) {
        toast.success('Sale registered successfully 🚀');
        localStorage.removeItem('smartops_sale_draft');
        setIsModalOpen(false);
        fetchSales();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Invoice calculation mismatch';
      toast.error(errMsg);
    }
  };

  const handleCancelSale = async (id) => {
    if (window.confirm('Mark this sale as cancelled? Stock levels will automatically be refunded.')) {
      try {
        const res = await salesService.update(id, { status: 'cancelled' });
        if (res.success) {
          toast.success('Invoice cancelled and stocks refunded 🔄');
          fetchSales();
        }
      } catch (e) {
        toast.error('Failed to cancel invoice');
      }
    }
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm('Delete this transaction? This removes data permanently from reports.')) {
      try {
        const res = await salesService.delete(id);
        if (res.success) {
          toast.success('Transaction record purged 🗑️');
          fetchSales();
        }
      } catch (e) {
        toast.error('Purging record failed');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Invoice ID', 'Customer', 'Employee', 'Date', 'Payment Method', 'Region', 'Total Amount', 'Profit', 'Status'];
    const rows = sales.map(s => [
      s._id,
      s.customer?.name || 'Walk-In',
      s.employee?.userId?.name || 'System',
      s.date,
      s.paymentMethod,
      s.region,
      s.totalAmount,
      s.profit,
      s.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export completed! 📊');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-zinc-100"
    >
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-emerald-400" /> Sales Ledger
          </h2>
          <p className="text-sm text-zinc-400">Track client invoices, regional sales totals, payment categories, and net transaction profits.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportToCSV()}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-lg text-xs font-semibold shadow-md cursor-pointer transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>
          
          <button
            onClick={() => openFormModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg hover:shadow-emerald-600/20 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Sale
          </button>
        </div>
      </div>

      {/* --- Stats Row --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Sales Revenue</div>
          <div className="text-3xl font-bold text-white mt-2">
            ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Gross generated income
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Invoices Registered</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
            {stats.salesCount}
            <span className="text-xs font-normal text-zinc-500">transactions</span>
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-indigo-450" /> Logged sales receipts
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider text-violet-400 font-semibold">Net Transactions Profit</div>
          <div className="text-3xl font-bold text-white mt-2">
            ${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-violet-400" /> Revenue minus warehouse costs
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sales Profit Margin</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline">
            {stats.marginPercentage}
            <span className="text-sm font-semibold ml-1 text-zinc-400">%</span>
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-amber-400" /> Average margin efficiency
          </div>
        </div>
      </div>

      {/* --- Filters Controls --- */}
      <div className="p-4 rounded-xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Region, Payment method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-zinc-900 border border-zinc-700/60 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {search !== debouncedSearch && (
            <RefreshCw className="absolute right-3 top-3 w-3.5 h-3.5 text-emerald-400 animate-spin" />
          )}
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={regionFilter}
            onChange={(e) => { setRegionFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Regions</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Asia-Pacific">Asia-Pacific</option>
            <option value="South America">South America</option>
            <option value="Africa">Africa</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Payments</option>
            <option value="card">Credit Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* --- Advanced Data Table --- */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/30 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                  Invoice Date & ID <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-zinc-500" />
                </th>
                <th className="p-4">Customer</th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('region')}>Region</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('totalAmount')}>Invoice Total</th>
                <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('profit')}>Net Profit</th>
                <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
                <th className="p-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-400">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-500 mb-2" />
                    <span>Querying transactional database logs...</span>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="font-semibold text-white">No sales transactions logged</p>
                    <p className="text-xs text-zinc-500 mt-1">Add a new invoice to populate details</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-zinc-800/20 transition-all">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-emerald-400" onClick={() => { setSelectedSale(sale); setIsDrawerOpen(true); }}>
                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                        INV-{sale._id.slice(-6).toUpperCase()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{new Date(sale.date).toLocaleString()}</div>
                    </td>
                    
                    <td className="p-4">
                      <div className="font-medium text-zinc-200">{sale.customer?.name || 'Walk-In Customer'}</div>
                      <div className="text-xs text-zinc-500">{sale.customer?.email || 'N/A'}</div>
                    </td>

                    <td className="p-4 text-xs text-zinc-400 flex items-center gap-1 mt-2.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {sale.region}
                    </td>

                    <td className="p-4 text-xs text-zinc-300 font-mono">
                      <span className="flex items-center gap-1 capitalize">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                        {sale.paymentMethod?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-4 text-right font-bold text-white">
                      ${sale.totalAmount.toFixed(2)}
                    </td>

                    <td className="p-4 text-right font-mono text-emerald-400 text-xs">
                      +${sale.profit.toFixed(2)}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium border select-none ${
                        sale.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : sale.status === 'cancelled'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {sale.status?.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedSale(sale); setIsDrawerOpen(true); }}
                          className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded transition"
                          title="View receipt invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sale.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelSale(sale._id)}
                            className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition"
                            title="Cancel invoice (Stock Refund)"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSale(sale._id)}
                          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                          title="Purge record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Showing <strong className="text-white">{sales.length}</strong> of{' '}
            <strong className="text-white">{totalSales}</strong> sales invoices
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800/50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-zinc-300">
              Page <strong className="text-white">{currentPage}</strong> of{' '}
              <strong className="text-white">{totalPages || 1}</strong>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800/50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MULTI-STEP CHECKOUT / NEW SALE MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                    Record Sales Transaction Invoice
                  </h3>
                  <p className="text-xs text-zinc-500">Step {formStep} of 2 - Transaction Metadata & Products Checkout</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-zinc-900 w-full flex">
                <div className={`h-full bg-emerald-600 transition-all duration-300 ${formStep === 1 ? 'w-1/2' : 'w-full'}`} />
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => loadDraft()}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-350"
                  >
                    Restore Unsaved Checkout Draft?
                  </button>
                </div>

                {formStep === 1 ? (
                  // --- STEP 1: Core Parameters ---
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Link Customer *</label>
                        <select
                          value={formData.customer}
                          onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-emerald-500 ${
                            formErrors.customer ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                        >
                          <option value="">Select Customer profile</option>
                          {customersList.map(c => (
                            <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                          ))}
                        </select>
                        {formErrors.customer && <p className="text-[11px] text-rose-500 mt-1">{formErrors.customer}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Link Employee Associate *</label>
                        <select
                          value={formData.employee}
                          onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-emerald-500 ${
                            formErrors.employee ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                        >
                          <option value="">Select Employee associate</option>
                          {employeesList.map(emp => (
                            <option key={emp._id} value={emp._id}>
                              {emp.userId?.name || 'User Account Deleted'} - {emp.position}
                            </option>
                          ))}
                        </select>
                        {formErrors.employee && <p className="text-[11px] text-rose-500 mt-1">{formErrors.employee}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Invoice Date</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Region *</label>
                        <select
                          value={formData.region}
                          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="North America">North America</option>
                          <option value="Europe">Europe</option>
                          <option value="Asia-Pacific">Asia-Pacific</option>
                          <option value="South America">South America</option>
                          <option value="Africa">Africa</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Payment Method</label>
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="card">Credit Card</option>
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Initial Invoice Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="completed">Completed (Deducts stock)</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // --- STEP 2: Checkout Line Items ---
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Line Items List</span>
                      <button
                        type="button"
                        onClick={addLineItem}
                        className="text-xs font-semibold text-emerald-450 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" /> Add Product Item
                      </button>
                    </div>
                    
                    {formData.products.length === 0 ? (
                      <div className="p-6 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                        No products added yet. Click "Add Product Item" above to begin checkout.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.products.map((item, idx) => (
                          <div key={idx} className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl flex items-center gap-3 relative">
                            {/* Product Selection */}
                            <div className="flex-1">
                              <label className="text-[10px] text-zinc-500 block mb-0.5">Select Product</label>
                              <select
                                value={item.product}
                                onChange={(e) => updateLineItem(idx, 'product', e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-zinc-300 focus:outline-none"
                              >
                                <option value="">Select product...</option>
                                {productsList.map(p => (
                                  <option key={p._id} value={p._id} disabled={p.stock === 0}>
                                    {p.name} (${p.price.toFixed(2)} - Stock: {p.stock})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Quantity */}
                            <div className="w-20">
                              <label className="text-[10px] text-zinc-500 block mb-0.5">Qty</label>
                              <input
                                type="number"
                                min="1"
                                max={item._maxStock || 1000}
                                value={item.quantity}
                                onChange={(e) => updateLineItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1 text-xs text-right text-zinc-300"
                              />
                            </div>

                            {/* Max stock preview */}
                            <div className="w-16 text-center text-zinc-500 text-[10px] self-end pb-1.5">
                              Stock: {item._maxStock || 0}
                            </div>

                            {/* Price preview */}
                            <div className="w-20 text-right self-end pb-1 font-bold text-white text-xs">
                              ${(item.priceAtSale * item.quantity).toFixed(2)}
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              className="text-zinc-500 hover:text-rose-500 p-1 self-end mb-0.5"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {formErrors.products && <p className="text-[11px] text-rose-500 mt-1">{formErrors.products}</p>}

                    {/* Total invoice sum preview */}
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Estimated Invoice Total</span>
                      <strong className="text-xl font-bold text-emerald-450">${calculateInvoiceTotal().toFixed(2)}</strong>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-zinc-900/30 border-t border-zinc-850 flex items-center justify-between">
                <div>
                  {formStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold hover:bg-zinc-900 cursor-pointer transition"
                    >
                      Back
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  {formStep === 1 ? (
                    <button
                      type="button"
                      disabled={!formData.customer || !formData.employee}
                      onClick={() => setFormStep(2)}
                      className="px-4 py-2 bg-emerald-650 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      Line Items Checkout
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={formData.products.length === 0}
                      onClick={handleFormSubmit}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      Submit Invoice Transaction
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TRANSACTION INVOICE RECEIPT DRAWER --- */}
      <AnimatePresence>
        {isDrawerOpen && selectedSale && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsDrawerOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 text-zinc-100 flex flex-col shadow-2xl h-full"
              >
                {/* Header */}
                <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-450">Transaction Invoice Receipt</span>
                    <h3 className="text-lg font-bold text-white mt-1">Invoice Receipt Details</h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Receipt Sheet */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status Box */}
                  <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Invoice ID:</span>
                      <strong className="font-mono text-white">INV-{selectedSale._id.toUpperCase()}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Date Logged:</span>
                      <span className="text-zinc-300">{new Date(selectedSale.date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Payment Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedSale.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-450'
                      }`}>
                        {selectedSale.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Associated profiles */}
                  <div className="space-y-3 text-xs">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transaction Affiliates</h4>
                    <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-500" />
                        <div>
                          <span className="text-zinc-500 text-[10px] block">Customer Client</span>
                          <span className="font-semibold text-white">{selectedSale.customer?.name || 'Walk-In Customer'}</span>
                        </div>
                      </div>
                      <div className="border-t border-zinc-800/80 my-1 pt-1.5 flex items-center gap-2">
                        <Users className="w-4 h-4 text-zinc-500" />
                        <div>
                          <span className="text-zinc-500 text-[10px] block">Sales Representative</span>
                          <span className="font-semibold text-white">
                            {selectedSale.employee?.userId?.name || 'System Auto Ledger'}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-zinc-800/80 my-1 pt-1.5 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-zinc-500" />
                        <div>
                          <span className="text-zinc-500 text-[10px] block">Sales Region</span>
                          <span className="font-semibold text-zinc-350">{selectedSale.region}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Purchased Items List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invoiced Products</h4>
                    <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg space-y-3 text-xs">
                      {selectedSale.products?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white block">{item.product?.name || 'Deleted Product Catalog Item'}</span>
                            <span className="text-[10px] text-zinc-500">Qty: {item.quantity} × ${item.priceAtSale?.toFixed(2)}</span>
                          </div>
                          <span className="font-mono text-zinc-350 font-bold">${(item.quantity * item.priceAtSale).toFixed(2)}</span>
                        </div>
                      ))}
                      
                      <div className="border-t border-zinc-800/80 pt-3 flex justify-between items-center font-bold text-sm">
                        <span className="text-zinc-400">Total Invoice Amount</span>
                        <span className="text-white">${selectedSale.totalAmount?.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Net Estimated Margin Profit</span>
                        <span className="text-emerald-450 font-semibold">+${selectedSale.profit?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transaction log</h4>
                    <div className="space-y-3 border-l-2 border-zinc-800 pl-4 ml-2 text-xs">
                      <div className="relative">
                        <div className="absolute -left-[22px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-zinc-950" />
                        <span className="text-zinc-500 text-[10px] block">{new Date(selectedSale.date).toLocaleString()}</span>
                        <p className="text-zinc-300 font-medium">Invoice registered with state "{selectedSale.status}".</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[22px] top-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-zinc-950" />
                        <span className="text-zinc-500 text-[10px] block">{new Date(selectedSale.createdAt).toLocaleString()}</span>
                        <p className="text-zinc-300 font-medium">Customer loyalty multiplier parameters computed.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-6 bg-zinc-900/40 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Print Invoice Sheet
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedSale.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          handleCancelSale(selectedSale._id);
                        }}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Cancel Invoice
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleDeleteSale(selectedSale._id);
                      }}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Delete Log
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sales;
