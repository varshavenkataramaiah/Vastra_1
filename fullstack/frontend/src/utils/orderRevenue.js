const excludedStatuses = new Set(['CANCELLED', 'RETURNED']);

export const calculateRevenue = (orders = []) => orders
  .filter((order) => (
    !excludedStatuses.has(String(order.status || '').toUpperCase())
    && String(order.paymentStatus || '').toLowerCase() !== 'refunded'
    && String(order.refundStatus || '').toUpperCase() !== 'INITIATED'
  ))
  .reduce((total, order) => total + Number(order.total || 0), 0);