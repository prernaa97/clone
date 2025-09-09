import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";
import Cookies from "js-cookie";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useHeader } from "../context/HeaderContext";

export default function Subscription() {
  const { updateHeader } = useHeader();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [postUsage, setPostUsage] = useState({ used: 0, limit: 0 });

  // Update header when component mounts
  useEffect(() => {
    updateHeader("Subscription Dashboard", "View your subscription details and history");
  }, [updateHeader]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      
      if (!token) {
        toast.error("Please login to view subscription information");
        return;
      }

      const payload = decodeToken(token);
      if (payload?.sub) {
        setUser({ 
          id: payload.sub, 
          name: payload.name || payload.email?.split('@')[0] || 'User', 
          email: payload.email 
        });

        // Fetch all data in parallel
        await Promise.all([
          fetchDoctorProfile(token, payload.sub),
          fetchSubscriptionData(token, payload.sub),
          fetchPaymentHistory(token, payload.sub),
          fetchPostUsage(token, payload.sub)
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to fetch subscription data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorProfile = async (token, userId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/profiles/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const userProfile = response.data.profiles.find(
          profile => profile.userId._id === userId || profile._id === userId
        );
        setDoctorProfile(userProfile);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchSubscriptionData = async (token, userId) => {
    try {
      // Fetch current subscription status
      const subResponse = await axios.get(
        `http://localhost:5000/api/doctors/subscription/status?doctorId=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (subResponse.data?.success) {
        setCurrentSubscription(subResponse.data);

        // If there's an active subscription, get plan details
        if (subResponse.data.hasActive && subResponse.data.currentPlan) {
          setCurrentPlan(subResponse.data.currentPlan);
        }
      }

      // Fetch subscription history
      const historyResponse = await axios.get(
        `http://localhost:5000/api/subscription/doctor/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (historyResponse.data?.success) {
        setSubscriptionHistory(historyResponse.data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    }
  };

  const fetchPaymentHistory = async (token, userId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/payment/history/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data?.success) {
        setPaymentHistory(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const fetchPostUsage = async (token, userId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/posts/usage/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data?.success) {
        setPostUsage({
          used: response.data.postsUsed || 0,
          limit: response.data.postLimit || 0
        });
      }
    } catch (error) {
      console.error('Error fetching post usage:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysLeft = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getSubscriptionStatus = () => {
    if (!currentSubscription?.hasActive) return 'No Active Subscription';
    
    const daysLeft = calculateDaysLeft(currentSubscription.endDate);
    if (daysLeft <= 0) return 'Expired';
    if (daysLeft <= 7) return 'Expiring Soon';
    return 'Active';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'success';
      case 'Expiring Soon': return 'warning';
      case 'Expired': return 'danger';
      case 'No Active Subscription': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
  return (
      <>
        <ToastContainer />
        <div className="container-fluid p-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Loading subscription information...</p>
              </div>
            </div>
      </div>
      </>
    );
  }

          return (
    <>
      <ToastContainer />
      <div className="container-fluid p-4" style={{ height: 'calc(100vh - 140px)', overflow: 'auto' }}>
        <div className="row g-4">
          
          {/* Doctor Profile Information */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-user-md me-2"></i>
                  Doctor Information
                </h5>
              </div>
              <div className="card-body">
                {doctorProfile ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Name</small>
                        <strong>{doctorProfile.name}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Email</small>
                        <strong>{user?.email}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Specialization</small>
                        <strong>{doctorProfile.specialization}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Experience</small>
                        <strong>{doctorProfile.experience}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Status</small>
                        <span className={`badge bg-${doctorProfile.status === 'Approved' ? 'success' : doctorProfile.status === 'Rejected' ? 'danger' : 'warning'}`}>
                          {doctorProfile.status}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Registration Date</small>
                        <strong>{formatDate(doctorProfile.createdAt)}</strong>
                      </div>
                    </div>
                    {doctorProfile.licenseNumber && (
                      <div className="col-12">
                        <div className="border rounded p-3 bg-light">
                          <small className="text-muted d-block mb-1">License Number</small>
                          <strong>{doctorProfile.licenseNumber}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No Doctor Profile Found</h6>
                    <p className="text-muted small">Submit your doctor profile to get started</p>
                    <a href="/doctor-profile" className="btn btn-primary btn-sm">
                      <i className="fas fa-plus me-1"></i>
                      Submit Profile
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Subscription Information */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-crown me-2"></i>
                  Current Subscription
                </h5>
              </div>
              <div className="card-body">
                {currentSubscription?.hasActive && currentPlan ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Plan Name</small>
                        <strong>{currentPlan.name}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Status</small>
                        <span className={`badge bg-${getStatusColor(getSubscriptionStatus())}`}>
                          {getSubscriptionStatus()}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Start Date</small>
                        <strong>{formatDate(currentSubscription.startDate)}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">End Date</small>
                        <strong>{formatDate(currentSubscription.endDate)}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Days Remaining</small>
                        <strong className={calculateDaysLeft(currentSubscription.endDate) <= 7 ? 'text-warning' : 'text-success'}>
                          {calculateDaysLeft(currentSubscription.endDate)} days
                        </strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Post Usage</small>
                        <div className="d-flex align-items-center">
                          <strong className="me-2">{postUsage.used} / {postUsage.limit}</strong>
                          <div className="progress flex-grow-1" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-info" 
                              style={{ width: `${postUsage.limit > 0 ? (postUsage.used / postUsage.limit) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="border rounded p-3 bg-light">
                        <small className="text-muted d-block mb-1">Plan Details</small>
                        <div className="d-flex justify-content-between align-items-center">
                          <span><strong>Duration:</strong> {currentPlan.days} days</span>
                          <span><strong>Price:</strong> ₹{currentPlan.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-crown fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No Active Subscription</h6>
                    <p className="text-muted small">Choose a plan to start your doctor journey</p>
                    <a href="/upgrade-plan" className="btn btn-success btn-sm">
                      <i className="fas fa-plus me-1"></i>
                      Choose Plan
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fas fa-credit-card me-2"></i>
                  Payment History
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {paymentHistory.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {paymentHistory.map((payment, index) => (
                      <div key={index} className="list-group-item border-0 px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1 fw-bold">₹{payment.amount}</h6>
                            <p className="mb-1 text-muted small">{payment.planName || 'Subscription Payment'}</p>
                            <small className="text-muted">{formatDateTime(payment.createdAt)}</small>
                          </div>
                          <span className={`badge ${payment.status === 'paid' ? 'bg-success' : payment.status === 'pending' ? 'bg-warning' : 'bg-danger'}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No Payment History</h6>
                    <p className="text-muted small">Your payment transactions will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription History */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <i className="fas fa-history me-2"></i>
                  Subscription History
                </h5>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {subscriptionHistory.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {subscriptionHistory.map((subscription, index) => (
                      <div key={index} className="list-group-item border-0 px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1 fw-bold">{subscription.planName || 'Subscription Plan'}</h6>
                            <p className="mb-1 text-muted small">
                              {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                            </p>
                            <small className="text-muted">
                              Duration: {subscription.planDays || 'N/A'} days
                            </small>
                          </div>
                          <span className={`badge ${subscription.isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {subscription.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-clock fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No Subscription History</h6>
                    <p className="text-muted small">Your subscription history will appear here</p>
            </div>
        )}
      </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
