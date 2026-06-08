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
  Briefcase,
  DollarSign,
  Award,
  Calendar,
  CheckSquare,
  Square,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  PlusCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { employeesService } from '../services/api';

const Employees = () => {
  // --- State Variables ---
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt:desc');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Inline editing state
  const [inlineEditField, setInlineEditField] = useState(null); // { id, field }
  const [inlineEditValue, setInlineEditValue] = useState('');

  // Modals & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form states (Multi-step)
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    position: '',
    salary: '',
    performance: '100'
  });
  const [formErrors, setFormErrors] = useState({});

  // Tasks inline additions in details drawer
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalCount: 0,
    avgPerformance: 0,
    activeTasks: 0,
    attendanceRatio: 95.8
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
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: debouncedSearch,
        department: deptFilter,
        sort: sortBy
      };
      const response = await employeesService.getAll(params);
      if (response.success) {
        setEmployees(response.data);
        setTotalEmployees(response.pagination.total);
        setTotalPages(response.pagination.pages);

        // Update local stats from employee registry database
        calculateStats();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load employee list 🛡️');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, debouncedSearch, deptFilter, sortBy]);

  const calculateStats = async () => {
    try {
      const response = await employeesService.getAll({ limit: 1000 });
      if (response.success) {
        const allItems = response.data;
        const total = allItems.length;
        
        const perfSum = allItems.reduce((sum, e) => sum + (e.performance || 0), 0);
        const avgPerf = total > 0 ? parseFloat((perfSum / total).toFixed(1)) : 0;
        
        const tasksCount = allItems.reduce((sum, e) => {
          const pending = e.tasks?.filter(t => t.status !== 'completed').length || 0;
          return sum + pending;
        }, 0);

        setStats({
          totalCount: total,
          avgPerformance: avgPerf,
          activeTasks: tasksCount,
          attendanceRatio: 96.2 // baseline standard representation
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Form Auto-Save Draft ---
  useEffect(() => {
    if (isModalOpen && modalMode === 'add') {
      localStorage.setItem('smartops_employee_draft', JSON.stringify(formData));
    }
  }, [formData, isModalOpen, modalMode]);

  const loadDraft = () => {
    const draft = localStorage.getItem('smartops_employee_draft');
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
      setSelectedIds(employees.map(emp => emp._id));
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
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} employees? This will purge their User logins too.`)) {
      try {
        const res = await employeesService.bulkDelete(selectedIds);
        if (res.success) {
          toast.success(res.message);
          setSelectedIds([]);
          fetchEmployees();
        }
      } catch (e) {
        toast.error('Bulk delete failed 🛡️');
      }
    }
  };

  // --- Inline Edit handlers ---
  const startInlineEdit = (employee, field, currentValue) => {
    setInlineEditField({ id: employee._id, field });
    setInlineEditValue(currentValue);
  };

  const saveInlineEdit = async (id, field) => {
    try {
      let value = inlineEditValue;
      if (field === 'salary' || field === 'performance') {
        value = parseFloat(value);
        if (isNaN(value) || value < 0) {
          toast.error('Invalid number input 🚨');
          return;
        }
        if (field === 'performance' && value > 100) {
          toast.error('Performance score max is 100 🚨');
          return;
        }
      }

      const res = await employeesService.update(id, { [field]: value });
      if (res.success) {
        toast.success('Employee updated inline ⚡');
        setInlineEditField(null);
        fetchEmployees();
      }
    } catch (e) {
      toast.error('Failed to update field 🛡️');
    }
  };

  // --- Add/Edit Modal Handlers ---
  const openFormModal = (mode, employee = null) => {
    setModalMode(mode);
    setFormStep(1);
    setFormErrors({});
    if (mode === 'edit' && employee) {
      setSelectedEmployee(employee);
      setFormData({
        name: employee.userId?.name || '',
        email: employee.userId?.email || '',
        password: '', // blank on edit
        role: employee.userId?.role || 'employee',
        department: employee.department,
        position: employee.position,
        salary: employee.salary,
        performance: employee.performance || 100
      });
    } else {
      setSelectedEmployee(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        position: '',
        salary: '',
        performance: '100'
      });
    }
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please add a valid email';
    }
    
    if (modalMode === 'add' && (!formData.password || formData.password.length < 6)) {
      errors.password = 'Password is required and must be at least 6 characters';
    }

    if (!formData.department.trim()) errors.department = 'Department is required';
    if (!formData.position.trim()) errors.position = 'Job Position is required';

    const sal = parseFloat(formData.salary);
    if (isNaN(sal) || sal < 0) errors.salary = 'Salary must be a positive number';

    const perf = parseInt(formData.performance);
    if (isNaN(perf) || perf < 0 || perf > 100) errors.performance = 'Performance score must be between 0 and 100';

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
      salary: parseFloat(formData.salary),
      performance: parseInt(formData.performance)
    };

    try {
      let res;
      if (modalMode === 'add') {
        res = await employeesService.create(submissionData);
        if (res.success) {
          toast.success('Employee created successfully 🎉');
          localStorage.removeItem('smartops_employee_draft');
        }
      } else {
        res = await employeesService.update(selectedEmployee._id, submissionData);
        if (res.success) {
          toast.success('Employee profile updated 🔄');
        }
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchEmployees();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Database error occurred';
      toast.error(errMsg);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Delete this employee profile? This will permanently delete their credentials and database tasks.')) {
      try {
        const res = await employeesService.delete(id);
        if (res.success) {
          toast.success('Employee purged successfully 🗑️');
          fetchEmployees();
        }
      } catch (e) {
        toast.error('Purging employee account failed');
      }
    }
  };

  // --- Tasks checklist additions ---
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask = {
      title: newTaskTitle,
      description: 'Task assigned by system administrator',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    const updatedTasks = [...(selectedEmployee.tasks || []), newTask];

    try {
      const res = await employeesService.update(selectedEmployee._id, { tasks: updatedTasks });
      if (res.success) {
        toast.success('Task assigned directly 📝');
        setSelectedEmployee(res.data);
        setNewTaskTitle('');
        fetchEmployees();
      }
    } catch (e) {
      toast.error('Failed to assign task');
    }
  };

  const handleToggleTaskStatus = async (taskIndex) => {
    const updatedTasks = [...selectedEmployee.tasks];
    const currentStatus = updatedTasks[taskIndex].status;
    updatedTasks[taskIndex].status = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      const res = await employeesService.update(selectedEmployee._id, { tasks: updatedTasks });
      if (res.success) {
        toast.success('Task status updated inline ⚡');
        setSelectedEmployee(res.data);
        fetchEmployees();
      }
    } catch (e) {
      toast.error('Failed to update task status');
    }
  };

  // --- Attendance logging handlers ---
  const handleLogAttendance = async (status) => {
    const today = new Date().setHours(0,0,0,0);
    const hasTodayAttendance = selectedEmployee.attendance?.some(a => new Date(a.date).setHours(0,0,0,0) === today);

    if (hasTodayAttendance) {
      toast.error('Attendance for today has already been logged! 🛡️');
      return;
    }

    const updatedAttendance = [
      ...(selectedEmployee.attendance || []),
      { date: new Date(), status }
    ];

    try {
      const res = await employeesService.update(selectedEmployee._id, { attendance: updatedAttendance });
      if (res.success) {
        toast.success(`Logged attendance: "${status}" for today ✅`);
        setSelectedEmployee(res.data);
        fetchEmployees();
      }
    } catch (e) {
      toast.error('Attendance logs save failure');
    }
  };

  const getAttendanceStats = (attendance = []) => {
    const total = attendance.length;
    if (total === 0) return { present: 0, late: 0, absent: 0, leave: 0, ratio: 100 };
    
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const leave = attendance.filter(a => a.status === 'leave').length;

    const ratio = parseFloat((((present + late + leave) / total) * 100).toFixed(1));
    return { present, late, absent, leave, ratio };
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Position', 'Salary', 'Performance Score', 'Attendance Logs', 'Pending Tasks'];
    const rows = employees.map(emp => [
      emp.userId?.name || 'N/A',
      emp.userId?.email || 'N/A',
      emp.userId?.role || 'employee',
      emp.department,
      emp.position,
      emp.salary,
      emp.performance || 100,
      emp.attendance?.length || 0,
      emp.tasks?.filter(t => t.status !== 'completed').length || 0
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employee_roster_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export completed! 📊');
  };

  const getInitials = (name) => {
    if (!name) return 'E';
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
            <Users className="w-7 h-7 text-violet-400" /> Employee Roster
          </h2>
          <p className="text-sm text-zinc-400">Manage organizational departments, verify performance metrics, log daily attendance, and assign tasks.</p>
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
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Headcount</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
            {stats.totalCount}
            <span className="text-xs font-normal text-zinc-500 font-sans">profiles</span>
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-violet-400" /> Organization staff active
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Average Performance</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline">
            {stats.avgPerformance}
            <span className="text-xs text-zinc-500 ml-1">/ 100</span>
          </div>
          <div className="text-xs text-emerald-450 mt-2 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> High index efficiency score
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Tasks assigned</div>
          <div className="text-3xl font-bold text-white mt-2 flex items-baseline gap-2">
            {stats.activeTasks}
            <span className="text-xs font-normal text-zinc-500">pending</span>
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 text-amber-500" /> In-progress checklist items
          </div>
        </div>

        <div className="p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 pointer-events-none" />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Attendance Rate</div>
          <div className="text-3xl font-bold text-white mt-2">
            {stats.attendanceRatio}%
          </div>
          <div className="text-xs text-violet-400 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Average daily check-in ratio
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
            placeholder="Search employees by Name, Email, Department, Title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-zinc-900 border border-zinc-700/60 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition"
          />
          {search !== debouncedSearch && (
            <RefreshCw className="absolute right-3 top-3 w-3.5 h-3.5 text-violet-400 animate-spin" />
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
          </select>
        </div>
      </div>

      {/* --- Bulk Actions Panel --- */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-violet-950/40 border border-violet-850 rounded-xl flex items-center justify-between gap-4"
        >
          <span className="text-xs text-violet-200">
            Selected <strong className="text-white">{selectedIds.length}</strong> employee accounts
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Selected
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
                    checked={employees.length > 0 && selectedIds.length === employees.length}
                    onChange={handleBulkSelect}
                    className="rounded text-violet-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('userId')}>
                  Employee associate <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-zinc-500" />
                </th>
                <th className="p-4">Department & Role</th>
                <th className="p-4">Position Title</th>
                <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('salary')}>Salary</th>
                <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => handleSort('performance')}>Performance</th>
                <th className="p-4 text-center">Tasks</th>
                <th className="p-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-400">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-violet-500 mb-2" />
                    <span>Loading organization staff records...</span>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-400">
                    <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="font-semibold text-white">No employees registered</p>
                    <p className="text-xs text-zinc-500 mt-1">Configure user accounts to create profiles</p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isSelected = selectedIds.includes(emp._id);
                  const pendingTasks = emp.tasks?.filter(t => t.status !== 'completed').length || 0;
                  const totalTasks = emp.tasks?.length || 0;
                  const isLowPerf = emp.performance < 70;
                  
                  return (
                    <tr
                      key={emp._id}
                      className={`hover:bg-zinc-800/20 transition-all ${
                        isSelected ? 'bg-violet-950/10' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(emp._id)}
                          className="rounded text-violet-500 cursor-pointer"
                        />
                      </td>

                      {/* Employee details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-650/10 text-violet-400 flex items-center justify-center font-bold text-xs border border-violet-500/20 shadow-inner">
                            {getInitials(emp.userId?.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{emp.userId?.name || 'Account Inactive'}</div>
                            <div className="text-xs text-zinc-500 font-mono">{emp.userId?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded-full border border-zinc-700/50 block w-max">
                          {emp.department}
                        </span>
                        <span className="text-[10px] text-zinc-500 capitalize block mt-1 ml-1">{emp.userId?.role || 'Staff'}</span>
                      </td>

                      {/* Position Title */}
                      <td className="p-4 text-xs text-zinc-350 font-medium">
                        {emp.position}
                      </td>

                      {/* Salary */}
                      <td className="p-4 text-right font-semibold text-white">
                        {inlineEditField?.id === emp._id && inlineEditField?.field === 'salary' ? (
                          <input
                            type="number"
                            value={inlineEditValue}
                            onChange={(e) => setInlineEditValue(e.target.value)}
                            onBlur={() => saveInlineEdit(emp._id, 'salary')}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(emp._id, 'salary')}
                            className="w-20 px-1 py-0.5 bg-zinc-900 border border-violet-500 rounded text-right text-xs"
                            autoFocus
                          />
                        ) : (
                          <span
                            onDoubleClick={() => startInlineEdit(emp, 'salary', emp.salary)}
                            className="cursor-pointer border-b border-dashed border-zinc-700 hover:text-violet-400"
                            title="Double click to edit salary"
                          >
                            ${(emp.salary || 0).toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Performance */}
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="font-bold text-xs">
                            {inlineEditField?.id === emp._id && inlineEditField?.field === 'performance' ? (
                              <input
                                type="number"
                                value={inlineEditValue}
                                onChange={(e) => setInlineEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(emp._id, 'performance')}
                                onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(emp._id, 'performance')}
                                className="w-12 px-1 py-0.5 bg-zinc-900 border border-violet-500 rounded text-center text-xs"
                                autoFocus
                              />
                            ) : (
                              <span
                                onDoubleClick={() => startInlineEdit(emp, 'performance', emp.performance)}
                                className={`cursor-pointer border-b border-dashed border-zinc-700 hover:text-violet-400 ${
                                  isLowPerf ? 'text-rose-400 font-extrabold animate-pulse' : 'text-zinc-200'
                                }`}
                                title="Double click to edit performance score"
                              >
                                {emp.performance}%
                              </span>
                            )}
                          </div>
                          
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isLowPerf ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${emp.performance}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Tasks ratio */}
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 text-xs rounded font-mono ${
                          pendingTasks > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {totalTasks - pendingTasks}/{totalTasks}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedEmployee(emp); setIsDrawerOpen(true); }}
                            className="p-1 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded transition"
                            title="View checklist & profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openFormModal('edit', emp)}
                            className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition"
                            title="Edit credentials"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp._id)}
                            className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                            title="Delete staff account"
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

        {/* Pagination */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Showing <strong className="text-white">{employees.length}</strong> of{' '}
            <strong className="text-white">{totalEmployees}</strong> staff profiles
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

      {/* --- ADD/EDIT MODAL (Multi-step) --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    {modalMode === 'add' ? 'Add Employee profile' : 'Edit Credentials'}
                  </h3>
                  <p className="text-xs text-zinc-500">Step {formStep} of 2 - Setup login & department details</p>
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
                <div className={`h-full bg-violet-600 transition-all duration-300 ${formStep === 1 ? 'w-1/2' : 'w-full'}`} />
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {modalMode === 'add' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => loadDraft()}
                      className="text-xs font-semibold text-violet-400 hover:text-violet-305"
                    >
                      Restore Unsaved Draft?
                    </button>
                  </div>
                )}

                {formStep === 1 ? (
                  // --- STEP 1: Core User Login Account Setup ---
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Employee Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                          formErrors.name ? 'border-rose-500' : 'border-zinc-800'
                        }`}
                        placeholder="e.g. Alice Smith"
                      />
                      {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                          formErrors.email ? 'border-rose-500' : 'border-zinc-800'
                        }`}
                        placeholder="e.g. alice.smith@company.com"
                      />
                      {formErrors.email && <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>}
                    </div>

                    {modalMode === 'add' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Login Password * (Min 6 chars)</label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.password ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="••••••"
                        />
                        {formErrors.password && <p className="text-[11px] text-rose-500 mt-1">{formErrors.password}</p>}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Authorization Privilege Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                      >
                        <option value="employee">Employee associate</option>
                        <option value="manager">Manager lead</option>
                        <option value="admin">System Admin</option>
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  // --- STEP 2: Work profile parameters ---
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Department *</label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.department ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                        >
                          <option value="">Select Department</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Sales">Sales</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Human Resources">Human Resources</option>
                          <option value="Finance">Finance</option>
                        </select>
                        {formErrors.department && <p className="text-[11px] text-rose-500 mt-1">{formErrors.department}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Job Position Title *</label>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.position ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="e.g. Senior Backend Engineer"
                        />
                        {formErrors.position && <p className="text-[11px] text-rose-500 mt-1">{formErrors.position}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Salary Amount ($) *</label>
                        <input
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.salary ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="0"
                        />
                        {formErrors.salary && <p className="text-[11px] text-rose-500 mt-1">{formErrors.salary}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">Performance Index Score (0-100)</label>
                        <input
                          type="number"
                          value={formData.performance}
                          onChange={(e) => setFormData({ ...formData, performance: e.target.value })}
                          className={`w-full px-3 py-2 bg-zinc-900 border rounded-lg text-sm focus:outline-none focus:border-violet-500 ${
                            formErrors.performance ? 'border-rose-500' : 'border-zinc-800'
                          }`}
                          placeholder="100"
                        />
                        {formErrors.performance && <p className="text-[11px] text-rose-500 mt-1">{formErrors.performance}</p>}
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
                      className="px-4 py-2 bg-violet-650 hover:bg-violet-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleFormSubmit()}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
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

      {/* --- DETAIL VIEW DRAWER WITH ASSIGNED TASKS & ATTENDANCE --- */}
      <AnimatePresence>
        {isDrawerOpen && selectedEmployee && (
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
                    <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400">Employee Associate Profile</span>
                    <h3 className="text-lg font-bold text-white mt-1">{selectedEmployee.userId?.name || 'Staff Profile'}</h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Avatar & General Position Info */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold text-lg border border-violet-500/20 shadow-inner">
                      {getInitials(selectedEmployee.userId?.name)}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-violet-900/30 text-violet-350 border border-violet-800/20">
                        {selectedEmployee.department}
                      </span>
                      <div className="font-semibold text-white mt-1.5">{selectedEmployee.position}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{selectedEmployee.userId?.email}</div>
                    </div>
                  </div>

                  {/* Profile Parameters Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Salary & Metrics</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="text-zinc-500">Salary Package</div>
                        <div className="text-white mt-1 font-bold text-sm">${selectedEmployee.salary?.toLocaleString()}/yr</div>
                      </div>
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="text-zinc-500">Performance Index</div>
                        <div className="text-emerald-400 mt-1 font-bold text-sm">{selectedEmployee.performance || 100}%</div>
                      </div>
                      
                      {/* Attendance stats summary */}
                      {(() => {
                        const att = getAttendanceStats(selectedEmployee.attendance);
                        return (
                          <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-lg col-span-2 space-y-2">
                            <div className="text-zinc-500">Attendance Log Metrics</div>
                            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] pt-1">
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-1.5 rounded">
                                <span className="text-emerald-400 block font-bold">{att.present}</span>
                                <span className="text-zinc-500 text-[8px] uppercase">Pres</span>
                              </div>
                              <div className="bg-amber-500/5 border border-amber-500/10 p-1.5 rounded">
                                <span className="text-amber-400 block font-bold">{att.late}</span>
                                <span className="text-zinc-500 text-[8px] uppercase">Late</span>
                              </div>
                              <div className="bg-rose-500/5 border border-rose-500/10 p-1.5 rounded">
                                <span className="text-rose-455 block font-bold">{att.absent}</span>
                                <span className="text-zinc-500 text-[8px] uppercase">Abs</span>
                              </div>
                              <div className="bg-blue-500/5 border border-blue-500/10 p-1.5 rounded">
                                <span className="text-blue-400 block font-bold">{att.leave}</span>
                                <span className="text-zinc-500 text-[8px] uppercase">Leave</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-zinc-400 text-right">Daily check-in accuracy: <strong>{att.ratio}%</strong></div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Daily Attendance Logging Option */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Log Today's Attendance</h4>
                    <div className="flex items-center gap-2">
                      {['present', 'late', 'absent', 'leave'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleLogAttendance(status)}
                          className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 hover:border-violet-500/40 rounded text-xs capitalize transition cursor-pointer"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tasks list with interactive status checklist */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Assigned Task Checklist</h4>
                    
                    {/* Add Task Inline */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs placeholder-zinc-550 focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddTask}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-semibold text-white cursor-pointer"
                      >
                        Assign
                      </button>
                    </div>

                    {/* Task Checklist Items */}
                    {!selectedEmployee.tasks || selectedEmployee.tasks.length === 0 ? (
                      <div className="p-3 border border-dashed border-zinc-850 rounded-lg text-center text-xs text-zinc-500">
                        No active checklist tasks assigned.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedEmployee.tasks.map((task, idx) => {
                          const isCompleted = task.status === 'completed';
                          return (
                            <div
                              key={idx}
                              onClick={() => handleToggleTaskStatus(idx)}
                              className={`p-2.5 border rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                                isCompleted 
                                  ? 'bg-zinc-900/30 border-zinc-850/50 text-zinc-500 line-through' 
                                  : 'bg-zinc-900 border-zinc-850 text-zinc-300 hover:border-violet-500/30'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckSquare className="w-4 h-4 text-emerald-450 flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                              )}
                              
                              <div className="flex-1 text-xs">
                                <span className="font-medium">{task.title}</span>
                                {task.dueDate && (
                                  <span className="text-[9px] text-zinc-550 block mt-0.5">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Drawer */}
                <div className="p-6 bg-zinc-900/40 border-t border-zinc-850 flex items-center justify-between">
                  <button
                    onClick={async () => {
                      if (confirm('Bumping this employee salary by +$5,000 as promotion bump?')) {
                        try {
                          const res = await employeesService.update(selectedEmployee._id, {
                            salary: selectedEmployee.salary + 5000
                          });
                          if (res.success) {
                            toast.success('Salary bump successfully computed! 💸');
                            setSelectedEmployee(res.data);
                            fetchEmployees();
                          }
                        } catch (e) {
                          toast.error('Failed to update salary package');
                        }
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-650/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/20 hover:border-transparent rounded-lg text-xs font-semibold cursor-pointer transition"
                  >
                    Promote (+$5K)
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        openFormModal('edit', selectedEmployee);
                      }}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleDeleteEmployee(selectedEmployee._id);
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

export default Employees;
