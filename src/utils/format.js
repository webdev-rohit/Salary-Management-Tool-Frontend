export const fmtSalary = (n) =>
  '$' + Number(n).toLocaleString('en-US');

export const fmtK = (n) =>
  n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'K' : '$' + n;

export const initials = (name) =>
  (name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const AVATAR_COLORS = [
  '#6366F1','#0D9488','#7C3AED','#D97706','#DC2626',
  '#9D174D','#065F46','#1D4ED8','#92400E','#4F46E5',
  '#0EA5E9','#16A34A','#CA8A04','#DB2777','#7C3AED',
];

export const avatarColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const DEPT_BADGE = {
  Engineering: { bg: '#EFF6FF', color: '#1D4ED8' },
  Product:     { bg: '#F5F3FF', color: '#6D28D9' },
  Design:      { bg: '#FDF4FF', color: '#9D174D' },
  Marketing:   { bg: '#FFF7ED', color: '#C2410C' },
  HR:          { bg: '#ECFDF5', color: '#065F46' },
  Sales:       { bg: '#F0FDFA', color: '#0F766E' },
  Finance:     { bg: '#FFFBEB', color: '#92400E' },
};

export const deptBadge = (dept) =>
  DEPT_BADGE[dept] || { bg: '#F1F5F9', color: '#475569' };
