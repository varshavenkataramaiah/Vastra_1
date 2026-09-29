import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../Components/Navbar';
import { API_BASE_URL } from '../api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const localMobileNumber = (mobile = '') => String(mobile).replace(/^\+91/, '').replace(/\D/g, '').slice(-10);

const normalizeOrder = (order) => ({
  id: order._id || order.id,
  date: order.createdAt || order.date || new Date().toISOString(),
  total: Number(order.total || 0),
  status: order.status || 'PLACED',
  items: (order.items || []).map((item, index) => ({
    id: item.productId || item.id || `${order._id || order.id}-${index}`,
    name: item.name || 'Product',
    image: item.image || '',
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 1),
  })),
});

function Checkout() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const currentUser = useSelector((state) => state.user.currentUser);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [shippingDetails, setShippingDetails] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: localMobileNumber(currentUser?.mobile),
    address: '',
    city: '',
    postcode: '',
  });
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsRazorpayReady(true);
    document.body.appendChild(script);

    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setShippingDetails((prev) => ({
      ...prev,
      name: currentUser.name || prev.name,
      email: currentUser.email || prev.email,
      phone: localMobileNumber(currentUser.mobile) || prev.phone,
    }));
  }, [currentUser]);

  const placeOrder = async (paymentDetails = {}) => {
    if (!currentUser) {
      setPaymentError('Please log in to place an order.');
      return;
    }

    const token = localStorage.getItem('vastraToken');
    if (!token) {
      setPaymentError('Your session has expired. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          total,
          paymentMethod: selectedPayment === 'cash' ? 'cash' : 'razorpay',
          ...paymentDetails,
          shippingAddress: {
            fullName: shippingDetails.name,
            email: shippingDetails.email,
            mobile: `+91${shippingDetails.phone}`,
            address: shippingDetails.address,
            city: shippingDetails.city,
            state: '',
            zipCode: shippingDetails.postcode,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to place order');
      }

      const savedOrder = normalizeOrder(data.order);
      dispatch({ type: 'PLACE_ORDER', payload: savedOrder });
      dispatch({ type: 'CLEAR_CART' });
      setIsOrderPlaced(true);
    } catch (error) {
      setPaymentError(error.message || 'Unable to place order. Please try again.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setPaymentError('');
    if (!EMAIL_PATTERN.test(shippingDetails.email.trim())) {
      setPaymentError('Enter a valid email address with an extension.');
      return;
    }
    if (!/^\d{10}$/.test(shippingDetails.phone.trim())) {
      setPaymentError('Enter a 10-digit mobile number.');
      return;
    }

    if (selectedPayment === 'cash') {
      await placeOrder();
      return;
    }

    try {
      const token = localStorage.getItem('vastraToken');
      const orderResponse = await fetch(`${API_BASE_URL}/orders/payment-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
      const paymentOrder = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(paymentOrder.message || 'Unable to initialize payment');
      }

      if (!isRazorpayReady || !window.Razorpay) {
        throw new Error('The payment gateway is still loading. Please try again.');
      }

      const razorpay = new window.Razorpay({
        key: paymentOrder.keyId,
        order_id: paymentOrder.orderId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Vastra Store',
        description: 'Order payment',
        method: {
          card: true,
          netbanking: true,
          wallet: true,
          upi: true,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI',
                instruments: [{ method: 'upi' }],
              },
            },
            sequence: ['block.upi'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: async (paymentResponse) => {
          await placeOrder({
            razorpayOrderId: paymentResponse.razorpay_order_id,
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpaySignature: paymentResponse.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => setPaymentError('Payment was cancelled.'),
        },
        theme: {
          color: '#222222',
        },
      });

      razorpay.on('payment.failed', () => {
        setPaymentError('Payment failed. Please try again.');
      });
      razorpay.open();
    } catch (error) {
      setPaymentError(error.message || 'Unable to initialize payment. Please try again.');
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  }

  return (
    <>
      <Navbar />
      <main className="container checkout-page py-4">
        {isOrderPlaced ? (
          <section className="empty-state text-center py-5">
            <h1 className="page-title">Order placed successfully</h1>
            <p className="text-muted">Thank you for your purchase. Your order is being processed.</p>
            <Link className="btn btn-dark" to="/">Continue shopping</Link>
          </section>
        ) : items.length === 0 ? (
          <section className="empty-state text-center py-5">
            <h1 className="page-title">Your cart is empty</h1>
            <p className="text-muted">Add products before continuing to checkout.</p>
            <Link className="btn btn-dark" to="/">Start shopping</Link>
          </section>
        ) : (
          <>
            <h1 className="page-title mb-4">Checkout</h1>
            <div className="row g-4 align-items-start">
              <div className="col-lg-7">
                <form className="checkout-form" onSubmit={handleSubmit}>
                  <section className="checkout-section">
                    <h2>Contact details</h2>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="checkout-name">Full name</label>
                        <input id="checkout-name" name="name" type="text" value={shippingDetails.name} onChange={(event) => setShippingDetails({ ...shippingDetails, name: event.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="checkout-email">Email address</label>
                        <input id="checkout-email" name="email" type="email" pattern="[^@ ]+@[^@ ]+\.[A-Za-z]{2,}" value={shippingDetails.email} onChange={(event) => setShippingDetails({ ...shippingDetails, email: event.target.value })} required />
                      </div>
                      <div className="col-12">
                        <label htmlFor="checkout-phone">Phone number</label>
                        <div className="input-group">
                          <span className="input-group-text">+91</span>
                          <input id="checkout-phone" name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={shippingDetails.phone} onChange={(event) => setShippingDetails({ ...shippingDetails, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} required />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="checkout-section">
                    <h2>Shipping address</h2>
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="checkout-address">Street address</label>
                        <input id="checkout-address" name="address" type="text" value={shippingDetails.address} onChange={(event) => setShippingDetails({ ...shippingDetails, address: event.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="checkout-city">City</label>
                        <input id="checkout-city" name="city" type="text" value={shippingDetails.city} onChange={(event) => setShippingDetails({ ...shippingDetails, city: event.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="checkout-postcode">Postal code</label>
                        <input id="checkout-postcode" name="postcode" type="text" value={shippingDetails.postcode} onChange={(event) => setShippingDetails({ ...shippingDetails, postcode: event.target.value })} required />
                      </div>
                    </div>
                  </section>

                  <section className="checkout-section">
                    <h2>Payment method</h2>
                    <label className="payment-option">
                      <input type="radio" name="payment" value="card" checked={selectedPayment === 'card'} onChange={() => setSelectedPayment('card')} />
                      <span>Credit or debit card (Razorpay)</span>
                    </label>
                    <label className="payment-option">
                      <input type="radio" name="payment" value="upi" checked={selectedPayment === 'upi'} onChange={() => setSelectedPayment('upi')} />
                      <span>UPI (Razorpay)</span>
                    </label>
                    <label className="payment-option">
                      <input type="radio" name="payment" value="cash" checked={selectedPayment === 'cash'} onChange={() => setSelectedPayment('cash')} />
                      <span>Cash on delivery</span>
                    </label>
                  </section>

                  {paymentError && <p className="payment-error" role="alert">{paymentError}</p>}
                  <button type="submit" className="btn btn-dark checkout-submit">Place order</button>
                </form>
              </div>

              <div className="col-lg-5">
                <aside className="cart-summary checkout-summary">
                  <h2>Order summary</h2>
                  {items.map((item) => (
                    <div className="d-flex justify-content-between gap-3 mb-3" key={`${item.id}-${item.image}`}>
                      <span>{item.name} × {item.quantity}</span>
                      <strong>Rs. {(Number(item.price || 0) * item.quantity).toFixed(2)}</strong>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between cart-total">
                    <span>Total</span>
                    <strong>Rs. {total.toFixed(2)}</strong>
                  </div>
                </aside>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default Checkout;