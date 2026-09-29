const initialState = {
	items: [],
	error: '',
};

const isSameProduct = (firstProduct, secondProduct) =>
	firstProduct.id === secondProduct.id && firstProduct.image === secondProduct.image;

export const cartReducer = (state = initialState, action) => {
	switch (action.type) {
		case 'SET_CART':
			return { items: action.payload || [], error: '' };
		case 'LOGOUT_USER':
			return initialState;
		case 'ADD_TO_CART': {
			const existingItem = state.items.find((item) => isSameProduct(item, action.payload));
			const availableStock = action.payload.inStock === false
				? 0
				: Number.isFinite(Number(action.payload.stock))
					? Number(action.payload.stock)
					: Number.POSITIVE_INFINITY;
			const quantity = existingItem ? existingItem.quantity : 0;

			if (quantity >= availableStock) {
				return { ...state, error: availableStock === 0 ? 'This product is out of stock.' : `Only ${availableStock} available.` };
			}

			if (existingItem) {
				return {
					...state,
					error: '',
					items: state.items.map((item) =>
						isSameProduct(item, action.payload)
							? { ...item, quantity: item.quantity + 1 }
							: item
					),
				};
			}

			return {
				...state,
				error: '',
				items: [...state.items, { ...action.payload, quantity: 1 }],
			};
		}
		case 'REMOVE_FROM_CART':
			return {
				...state,
				items: state.items.filter((item) => !isSameProduct(item, action.payload)),
			};
		case 'UPDATE_CART_QUANTITY': {
			const currentItem = state.items.find((item) => isSameProduct(item, action.payload));
			const quantity = Number(action.payload.quantity);
			const availableStock = currentItem?.inStock === false
				? 0
				: Number.isFinite(Number(currentItem?.stock))
					? Number(currentItem.stock)
					: Number.POSITIVE_INFINITY;

			if (!Number.isInteger(quantity) || quantity < 1) {
				return { ...state, error: 'Enter a valid whole-number quantity.' };
			}
			if (quantity > availableStock) {
				return { ...state, error: `Only ${availableStock} available.` };
			}
			return {
				...state,
				error: '',
				items: state.items.map((item) =>
					isSameProduct(item, action.payload) ? { ...item, quantity } : item
				),
			};
		}
		case 'CLEAR_CART':
			return initialState;
		case 'CLEAR_CART_ERROR':
			return { ...state, error: '' };
		default:
			return state;
	}
};
