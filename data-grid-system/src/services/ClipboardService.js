let clipboardData = null;

export const setClipboardData = (data, sourceSchema) => {
  clipboardData = {
    values: data,
    sourceSchema: sourceSchema,
    timestamp: Date.now()
  };
};

export const getClipboardData = () => {
  if (clipboardData && Date.now() - clipboardData.timestamp > 1800000) {
    clipboardData = null;
  }
  return clipboardData;
};

export const clearClipboardData = () => {
  clipboardData = null;
};