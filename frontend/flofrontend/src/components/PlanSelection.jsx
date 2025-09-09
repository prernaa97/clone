import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function PlanSelection() {
  const [plans, setPlans] = useState([]);
  const token = useMemo(() => Cookies.get('token'), []);

  useEffect(() => {
    let mounted = true;
    axios.get('http://localhost:5000/api/plan')
      .then(r => {
        if (mounted) setPlans(r.data?.plans || []);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const css = `
    .pricing-section { background: transparent; color:#1e293b; padding:60px 0 80px 0; text-align:center; }
    .pricing-title { font-size:2.0rem; font-weight:700; margin-bottom:10px; }
    .pricing-title span { display:block; font-size:1.25rem; font-weight:500; color:#64748b; }
    .pricing-subtitle { color:#64748b; margin-bottom:40px; font-size:0.95rem; }
    .pricing-cards { display:flex; justify-content:center; gap:32px; flex-wrap:wrap; }
    .pricing-card { background:#ffffff; box-shadow:0 8px 24px rgba(102,126,234,0.12); width:320px; padding:60px 30px; position:relative; display:flex; flex-direction:column; align-items:center; margin-bottom:30px; border-radius:12px; border:1px solid #e2e8f0; }
    .pricing-card-header { background:#ffffff; color:#1e293b; width:220px; font-size:1rem; font-weight:700; border-radius:10px; padding:10px 20px; position:absolute; top:-30px; left:50%; transform:translateX(-50%); box-shadow:0 6px 14px rgba(102,126,234,0.25); border:1px solid #e2e8f0; }
    .pricing-card-price { font-size:2rem; font-weight:800; margin:30px 0 20px 0; color:#1e293b; }
    .pricing-features { list-style:none; margin-bottom:24px; color:#475569; font-size:0.95rem; padding:0; }
    .pricing-features li { margin:14px; }
    .pricing-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; border:none; border-radius:10px; padding:10px 20px; font-size:0.95rem; font-weight:700; cursor:pointer; transition: transform .12s ease, box-shadow .12s ease; box-shadow: 0 8px 18px rgba(102, 126, 234, 0.35); }
    .pricing-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(102, 126, 234, 0.45); }
    .pricing-card.starter { border-top:6px solid #667eea; }
    .pricing-card.business { border-top:6px solid #20c997; }
    .pricing-card.ecommerce { border-top:6px solid #e94e77; }
    @media (max-width:1000px){ .pricing-cards { flex-direction:column; align-items:center; } }
    `;
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-subscription-style', 'true');
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
    return () => { document.head.removeChild(styleTag); };
  }, []);

  const getCardClass = (idx) => idx % 3 === 0 ? 'starter' : idx % 3 === 1 ? 'business' : 'ecommerce';
  const getTopBorder = (klass) => klass === 'starter' ? '#3a4e7c' : klass === 'business' ? '#2ecfcf' : '#e94e77';

  const decode = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch { return null; }
  };

  const handleBuy = async (plan) => {
    try {
      const t = Cookies.get('token');
      const payload = decode(t || '');
      const userId = payload?.sub;
      if (!userId) { alert('Please login again'); return; }

      // Step 1: Create a pending subscription for this user and plan
      const subRes = await axios.post('http://localhost:5000/api/subscription', {
        doctorId: userId,
        planId: plan._id
      }, { headers: { Authorization: `Bearer ${t}` } });

      if (!subRes.data?.success) { alert('Failed to create subscription'); return; }
      const subscription = subRes.data.subscription;

      // Step 2: Create Razorpay order for amount
      const co = await axios.post('http://localhost:5000/api/payment/checkout', {
        amount: Number(plan.price)
      });
      if (!co.data?.success) { alert('Checkout failed'); return; }
      const order = co.data.order;

      // Step 3: Open Razorpay
      const options = {
        key: (import.meta.env.VITE_RAZORPAY_KEY_ID || window.RAZORPAY_KEY_ID || 'rzp_test_RCgSKXFcOMhnGT'),
        amount: order.amount,
        currency: order.currency,
        name: 'Healthcare Platform',
        description: plan.name,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Step 4: Verify
            const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(plan.price),
              sub_id: subscription._id
            });
            if (verifyRes.data?.success) {
              window.location.href = '/profile-status';
            } else {
              alert('Verification failed');
            }
          } catch (e) {
            console.error(e);
            alert('Verification error');
          }
        },
        theme: { color: '#667eea' }
      };

      const openCheckout = () => {
        const rp = new window.Razorpay(options);
        rp.open();
      };
      if (window.Razorpay) {
        openCheckout();
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = openCheckout;
        document.body.appendChild(script);
      }
    } catch (e) {
      console.error(e);
      alert('Payment start failed');
    }
  };

  return (
    <section className="pricing-section">
      <h2 className="pricing-title">Choose your plan<br /><span>activate your doctor account</span></h2>
      <p className="pricing-subtitle">Select a subscription to continue.</p>
      <div className="pricing-cards">
        {plans.map((p, i) => {
          const klass = getCardClass(i);
          return (
            <div className={`pricing-card ${klass}`} key={p._id}>
              <div className="pricing-card-header" style={{ borderTop: `7px solid ${getTopBorder(klass)}` }}>
                {p.name}<br /><span className="pricing-card-price">₹ {p.price}</span>
              </div>
              <div className="pricing-card-price"></div>
              <ul className="pricing-features">
                <li>{p.days} days validity</li>
                <li>{p.postLimit} post limit</li>
                <li>{p.discount}% discount</li>
                <li>Instant activation</li>
              </ul>
              <button className="pricing-btn" onClick={() => handleBuy(p)}>BUY NOW</button>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div className="text-muted">No plans available</div>
        )}
      </div>
    </section>
  );
}
