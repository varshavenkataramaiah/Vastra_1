import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import './Details.css'

let ProductDetails = ({ product }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const currentUser = useSelector((state) => state.user.currentUser)
    const galleryImages = product.gallery || [
        product.image,
        product.image.replace('w=700', 'w=900&h=900'),
        product.image.replace('q=85', 'q=70&sat=-10'),
        product.image.replace('fit=crop', 'fit=crop&crop=faces'),
    ]
    const [selectedImage, setSelectedImage] = useState(product.image)

    const addToCart = () => {
        if (!currentUser) {
            navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
            return false
        }
        dispatch({ type: 'ADD_TO_CART', payload: product })
        return true
    }

    const buyNow = () => {
        if (addToCart()) navigate('/checkout')
    }

  return (
    <section id="product-info">

        <div className="item-image-parent">
            <div className="item-list-vertical">
                {galleryImages.map((image, index) => (
                    <button className={`thumb-box ${selectedImage === image ? 'thumb-box-active' : ''}`} type="button" key={`${image}-${index}`} onClick={() => setSelectedImage(image)}>
                        <img src={image} alt={`${product.name || 'Product'} view ${index + 1}`} />
                    </button>
                ))}

            </div>
            <div className="item-image-main">
                <img src={selectedImage} alt={product.name || 'Product'} />
            </div>
        </div>

        <div className="item-info-parent">
            <div className="main-info">
                <h4>{product.name || product.title || 'Product'}</h4>
                <div className="star-rating">
                    <span>★★★★</span>★
                </div>
                <p>Price: <span id="price">₹ {product.price}</span></p>
            </div>
            <div className="select-items">
                
                <div className="change-color">
                    <label><b>Colour:</b> Black</label><br />
                    <div className="thumb-box">
                        <img src="https://i.ibb.co/QjkJJk3/select1.jpg" alt="thumbnail" />
                    </div>
                    <div className="thumb-box">
                        <img src="https://i.ibb.co/C297yD0/select2.jpg" alt="thumbnail" />
                    </div>
                </div>
                
                <div className="change-size">
                    <label><b>Size:</b></label><br/>
                    <select>
                        <option>S</option>
                        <option>M</option>
                        <option>L</option>
                        <option>XL</option>
                        <option>2XL</option>
                    </select>
                </div>

                <div className="description">
                    <p>{product.description}</p>
                    <ul>
                        <li>Care Instructions: Machine Wash</li>
                        <li>Fit Type: classNameic Fit</li>
                        <li>Color name: Black-White</li>
                        <li>Material: Cotton</li>
                        <li>Pattern: Solid</li>
                    </ul>
                </div>
                <div className="product-detail-actions">
                    <button type="button" className="btn btn-outline-dark" onClick={addToCart}>
                        Add to cart
                    </button>
                    <button type="button" className="btn btn-dark" onClick={buyNow}>
                        Buy now
                    </button>
                </div>
            </div>
        </div>
    </section>
   
  )
}

export default ProductDetails