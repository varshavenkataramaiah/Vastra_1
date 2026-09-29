import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../Components/Navbar';

function Cart() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Navbar />
      <main className="container cart-page py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="page-title mb-0">Shopping Cart</h1>
          <span className="text-muted">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
        </div>
        {items.length > 0 ? (
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <div className="cart-items">
                {items.map((item) => (
                  <article className="cart-item" key={`${item.id}-${item.image}`}>
                    <img src={item.image} alt={item.name} className="cart-item-image" />
                    <div className="cart-item-details">
                      <h2>{item.name}</h2>
                      <p className="text-muted mb-2">Rs. {Number(item.price || 0).toFixed(2)}</p>
                      <div className="cart-item-controls">
                        <label htmlFor={`quantity-${item.id}-${item.image}`}>Quantity</label>
                        <input
                          id={`quantity-${item.id}-${item.image}`}
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.quantity}
                          onChange={(event) => dispatch({
                            type: 'UPDATE_CART_QUANTITY',
                            payload: { ...item, quantity: Number(event.target.value) },
                          })}
                        />
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0"
                          onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item })}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <strong className="cart-item-total">Rs. {(Number(item.price || 0) * item.quantity).toFixed(2)}</strong>
                  </article>
                ))}
              </div>
            </div>
            <div className="col-lg-4">
              <aside className="cart-summary">
                <h2>Order summary</h2>
                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <strong>Rs. {total.toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between cart-total">
                  <span>Total</span>
                  <strong>Rs. {total.toFixed(2)}</strong>
                </div>
                <Link className="btn btn-dark w-100 mt-4" to="/checkout">Checkout</Link>
                <button type="button" className="btn btn-link text-danger w-100 mt-2" onClick={() => dispatch({ type: 'CLEAR_CART' })}>
                  Clear cart
                </button>
              </aside>
            </div>
          </div>
        ) : (
          <div className="empty-state text-center py-5">
            <h2>Your cart is empty</h2>
            <p className="text-muted">Add something from the store and it will appear here.</p>
            <Link className="btn btn-dark" to="/">Start shopping</Link>
          </div>
        )}
      </main>
    </>
  );
}

export default Cart;