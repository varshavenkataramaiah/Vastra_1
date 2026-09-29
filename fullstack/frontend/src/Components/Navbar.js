import React from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Footer from './Footer';

function Navbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const searchParams = new URLSearchParams(location.search)
    const currentUser = useSelector((state) => state.user.currentUser)
    const cartItems = useSelector((state) => state.cart.items)
    const wishlistItems = useSelector((state) => state.wishlist.items)
    const cartError = useSelector((state) => state.cart.error)
    const cartCount = currentUser ? cartItems.reduce((total, item) => total + item.quantity, 0) : 0
    const wishlistCount = currentUser ? wishlistItems.length : 0
    const dispatch = useDispatch()

    const navClassName = (path) => `nav-link ${location.pathname === path ? 'active' : ''}`
    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/men', label: 'Men' },
        { path: '/women', label: 'Women' },
        { path: '/kids', label: 'Kids' },
        { path: '/beauty', label: 'Beauty' },
        { path: '/living', label: 'Living' },
        { path: '/accessories', label: 'Accessories' },
        { path: '/footwear', label: 'Footwear' },
    ]

    const handleSearch = (event) => {
        event.preventDefault()
        const query = event.currentTarget.elements.search.value.trim()
        navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
    }

    return (
        <div className="app-shell">
            <nav className="navbar navbar-expand-lg navbar-light bg-light marketplace-navbar">
                <div className="container-fluid site-nav-inner">
                    <Link className="navbar-brand" to="/">
                        <img
                            src="https://static.vecteezy.com/system/resources/thumbnails/080/424/393/small/modern-letter-v-logo-icon-with-upward-arrow-blue-metallic-gradient-alphabet-symbol-creative-growth-and-success-concept-isolated-on-transparent-background-for-business-and-finance-png.png"
                            alt="Vastra home"
                            width="80"
                        />
                        <span>Vastra</span>
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse nav-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            {navItems.map((item) => (
                                <li className="nav-item" key={item.path}>
                                    <Link className={navClassName(item.path)} aria-current="page" to={item.path}>
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="nav-right-group">
                            <form className="navbar-search" role="search" onSubmit={handleSearch}>
                                <span className="navbar-search-icon" aria-hidden="true">&#128269;</span>
                                <input
                                    name="search"
                                    type="search"
                                    placeholder="Search products, brands and more"
                                    aria-label="Search products, brands and more"
                                    defaultValue={searchParams.get('q') || ''}
                                />
                            </form>

                            <div className="nav-actions">
                                {!currentUser?.isAdmin && <>
                                    <Link className="nav-action" to="/wishlist">
                                        <span className="nav-action-icon" aria-hidden="true">&#9825;</span>
                                        <span>Wishlist</span>
                                        <b>{wishlistCount}</b>
                                    </Link>
                                    <Link className="nav-action" to="/cart">
                                        <span className="nav-action-icon" aria-hidden="true">&#128722;</span>
                                        <span>Bag</span>
                                        <b>{cartCount}</b>
                                    </Link>
                                </>}
                                <Link className="nav-action" to={currentUser?.isAdmin ? '/admin' : currentUser ? '/account' : '/login'}>
                                    <span className="nav-action-icon" aria-hidden="true">&#128100;</span>
                                    <span>{currentUser?.isAdmin ? 'Admin' : currentUser ? 'Account' : 'Login'}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            {cartError && (
                <div className="container pt-3">
                    <div className="alert alert-danger alert-dismissible mb-0" role="alert">
                        {cartError}
                        <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => dispatch({ type: 'CLEAR_CART_ERROR' })} />
                    </div>
                </div>
            )}
            <div className="app-content">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}

export default Navbar;