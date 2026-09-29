import React from 'react';
import Navbar from '../Components/Navbar';
import Carousel from '../Components/Carousel';
import Ads from '../Components/Ads';
import CategoryProducts from '../Components/CategoryProducts';

function Home() {
  const product_array = [
    { name: 'iphone', label: 'Smart essentials', collection: "Women's clothing", tag: 'New launches', to: '/women' },
    { name: 'samsung', label: 'Signature style', collection: 'Accessories', tag: 'Best sellers', to: '/accessories' },
    { name: 'oneplus', label: 'Performance picks', collection: 'Beauty', tag: 'Trending now', to: '/beauty' },
    { name: 'xiaomi', label: 'Everyday value', collection: 'Home & living', tag: 'Hot deals', to: '/living' },
  ];

  return (
    <div>
      <div className='container-fluid'>
        <Navbar />
        <Carousel />
        <div className='row g-3 home-brand-row'>
          {product_array.map((item) => (
            <Ads
              key={item.name}
              name={item.name}
              label={item.label}
              collection={item.collection}
              tag={item.tag}
              to={item.to}
            />
          ))}
        </div>
        <CategoryProducts title='Featured Products' category='featured' />
      </div>
    </div>
  );
}

export default Home;
