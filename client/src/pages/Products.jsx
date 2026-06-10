import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
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
  Upload,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Check,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { productsService, salesService } from '../services/api';

const Products = () => {
  // --- State Variables ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt:desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Table columns visibility
  const [columnVisibility, setColumnVisibility] = useState({
    image: true,
    sku: true,
    category: true,
    pricing: true,
    stock: true,
    status: true
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Inline editing state
  const [inlineEditField, setInlineEditField] = useState(null); // { id, field }
  const [inlineEditValue, setInlineEditValue] = useState('');

  // Modals & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form states (Multi-step)
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '10',
    supplier: '',
    status: 'active',
    images: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');

  // Drawer related sales
  const [relatedSales, setRelatedSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalCount: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    avgMargin: 0
  });

  // --- Search Debouncing Effect ---
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
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        category: categoryFilter,
        stockStatus: stockFilter,
        sort: sortBy
      };
      const response = await productsService.getAll(params);
      if (response.success) {
        setProducts(response.data);
        setTotalProducts(response.pagination.total);
        setTotalPages(response.pagination.pages);

        // Update local stats from product data
        calculateStats(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load products 🛡️');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'SmartOps AI - Product Inventory Catalog';
    fetchProducts();
  }, [currentPage, debouncedSearch, statusFilter, categoryFilter, stockFilter, sortBy]);

  // Fetch full stats dynamically by getting all products without limits for math
  const calculateStats = async (currentItems) => {
    try {
      // Fetch stats using search/filters or from all products
      const response = await productsService.getAll({ limit: 1000 });
      if (response.success) {
        const allItems = response.data;
        const total = allItems.length;
        const value = allItems.reduce((sum, item) => sum + (item.price * item.stock), 0);
        const lowStock = allItems.filter(item => item.stock <= item.minStock).length;
        
        let marginSum = 0;
        let marginCount = 0;
        allItems.forEach(item => {
          if (item.price > 0) {
            marginSum += ((item.price - item.cost) / item.price) * 100;
            marginCount++;
          }
        });
        
        setStats({
          totalCount: total,
          inventoryValue: value,
          lowStockCount: lowStock,
          avgMargin: marginCount > 0 ? parseFloat((marginSum / marginCount).toFixed(1)) : 0
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Form Auto-Save Draft ---
  useEffect(() => {
    if (isModalOpen && modalMode === 'add') {
      localStorage.setItem('smartops_product_draft', JSON.stringify(formData));
    }
  }, [formData, isModalOpen, modalMode]);

  const loadDraft = () => {
    const draft = localStorage.getItem('smartops_product_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        if (parsed.images && parsed.images.length > 0) {
          setImagePreview(parsed.images[0]);
        }
        toast.success('Form draft restored 📝');
      } catch (e) {
        console.error(e);
      }
    } else {
      toast.error('No draft found to restore 🔍');
    }
  };

  // --- Handle Action Handlers ---
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
      setSelectedIds(products.map(p => p._id));
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
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
      try {
        const res = await productsService.bulkDelete(selectedIds);
        if (res.success) {
          toast.success(res.message);
          setSelectedIds([]);
          fetchProducts();
        }
      } catch (e) {
        toast.error('Bulk delete failed 🛡️');
      }
    }
  };

  const handleBulkStatusChange = async (status) => {
    try {
      const res = await productsService.bulkUpdateStatus(selectedIds, status);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        fetchProducts();
      }
    } catch (e) {
      toast.error('Bulk status update failed 🔄');
    }
  };

  // --- Inline Edit handlers ---
  const startInlineEdit = (product, field, currentValue) => {
    setInlineEditField({ id: product._id, field });
    setInlineEditValue(currentValue);
  };

  const saveInlineEdit = async (id, field) => {
    try {
      let value = inlineEditValue;
      if (field === 'price' || field === 'cost' || field === 'stock') {
        value = parseFloat(value);
        if (isNaN(value) || value < 0) {
          toast.error('Invalid number input 🚨');
          return;
        }
      }
      
      const res = await productsService.update(id, { [field]: value });
      if (res.success) {
        toast.success('Field updated inline ⚡');
        setInlineEditField(null);
        fetchProducts();
      }
    } catch (e) {
      toast.error('Failed to update field 🛡️');
    }
  };

  // --- Details Drawer and sales ---
  const openDetailsDrawer = async (product) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
    setSalesLoading(true);
    try {
      // Fetch sales containing this product
      const res = await salesService.getAll({ limit: 50 });
      if (res.success) {
        const filtered = res.data.filter(sale => 
          sale.products.some(p => p.product && p.product._id === product._id)
        );
        setRelatedSales(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalesLoading(false);
    }
  };

  // --- Add/Edit Modal Handlers ---
  const openFormModal = (mode, product = null) => {
    setModalMode(mode);
    setFormStep(1);
    setFormErrors({});
    if (mode === 'edit' && product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        minStock: product.minStock || 10,
        supplier: product.supplier || '',
        status: product.status || 'active',
        images: product.images || []
      });
      setImagePreview(product.images && product.images.length > 0 ? product.images[0] : '');
    } else {
      setSelectedProduct(null);
      // Try restoring draft, or clear
      setFormData({
        name: '',
        sku: '',
        category: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '10',
        supplier: '',
        status: 'active',
        images: []
      });
      setImagePreview('');
    }
    setIsModalOpen(true);
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    } else if (!/^[A-Z0-9-]+$/i.test(formData.sku.trim())) {
      errors.sku = 'SKU must contain only letters, numbers, and hyphens';
    }
    
    if (!formData.category.trim()) errors.category = 'Category is required';
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      errors.price = 'Price must be a positive number';
    }
    
    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost < 0) {
      errors.cost = 'Cost must be a positive number';
    }
    
    if (!isNaN(price) && !isNaN(cost) && cost > price) {
      errors.price = 'Price should normally be greater than cost ⚠️';
    }
    
    const stock = parseInt(formData.stock);
    if (isNaN(stock) || stock < 0) errors.stock = 'Stock must be a non-negative integer';

    const minStock = parseInt(formData.minStock);
    if (isNaN(minStock) || minStock < 0) errors.minStock = 'Min stock threshold must be non-negative';

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
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock || 10),
      sku: formData.sku.toUpperCase()
    };

    try {
      let res;
      if (modalMode === 'add') {
        res = await productsService.create(submissionData);
        if (res.success) {
          toast.success('Product added successfully 🎉');
          localStorage.removeItem('smartops_product_draft');
        }
      } else {
        res = await productsService.update(selectedProduct._id, submissionData);
        if (res.success) {
          toast.success('Product updated successfully 🔄');
        }
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchProducts();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Database error occurred';
      toast.error(errMsg);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setImagePreview(base64);
      setFormData(prev => ({
        ...prev,
        images: [base64]
      }));
      toast.success('Product image uploaded 📸');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Delete this product? This action cannot be undone.')) {
      try {
        const res = await productsService.delete(id);
        if (res.success) {
          toast.success('Product deleted 🗑️');
          fetchProducts();
        }
      } catch (e) {
        toast.error('Failed to delete product');
      }
    }
  };

  const exportToCSV = () => {
    // Generate CSV contents
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock', 'Min Stock', 'Supplier', 'Status'];
    const rows = products.map(p => [
      p.name,
      p.sku,
      p.category,
      p.price,
      p.cost,
      p.stock,
      p.minStock,
      p.supplier || '',
      p.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_catalog_${new Date().toISOString().slice(0,10)}.csv`);
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
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-violet-400" /> Products Catalog
          </h2>
          <p className="text-sm text-zinc-400">Manage hardware inventory counts, category segmentations, and profit margins.</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold shadow-lg hover:shadow-violet-600/20 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none transition group-hover:bg-violet-500/10" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Products</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
            {stats.totalCount}
            <span className="text-xs font-normal text-zinc-500">items</span>
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-violet-400" /> Active in warehouse
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Inventory Value</div>
          <div className="text-3xl font-bold text-white mt-2">
            ${stats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Total potential asset value
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider font-semibold text-amber-400">Stock Alerts</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
            {stats.lowStockCount}
            <span className="text-xs font-normal text-zinc-500">warning</span>
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Below minimum thresholds
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Average Profit Margin</div>
          <div className="text-3xl font-bold text-white mt-2">
            {stats.avgMargin}%
          </div>
          <div className="text-xs text-violet-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Profitable inventory pricing
          </div>
        </div>
      </div>

      {/* --- Filter / Search Controls --- */}
      <div className="p-4 rounded-xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Debounce indicator */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search products by Name, SKU, Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-zinc-900 border border-zinc-700/60 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition"
          />
          {search !== debouncedSearch && (
            <RefreshCw className="absolute right-3 top-3 w-3.5 h-3.5 text-violet-400 animate-spin" />
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-2.5 top-3 w-3.5 h-3.5 text-zinc-500" />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="pl-8 pr-6 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Hardware">Hardware</option>
              <option value="Networking">Networking</option>
              <option value="Office">Office</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          {/* Stock Status Filter */}
          <select
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Stock Levels</option>
            <option value="normal">In Stock</option>
            <option value="low">Low Stock Warning</option>
            <option value="out">Out of Stock</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>

          {/* Columns Visibility Trigger */}
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
                          className="rounded text-violet-500"
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

      {/* --- Bulk Actions Toast Panel --- */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-violet-950/40 border border-violet-800/60 rounded-xl flex items-center justify-between gap-4"
        >
          <span className="text-xs text-violet-200">
            Selected <strong className="text-white">{selectedIds.length}</strong> products
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('active')}
              className="px-3 py-1 bg-violet-700/40 hover:bg-violet-700 text-white rounded text-xs font-medium cursor-pointer transition"
            >
              Set Active
            </button>
            <button
              onClick={() => handleBulkStatusChange('inactive')}
              className="px-3 py-1 bg-violet-700/40 hover:bg-violet-700 text-white rounded text-xs font-medium cursor-pointer transition"
            >
              Set Inactive
            </button>
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
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleBulkSelect}
                    className="rounded text-violet-500 cursor-pointer"
                  />
                </th>
                {columnVisibility.image && <th className="p-4 w-16">Image</th>}
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                  Product Name & Details <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-zinc-500" />
                </th>
                {columnVisibility.sku && <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('sku')}>SKU</th>}
                {columnVisibility.category && <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('category')}>Category</th>}
                {columnVisibility.pricing && <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>Price / Cost</th>}
                {columnVisibility.stock && <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('stock')}>Stock Levels</th>}
                {columnVisibility.status && <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>}
                <th className="p-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-zinc-400">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-violet-500 mb-2" />
                    <span>Loading products catalogue data...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-zinc-400">
                    <Package className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="font-semibold text-white">No products found</p>
                    <p className="text-xs text-zinc-500 mt-1">Try expanding your search query or creating a new item</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isSelected = selectedIds.includes(product._id);
                  const isLowStock = product.stock <= product.minStock;
                  
                  return (
                    <tr
                      key={product._id}
                      className={`hover:bg-zinc-800/20 transition-all ${
                        isSelected ? 'bg-violet-950/10' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(product._id)}
                          className="rounded text-violet-500 cursor-pointer"
                        />
                      </td>
                      
                      {columnVisibility.image && (
                        <td className="p-4">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-700 bg-zinc-900"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                              <Package className="w-5 h-5 text-zinc-600" />
                            </div>
                          )}
                        </td>
                      )}
                      
                      <td className="p-4">
                        <div className="font-semibold text-white">{product.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Supplier: {product.supplier || 'N/A'}</div>
                      </td>
                      
                      {columnVisibility.sku && (
                        <td className="p-4 font-mono text-xs text-zinc-400 tracking-wider">
                          {product.sku}
                        </td>
                      )}
                      
                      {columnVisibility.category && (
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-full border border-zinc-700/50">
                            {product.category}
                          </span>
                        </td>
                      )}
                      
                      {columnVisibility.pricing && (
                        <td className="p-4 text-right">
                          <div className="font-semibold text-white">
                            {inlineEditField?.id === product._id && inlineEditField?.field === 'price' ? (
                              <input
                                type="number"
                                step="0.01"
                                value={inlineEditValue}
                                onChange={(e) => setInlineEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(product._id, 'price')}
                                onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(product._id, 'price')}
                                className="w-20 px-1 py-0.5 bg-zinc-900 border border-violet-500 rounded text-right text-xs"
                                autoFocus
                              />
                            ) : (
                              <span 
                                onDoubleClick={() => startInlineEdit(product, 'price', product.price)}
                                className="cursor-pointer border-b border-dashed border-zinc-600 hover:border-violet-400 hover:text-violet-300"
                                title="Double click to edit price"
                              >
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-zinc-500">
                            Cost:{' '}
                            {inlineEditField?.id === product._id && inlineEditField?.field === 'cost' ? (
                              <input
                                type="number"
                                step="0.01"
                                value={inlineEditValue}
                                onChange={(e) => setInlineEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(product._id, 'cost')}
                                onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(product._id, 'cost')}
                                className="w-16 px-1 py-0.5 bg-zinc-900 border border-violet-500 rounded text-right text-xs"
                                autoFocus
                              />
                            ) : (
                              <span 
                                onDoubleClick={() => startInlineEdit(product, 'cost', product.cost)}
                                className="cursor-pointer border-b border-dashed border-zinc-700 hover:border-violet-400 hover:text-violet-300"
                                title="Double click to edit cost"
                              >
                                ${product.cost.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      
                      {columnVisibility.stock && (
                        <td className="p-4 text-right">
                          <div className="font-semibold text-white">
                            {inlineEditField?.id === product._id && inlineEditField?.field === 'stock' ? (
                              <input
                                type="number"
                                value={inlineEditValue}
                                onChange={(e) => setInlineEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(product._id, 'stock')}
                                onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(product._id, 'stock')}
                                className="w-16 px-1 py-0.5 bg-zinc-900 border border-violet-500 rounded text-right text-xs"
                                autoFocus
                              />
                            ) : (
                              <span 
                                onDoubleClick={() => startInlineEdit(product, 'stock', product.stock)}
                                className={`cursor-pointer border-b border-dashed border-zinc-600 hover:border-violet-400 hover:text-violet-300 ${
                                  isLowStock ? 'text-amber-400 font-bold' : ''
                                }`}
                                title="Double click to edit stock"
                              >
                                {product.stock}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500">Min: {product.minStock}</div>
                        </td>
                      )}
                      
                      {columnVisibility.status && (
                        <td className="p-4 text-center">
                          {inlineEditField?.id === product._id && inlineEditField?.field === 'status' ? (
                            <select
                              value={inlineEditValue}
                              onChange={(e) => {
                                setInlineEditValue(e.target.value);
                                // save immediately when changed
                                const updateImmediately = async () => {
                                  try {
                                    const res = await productsService.update(product._id, { status: e.target.value });
                                    if (res.success) {
                                      toast.success('Status updated inline 🔄');
                                      setInlineEditField(null);
                                      fetchProducts();
                                    }
                                  } catch (err) {
                                    toast.error('Failed to update status');
                                  }
                                };
                                updateImmediately();
                              }}
                              onBlur={() => setInlineEditField(null)}
                              className="px-1.5 py-0.5 bg-zinc-900 border border-violet-500 rounded text-xs"
                              autoFocus
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="out-of-stock">Out of Stock</option>
                            </select>
                          ) : (
                            <span
                              onDoubleClick={() => startInlineEdit(product, 'status', product.status)}
                              className={`px-2.5 py-1 text-xs rounded-full font-medium cursor-pointer border select-none ${
                                product.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : product.status === 'out-of-stock'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                              }`}
                              title="Double click to change status"
                            >
                              {product.status === 'active' ? 'Active' : product.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}
                            </span>
                          )}
                        </td>
                      )}
                      
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailsDrawer(product)}
                            className="p-1 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openFormModal('edit', product)}
                            className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                            title="Delete product"
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
            Showing <strong className="text-white">{products.length}</strong> of{' '}
            <strong className="text-white">{totalProducts}</strong> products catalog items
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
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    {modalMode === 'add' ? 'Add Product to Catalog' : 'Edit Product Details'}
                  </h3>
                  <p className="text-xs text-zinc-500">Step {formStep} of 2 - Specify catalog values</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Steps Progress bar */}
              <div className="h-1 bg-zinc-900 w-full flex">
                <div className={`h-full bg-violet-600 transition-all duration-300 ${formStep === 1 ? 'w-1/2' : 'w-full'}`} />
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {modalMode === 'add' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => loadDraft()}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-300"
                    >
                      Restore Unsaved Draft?
                    </button>
                  </div>
                )}

                {formStep === 1 ? (
                  // --- STEP 1: Basic Information ---
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                          formErrors.name ? 'border-rose-500' : 'border-zinc-800'
                        }`}
                        placeholder="e.g. Dell PowerEdge Server R740"
                      />
                      {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">SKU Number *</label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm font-mono focus:outline-none focus:border-violet-500 ${
                            formErrors.sku ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="e.g. PE-R740-128GB"
                        />
                        {formErrors.sku && <p className="text-[11px] text-rose-500 mt-1">{formErrors.sku}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.category ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                        >
                          <option value="">Select Category</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Hardware">Hardware</option>
                          <option value="Networking">Networking</option>
                          <option value="Office">Office</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                        {formErrors.category && <p className="text-[11px] text-rose-500 mt-1">{formErrors.category}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Supplier Brand</label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                        placeholder="e.g. Dell Enterprise Division"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Initial Catalog Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="out-of-stock">Out of Stock</option>
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  // --- STEP 2: Inventory & Pricing ---
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Selling Price ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.price ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="0.00"
                        />
                        {formErrors.price && <p className="text-[11px] text-rose-500 mt-1">{formErrors.price}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Warehouse cost ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.cost ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="0.00"
                        />
                        {formErrors.cost && <p className="text-[11px] text-rose-500 mt-1">{formErrors.cost}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Initial Stock Count *</label>
                        <input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.stock ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="0"
                        />
                        {formErrors.stock && <p className="text-[11px] text-rose-500 mt-1">{formErrors.stock}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Low Stock Limit (Min Stock)</label>
                        <input
                          type="number"
                          value={formData.minStock}
                          onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    {/* Image Drag & Drop File Upload */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Product Images</label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        className="p-6 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-violet-500/40 transition text-center cursor-pointer relative"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {imagePreview ? (
                          <div className="space-y-2">
                            <img
                              src={imagePreview}
                              alt="Upload preview"
                              className="w-20 h-20 mx-auto rounded-lg object-cover border border-zinc-700 bg-zinc-950"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImagePreview('');
                                setFormData(prev => ({ ...prev, images: [] }));
                              }}
                              className="text-[11px] font-semibold text-rose-500 hover:text-rose-400"
                            >
                              Clear Image
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 text-zinc-400">
                            <Upload className="w-8 h-8 text-zinc-600 mx-auto" />
                            <p className="text-xs font-semibold text-zinc-300">Drag & Drop Image or Click</p>
                            <p className="text-[10px] text-zinc-500">Supports JPG, PNG, WEBP (max 2MB)</p>
                          </div>
                        )}
                      </div>
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
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFormSubmit()}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      Save Product
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
        {isDrawerOpen && selectedProduct && (
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
                    <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400">Inventory Entity Details</span>
                    <h3 className="text-lg font-bold text-white mt-1">{selectedProduct.name}</h3>
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
                  {/* Photo Display */}
                  <div className="w-full h-48 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
                    {selectedProduct.images && selectedProduct.images.length > 0 ? (
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center space-y-2">
                        <Package className="w-12 h-12 text-zinc-700 mx-auto" />
                        <span className="text-xs text-zinc-500">No Image Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Core Properties */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Specifications</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="text-zinc-500">SKU Code</div>
                        <div className="font-mono text-zinc-300 mt-1 uppercase font-bold tracking-wider">{selectedProduct.sku}</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="text-zinc-500">Category</div>
                        <div className="text-zinc-300 mt-1 font-semibold">{selectedProduct.category}</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="text-zinc-500">Price / Cost</div>
                        <div className="text-zinc-300 mt-1 font-semibold">
                          ${selectedProduct.price.toFixed(2)} / ${selectedProduct.cost.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="text-zinc-500">Margin (%)</div>
                        <div className="text-emerald-400 mt-1 font-semibold">
                          ${(selectedProduct.price - selectedProduct.cost).toFixed(2)} ({selectedProduct.price > 0 ? (((selectedProduct.price - selectedProduct.cost) / selectedProduct.price) * 100).toFixed(1) : 0}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Levels */}
                  <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">Warehouse Stock Level:</span>
                      <strong className={selectedProduct.stock <= selectedProduct.minStock ? 'text-amber-400' : 'text-white'}>
                        {selectedProduct.stock} units
                      </strong>
                    </div>
                    
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedProduct.stock === 0
                            ? 'bg-rose-500'
                            : selectedProduct.stock <= selectedProduct.minStock
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (selectedProduct.stock / 100) * 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                      <span>Threshold: {selectedProduct.minStock} units</span>
                      <span>Supplier: {selectedProduct.supplier || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Related Data: Recent Sales History for this Product */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Invoices</h4>
                    {salesLoading ? (
                      <div className="text-center py-4 text-xs text-zinc-500">Loading purchase events...</div>
                    ) : relatedSales.length === 0 ? (
                      <div className="p-3 border border-dashed border-zinc-850 rounded-lg text-center text-xs text-zinc-500">
                        No transactions registered for this product
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {relatedSales.map(sale => {
                          const quantitySold = sale.products.find(p => p.product?._id === selectedProduct._id)?.quantity || 0;
                          return (
                            <div key={sale._id} className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-lg flex justify-between items-center text-xs">
                              <div>
                                <span className="font-semibold text-white">Invoice #{sale._id.slice(-6).toUpperCase()}</span>
                                <div className="text-[10px] text-zinc-500 mt-0.5">{new Date(sale.date).toLocaleDateString()}</div>
                              </div>
                              <div className="text-right">
                                <span className="text-zinc-300">Qty: {quantitySold}</span>
                                <div className="font-semibold text-emerald-400 mt-0.5">${(quantitySold * selectedProduct.price).toFixed(2)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Activity Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Activity Timeline</h4>
                    <div className="space-y-3 border-l-2 border-zinc-800 pl-4 ml-2 text-xs">
                      <div className="relative">
                        <div className="absolute -left-[22px] top-0.5 w-2.5 h-2.5 rounded-full bg-violet-500 ring-4 ring-zinc-950" />
                        <span className="text-zinc-500 text-[10px] block">{new Date(selectedProduct.createdAt).toLocaleString()}</span>
                        <p className="text-zinc-300 font-medium">Product registered in warehouse catalogue.</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[22px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-zinc-950" />
                        <span className="text-zinc-500 text-[10px] block">{new Date(selectedProduct.updatedAt).toLocaleString()}</span>
                        <p className="text-zinc-300 font-medium">Database catalog entry metadata synchronized.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="p-6 bg-zinc-900/40 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    onClick={async () => {
                      if (confirm('Restock this product by adding +50 units?')) {
                        try {
                          const res = await productsService.update(selectedProduct._id, { stock: selectedProduct.stock + 50 });
                          if (res.success) {
                            toast.success('Product restocked 📦');
                            setSelectedProduct(res.data);
                            fetchProducts();
                          }
                        } catch (e) {
                          toast.error('Restock action failed');
                        }
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/20 hover:border-transparent rounded-lg text-xs font-semibold cursor-pointer transition"
                  >
                    Quick Restock (+50)
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        openFormModal('edit', selectedProduct);
                      }}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleDeleteProduct(selectedProduct._id);
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

export default Products;
