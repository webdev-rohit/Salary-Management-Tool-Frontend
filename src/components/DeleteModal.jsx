export default function DeleteModal({ employee, onConfirm, onClose, deleting }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '400px' }}>
        <div className="modal-header">
          <div className="modal-icon-wrap" style={{ background: '#FEF2F2', color: '#EF4444' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <div>
            <div className="modal-title">Remove Employee</div>
            <div className="modal-subtitle">This action cannot be undone</div>
          </div>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5 }}>
          Are you sure you want to remove <strong>{employee?.full_name}</strong> from the employee database?
        </p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={deleting}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Removing…' : 'Remove Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}
