export const getSafeValues = (row) => {
  if (!row) return {};
  if (typeof row.values === 'string') {
    try {
      return JSON.parse(row.values) || {};
    } catch {
      return {};
    }
  }
  return row.values || {};
};

export const prepareRowForApi = (row) => ({
  ...row,
  values: getSafeValues(row)
});

export const createEmptyRow = (columns = []) => ({
  values: columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {}),
  status: 'ToDo'
});