import { useState, useEffect } from 'react';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'HR', 'Sales', 'Finance'];
const COUNTRIES = ['USA', 'United Kingdom', 'Canada', 'India', 'Spain', 'Germany', 'Australia', 'France', 'Singapore', 'Brazil'];

const empty = { full_name: '', email: '', job_title: '', department: '', country: '', salary: '' };

const parseSalaryNum = (s) => parseFloat(String(s).split(' ')[0]) || '';

export default function EmployeeModal({ mode, employee, onSave, onClose, saving, currency }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && employee) {
      setForm({
        full_name: employee.full_name || '',
        email: employee.email || '',
        job_title: employee.job_title || '',
        department: employee.department || '',
        country: employee.country || '',
        salary: parseSalaryNum(employee.salary),
      });
    } else {
      setForm(empty);
    }
    setErrors({});
  }, [mode, employee]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = true;
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = true;
    if (!form.job_title.trim()) e.job_title = true;
    if (!form.department) e.department = true;
    if (!form.country) e.country = true;
    if (!form.salary || Number(form.salary) <= 0) e.salary = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      job_title: form.job_title.trim(),
      department: form.department,
      country: form.country,
      salary: Number(form.salary),
    });
  };

  const isEdit = mode === 'edit';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-icon-wrap" style={isEdit ? { background: '#FFF7ED', color: '#C2410C' } : { background: '#EEF2FF', color: '#4F46E5' }}>
            {isEdit ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            )}
          </div>
          <div>
            <div className="modal-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</div>
            <div className="modal-subtitle">All fields are required</div>
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label className="m-label">Full Name <span className="req">*</span></label>
            <input className={`m-input${errors.full_name ? ' error' : ''}`} value={form.full_name} onChange={set('full_name')} placeholder="e.g. Jane Smith" />
          </div>
          <div>
            <label className="m-label">Work Email <span className="req">*</span></label>
            <input className={`m-input${errors.email ? ' error' : ''}`} type="email" value={form.email} onChange={set('email')} placeholder="e.g. jane@company.com" />
          </div>
          <div>
            <label className="m-label">Job Title <span className="req">*</span></label>
            <input className={`m-input${errors.job_title ? ' error' : ''}`} value={form.job_title} onChange={set('job_title')} placeholder="e.g. Senior Engineer" />
          </div>
          <div>
            <label className="m-label">Department <span className="req">*</span></label>
            <select className={`m-select${errors.department ? ' error' : ''}`} value={form.department} onChange={set('department')}>
              <option value="">Select…</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="m-label">Country <span className="req">*</span></label>
            <select className={`m-select${errors.country ? ' error' : ''}`} value={form.country} onChange={set('country')}>
              <option value="">Select…</option>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="m-label">Annual Salary{currency ? ` (${currency})` : ''} <span className="req">*</span></label>
            <div className="salary-wrap">
              {currency && <span className="salary-pre">{currency}</span>}
              <input className={`m-input${currency ? ' salary' : ''}${errors.salary ? ' error' : ''}`} type="number" min="1" value={form.salary} onChange={set('salary')} placeholder="e.g. 95000" />
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}
