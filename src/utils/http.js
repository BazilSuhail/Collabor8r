import api from './api'

export const get = (path, data) => api('GET', path, data)
export const post = (path, data) => api('POST', path, data)
export const put = (path, data) => api('PUT', path, data)
export const patch = (path, data) => api('PATCH', path, data)
export const del = (path) => api('DELETE', path)
