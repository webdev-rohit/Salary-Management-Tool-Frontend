import api from './axios';

export const login = (email, password) =>
  api.post('/auth/login', { user_email: email, password });
