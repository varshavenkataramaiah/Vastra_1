const initialState = {
	items: [],
};

const isSameProduct = (firstProduct, secondProduct) =>
	firstProduct.id === secondProduct.id && firstProduct.image === secondProduct.image;

export const wishlistReducer = (state = initialState, action) => {
	switch (action.type) {
		case 'SET_WISHLIST':
			return { items: action.payload || [] };
		case 'LOGOUT_USER':
			return initialState;
		case 'TOGGLE_WISHLIST': {
			const alreadySaved = state.items.some((item) => isSameProduct(item, action.payload));

			return {
				...state,
				items: alreadySaved
					? state.items.filter((item) => !isSameProduct(item, action.payload))
					: [...state.items, action.payload],
			};
		}
		case 'REMOVE_FROM_WISHLIST':
			return {
				...state,
				items: state.items.filter((item) => !isSameProduct(item, action.payload)),
			};
		default:
			return state;
	}
};
