import api from './axios';

export const getEmployees = (page = 1, pageSize = 20) =>
  api.get('/employees', { params: { page, page_size: pageSize } });

export const getEmployee = (id) => api.get(`/employees/${id}`);

export const createEmployee = (data) => api.post('/employees', data);

export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);

export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
