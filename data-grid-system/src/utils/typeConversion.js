export const convertValueToType = (value, targetType) => {
    if (value === null || value === undefined) return '';
    
    switch(targetType) {
      case 'string':
        return String(value);
      case 'number':
        const num = Number(value);
        return isNaN(num) ? '' : num;
      case 'date':
        if (value instanceof Date) return value.toISOString();
        const date = new Date(value);
        return isNaN(date.getTime()) ? '' : date.toISOString();
      case 'status':
        const statusMap = {
          'todo': 'ToDo',
          'to do': 'ToDo',
          'need to start': 'ToDo',
          'inprogress': 'In Progress',
          'in progress': 'In Progress',
          'progress': 'In Progress',
          'finished': 'Finished',
          'complete': 'Finished',
          'done': 'Finished'
        };
        return statusMap[String(value).toLowerCase()] || 'ToDo';
      default:
        return value;
    }
  };
  
  export const getFieldType = (field) => {
    if (field.type) return field.type;
    if (field.key === 'createdAt' || field.key === 'dueDate') return 'date';
    if (field.key === 'status') return 'status';
    return 'string';
  };