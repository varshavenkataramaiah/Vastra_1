import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../Components/Navbar';

const returnSteps = ['REQUESTED', 'ACCEPTED', 'RECEIVED'];

function Returns() {
  const orders = useSelector((state) => state.orders.items);
  const returns = orders.filter((order) => order.returnStatus && order.returnStatus !== 'NONE');

  return (
    <>
      <Navbar />
      <main className="container returns-page py-4">
        <header className="returns-hero">
          <div>
            <span className="orders-kicker">After-sales care</span>
            <h1 className="page-title mb-2">Returns centre</h1>
            <p>Everything about your returns and refunds, in one place.</p>
          </div>
          <Link className="orders-back-link" to="/orders">← Back to orders</Link>
        </header>
        <section className="returns-guide">
          <div><span className="returns-guide-number">01</span><strong>Request</strong><p>Ask for a return after delivery.</p></div>
          <div><span className="returns-guide-number">02</span><strong>Review</strong><p>Our team accepts and reviews it.</p></div>
          <div><span className="returns-guide-number">03</span><strong>Refund</strong><p>Refund starts once the item arrives.</p></div>
        </section>
        {returns.length === 0 ? (
          <section className="empty-state text-center py-5">
            <span className="returns-empty-mark">↺</span>
            <h2>No returns yet</h2>
            <p className="text-muted">Eligible delivered orders will appear here.</p>
            <Link className="btn btn-dark" to="/orders">View my orders</Link>
          </section>
        ) : (
          <section className="returns-list">
            {returns.map((order) => {
              const stepIndex = returnSteps.indexOf(order.returnStatus);
              const isRefunded = order.refundStatus === 'INITIATED';
              return (
                <article className="return-card" key={order.id}>
                  <div className="return-card-heading">
                    <div>
                      <span className="order-label">Order #{order.id.slice(-8).toUpperCase()}</span>
                      <h2>{order.items[0]?.name || 'Returned item'}</h2>
                      <span className="text-muted">Requested on {new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <strong>Rs. {Number(order.total).toFixed(2)}</strong>
                  </div>
                  <div className="return-progress" aria-label={`Return status: ${order.returnStatus}`}>
                    {returnSteps.map((step, index) => <div className={`return-step ${index <= stepIndex ? 'complete' : ''}`} key={step}><span>{index < stepIndex ? '✓' : index + 1}</span><strong>{step.charAt(0) + step.slice(1).toLowerCase()}</strong></div>)}
                    <div className={`return-step ${isRefunded ? 'complete' : ''}`}><span>{isRefunded ? '✓' : 4}</span><strong>{isRefunded ? 'Refund initiated' : 'Refund'}</strong></div>
                  </div>
                  {order.returnReason && <p className="return-reason"><strong>Your reason:</strong> {order.returnReason}</p>}
                  <div className="return-card-footer">
                    <span>{order.returnStatus === 'REJECTED' ? 'Return request rejected' : order.returnStatus === 'RECEIVED' ? (isRefunded ? 'Refund initiated to your original payment method' : 'Received · refund pending') : `Return ${order.returnStatus.toLowerCase()}`}</span>
                    <Link to={`/orders/${order.id}`}>View order →</Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}

export default Returns;
