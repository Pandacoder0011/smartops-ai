import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Award,
  DollarSign,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
  Check,
  CheckSquare,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { customersService, salesService } from '../services/api';

const Customers = () => {
  // --- State Variables ---
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt:desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    contact: true,
    location: true,
    segment: true,
    purchases: true,
    loyalty: true
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Inline editing state
  const [inlineEditField, setInlineEditField] = useState(null); // { id, field }
  const [inlineEditValue, setInlineEditValue] = useState('');

  // Modals & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form states (Multi-step)
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    totalPurchases: '0',
    loyaltyPoints: '0',
    segment: 'new'
  });
  const [formErrors, setFormErrors] = useState({});

  // Drawer related sales
  const [relatedSales, setRelatedSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalCount: 0,
    vipCount: 0,
    newCount: 0,
    totalLoyalty: 0
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

  // --- Fetch Data ---
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: debouncedSearch,
        segment: segmentFilter,
        sort: sortBy
      };
      const response = await customersService.getAll(params);
      if (response.success) {
        setCustomers(response.data);
        setTotalCustomers(response.pagination.total);
        setTotalPages(response.pagination.pages);

        // Update local stats metrics
        calculateStats();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load customers 🛡️');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'SmartOps AI - Customer Directory';
    fetchCustomers();
  }, [currentPage, debouncedSearch, segmentFilter, sortBy]);

  const calculateStats = async () => {
    try {
      const response = await customersService.getAll({ limit: 1000 });
      if (response.success) {
        const allItems = response.data;
        const total = allItems.length;
        const vip = allItems.filter(c => c.segment === 'vip').length;
        const newReg = allItems.filter(c => c.segment === 'new').length;
        const loyalty = allItems.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
        
        setStats({
          totalCount: total,
          vipCount: vip,
          newCount: newReg,
          totalLoyalty: loyalty
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Form Auto-Save Draft ---
  useEffect(() => {
    if (isModalOpen && modalMode === 'add') {
      localStorage.setItem('smartops_customer_draft', JSON.stringify(formData));
    }
  }, [formData, isModalOpen, modalMode]);

  const loadDraft = () => {
    const draft = localStorage.getItem('smartops_customer_draft');
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

  const handleBulkSelect = (e) => {
    if (e.target.checked) {
      setSelectedIds(customers.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleRowSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} customers?`)) {
      try {
        const res = await customersService.bulkDelete(selectedIds);
        if (res.success) {
          toast.success(res.message);
          setSelectedIds([]);
          fetchCustomers();
        }
      } catch (e) {
        toast.error('Bulk delete failed 🛡️');
      }
    }
  };

  // --- Inline Edit handlers ---
  const startInlineEdit = (customer, field, currentValue) => {
    setInlineEditField({ id: customer._id, field });
    setInlineEditValue(currentValue);
  };

  const saveInlineEdit = async (id, field) => {
    try {
      let value = inlineEditValue;
      if (field === 'loyaltyPoints' || field === 'totalPurchases') {
        value = parseFloat(value);
        if (isNaN(value) || value < 0) {
          toast.error('Invalid number input 🚨');
          return;
        }
      }

      const res = await customersService.update(id, { [field]: value });
      if (res.success) {
        toast.success('Customer updated inline ⚡');
        setInlineEditField(null);
        fetchCustomers();
      }
    } catch (e) {
      toast.error('Failed to update field 🛡️');
    }
  };

  // --- Details Drawer and transactions ---
  const openDetailsDrawer = async (customer) => {
    setSelectedCustomer(customer);
    setIsDrawerOpen(true);
    setSalesLoading(true);
    try {
      const res = await salesService.getAll({ limit: 50 });
      if (res.success) {
        const filtered = res.data.filter(sale => sale.customer && sale.customer._id === customer._id);
        setRelatedSales(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalesLoading(false);
    }
  };

  // --- Add/Edit Modal Handlers ---
  const openFormModal = (mode, customer = null) => {
    setModalMode(mode);
    setFormStep(1);
    setFormErrors({});
    if (mode === 'edit' && customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: {
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          zip: customer.address?.zip || ''
        },
        totalPurchases: customer.totalPurchases || 0,
        loyaltyPoints: customer.loyaltyPoints || 0,
        segment: customer.segment || 'new'
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zip: ''
        },
        totalPurchases: '0',
        loyaltyPoints: '0',
        segment: 'new'
      });
    }
    setIsModalOpen(true);
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Customer name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please add a valid email';
    }
    
    const loyalty = parseInt(formData.loyaltyPoints);
    if (isNaN(loyalty) || loyalty < 0) errors.loyaltyPoints = 'Loyalty points cannot be negative';

    const purchases = parseFloat(formData.totalPurchases);
    if (isNaN(purchases) || purchases < 0) errors.totalPurchases = 'Purchases count cannot be negative';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors 🚨');
      return;
    }

    const submissionData = {
      ...formData,
      loyaltyPoints: parseInt(formData.loyaltyPoints),
      totalPurchases: parseFloat(formData.totalPurchases)
    };

    try {
      let res;
      if (modalMode === 'add') {
        res = await customersService.create(submissionData);
        if (res.success) {
          toast.success('Customer profile created 🎉');
          localStorage.removeItem('smartops_customer_draft');
        }
      } else {
        res = await customersService.update(selectedCustomer._id, submissionData);
        if (res.success) {
          toast.success('Customer profile updated 🔄');
        }
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchCustomers();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Database error occurred';
      toast.error(errMsg);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Delete this customer account? All related historical records will remain intact.')) {
      try {
        const res = await customersService.delete(id);
        if (res.success) {
          toast.success('Customer deleted 🗑️');
          fetchCustomers();
        }
      } catch (e) {
        toast.error('Failed to delete customer profile');
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Street', 'City', 'State', 'Zip', 'Purchases', 'Loyalty Points', 'Segment'];
    const rows = customers.map(c => [
      c.name,
      c.email,
      c.phone || '',
      c.address?.street || '',
      c.address?.city || '',
      c.address?.state || '',
      c.address?.zip || '',
      c.totalPurchases || 0,
      c.loyaltyPoints || 0,
      c.segment
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_registry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export completed! 📊');
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-zinc-100"
    >
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" /> Customer Registry
          </h2>
          <p className="text-sm text-zinc-400">View loyalty accounts, segmentation statuses, contact information and purchase records.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportToCSV()}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-lg text-xs font-semibold shadow-md cursor-pointer transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>
          
          <button
            onClick={() => openFormModal('add')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg hover:shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* --- Stats Summary Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Customers</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
            {stats.totalCount}
            <span className="text-xs font-normal text-zinc-500 font-sans">profiles</span>
          </div>
          <div className="text-xs text-indigo-400 mt-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Registered in database
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider text-amber-400 font-semibold">VIP Segment</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
            {stats.vipCount}
            <span className="text-xs font-normal text-zinc-500">accounts</span>
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> Total loyal VIP customers
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">New Registrations</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
            {stats.newCount}
            <span className="text-xs font-normal text-zinc-500">accounts</span>
          </div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Added in current session
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Cumulative Loyalty</div>
          <div className="text-3xl font-bold text-white mt-2">
            {stats.totalLoyalty.toLocaleString()}
            <span className="text-xs font-normal text-zinc-500 ml-1">pts</span>
          </div>
          <div className="text-xs text-violet-400 mt-2 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Reward points active
          </div>
        </div>
      </div>

      {/* --- Filter / Search Controls --- */}
      <div className="p-4 rounded-xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search customers by Name, Email, Phone, City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-zinc-900 border border-zinc-700/60 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {search !== debouncedSearch && (
            <RefreshCw className="absolute right-3 top-3 w-3.5 h-3.5 text-indigo-400 animate-spin" />
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segment Filter */}
          <select
            value={segmentFilter}
            onChange={(e) => { setSegmentFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Segments</option>
            <option value="vip">VIP Segment</option>
            <option value="regular">Regular</option>
            <option value="new">New Members</option>
          </select>

          {/* Columns Visibility */}
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 hover:text-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Columns
            </button>
            
            <AnimatePresence>
              {showColMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowColMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl p-3 space-y-2 z-20"
                  >
                    <div className="text-xs font-semibold text-zinc-400 mb-1">Column Visibility</div>
                    {Object.keys(columnVisibility).map(col => (
                      <label key={col} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={columnVisibility[col]}
                          onChange={(e) => setColumnVisibility({ ...columnVisibility, [col]: e.target.checked })}
                          className="rounded text-indigo-500"
                        />
                        <span className="capitalize">{col}</span>
                      </label>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* --- Bulk Actions Panel --- */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-indigo-950/40 border border-indigo-850 rounded-xl flex items-center justify-between gap-4"
        >
          <span className="text-xs text-indigo-200">
            Selected <strong className="text-white">{selectedIds.length}</strong> customer profiles
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkDelete()}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* --- Advanced Data Table --- */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/30 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    onChange={handleBulkSelect}
                    className="rounded text-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                  Customer details <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-zinc-500" />
                </th>
                {columnVisibility.contact && <th className="p-4">Contact Profile</th>}
                {columnVisibility.location && <th className="p-4">Location</th>}
                {columnVisibility.segment && <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('segment')}>Segment</th>}
                {columnVisibility.purchases && <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('totalPurchases')}>Purchases</th>}
                {columnVisibility.loyalty && <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('loyaltyPoints')}>Loyalty Points</th>}
                <th className="p-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-400">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-500 mb-2" />
                    <span>Loading customer profiles...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-400">
                    <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="font-semibold text-white">No customers found</p>
                    <p className="text-xs text-zinc-500 mt-1">Try refining search keyword parameters</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const isSelected = selectedIds.includes(customer._id);
                  const isVip = customer.segment === 'vip';
                  
                  return (
                    <tr
                      key={customer._id}
                      className={`hover:bg-zinc-800/20 transition-all ${
                        isSelected ? 'bg-indigo-950/10' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(customer._id)}
                          className="rounded text-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Name / Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                            isVip 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 glow-primary' 
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}>
                            {getInitials(customer.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{customer.name}</div>
                            <div className="text-xs text-zinc-500">{customer.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      {columnVisibility.contact && (
                        <td className="p-4 text-zinc-300 text-xs font-mono">
                          {customer.phone || 'N/A'}
                        </td>
                      )}

                      {/* Location */}
                      {columnVisibility.location && (
                        <td className="p-4 text-xs text-zinc-400">
                          {customer.address?.city && customer.address?.state
                            ? `${customer.address.city}, ${customer.address.state}`
                            : 'Not Specified'}
                        </td>
                      )}

                      {/* Segment */}
                      {columnVisibility.segment && (
                        <td className="p-4 text-center">
                          {inlineEditField?.id === customer._id && inlineEditField?.field === 'segment' ? (
                            <select
                              value={inlineEditValue}
                              onChange={async (e) => {
                                setInlineEditValue(e.target.value);
                                try {
                                  const res = await customersService.update(customer._id, { segment: e.target.value });
                                  if (res.success) {
                                    toast.success('Segment updated inline 🔄');
                                    setInlineEditField(null);
                                    fetchCustomers();
                                  }
                                } catch (err) {
                                  toast.error('Failed to update segment');
                                }
                              }}
                              onBlur={() => setInlineEditField(null)}
                              className="px-1.5 py-0.5 bg-zinc-900 border border-indigo-500 rounded text-xs"
                              autoFocus
                            >
                              <option value="new">New</option>
                              <option value="regular">Regular</option>
                              <option value="vip">VIP</option>
                            </select>
                          ) : (
                            <span
                              onDoubleClick={() => startInlineEdit(customer, 'segment', customer.segment)}
                              className={`px-2.5 py-0.5 text-xs rounded-full font-medium border cursor-pointer select-none ${
                                customer.segment === 'vip'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : customer.segment === 'regular'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                              }`}
                              title="Double click to change segment"
                            >
                              {customer.segment?.toUpperCase()}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Total Purchases */}
                      {columnVisibility.purchases && (
                        <td className="p-4 text-right font-semibold text-white">
                          {inlineEditField?.id === customer._id && inlineEditField?.field === 'totalPurchases' ? (
                            <input
                              type="number"
                              step="0.01"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onBlur={() => saveInlineEdit(customer._id, 'totalPurchases')}
                              onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(customer._id, 'totalPurchases')}
                              className="w-20 px-1 py-0.5 bg-zinc-900 border border-indigo-500 rounded text-right text-xs"
                              autoFocus
                            />
                          ) : (
                            <span
                              onDoubleClick={() => startInlineEdit(customer, 'totalPurchases', customer.totalPurchases)}
                              className="cursor-pointer border-b border-dashed border-zinc-700 hover:text-indigo-400"
                              title="Double click to edit purchases"
                            >
                              ${(customer.totalPurchases || 0).toFixed(2)}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Loyalty Points */}
                      {columnVisibility.loyalty && (
                        <td className="p-4 text-right">
                          {inlineEditField?.id === customer._id && inlineEditField?.field === 'loyaltyPoints' ? (
                            <input
                              type="number"
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onBlur={() => saveInlineEdit(customer._id, 'loyaltyPoints')}
                              onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(customer._id, 'loyaltyPoints')}
                              className="w-16 px-1 py-0.5 bg-zinc-900 border border-indigo-500 rounded text-right text-xs"
                              autoFocus
                            />
                          ) : (
                            <span
                              onDoubleClick={() => startInlineEdit(customer, 'loyaltyPoints', customer.loyaltyPoints)}
                              className="cursor-pointer border-b border-dashed border-zinc-700 hover:text-indigo-400 font-mono text-zinc-300 font-semibold"
                              title="Double click to edit points"
                            >
                              {customer.loyaltyPoints || 0}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailsDrawer(customer)}
                            className="p-1 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded transition"
                            title="View customer details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openFormModal('edit', customer)}
                            className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition"
                            title="Edit profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer._id)}
                            className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                            title="Delete customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Showing <strong className="text-white">{customers.length}</strong> of{' '}
            <strong className="text-white">{totalCustomers}</strong> customer records
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

      {/* --- ADD/EDIT MODAL FORM (Multi-step) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-400" />
                    {modalMode === 'add' ? 'Register Customer Account' : 'Edit Customer Profile'}
                  </h3>
                  <p className="text-xs text-zinc-500">Step {formStep} of 2 - Personal & Loyalty Details</p>
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
                <div className={`h-full bg-indigo-600 transition-all duration-300 ${formStep === 1 ? 'w-1/2' : 'w-full'}`} />
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {modalMode === 'add' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => loadDraft()}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-350"
                    >
                      Restore Unsaved Draft?
                    </button>
                  </div>
                )}

                {formStep === 1 ? (
                  // --- STEP 1: Personal Profile ---
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Customer Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-indigo-500 ${
                          formErrors.name ? 'border-rose-500' : 'border-zinc-800'
                        }`}
                        placeholder="e.g. John Doe"
                      />
                      {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-indigo-500 ${
                          formErrors.email ? 'border-rose-500' : 'border-zinc-800'
                        }`}
                        placeholder="e.g. john.doe@example.com"
                      />
                      {formErrors.email && <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. +1 (555) 019-2834"
                      />
                    </div>
                  </motion.div>
                ) : (
                  // --- STEP 2: Address & Loyalty Details ---
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-zinc-300">Street Address</label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Street details..."
                      />
                      
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.address.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, city: e.target.value }
                          })}
                          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={formData.address.state}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, state: e.target.value }
                          })}
                          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Zip"
                          value={formData.address.zip}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, zip: e.target.value }
                          })}
                          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Total Purchases ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.totalPurchases}
                          onChange={(e) => setFormData({ ...formData, totalPurchases: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-indigo-500 ${
                            formErrors.totalPurchases ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="0.00"
                        />
                        {formErrors.totalPurchases && <p className="text-[11px] text-rose-500 mt-1">{formErrors.totalPurchases}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Loyalty Points</label>
                        <input
                          type="number"
                          value={formData.loyaltyPoints}
                          onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-indigo-500 ${
                            formErrors.loyaltyPoints ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="0"
                        />
                        {formErrors.loyaltyPoints && <p className="text-[11px] text-rose-500 mt-1">{formErrors.loyaltyPoints}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Segmentation Tier Override</label>
                      <select
                        value={formData.segment}
                        onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="new">New member</option>
                        <option value="regular">Regular</option>
                        <option value="vip">VIP customer</option>
                      </select>
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
                      onClick={() => setFormStep(2)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFormSubmit()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      Save Profile
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DETAIL VIEW DRAWER --- */}
      <AnimatePresence>
        {isDrawerOpen && selectedCustomer && (
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
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Customer account Details</span>
                    <h3 className="text-lg font-bold text-white mt-1">{selectedCustomer.name}</h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Account Summary Bubble */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/20 shadow-inner">
                      {getInitials(selectedCustomer.name)}
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                        selectedCustomer.segment === 'vip' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {selectedCustomer.segment?.toUpperCase()} MEMBER
                      </span>
                      <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> {selectedCustomer.email}
                      </div>
                    </div>
                  </div>

                  {/* Core Properties */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Parameters</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="text-zinc-500">Total Spent</div>
                        <div className="text-white mt-1 font-bold text-sm">${(selectedCustomer.totalPurchases || 0).toFixed(2)}</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="text-zinc-500">Loyalty Balance</div>
                        <div className="text-indigo-400 mt-1 font-bold text-sm">{selectedCustomer.loyaltyPoints || 0} pts</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg col-span-2">
                        <div className="text-zinc-500">Phone & Contacts</div>
                        <div className="text-zinc-300 mt-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" /> {selectedCustomer.phone || 'No phone registered'}
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg col-span-2">
                        <div className="text-zinc-500">Address Profile</div>
                        <div className="text-zinc-300 mt-1 flex items-start gap-1.5 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 mt-0.5" />
                          <div>
                            <div>{selectedCustomer.address?.street || 'No street details'}</div>
                            <div>
                              {selectedCustomer.address?.city || 'N/A'}, {selectedCustomer.address?.state || 'N/A'}{' '}
                              {selectedCustomer.address?.zip || ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Data: Invoice history */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Purchase History</h4>
                    {salesLoading ? (
                      <div className="text-center py-4 text-xs text-zinc-500">Loading customer invoices...</div>
                    ) : relatedSales.length === 0 ? (
                      <div className="p-3 border border-dashed border-zinc-850 rounded-lg text-center text-xs text-zinc-500">
                        No transactions registered for this account
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {relatedSales.map(sale => (
                          <div key={sale._id} className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-lg flex justify-between items-center text-xs">
                            <div>
                              <span className="font-semibold text-white">Invoice #{sale._id.slice(-6).toUpperCase()}</span>
                              <div className="text-[10px] text-zinc-500 mt-0.5">{new Date(sale.date).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                              <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                                sale.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                              }`}>
                                {sale.status}
                              </span>
                              <div className="font-semibold text-white mt-1">${sale.totalAmount.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Activity Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Activity timeline</h4>
                    <div className="space-y-3 border-l-2 border-zinc-800 pl-4 ml-2 text-xs">
                      <div className="relative">
                        <div className="absolute -left-[22px] top-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-zinc-950" />
                        <span className="text-zinc-500 text-[10px] block">Join Date: {new Date(selectedCustomer.joinDate).toLocaleString()}</span>
                        <p className="text-zinc-300 font-medium">Customer account registered.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[22px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-zinc-950" />
                        <span className="text-zinc-500 text-[10px] block">Updated At: {new Date(selectedCustomer.updatedAt).toLocaleString()}</span>
                        <p className="text-zinc-300 font-medium">Profile preferences modified in database.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="p-6 bg-zinc-900/40 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    onClick={async () => {
                      try {
                        const res = await customersService.update(selectedCustomer._id, {
                          loyaltyPoints: (selectedCustomer.loyaltyPoints || 0) + 100
                        });
                        if (res.success) {
                          toast.success('Awarded +100 Loyalty Points! 🏆');
                          setSelectedCustomer(res.data);
                          fetchCustomers();
                        }
                      } catch (e) {
                        toast.error('Failed to update loyalty balance');
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-transparent rounded-lg text-xs font-semibold cursor-pointer transition"
                  >
                    Award +100 pts
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        openFormModal('edit', selectedCustomer);
                      }}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleDeleteCustomer(selectedCustomer._id);
                      }}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Delete
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

export default Customers;
