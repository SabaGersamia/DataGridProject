export const ensureValidDate = (dateString) => {
    if (!dateString) return null; // Return null instead of generating new date
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };
  
  export const formatDate = (dateString) => {
    const validDate = ensureValidDate(dateString);
    if (!validDate) return 'N/A';
    
    const date = new Date(validDate);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };