import React from 'react'
import { Link } from 'react-router-dom';

function Ads({ name, label, collection, tag, to }) {
    const images = {
        iphone: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=85',
        samsung: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=85',
        oneplus: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=85',
        xiaomi: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=85',
    }

    return (
        <div className='col-12 col-sm-6 col-lg-3'>
            <div className='brand-card'>
                <div className='brand-image-wrap'>
                    <img src={images[name]} alt={`${label} collection`} className='brand-image' />
                    <div className='brand-overlay'>
                        <span>{tag}</span>
                    </div>
                </div>
                <div className='brand-content'>
                    <h3>{label}</h3>
                    <p>{collection}</p>
                    <Link to={to} className='brand-shop-link'>Shop now</Link>
                </div>
            </div>
        </div>
    )
}

export default Ads