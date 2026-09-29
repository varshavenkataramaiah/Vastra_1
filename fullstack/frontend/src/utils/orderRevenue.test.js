import { calculateRevenue } from './orderRevenue';

test('revenue excludes cancelled, returned, and refunded orders', () => {
  const orders = [
    { status: 'DELIVERED', total: 100 },
    { status: 'CANCELLED', total: 200 },
    { status: 'RETURNED', total: 300 },
    { status: 'DELIVERED', paymentStatus: 'refunded', total: 400 },
    { status: 'DELIVERED', refundStatus: 'INITIATED', total: 500 },
  ];

  expect(calculateRevenue(orders)).toBe(100);
});