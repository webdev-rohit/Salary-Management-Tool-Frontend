import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import EmployeeModal from '../components/EmployeeModal';
import DeleteModal from '../components/DeleteModal';
import { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee } from '../api/employees';
import { getSalaryRange } from '../api/insights';
import { initials, avatarColor } from '../utils/format';

const PAGE_SIZE = 20;        // server-side page size (no filters)
const FETCH_PAGE_SIZE = 100; // max page size when fetching all for filtering
const FILTERED_PAGE_SIZE = 20; // client-side page size when filters are active

const DEPT_COLORS = {
  Engineering: { bg: '#EFF6FF', color: '#1D4ED8' },
  Product:     { bg: '#F5F3FF', color: '#6D28D9' },
  Design:      { bg: '#FDF4FF', color: '#9D174D' },
  Marketing:   { bg: '#FFF7ED', color: '#C2410C' },
  HR:          { bg: '#ECFDF5', color: '#065F46' },
  Sales:       { bg: '#F0FDFA', color: '#0F766E' },
  Finance:     { bg: '#FFFBEB', color: '#92400E' },
};

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'HR', 'Sales', 'Finance'];

// Fetch every page from the API and return all employees as a flat array
async function fetchAllEmployees(addToast) {
  try {
    const first = await getEmployees(1, FETCH_PAGE_SIZE);
    const d = first.data;
    const firstPage = Array.isArray(d) ? d : (d.employees ?? d.items ?? d.data ?? []);
    const totalPages = Array.isArray(d) ? 1 : (d.total_pages ?? d.pages ?? 1);

    if (totalPages <= 1) return firstPage;

    // Fetch remaining pages in parallel batches of 10 to avoid overwhelming the server
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const BATCH = 10;
    let all = [...firstPage];
    for (let i = 0; i < remaining.length; i += BATCH) {
      const batch = remaining.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((p) =>
          getEmployees(p, FETCH_PAGE_SIZE).then((r) => {
            const rd = r.data;
            return Array.isArray(rd) ? rd : (rd.employees ?? rd.items ?? rd.data ?? []);
          })
        )
      );
      all = all.concat(results.flat());
    }
    return all;
  } catch {
    addToast('Failed to load all employees for filtering', 'error');
    return null;
  }
}

