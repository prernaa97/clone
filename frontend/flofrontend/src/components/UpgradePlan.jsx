import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';

export default function UpgradePlan() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const decode = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch { return null; }
  };

  useEffect(() => {
    const css = `
    /* Main container styles */
    .upgrade-plan-container { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      min-height: 100vh; 
      padding: 20px 0;
      overflow-x: hidden;
    }
    
    /* Header section styles */
    .upgrade-header-section {
      text-align: center;
      padding: 40px 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      margin: 0 20px 30px 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .upgrade-header-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .upgrade-header-subtitle {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 0;
    }
    
    /* Current plan card improvements */
    .current-plan-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.8);
      margin: 0 20px 30px 20px;
      overflow: hidden;
    }
    
    .current-plan-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 30px;
      border: none;
    }
    
    .current-plan-body {
      padding: 30px;
      background: white;
    }
    
    .current-plan-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 20px;
    }
    
    .current-plan-stats {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 25px;
    }
    
    .current-plan-stat {
      text-align: center;
      flex: 1;
      min-width: 120px;
    }
    
    .current-plan-stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .current-plan-stat-label {
      font-size: 0.9rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .current-plan-progress {
      margin: 20px 0;
    }
    
    .current-plan-progress .progress {
      height: 12px;
      border-radius: 10px;
      background: #e2e8f0;
      overflow: hidden;
    }
    
    .current-plan-progress .progress-bar {
      background: linear-gradient(90deg, #10b981, #059669);
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    
    .renew-same-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    
    .renew-same-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      color: white;
    }
    
    /* Warning banner styles */
    .upgrade-warning-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
      border: 1px solid #f59e0b;
      border-radius: 15px;
      padding: 20px;
      margin: 0 20px 30px 20px;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
    }
    
    .upgrade-warning-text {
      color: #92400e;
      margin: 0;
      font-weight: 500;
    }
    
    /* Pricing section improvements */
    .pricing-section { 
      background: transparent; 
      color: #1e293b; 
      padding: 20px; 
      text-align: center;
      margin: 0 20px;
    }
    
    .pricing-section-title {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin-bottom: 30px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    /* Keep existing pricing card styles exactly as they are */
    .pricing-cards { display:flex; justify-content:center; gap:32px; flex-wrap:wrap; margin-top: 30px; }
    .pricing-card { background:#ffffff; box-shadow:0 8px 24px rgba(102,126,234,0.12); width:320px; padding:60px 30px; position:relative; display:flex; flex-direction:column; align-items:center; margin-bottom:30px; border-radius:12px; border:1px solid #e2e8f0; }
    .pricing-card-header { background:#ffffff; color:#1e293b; width:220px; font-size:1rem; font-weight:700; border-radius:10px; padding:10px 20px; position:absolute; top:-30px; left:50%; transform:translateX(-50%); box-shadow:0 6px 14px rgba(102,126,234,0.25); border:1px solid #e2e8f0; }
    .pricing-card-price { font-size:2rem; font-weight:800; margin:30px 0 20px 0; color:#1e293b; }
    .pricing-features { list-style:none; margin-bottom:24px; color:#475569; font-size:0.95rem; padding:0; }
    .pricing-features li { margin:14px; }
    .pricing-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; border:none; border-radius:10px; padding:10px 20px; font-size:0.95rem; font-weight:700; cursor:pointer; transition: transform .12s ease, box-shadow .12s ease; box-shadow: 0 8px 18px rgba(102, 126, 234, 0.35); }
    .pricing-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(102, 126, 234, 0.45); }
    .pricing-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .pricing-card.starter { border-top:6px solid #667eea; }
    .pricing-card.business { border-top:6px solid #20c997; }
    .pricing-card.ecommerce { border-top:6px solid #e94e77; }
    
    /* Responsive design */
    @media (max-width: 1200px) { 
      .pricing-cards { flex-direction: column; align-items: center; }
      .upgrade-header-title { font-size: 2rem; }
      .current-plan-stats { flex-direction: column; }
      .current-plan-stat { min-width: auto; }
    }
    
    @media (max-width: 768px) {
      .upgrade-plan-container { padding: 10px 0; }
      .upgrade-header-section, .current-plan-card, .upgrade-warning-banner, .pricing-section { margin: 0 10px 20px 10px; }
      .upgrade-header-section { padding: 30px 15px; }
      .current-plan-body { padding: 20px; }
      .current-plan-title { font-size: 1.5rem; }
    }
    `;
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-upgrade-plan-style', 'true');
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
    return () => { 
      const existingStyle = document.querySelector('[data-upgrade-plan-style="true"]');
      if (existingStyle) document.head.removeChild(existingStyle); 
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = Cookies.get('token');
      const payload = decode(token || '');
      const userId = payload?.sub;
      if (!userId) return;

      // Load plans - filter out free plans for renewal
      const plansRes = await axios.get('http://localhost:5000/api/plan');
      if (plansRes.data?.success) {
        // Filter out free plans (price = 0) for renewal
        const filteredPlans = plansRes.data.plans.filter(plan => plan.price > 0);
        setPlans(filteredPlans || []);
      }

      // Load current subscription status - using correct endpoint
      try {
        const subRes = await axios.get(`http://localhost:5000/api/doctors/subscription/status?doctorId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (subRes.data?.success) {
          setCurrentSubscription(subRes.data);
          
          // Get current plan details from active subscription
          if (subRes.data.hasActive) {
            try {
              // Get all plans to find current plan details
              const allPlansRes = await axios.get('http://localhost:5000/api/plan');
              if (allPlansRes.data?.success) {
                // Find current plan - this would need subscription to have planId
                // For now, we'll simulate current plan logic
                const activePlans = allPlansRes.data.plans.filter(p => p.price > 0);
                if (activePlans.length > 0) {
                  setCurrentPlan(activePlans[0]); // Set first paid plan as current for demo
                }
              }
            } catch (planErr) {
              console.log('Could not fetch current plan details:', planErr.message);
            }
          }
        }
      } catch (err) {
        // If subscription status API fails, continue without current subscription info
        console.log('No subscription status available:', err.message);
      }
    } catch (e) {
      console.error('Error loading data:', e);
      toast.error('Failed to load plans');
    }
  };

  const getCardClass = (idx) => idx % 3 === 0 ? 'starter' : idx % 3 === 1 ? 'business' : 'ecommerce';
  const getTopBorder = (klass) => klass === 'starter' ? '#667eea' : klass === 'business' ? '#20c997' : '#e94e77';

  const handleRenewPlan = async (plan) => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      const payload = decode(token || '');
      const userId = payload?.sub;
      if (!userId) { toast.error('Please login again'); return; }

      // If user has active subscription, show confirmation first
      if (currentSubscription?.hasActive) {
        setSelectedPlan(plan);
        setShowModal(true);
        return;
      }

      // If no active subscription, proceed directly
      await proceedWithRenewal(plan, userId, token);
    } catch (e) {
      console.error('Error preparing renewal:', e);
      toast.error('Renewal preparation failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const confirmRenewal = async () => {
    if (!selectedPlan) return;
    setShowModal(false);
    
    try {
      const token = Cookies.get('token');
      const payload = decode(token || '');
      const userId = payload?.sub;
      await proceedWithRenewal(selectedPlan, userId, token);
    } catch (e) {
      console.error(e);
      toast.error('Renewal failed');
    }
  };

  const proceedWithRenewal = async (plan, userId, token) => {
    try {
      // If has active subscription, use renewal flow
      if (currentSubscription?.hasActive) {
        // Step 1: Prepare renewal
        await axios.post('http://localhost:5000/api/subscription/renew/prepare', {
          doctorId: userId,
          planId: plan._id,
          confirmReplace: true
        }, { headers: { Authorization: `Bearer ${token}` } });

        // Step 2: Create checkout
        const checkoutRes = await axios.post('http://localhost:5000/api/payment/checkout', {
          amount: Number(plan.price)
        });
        if (!checkoutRes.data?.success) { toast.error('Checkout failed'); return; }
        const order = checkoutRes.data.order;

        // Step 3: Open Razorpay with renewal finalize
        openRazorpay(order, plan, userId, true);
      } else {
        // New subscription flow
        const subRes = await axios.post('http://localhost:5000/api/subscription', {
          doctorId: userId,
          planId: plan._id
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (!subRes.data?.success) { toast.error('Failed to create subscription'); return; }
        const subscription = subRes.data.subscription;

        const checkoutRes = await axios.post('http://localhost:5000/api/payment/checkout', {
          amount: Number(plan.price)
        });
        if (!checkoutRes.data?.success) { toast.error('Checkout failed'); return; }
        const order = checkoutRes.data.order;

        openRazorpay(order, plan, userId, false, subscription._id);
      }
    } catch (e) {
      console.error(e);
      toast.error('Payment setup failed');
    }
  };

  const openRazorpay = (order, plan, userId, isRenewal, subId = null) => {
    const options = {
      key: (import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RCgSKXFcOMhnGT'),
      amount: order.amount,
      currency: order.currency,
      name: 'Healthcare Platform',
      description: `${isRenewal ? 'Renew to' : 'Subscribe to'} ${plan.name}`,
      order_id: order.id,
      handler: async function (response) {
        try {
          if (isRenewal) {
            // Finalize renewal
            const finalizeRes = await axios.post('http://localhost:5000/api/subscription/renew/finalize', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              doctorId: userId,
              planId: plan._id,
              confirmReplace: true
            });
            if (finalizeRes.data?.success) {
              toast.success('Subscription renewed successfully!');
              setTimeout(() => window.location.href = '/profile-status', 1500);
            } else {
              toast.error('Renewal verification failed');
            }
          } else {
            // Verify new subscription
            const verifyRes = await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(plan.price),
              sub_id: subId
            });
            if (verifyRes.data?.success) {
              toast.success('Subscription activated successfully!');
              setTimeout(() => window.location.href = '/profile-status', 1500);
            } else {
              toast.error('Verification failed');
            }
          }
        } catch (e) {
          console.error(e);
          toast.error('Payment verification error');
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
  };

  return (
    <div className="upgrade-plan-container">
      <ToastContainer />
      
      {/* Header Section */}
      <div className="upgrade-header-section">
        <h1 className="upgrade-header-title">Renew Subscription</h1>
        <p className="upgrade-header-subtitle">Upgrade or renew your doctor account</p>
      </div>
      
      {/* Current Plan Details */}
      {currentSubscription?.hasActive && currentPlan && (
        <div className="current-plan-card">
          <div className="current-plan-header">
            <h5 className="mb-0">
              <i className="fas fa-crown me-2"></i>
              Your Current Active Plan
            </h5>
          </div>
          <div className="current-plan-body">
            <h4 className="current-plan-title">{currentPlan.name}</h4>
            <div className="current-plan-stats">
              <div className="current-plan-stat">
                <div className="current-plan-stat-value text-success">₹{currentPlan.price}</div>
                <div className="current-plan-stat-label">Price</div>
              </div>
              <div className="current-plan-stat">
                <div className="current-plan-stat-value text-info">{currentPlan.days}</div>
                <div className="current-plan-stat-label">Days</div>
              </div>
              <div className="current-plan-stat">
                <div className="current-plan-stat-value text-warning">{currentPlan.postLimit}</div>
                <div className="current-plan-stat-label">Posts</div>
              </div>
              <div className="current-plan-stat">
                <div className="current-plan-stat-value text-primary">{currentSubscription.daysLeft || 0}</div>
                <div className="current-plan-stat-label">Days Left</div>
              </div>
            </div>
            
            <div className="current-plan-progress">
              <div className="progress">
                <div 
                  className="progress-bar" 
                  style={{width: `${Math.max(0, Math.min(100, ((currentSubscription.daysLeft || 0) / currentPlan.days) * 100))}%`}}
                ></div>
              </div>
              <small className="text-muted d-block text-center mt-2">Time remaining</small>
            </div>
            
            <div className="text-center">
              <button 
                className="renew-same-btn"
                onClick={() => handleRenewPlan(currentPlan)}
                disabled={loading}
              >
                <i className="fas fa-redo me-2"></i>
                Renew Same Plan
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Warning for existing users */}
      {currentSubscription?.hasActive && (
        <div className="upgrade-warning-banner">
          <p className="upgrade-warning-text">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Note:</strong> Renewing will replace your current plan with the new one and reset your subscription period.
          </p>
        </div>
      )}

      {/* Pricing Section */}
      <section className="pricing-section">
        <h2 className="pricing-section-title">Choose Your Plan</h2>
        
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
                
                <button 
                  className="pricing-btn" 
                  onClick={() => handleRenewPlan(p)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 
                   currentSubscription?.hasActive ? 'UPGRADE/RENEW' : 'BUY NOW'}
                </button>
              </div>
            );
          })}
          {plans.length === 0 && (
            <div style={{color: 'white', padding: '40px', fontSize: '1.2rem'}}>No plans available</div>
          )}
        </div>
      </section>

      {/* Confirmation Modal */}
      {showModal && selectedPlan && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Confirm Subscription Renewal</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>You are about to renew your subscription with the <strong>{selectedPlan.name}</strong> plan.</p>
                <p>Your current plan will be deactivated and replaced with the new one.</p>
                <p className="text-muted">Are you sure you want to continue?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={confirmRenewal}>Confirm Renewal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}