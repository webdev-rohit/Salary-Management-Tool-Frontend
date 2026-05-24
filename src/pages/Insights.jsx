import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import { getDepartments, getHeadcount, getTopEarners, getCountryStats, getJobTitleAvg } from '../api/insights';
import { fmtSalary, fmtK, initials, avatarColor, deptBadge } from '../utils/format';

Chart.register(...registerables);

const DEPT_COLORS = ['#0D9488','#6366F1','#7C3AED','#EC4899','#F59E0B','#6B7280','#10B981','#EF4444','#0EA5E9','#D97706'];
const COUNTRY_COLORS = ['#6366F1','#10B981','#F59E0B','#EF4444','#0EA5E9','#8B5CF6','#F97316'];

const COUNTRY_FLAGS = {
  'USA': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'India': '🇮🇳',
  'Spain': '🇪🇸', 'Germany': '🇩🇪', 'Australia': '🇦🇺', 'France': '🇫🇷',
  'Singapore': '🇸🇬', 'Brazil': '🇧🇷',
};

function useChart(canvasRef, config, deps) {
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !config) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, config);
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, deps);
}

export default function Insights() {
  const { userEmail } = useAuth();
  const { addToast } = useToast();

  const [deptData, setDeptData] = useState([]);
  const [headcountData, setHeadcountData] = useState([]);
  const [topEarners, setTopEarners] = useState([]);
  const [earnerN, setEarnerN] = useState(10);
  const [loading, setLoading] = useState(true);
  const [earnerLoading, setEarnerLoading] = useState(false);

  // Country query
  const [countryQ, setCountryQ] = useState('');
  const [countryResult, setCountryResult] = useState(null);
  const [countryLoading, setCountryLoading] = useState(false);

  // Job title query
  const [titleQ, setTitleQ] = useState('');
  const [titleCountryQ, setTitleCountryQ] = useState('');
  const [titleResult, setTitleResult] = useState(null);
  const [titleLoading, setTitleLoading] = useState(false);

  const deptChartRef = useRef(null);
  const countryChartRef = useRef(null);

  // Fetch static data
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [depts, headcount] = await Promise.all([getDepartments(), getHeadcount()]);
        setDeptData(depts.data);
        setHeadcountData(headcount.data);
      } catch {
        addToast('Failed to load insights data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch top earners when N changes
  useEffect(() => {
    const fetchEarners = async () => {
      setEarnerLoading(true);
      try {
        const res = await getTopEarners(earnerN);
        setTopEarners(res.data);
      } catch {
        addToast('Failed to load top earners', 'error');
      } finally {
        setEarnerLoading(false);
      }
    };
    fetchEarners();
  }, [earnerN]);

  // Department bar chart
  const deptLabels = deptData.map((d) => d.department);
  const deptAvgs = deptData.map((d) => d.avg_salary ?? d.average_salary ?? d.avg ?? 0);

  useChart(deptChartRef, deptData.length ? {
    type: 'bar',
    data: {
      labels: deptLabels,
      datasets: [{
        label: 'Avg Salary',
        data: deptAvgs,
        backgroundColor: DEPT_COLORS.map((c) => c + '22'),
        borderColor: DEPT_COLORS,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ' ' + fmtSalary(ctx.raw) + ' avg' } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 }, color: '#64748B' } },
        y: { grid: { color: '#F1F5F9' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#94A3B8', callback: (v) => fmtK(v) }, beginAtZero: true },
      },
    },
  } : null, [deptData]);

  // Headcount doughnut chart
  const hcLabels = headcountData.map((h) => h.country);
  const hcCounts = headcountData.map((h) => h.headcount ?? h.count ?? 0);

  useChart(countryChartRef, headcountData.length ? {
    type: 'doughnut',
    data: {
      labels: hcLabels,
      datasets: [{
        data: hcCounts,
        backgroundColor: COUNTRY_COLORS,
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true, cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `  ${ctx.label}: ${ctx.raw} employee${ctx.raw > 1 ? 's' : ''}` } },
      },
    },
  } : null, [headcountData]);

  const handleCountryQuery = async () => {
    if (!countryQ) return;
    setCountryLoading(true);
    setCountryResult(null);
    try {
      const res = await getCountryStats(countryQ);
      setCountryResult({ ok: true, data: res.data, country: countryQ });
    } catch (err) {
      if (err.response?.status === 404) {
        setCountryResult({ ok: false, country: countryQ });
      } else {
        addToast('Query failed', 'error');
      }
    } finally {
      setCountryLoading(false);
    }
  };

  const handleTitleQuery = async () => {
    if (!titleQ.trim()) return;
    setTitleLoading(true);
    setTitleResult(null);
    try {
      const res = await getJobTitleAvg(titleQ.trim(), titleCountryQ || undefined);
      setTitleResult({ ok: true, data: res.data, title: titleQ, country: titleCountryQ });
    } catch (err) {
      if (err.response?.status === 404) {
        setTitleResult({ ok: false, title: titleQ, country: titleCountryQ });
      } else {
        addToast('Query failed', 'error');
      }
    } finally {
      setTitleLoading(false);
    }
  };

  const orgName = userEmail ? userEmail.split('@')[1]?.split('.')[0] || 'Org' : 'Org';
  const orgLabel = orgName.charAt(0).toUpperCase() + orgName.slice(1);
  const userInitials = initials(userEmail.split('@')[0].replace(/[._]/g, ' '));

  const uniqueCountries = [...new Set(headcountData.map((h) => h.country))];

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-parent">{orgLabel}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Insights</span>
          </div>
          <div className="topbar-actions">
            <div className="topbar-avatar">{userInitials || 'U'}</div>
          </div>
        </div>

        <div className="content">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div className="page-title">Insights Dashboard</div>
              <div className="page-subtitle">Salary analytics and workforce intelligence for {orgLabel}</div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 100, fontSize: 12, fontWeight: 600, color: '#065F46' }}>
              <span style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 300 }}><div className="spinner" /></div>
          ) : (
            <>
              {/* Charts Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Department Chart */}
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <div className="chart-card-title">Salary by Department</div>
                      <div className="chart-card-subtitle">Average salary per department</div>
                    </div>
                    <div className="chart-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      {deptData.length} departments
                    </div>
                  </div>
                  <div className="chart-card-body">
                    {deptData.length ? (
                      <canvas ref={deptChartRef} style={{ maxHeight: 260 }} />
                    ) : (
                      <div className="empty-state" style={{ padding: '40px 24px' }}>
                        <p>No department data</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Headcount Doughnut */}
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div>
                      <div className="chart-card-title">Headcount by Country</div>
                      <div className="chart-card-subtitle">Employee distribution</div>
                    </div>
                  </div>
                  <div className="chart-card-body">
                    {headcountData.length ? (
                      <>
                        <canvas ref={countryChartRef} style={{ maxHeight: 180 }} />
                        <div className="legend-list">
                          {headcountData.map((h, i) => (
                            <div key={h.country} className="legend-item">
                              <div className="legend-left">
                                <div className="legend-dot" style={{ background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }} />
                                <span className="legend-label">{COUNTRY_FLAGS[h.country] || '🌍'} {h.country}</span>
                              </div>
                              <span className="legend-val">{h.headcount ?? h.count} emp</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="empty-state" style={{ padding: '40px 24px' }}><p>No headcount data</p></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Queries */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Country Stats */}
                <div className="query-card">
                  <div className="query-card-header">
                    <div className="query-card-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div>
                      <div className="query-card-title">Country Salary Stats</div>
                      <div className="query-card-subtitle">Min, avg and max salary for selected country</div>
                    </div>
                  </div>
                  <div className="query-card-body">
                    <div className="query-row">
                      <div className="query-field">
                        <div className="q-label">Select Country</div>
                        <select className="q-select" value={countryQ} onChange={(e) => setCountryQ(e.target.value)}>
                          <option value="">Choose…</option>
                          {(uniqueCountries.length ? uniqueCountries : Object.keys(COUNTRY_FLAGS)).map((c) => (
                            <option key={c} value={c}>{COUNTRY_FLAGS[c] || '🌍'} {c}</option>
                          ))}
                        </select>
                      </div>
                      <button className="btn-query" onClick={handleCountryQuery} disabled={countryLoading || !countryQ}>
                        {countryLoading ? (
                          <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        )}
                        Query
                      </button>
                    </div>
                    {countryResult && (
                      <div className={`query-result ${countryResult.ok ? 'success' : 'empty'}`}>
                        {countryResult.ok ? (
                          <>
                            <div className="result-label">{countryResult.country} — {countryResult.data.headcount ?? ''} employee{(countryResult.data.headcount ?? 2) > 1 ? 's' : ''}</div>
                            <div className="result-grid">
                              <div>
                                <div className="result-item-label">Min Salary</div>
                                <div className="result-item-value red">{fmtSalary(countryResult.data.min_salary ?? countryResult.data.min)}</div>
                              </div>
                              <div>
                                <div className="result-item-label">Avg Salary</div>
                                <div className="result-item-value primary">{fmtSalary(countryResult.data.avg_salary ?? countryResult.data.avg)}</div>
                              </div>
                              <div>
                                <div className="result-item-label">Max Salary</div>
                                <div className="result-item-value green">{fmtSalary(countryResult.data.max_salary ?? countryResult.data.max)}</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="result-label">Result</div>
                            <div style={{ fontSize: 13, color: 'var(--warning)' }}>⚠️ No employees found in {countryResult.country}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Title Query */}
                <div className="query-card">
                  <div className="query-card-header">
                    <div className="query-card-icon" style={{ background: '#FFF7ED', color: '#C2410C' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <div>
                      <div className="query-card-title">Avg Salary by Job Title</div>
                      <div className="query-card-subtitle">Average salary for a job title in a country</div>
                    </div>
                  </div>
                  <div className="query-card-body">
                    <div className="query-row">
                      <div className="query-field">
                        <div className="q-label">Job Title</div>
                        <input
                          className="q-input" value={titleQ}
                          onChange={(e) => setTitleQ(e.target.value)}
                          placeholder="e.g. Senior Engineer"
                          onKeyDown={(e) => e.key === 'Enter' && handleTitleQuery()}
                        />
                      </div>
                      <div className="query-field" style={{ maxWidth: 140 }}>
                        <div className="q-label">Country</div>
                        <select className="q-select" value={titleCountryQ} onChange={(e) => setTitleCountryQ(e.target.value)}>
                          <option value="">Any</option>
                          {(uniqueCountries.length ? uniqueCountries : Object.keys(COUNTRY_FLAGS)).map((c) => (
                            <option key={c} value={c}>{COUNTRY_FLAGS[c] || '🌍'} {c}</option>
                          ))}
                        </select>
                      </div>
                      <button className="btn-query" onClick={handleTitleQuery} disabled={titleLoading || !titleQ.trim()}>
                        {titleLoading ? (
                          <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        )}
                        Query
                      </button>
                    </div>
                    {titleResult && (
                      <div className={`query-result ${titleResult.ok ? 'success' : 'empty'}`}>
                        {titleResult.ok ? (
                          <>
                            <div className="result-label">{titleResult.title}{titleResult.country ? ` · ${titleResult.country}` : ''}</div>
                            <div className="result-grid">
                              <div>
                                <div className="result-item-label">Avg Salary</div>
                                <div className="result-item-value primary" style={{ fontSize: 20 }}>
                                  {fmtSalary(titleResult.data.avg_salary ?? titleResult.data.average_salary ?? titleResult.data.avg)}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="result-label">Result</div>
                            <div style={{ fontSize: 13, color: 'var(--warning)' }}>
                              ⚠️ No employees found for &ldquo;{titleResult.title}&rdquo;{titleResult.country ? ` in ${titleResult.country}` : ''}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Earners */}
              <div className="earners-card">
                <div className="earners-header">
                  <div>
                    <div className="earners-title">Top Earners</div>
                    <div className="earners-subtitle">Highest-paid employees · max 100 results</div>
                  </div>
                  <div className="n-selector">
                    Show top
                    <select value={earnerN} onChange={(e) => setEarnerN(Number(e.target.value))}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    employees
                  </div>
                </div>

                {earnerLoading ? (
                  <div className="spinner-wrap"><div className="spinner" /></div>
                ) : topEarners.length === 0 ? (
                  <div className="empty-state"><p>No earner data</p></div>
                ) : (
                  topEarners.map((emp, i) => {
                    const rank = i + 1;
                    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-n';
                    const color = avatarColor(emp.full_name || emp.email);
                    const badge = deptBadge(emp.department);
                    const maxSal = topEarners[0]?.salary ?? 1;
                    const pct = Math.round((emp.salary / maxSal) * 100);
                    const flag = COUNTRY_FLAGS[emp.country] || '🌍';
                    return (
                      <div key={emp.id ?? i} className="earner-row">
                        <div className={`earner-rank ${rankClass}`}>{rank}</div>
                        <div className="earner-avatar" style={{ background: color }}>
                          {initials(emp.full_name || '')}
                        </div>
                        <div className="earner-info">
                          <div className="earner-name">{emp.full_name}</div>
                          <div className="earner-meta">{emp.job_title} · {flag} {emp.country}</div>
                        </div>
                        <span className="earner-badge" style={{ background: badge.bg, color: badge.color }}>
                          {emp.department}
                        </span>
                        <div style={{ flex: 1, maxWidth: 200, padding: '0 16px' }}>
                          <div style={{ background: '#F1F5F9', borderRadius: 100, height: 5 }}>
                            <div style={{ width: `${pct}%`, height: 5, borderRadius: 100, background: color }} />
                          </div>
                        </div>
                        <div className="earner-salary">{fmtSalary(emp.salary)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