export default function Employees() {
  const { userEmail } = useAuth();
  const { addToast } = useToast();

  // ── Server-side pagination (no filter active) ──
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── All-employees cache (used when filters are active) ──
  const [allEmployees, setAllEmployees] = useState(null); // null = not yet fetched
  const [loadingAll, setLoadingAll] = useState(false);

  // ── Salary-range API (currency used in Add/Edit modal) ──
  const [currency, setCurrency] = useState('');

  // ── Filters ──
  const [deptFilter, setDeptFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  // ── Client-side pagination for filtered results ──
  const [filteredPage, setFilteredPage] = useState(1);

  // ── Global ID search ──
  const [searchId, setSearchId] = useState('');
  const [idSearchResult, setIdSearchResult] = useState(null);
  const [idSearchLoading, setIdSearchLoading] = useState(false);
  const searchDebounceRef = useRef(null);

  // ── Modals ──
  const [empModal, setEmpModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasFilter = !!(deptFilter || countryFilter);

  // Fetch salary range once on mount — only for the currency value used in the modal
  useEffect(() => {
    getSalaryRange()
      .then((res) => setCurrency(res.data.currency || ''))
      .catch(() => {});
  }, []);

  // Fetch current page (normal mode, no filters)
  const fetchPage = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await getEmployees(p, PAGE_SIZE);
      const data = res.data;
      if (Array.isArray(data)) {
        setEmployees(data);
        setTotalPages(1);
        setTotalCount(data.length);
      } else {
        setEmployees(data.employees ?? data.items ?? data.data ?? []);
        setTotalPages(data.total_pages ?? data.pages ?? 1);
        setTotalCount(data.total ?? data.total_count ?? (data.employees ?? []).length);
      }
    } catch {
      addToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchPage(page); }, [page]);

  // When filters become active and we don't have all employees yet, fetch them all
  useEffect(() => {
    if (hasFilter && allEmployees === null && !loadingAll) {
      setLoadingAll(true);
      fetchAllEmployees(addToast).then((all) => {
        setAllEmployees(all ?? []);
        setLoadingAll(false);
      });
    }
    // Reset to first filtered page whenever a filter changes
    setFilteredPage(1);
  }, [deptFilter, countryFilter]);

  // Global ID search — debounced, calls GET /employees/{id} directly
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    const id = searchId.trim();
    if (!id) { setIdSearchResult(null); return; }
    setIdSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await getEmployee(Number(id));
        setIdSearchResult([res.data]);
      } catch {
        setIdSearchResult([]);
      } finally {
        setIdSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchId]);

  const invalidateAllCache = () => setAllEmployees(null);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (empModal === 'edit' && editTarget) {
        await updateEmployee(editTarget.id, formData);
        addToast('Employee updated successfully');
      } else {
        await createEmployee(formData);
        addToast('Employee added successfully');
        setPage(1);
      }
      setEmpModal(null);
      setEditTarget(null);
      invalidateAllCache();
      fetchPage(empModal === 'add' ? 1 : page);
    } catch (err) {
      const msg = err.response?.data?.detail;
      addToast(typeof msg === 'string' ? msg : 'Failed to save employee', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      addToast('Employee removed');
      setDeleteTarget(null);
      if (idSearchResult?.length && idSearchResult[0]?.id === deleteTarget.id) setIdSearchResult([]);
      invalidateAllCache();
      fetchPage(page);
    } catch {
      addToast('Failed to remove employee', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Compute display rows ──
  const isIdSearch = searchId.trim() !== '';

  // All employees filtered by active filters (used only when hasFilter)
  const filteredAll = hasFilter
    ? (allEmployees ?? []).filter((e) => {
        if (deptFilter && e.department !== deptFilter) return false;
        if (countryFilter && e.country !== countryFilter) return false;
        return true;
      })
    : [];

  const filteredTotalPages = Math.max(1, Math.ceil(filteredAll.length / FILTERED_PAGE_SIZE));

  // Rows shown in the table
  let displayRows;
  if (isIdSearch) {
    displayRows = idSearchResult ?? [];
  } else if (hasFilter) {
    displayRows = filteredAll.slice(
      (filteredPage - 1) * FILTERED_PAGE_SIZE,
      filteredPage * FILTERED_PAGE_SIZE
    );
  } else {
    displayRows = employees;
  }

  // Derive unique values from whichever dataset is active
  const sourceForMeta = hasFilter ? (allEmployees ?? employees) : employees;
  const uniqueCountries = [...new Set(sourceForMeta.map((e) => e.country))].sort();
  const uniqueDepts    = [...new Set(sourceForMeta.map((e) => e.department))].sort();
  const deptCount      = new Set(employees.map((e) => e.department)).size;
  const countryCount   = new Set(employees.map((e) => e.country)).size;

  const tableLoading = loading || (isIdSearch && idSearchLoading) || (hasFilter && loadingAll);

  const orgName    = userEmail ? userEmail.split('@')[1]?.split('.')[0] || 'Org' : 'Org';
  const orgLabel   = orgName.charAt(0).toUpperCase() + orgName.slice(1);
  const userInitials = initials(userEmail.split('@')[0].replace(/[._]/g, ' '));

  // ── Pagination controls helper ──
  const activePage      = hasFilter ? filteredPage : page;
  const activeTotalPages = hasFilter ? filteredTotalPages : totalPages;
  const setActivePage   = hasFilter ? setFilteredPage : setPage;

  const resultText = isIdSearch
    ? null
    : hasFilter
      ? `Showing ${filteredAll.length} of ${allEmployees?.length ?? '…'} employees`
      : `Showing ${employees.length} of ${totalCount} employees`;

  return (
    <div className="app-shell">
      <Sidebar employeeCount={totalCount || undefined} />

      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-parent">{orgLabel}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Employees</span>
          </div>
          <div className="topbar-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input" type="number" min="1"
              placeholder="Search by Employee ID…" value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
          <div className="topbar-actions">
            <button className="btn-primary" onClick={() => { setEditTarget(null); setEmpModal('add'); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Employee
            </button>
            <div className="topbar-avatar">{userInitials || 'U'}</div>
          </div>
        </div>

        <div className="content">
          <div className="page-header">
            <div className="page-title">Employees</div>
            <div className="page-subtitle">Manage your organisation's workforce · <strong>{orgLabel}</strong></div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div className="kpi-card">
              <div className="kpi-label">
                <div className="kpi-icon" style={{ background: '#EEF2FF' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                Total Employees
              </div>
              <div className="kpi-value">{loading ? '—' : totalCount}</div>
              <div className="kpi-change neutral">across organisation</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">
                <div className="kpi-icon" style={{ background: '#FFF7ED' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2">
                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                Departments
              </div>
              <div className="kpi-value">{loading ? '—' : deptCount}</div>
              <div className="kpi-change neutral">across org</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">
                <div className="kpi-icon" style={{ background: '#F0F9FF' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                Countries
              </div>
              <div className="kpi-value">{loading ? '—' : countryCount}</div>
              <div className="kpi-change neutral">globally distributed</div>
            </div>
          </div>

          {/* Filter Row — hidden during ID search */}
          {!isIdSearch && (
            <div className="filter-row">
              <select className="filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                {(uniqueDepts.length ? uniqueDepts : DEPARTMENTS).map((d) => <option key={d}>{d}</option>)}
              </select>
              <select className="filter-select" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
                <option value="">All Countries</option>
                {uniqueCountries.map((c) => <option key={c}>{c}</option>)}
              </select>
              <div className="filter-spacer" />
              {loadingAll && hasFilter && (
                <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Loading all employees…
                </span>
              )}
              {!loadingAll && resultText && (
                <span className="results-count">{resultText}</span>
              )}
            </div>
          )}

          {/* Table */}
          <div className="table-card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Country</th>
                    <th>Salary</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableLoading ? (
                    <tr>
                      <td colSpan="7">
                        <div className="spinner-wrap"><div className="spinner" /></div>
                      </td>
                    </tr>
                  ) : displayRows.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-state">
                          <div className="empty-state-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                          </div>
                          <h3>No employees found</h3>
                          <p>{isIdSearch ? `No employee with ID ${searchId}` : 'Try adjusting your filters'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayRows.map((emp) => {
                      const color = avatarColor(emp.full_name || emp.email);
                      const dept  = DEPT_COLORS[emp.department] || { bg: '#F1F5F9', color: '#475569' };
                      return (
                        <tr key={emp.id}>
                          <td style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>#{emp.id}</td>
                          <td>
                            <div className="employee-cell">
                              <div className="emp-avatar" style={{ background: color }}>{initials(emp.full_name || '')}</div>
                              <div>
                                <div className="emp-name">{emp.full_name}</div>
                                <div className="emp-email">{emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-2)' }}>{emp.job_title}</td>
                          <td>
                            <span className="badge" style={{ background: dept.bg, color: dept.color }}>{emp.department}</span>
                          </td>
                          <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{emp.country}</td>
                          <td className="salary-cell">{emp.salary}</td>
                          <td>
                            <div className="actions-cell">
                              <button className="action-btn" title="Edit" onClick={() => { setEditTarget(emp); setEmpModal('edit'); }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button className="action-btn danger" title="Delete" onClick={() => setDeleteTarget(emp)}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
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

            {/* Pagination — hide during ID search */}
            {!isIdSearch && (
              <div className="pagination-row">
                <div className="page-info">
                  Page <strong>{activePage}</strong> of <strong>{activeTotalPages}</strong>
                  {hasFilter
                    ? <> · <strong>{filteredAll.length}</strong> matching records</>
                    : <> · <strong>{totalCount}</strong> records · max {PAGE_SIZE} per page</>}
                </div>
                <div className="page-btns">
                  <button className="page-btn" disabled={activePage <= 1} onClick={() => setActivePage((p) => p - 1)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  {Array.from({ length: activeTotalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === activeTotalPages || Math.abs(p - activePage) <= 2)
                    .map((p, i, arr) => [
                      i > 0 && arr[i - 1] !== p - 1
                        ? <span key={`dot-${p}`} style={{ padding: '0 4px', color: 'var(--text-3)' }}>…</span>
                        : null,
                      <button key={p} className={`page-btn${p === activePage ? ' active' : ''}`} onClick={() => setActivePage(p)}>{p}</button>,
                    ])}
                  <button className="page-btn" disabled={activePage >= activeTotalPages} onClick={() => setActivePage((p) => p + 1)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {empModal && (
        <EmployeeModal
          mode={empModal}
          employee={editTarget}
          onSave={handleSave}
          onClose={() => { setEmpModal(null); setEditTarget(null); }}
          saving={saving}
          currency={currency}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          employee={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
