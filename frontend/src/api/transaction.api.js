import api from '@/utils/api'

/**
 * 获取所有交易记录
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
export const getTransactions = (params) => {
  return api.get('/transactions', { params })
}

/**
 * 创建一个新的交易记录
 * @param {object} data - 交易数据 { part_id, trans_type, quantity, remarks }
 * @returns {Promise}
 */
export const createTransaction = (data) => {
  return api.post('/transactions', data)
}

/**
 * 导出交易记录为 Excel
 * @returns {Promise}
 */
export const exportTransactions = (params, lang) => {
  return api.get('/transactions/export', {
    params,
    responseType: 'blob', // Important for file downloads
    headers: {
      'Accept-Language': lang || 'en'
    }
  }).then(response => {
    // To handle the file download correctly, we need to extract the filename
    // from the 'Content-Disposition' header and return it along with the data blob.
    const header = response.headers['content-disposition'];
    const filenameMatch = header && header.match(/filename="(.+?)"/);
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'transactions.xlsx';

    return {
      blob: response.data,
      filename: filename
    };
  });
}

// 新增：报告故障配件
export function reportFault(faultData) {
  return api.post('/transactions/fault', faultData)
}
