import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import rootReducer from '../reducers/rootReducer';
import IconList from './IconList';
import ProductDetails from './ProductDetails';

const product = {
  id: 'product-1',
  name: 'Test product',
  image: 'https://example.com/product.jpg',
  price: 10,
  stock: 5,
};

const renderAsGuest = (element) => {
  const store = configureStore({ reducer: rootReducer });
  store.dispatch({ type: 'LOGOUT_USER' });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/shop']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/shop" element={element} />
          <Route path="/login" element={<h1>Login page</h1>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

test('guest adding from product icons is sent to login', async () => {
  renderAsGuest(<IconList product={product} />);

  fireEvent.click(screen.getByRole('link', { name: 'Add to cart' }));

  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
});

test('guest adding to wishlist from product icons is sent to login', async () => {
  renderAsGuest(<IconList product={product} />);

  fireEvent.click(screen.getByRole('link', { name: 'Add to wishlist' }));

  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
});

test('guest adding from product details is sent to login', async () => {
  renderAsGuest(<ProductDetails product={product} />);

  fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

  expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
});