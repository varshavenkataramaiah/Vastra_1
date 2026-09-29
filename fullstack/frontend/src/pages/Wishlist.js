import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../Components/Navbar';
import ProductItem from '../Components/ProductItem';
import { API_BASE_URL } from '../api';

function Wishlist() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.wishlist.items);
  const currentUser = useSelector((state) => state.user.currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [addingProductId, setAddingProductId] = useState('');
  const [unavailableProductIds, setUnavailableProductIds] = useState([]);
  const [cartError, setCartError] = useState('');

  const addToCart = async (product) => {
    if (!currentUser) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }

    setCartError('');
    setAddingProductId(product.id);

    try {
      const response = await fetch(`${API_BASE_URL}/products/${product.id}`);
      const data = await response.json();
      if (!response.ok || !data.product) {
        throw new Error(data.message || 'Unable to check product availability.');
      }

      const latestProduct = data.product;
      if (latestProduct.inStock === false || Number(latestProduct.stock) < 1) {
        setUnavailableProductIds((currentIds) => [...new Set([...currentIds, product.id])]);
        setCartError(`${product.name} is out of stock and was not added to your cart.`);
        return;
      }

      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          ...product,
          ...latestProduct,
          id: latestProduct._id || latestProduct.id || product.id,
        },
      });
    } catch (error) {
      setCartError(error.message || 'Unable to check product availability.');
    } finally {
      setAddingProductId('');
    }
  };

  return (
    <>
      <Navbar />
      <main className="container wishlist-page py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="page-title mb-0">My Wishlist</h1>
          <span className="text-muted">{items.length} item{items.length === 1 ? '' : 's'}</span>
        </div>
        {cartError && <p className="text-danger" role="alert">{cartError}</p>}
        {items.length > 0 ? (
          <div className="row g-4">
            {items.map((product) => (
              <div className="col-12 col-sm-6 col-lg-3" key={`${product.id}-${product.image}`}>
                <ProductItem product={product} showActions={false} />
                <div className="wishlist-actions">
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: product })}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className="btn btn-dark"
                    disabled={addingProductId === product.id || product.inStock === false || Number(product.stock) === 0 || unavailableProductIds.includes(product.id)}
                    onClick={() => addToCart(product)}
                  >
                    {addingProductId === product.id ? 'Checking stock...' : product.inStock === false || Number(product.stock) === 0 || unavailableProductIds.includes(product.id) ? 'Out of stock' : 'Add to cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state text-center py-5">
            <h2>Your wishlist is empty</h2>
            <p className="text-muted">Save products you love and find them here later.</p>
            <Link className="btn btn-dark" to="/">Continue shopping</Link>
          </div>
        )}
      </main>
    </>
  );
}

export default Wishlist;