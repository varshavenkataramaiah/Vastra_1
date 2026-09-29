import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import setCurrentProduct from '../actions/setCurrentProduct'




function IconList({product}) {
  let dispatch = useDispatch()
    const currentUser = useSelector((state) => state.user.currentUser)
    const navigate = useNavigate()
    const location = useLocation()
    let isWishlisted = useSelector((state) => state.wishlist.items.some(
        (item) => item.id === product.id && item.image === product.image
    ))
  let handleCurrentProduct = () => {
    dispatch(setCurrentProduct(product))
  } 
    let handleWishlist = (event) => {
        event.preventDefault()
        if (!currentUser) {
            navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
            return
        }
        dispatch({ type: 'TOGGLE_WISHLIST', payload: product })
    }
    let handleCart = (event) => {
        event.preventDefault()
        if (!currentUser) {
            navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
            return
        }
        dispatch({ type: 'ADD_TO_CART', payload: product })
    }
  return (
            <ul className="d-flex align-items-center justify-content-center list-unstyled icons">
                <Link onClick={handleCurrentProduct} to={`/details/${product.id}`}>
                    <li className="icon">
                        <span className="fas fa-expand-arrows-alt"></span>
                    </li>
                </Link>
                <Link onClick={handleWishlist} to="/wishlist" aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                    <li className="icon mx-3">
                        <span className={`fas fa-heart ${isWishlisted ? 'wishlist-active' : ''}`}></span>
                    </li>
                </Link>
                <Link onClick={handleCart} to="/cart" aria-label="Add to cart">
                    <li className="icon">
                        <span className="fas fa-shopping-bag"></span>

                    </li>
                </Link>
            </ul>
  )
}

export default IconList
