import { cartReducer } from './cartReducer';
import { wishlistReducer } from './wishlistReducer';

test('cart and wishlist are cleared on logout', () => {
  const product = { id: 'product-1', image: 'image.jpg', stock: 3 };

  expect(cartReducer({ items: [product], error: '' }, { type: 'LOGOUT_USER' }).items).toEqual([]);
  expect(wishlistReducer({ items: [product] }, { type: 'LOGOUT_USER' }).items).toEqual([]);
});

test('cart rejects quantities above available stock', () => {
  const product = { id: 'product-1', image: 'image.jpg', stock: 2 };
  const initialState = cartReducer(undefined, { type: 'ADD_TO_CART', payload: product });
  const nextState = cartReducer(initialState, {
    type: 'UPDATE_CART_QUANTITY',
    payload: { ...product, quantity: 3 },
  });

  expect(nextState.items[0].quantity).toBe(1);
  expect(nextState.error).toBe('Only 2 available.');
});

test('cart rejects adding an out-of-stock product', () => {
  const product = { id: 'product-1', image: 'image.jpg', stock: 0 };
  const nextState = cartReducer(undefined, { type: 'ADD_TO_CART', payload: product });

  expect(nextState.items).toEqual([]);
  expect(nextState.error).toBe('This product is out of stock.');
});