import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../Components/Navbar';
import { API_BASE_URL } from '../api';

const normalizeOrder = (order) => ({
  id: order._id || order.id,
  date: order.createdAt || order.date || new Date().toISOString(),
  total: Number(order.total || 0),
  status: order.status || 'PLACED',
  returnRequested: Boolean(order.returnRequested),
  returnStatus: order.returnStatus || (order.returnRequested ? 'REQUESTED' : 'NONE'),
  returnReason: order.returnReason || '',
  refundStatus: order.refundStatus || 'NOT_APPLICABLE',
  items: (order.items || []).map((item, index) => ({
    id: item.productId || item.id || `${order._id || order.id}-${index}`,
    name: item.name || 'Product',
    image: item.image || '',
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 1),
  })),
});

function Orders() {
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.orders.items);
  const currentUser = useSelector((state) => state.user.currentUser);
  const [actionError, setActionError] = React.useState('');
  const [actionId, setActionId] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('ALL');
  const [returningOrderId, setReturningOrderId] = React.useState('');
  const [returnReason, setReturnReason] = React.useState('');

  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('vastraToken');
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch order history');
        }

        const normalizedOrders = (data.orders || []).map(normalizeOrder);
        dispatch({ type: 'SET_ORDERS', payload: normalizedOrders });
      } catch (error) {
        console.error('Unable to fetch orders:', error);
      }
    };

    fetchOrders();
  }, [currentUser, dispatch]);

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'ACTIVE') return ['PLACED', 'PROCESSING', 'SHIPPED'].includes(order.status);
    if (activeFilter === 'COMPLETED') return ['DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status);
    if (activeFilter === 'RETURNS') return order.returnStatus !== 'NONE';
    return true;
  });

  const returnCount = orders.filter((order) => order.returnStatus !== 'NONE').length;
  const activeCount = orders.filter((order) => ['PLACED', 'PROCESSING', 'SHIPPED'].includes(order.status)).length;

  const updateOrder = async (orderId, action, payload = {}) => {
    const token = localStorage.getItem('vastraToken');
    setActionError('');
    setActionId(orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update order');
      dispatch({ type: 'SET_ORDERS', payload: orders.map((item) => item.id === orderId ? normalizeOrder(data.order) : item) });
      if (action === 'return') {
        setReturningOrderId('');
        setReturnReason('');
      }
    } catch (error) {
      setActionError(error.message);
    } finally {
      setActionId('');
    }
  };

  return (
    <>
      <Navbar />
      <main className="container orders-page py-4">
        <header className="orders-hero">
          <div>
            <span className="orders-kicker">Your shopping history</span>
            <h1 className="page-title mb-2">Orders &amp; returns</h1>
            <p>Track deliveries, manage cancellations, and follow your refund progress.</p>
          </div>
          <Link className="orders-shop-link" to="/">Continue shopping <span aria-hidden="true">→</span></Link>
        </header>
        <section className="orders-summary" aria-label="Order summary">
          <div><span>Total orders</span><strong>{orders.length}</strong></div>
          <div><span>In progress</span><strong>{activeCount}</strong></div>
          <div><span>Returns</span><strong>{returnCount}</strong></div>
        </section>
        <nav className="orders-tabs" aria-label="Order filters">
          {[['ALL', 'All orders'], ['ACTIVE', 'In progress'], ['COMPLETED', 'Completed'], ['RETURNS', 'Returns']].map(([value, label]) => <button type="button" className={activeFilter === value ? 'active' : ''} onClick={() => setActiveFilter(value)} key={value}>{label}<span>{value === 'RETURNS' ? returnCount : value === 'ACTIVE' ? activeCount : value === 'ALL' ? orders.length : orders.filter((order) => ['DELIVERED', 'RETURNED', 'CANCELLED'].includes(order.status)).length}</span></button>)}
          <Link className="orders-return-link" to="/returns">Open returns centre <span aria-hidden="true">↗</span></Link>
        </nav>
        {actionError && <p className="text-danger" role="alert">{actionError}</p>}
        {orders.length === 0 ? (
          <section className="empty-state text-center py-5">
            <h2>No orders yet</h2>
            <p className="text-muted">Your completed purchases will appear here.</p>
            <Link className="btn btn-dark" to="/">Start shopping</Link>
          </section>
        ) : (
          <div className="orders-list">
            {filteredOrders.length === 0 ? <section className="empty-state text-center py-5"><h2>No matching orders</h2><p className="text-muted">There is nothing in this view yet.</p></section> : filteredOrders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <span className="order-label">Order #{order.id.slice(-8).toUpperCase()}</span>
                    <h2><Link to={`/orders/${order.id}`}>{order.items[0]?.name || 'Your order'}{order.items.length > 1 && <span className="order-more-items"> + {order.items.length - 1} more</span>}</Link></h2>
                    <div className="order-meta">
                      <span>{new Date(order.date).toLocaleDateString()}</span>
                      <span className={`order-status order-status-${order.status.toLowerCase()}`}>{order.status}</span>
                    </div>
                  </div>
                  <div className="order-total"><span>Total</span><strong>Rs. {Number(order.total).toFixed(2)}</strong></div>
                </div>
                <div className="order-items">
                  {order.items.map((item) => (
                    <div className="order-item" key={`${order.id}-${item.id}-${item.image || 'item'}`}>
                      <img src={item.image} alt={item.name} />
                      <span>{item.name} × {item.quantity}</span>
                      <strong>Rs. {(Number(item.price || 0) * item.quantity).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
                {(order.status === 'PLACED' || order.status === 'PROCESSING') && <button className="btn btn-outline-danger btn-sm" type="button" disabled={actionId === order.id} onClick={() => updateOrder(order.id, 'cancel')}>{actionId === order.id ? 'Updating...' : 'Cancel order'}</button>}
                {order.status === 'DELIVERED' && order.returnStatus === 'NONE' && (
                  returningOrderId === order.id ? (
                    <form className="return-request-form" onSubmit={(event) => {
                      event.preventDefault();
                      if (!returnReason.trim()) {
                        setActionError('Please provide a reason for your return.');
                        return;
                      }
                      updateOrder(order.id, 'return', { reason: returnReason.trim() });
                    }}>
                      <label htmlFor={`return-reason-${order.id}`}>Reason for return</label>
                      <textarea
                        id={`return-reason-${order.id}`}
                        value={returnReason}
                        onChange={(event) => setReturnReason(event.target.value)}
                        maxLength="1000"
                        rows="3"
                        required
                      />
                      <div className="return-request-actions">
                        <button className="btn btn-dark btn-sm" type="submit" disabled={actionId === order.id}>
                          {actionId === order.id ? 'Submitting...' : 'Submit return request'}
                        </button>
                        <button className="btn btn-link btn-sm" type="button" onClick={() => { setReturningOrderId(''); setReturnReason(''); }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button className="btn btn-outline-dark btn-sm" type="button" disabled={actionId === order.id} onClick={() => { setActionError(''); setReturningOrderId(order.id); setReturnReason(''); }}>
                      Request return
                    </button>
                  )
                )}
                {order.status === 'DELIVERED' && order.returnStatus !== 'NONE' && (
                  <div className="order-return-details">
                    <span className="text-muted">Return: {order.returnStatus.toLowerCase()} {order.refundStatus === 'INITIATED' ? '· Refund initiated' : order.refundStatus === 'PENDING' ? '· Refund pending' : ''}</span>
                    {order.returnReason && <p><strong>Reason:</strong> {order.returnReason}</p>}
                  </div>
                )}
                {order.status === 'DELIVERED' && order.returnStatus === 'NONE' && <p className="order-note">Eligible for return request</p>}
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default Orders;