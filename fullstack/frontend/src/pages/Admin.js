import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../Components/Navbar';
import { API_BASE_URL } from '../api';
import { calculateRevenue } from '../utils/orderRevenue';
import './Admin.css';

const emptyProduct = {
  name: '',
  category: 'featured',
  price: '',
  rating: 5,
  image: '',
  description: '',
  stock: 10,
  inStock: true,
};

function Admin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.currentUser);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [productQuery, setProductQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productStockFilter, setProductStockFilter] = useState('ALL');
  const [orderFilter, setOrderFilter] = useState('ALL');

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('vastraToken') || ''}`,
        ...(options.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Admin request failed');
    return data;
  }, []);

  const loadProducts = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/products`);
    const data = await response.json();
    setProducts(data.products || []);
  }, []);

  const loadOrders = useCallback(async () => {
    const data = await request('/orders/admin/all');
    setOrders(data.orders || []);
  }, [request]);

  const loadCustomers = useCallback(async () => {
    const data = await request('/users/admin/all');
    setCustomers(data.users || []);
  }, [request]);

  useEffect(() => {
    const token = localStorage.getItem('vastraToken');
    if (!token || currentUser?.isAdmin !== undefined) {
      if (currentUser?.isAdmin) Promise.all([loadProducts(), loadOrders(), loadCustomers()]).catch((loadError) => setError(loadError.message));
      return;
    }

    fetch(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to verify admin access');
        dispatch({ type: 'SET_CURRENT_USER', payload: data.user });
        if (data.user.isAdmin) await Promise.all([loadProducts(), loadOrders(), loadCustomers()]);
      })
      .catch((loadError) => setError(loadError.message));
  }, [currentUser, dispatch, loadCustomers, loadOrders, loadProducts]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const payload = { ...form, price: Number(form.price), rating: Number(form.rating), stock: Number(form.stock) };
      if (editingId) {
        const data = await request(`/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setProducts((currentProducts) => currentProducts.map((product) => product._id === editingId ? data.product : product));
        setMessage('Product updated.');
      } else {
        const data = await request('/products', { method: 'POST', body: JSON.stringify(payload) });
        setProducts((currentProducts) => [data.product, ...currentProducts]);
        setMessage('Product created.');
      }
      setForm(emptyProduct);
      setEditingId(null);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const editProduct = (product) => {
    const productId = product._id || product.id;
    setEditingId(productId);
    setActiveSection('products');
    setForm({
      name: product.name || '',
      category: product.category || 'featured',
      price: product.price ?? '',
      rating: product.rating ?? 5,
      image: product.image || '',
      description: product.description || '',
      stock: product.stock ?? 0,
      inStock: product.inStock !== false,
    });
    setMessage('');
    setError('');
    window.requestAnimationFrame(() => {
      document.querySelector('.admin-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const deleteProduct = async (id) => {
    setMessage('');
    setError('');
    try {
      await request(`/products/${id}`, { method: 'DELETE' });
      setProducts((currentProducts) => currentProducts.filter((product) => product._id !== id));
      setMessage('Product deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const updateOrderStatus = async (id, status) => {
    setMessage('');
    setError('');
    try {
      const data = await request(`/orders/admin/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrders((currentOrders) => currentOrders.map((order) => (order._id === id ? data.order : order)));
      await loadProducts();
      setMessage('Order status updated.');
    } catch (statusError) {
      setError(statusError.message);
    }
  };

  const updateReturnStatus = async (id, status) => {
    setMessage('');
    setError('');
    try {
      const data = await request(`/orders/admin/${id}/return`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrders((currentOrders) => currentOrders.map((order) => (order._id === id ? data.order : order)));
      setMessage(status === 'RECEIVED' ? 'Return received and refund initiated.' : `Return ${status.toLowerCase()}.`);
    } catch (returnError) {
      setError(returnError.message);
    }
  };

  const handleAdminLogout = () => {
    dispatch({ type: 'LOGOUT_USER' });
    navigate('/');
  };

  const inventoryCategories = ['ALL', ...new Set(products.map((product) => product.category).filter(Boolean))];
  const visibleProducts = products.filter((product) => {
    const query = productQuery.trim().toLowerCase();
    const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
    const matchesCategory = productCategoryFilter === 'ALL' || product.category === productCategoryFilter;
    const matchesStock = productStockFilter === 'ALL'
      || (productStockFilter === 'IN_STOCK' ? product.stock > 0 : product.stock === 0);
    return matchesQuery && matchesCategory && matchesStock;
  });
  const visibleOrders = orders.filter((order) => orderFilter === 'ALL' || order.status === orderFilter);

  if (!currentUser?.isAdmin) {
    return (
      <><Navbar /><main className="container py-5 text-center"><h1 className="page-title">Admin access required</h1><p className="text-muted">This account is not configured for admin access.</p><Link className="btn btn-dark" to="/login">Log in</Link></main></>
    );
  }

  return (
    <><Navbar /><main className="admin-shell">
      <header className="admin-hero">
        <div className="admin-hero-copy">
          <span className="admin-eyebrow">Vastra / Control room</span>
          <h1>Good morning, {currentUser.name?.split(' ')[0] || 'Admin'}.</h1>
          <p>Keep the catalog sharp and every order moving.</p>
        </div>
        <button className="admin-logout" type="button" onClick={handleAdminLogout}>Log out <span aria-hidden="true">↗</span></button>
      </header>

      <div className="admin-content">
        <section className="admin-metrics" aria-label="Store overview">
          <div className="admin-metric"><span>Catalog</span><strong>{products.length}</strong><small>live products</small></div>
          <div className="admin-metric"><span>Orders</span><strong>{orders.length}</strong><small>all time</small></div>
          <div className="admin-metric"><span>To process</span><strong>{orders.filter((order) => order.status === 'PLACED').length}</strong><small>need attention</small></div>
          <div className="admin-metric admin-metric-accent"><span>Revenue</span><strong>Rs. {calculateRevenue(orders).toLocaleString('en-IN')}</strong><small>excluding cancelled and returned orders</small></div>
        </section>

        <nav className="admin-tabs" aria-label="Admin sections">
          {['overview', 'products', 'orders', 'customers'].map((section) => <button type="button" className={activeSection === section ? 'active' : ''} onClick={() => setActiveSection(section)} key={section}>{section}</button>)}
        </nav>

        {message && <p className="admin-feedback admin-feedback-success" role="status">{message}</p>}
        {error && <p className="admin-feedback admin-feedback-error" role="alert">{error}</p>}

        {activeSection === 'overview' && <section className="admin-overview-grid">
          <article className="admin-overview-card admin-overview-card-dark"><span className="admin-kicker">Today at a glance</span><h2>Your store is ready for its next order.</h2><p>{orders.filter((order) => order.status === 'PLACED').length} orders are waiting for processing. Keep the fulfillment desk moving from the Orders tab.</p><button type="button" className="admin-primary-button" onClick={() => setActiveSection('orders')}>Open order queue <span aria-hidden="true">→</span></button></article>
          <article className="admin-overview-card"><span className="admin-kicker">Catalog pulse</span><h2>{products.filter((product) => product.stock === 0).length} products are out of stock.</h2><p>Review inventory and pricing from the Products tab before your next campaign.</p><button type="button" className="admin-quiet-button" onClick={() => setActiveSection('products')}>Review catalog →</button></article>
        </section>}

        {activeSection === 'products' && <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Catalog studio</span><h2>{editingId ? 'Edit product' : 'Add a product'}</h2></div><span className="admin-panel-count">{products.length} items</span></div>
          <form className="admin-product-form" onSubmit={handleSubmit}>
            <label>Product name<input placeholder="e.g. Linen overshirt" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>Category<input placeholder="featured, men, women..." value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /></label>
            <label>Price<input placeholder="0.00" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
            <label>Stock<input placeholder="10" type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required /></label>
            <label className="admin-form-wide">Image URL<input placeholder="https://..." value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label>
            <label className="admin-form-wide">Description<textarea placeholder="Short product description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <div className="admin-form-actions"><button className="admin-primary-button" type="submit">{editingId ? 'Save changes' : 'Create product'} <span aria-hidden="true">→</span></button>{editingId && <button className="admin-quiet-button" type="button" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>Cancel</button>}</div>
          </form>
          <div className="admin-list-heading"><div><h3>Product inventory</h3><span>Manage availability and pricing</span></div><span className="admin-panel-count">{visibleProducts.length} shown</span></div>
          <div className="admin-inventory-controls">
            <input className="admin-filter-input" type="search" placeholder="Search catalog" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} />
            <select className="admin-filter-input" value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)} aria-label="Filter products by category">
              {inventoryCategories.map((category) => <option key={category} value={category}>{category === 'ALL' ? 'All categories' : category}</option>)}
            </select>
            <select className="admin-filter-input" value={productStockFilter} onChange={(event) => setProductStockFilter(event.target.value)} aria-label="Filter products by stock status">
              <option value="ALL">All stock</option>
              <option value="IN_STOCK">In stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
            </select>
          </div>
          <div className="admin-product-list">{visibleProducts.length === 0 ? <p className="admin-empty">No matching products.</p> : visibleProducts.map((product) => <article className="admin-product-row" key={product._id}><div className="admin-product-thumb">{product.image ? <img src={product.image} alt="" /> : <span>{product.name.charAt(0)}</span>}</div><div className="admin-product-name"><strong>{product.name}</strong><span>{product.category}</span></div><div className="admin-stock"><i className={product.stock > 0 ? 'in' : 'out'} />{product.stock} in stock</div><strong className="admin-product-price">Rs. {Number(product.price).toFixed(2)}</strong><div className="admin-row-actions"><button type="button" onClick={() => editProduct(product)}>Edit</button><button type="button" onClick={() => deleteProduct(product._id)}>Delete</button></div></article>)}</div>
        </section>}

        {activeSection === 'orders' && <section className="admin-panel admin-orders-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Fulfillment desk</span><h2>Order queue</h2></div><div className="admin-order-tools"><select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} aria-label="Filter orders"><option value="ALL">All statuses</option><option value="PLACED">Placed</option><option value="PROCESSING">Processing</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option></select><span className="admin-panel-count">{visibleOrders.length} orders</span></div></div>
          <div className="admin-order-list">{visibleOrders.length === 0 ? <p className="admin-empty">No matching orders.</p> : visibleOrders.map((order) => <article className="admin-order-row" key={order._id}><div><strong>#{order._id.slice(-8).toUpperCase()}</strong><span>{order.shippingAddress?.fullName || 'Customer'} · {new Date(order.createdAt).toLocaleDateString()}</span>{order.returnStatus && order.returnStatus !== 'NONE' && <small>Return: {order.returnStatus} {order.refundStatus === 'INITIATED' ? '· Refund initiated' : order.refundStatus === 'PENDING' ? '· Manual refund pending' : ''}</small>}{order.returnReason && <small>Customer reason: {order.returnReason}</small>}</div><strong>Rs. {Number(order.total).toFixed(2)}</strong><select disabled={['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)} aria-label={`Status for order ${order._id}`} value={order.status} onChange={(event) => updateOrderStatus(order._id, event.target.value)}><option value="PLACED">Placed</option><option value="PROCESSING">Processing</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option><option value="RETURNED">Returned</option><option value="CANCELLED">Cancelled</option></select>{order.returnStatus === 'REQUESTED' && <div className="admin-row-actions"><button type="button" onClick={() => updateReturnStatus(order._id, 'ACCEPTED')}>Accept return</button><button type="button" onClick={() => updateReturnStatus(order._id, 'REJECTED')}>Reject</button></div>}{order.returnStatus === 'ACCEPTED' && <button type="button" onClick={() => updateReturnStatus(order._id, 'RECEIVED')}>Mark received / refund</button>}</article>)}</div>
        </section>}

        {activeSection === 'customers' && <section className="admin-panel">
          <div className="admin-panel-heading"><div><span className="admin-kicker">Customer desk</span><h2>Registered customers</h2></div><span className="admin-panel-count">{customers.length} customers</span></div>
          <div className="admin-customer-list">{customers.length === 0 ? <p className="admin-empty">No customers yet.</p> : customers.map((customer) => <article className="admin-customer-row" key={customer._id}><div className="admin-customer-avatar">{(customer.name || 'U').charAt(0).toUpperCase()}</div><div><strong>{customer.name}</strong><span>{customer.email || customer.mobile || 'No contact details'}</span></div><span>{new Date(customer.createdAt).toLocaleDateString()}</span></article>)}</div>
        </section>}
      </div>
    </main></>
  );
}

export default Admin;
