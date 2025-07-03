import api from '../utils/api'

export const getBrands = () => api.get('/dimensions/brands')
export const createBrand = (data) => api.post('/dimensions/brands', data)
export const updateBrand = (id, data) => api.put(`/dimensions/brands/${id}`, data)
export const deleteBrand = (id) => api.delete(`/dimensions/brands/${id}`)

export const getModels = (brandId = null) => {
  const params = brandId ? { brand_id: brandId } : {}
  return api.get('/dimensions/models', { params })
}
export const createModel = (data) => api.post('/dimensions/models', data)
export const updateModel = (id, data) => api.put(`/dimensions/models/${id}`, data)
export const deleteModel = (id) => api.delete(`/dimensions/models/${id}`)


export const getPartTypes = () => api.get('/dimensions/part-types')
export const createPartType = (data) => api.post('/dimensions/part-types', data)
export const updatePartType = (id, data) => api.put(`/dimensions/part-types/${id}`, data)
export const deletePartType = (id) => api.delete(`/dimensions/part-types/${id}`)


export const getColours = () => api.get('/dimensions/colours')
export const createColour = (data) => api.post('/dimensions/colours', data)
export const updateColour = (id, data) => api.put(`/dimensions/colours/${id}`, data)
export const deleteColour = (id) => api.delete(`/dimensions/colours/${id}`)
