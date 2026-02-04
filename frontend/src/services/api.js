import axios from 'axios';

const AUTHORS_API = import.meta.env.VITE_AUTHORS_API || 'http://localhost:3001';
const PUBLICATIONS_API = import.meta.env.VITE_PUBLICATIONS_API || 'http://localhost:3002';

const authorsClient = axios.create({
  baseURL: AUTHORS_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

const publicationsClient = axios.create({
  baseURL: PUBLICATIONS_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authors API
export const authorsAPI = {
  create: (data) => authorsClient.post('/authors', data),
  getById: (id) => authorsClient.get(`/authors/${id}`),
  list: (page = 1, limit = 10) =>
    authorsClient.get('/authors', { params: { page, limit } }),
  update: (id, data) => authorsClient.patch(`/authors/${id}`, data),
  delete: (id) => authorsClient.delete(`/authors/${id}`),
};

// Publications API
export const publicationsAPI = {
  create: (data) => publicationsClient.post('/publications', data),
  getById: (id, includeAuthor = true) =>
    publicationsClient.get(`/publications/${id}`, {
      params: { includeAuthor },
    }),
  list: (page = 1, limit = 10, status = null) =>
    publicationsClient.get('/publications', {
      params: { page, limit, ...(status && { status }) },
    }),
  listByAuthor: (authorId, page = 1, limit = 10) =>
    publicationsClient.get(`/publications/author/${authorId}`, {
      params: { page, limit },
    }),
  update: (id, data) => publicationsClient.patch(`/publications/${id}`, data),
  changeStatus: (id, data) =>
    publicationsClient.patch(`/publications/${id}/status`, data),
  delete: (id) => publicationsClient.delete(`/publications/${id}`),
  getStats: () => publicationsClient.get('/stats/overview'),
};
