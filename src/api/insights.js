import api from './axios';

export const getCountryStats = (country) =>
  api.get(`/insights/country/${encodeURIComponent(country)}`);

export const getJobTitleAvg = (title, country) =>
  api.get('/insights/job-title', { params: { title, ...(country && { country }) } });

export const getDepartments = () => api.get('/insights/departments');

export const getHeadcount = () => api.get('/insights/headcount');

export const getTopEarners = (n = 10) =>
  api.get('/insights/top-earners', { params: { n } });

export const getSalaryRange = () => api.get('/insights/salary-range');
