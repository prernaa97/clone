import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";
import Cookies from "js-cookie";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useHeader } from "../context/HeaderContext";

export default function ProfileStatus() {
  const { updateHeader } = useHeader();
  const [profileStatus, setProfileStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Update header when component mounts
  useEffect(() => {
    updateHeader("Profile Status", "Check your doctor profile application status");
  }, [updateHeader]);

  useEffect(() => {
    fetchProfileStatus();
    fetchNotifications();
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

  const fetchProfileStatus = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      
      if (!token) {
        toast.error("Please login to check profile status");
        return;
      }

      const payload = decodeToken(token);
      if (payload?.sub) {
        setUser({ 
          id: payload.sub, 
          name: payload.name || payload.email?.split('@')[0] || 'User', 
          email: payload.email 
        });
      }

      // Get user's profile status by fetching their specific profile
      const response = await axios.get(
        `http://localhost:5000/api/profiles/all`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success && payload?.sub) {
        // Find the profile for the current user
        const userProfile = response.data.profiles.find(
          profile => profile.userId._id === payload.sub || profile._id === payload.sub
        );
        
        setProfileStatus(userProfile);
      }
    } catch (error) {
      console.error('Error fetching profile status:', error);
      if (error.response?.status === 404) {
        setProfileStatus(null); // No profile found
      } else {
        toast.error("Failed to fetch profile status");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) return;

      const response = await axios.get(
        'http://localhost:5000/api/notifications',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        
        // Mark notifications as read when user views them
        if (response.data.notifications?.length > 0) {
          await axios.put(
            'http://localhost:5000/api/notifications/mark-all-read',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getStatusInfo = (status) => {
    const statusConfig = {
      pending: {
        color: 'warning',
        icon: 'clock',
        title: 'Under Review',
        message: 'Your doctor profile is currently being reviewed by our admin team. You will be notified once a decision is made.',
        action: 'Please wait for admin approval'
      },
      Approved: {
        color: 'success',
        icon: 'check-circle',
        title: 'Profile Approved',
        message: 'Congratulations! Your doctor profile has been approved. You can now proceed to payment to activate your doctor account.',
        action: 'Proceed to Payment'
      },
      Rejected: {
        color: 'danger',
        icon: 'times-circle',
        title: 'Profile Rejected',
        message: 'Unfortunately, your doctor profile application was not approved. You can continue using the platform as a patient.',
        action: 'Continue as Patient'
      }
    };
    
    return statusConfig[status] || statusConfig.pending;
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
              <p className="text-muted">Checking your profile status...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer />
       <div className="container-fluid p-4" style={{height: 'calc(100vh - 140px)', overflow: 'auto'}}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-lg">
              <div className="card-body p-5">
                {!profileStatus ? (
                  // No profile submitted yet
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="fas fa-user-md fa-4x text-muted mb-3"></i>
                      <h4 className="fw-bold text-dark">No Doctor Profile Found</h4>
                      <p className="text-muted mb-4">
                        You haven't submitted a doctor profile application yet. 
                        Submit your profile to become a doctor on our platform.
                      </p>
                    </div>
                    
                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                      <a href="/doctor-profile" className="btn btn-primary btn-lg">
                        <i className="fas fa-plus me-2"></i>
                        Submit Doctor Profile
                      </a>
                    </div>
                  </div>
                ) : (
                  // Profile exists - show status
                  (() => {
                    const statusInfo = getStatusInfo(profileStatus.status);
                    return (
                      <div className="text-center">
                        <div className="mb-4">
                          <div 
                            className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3`}
                            style={{
                              width: '80px',
                              height: '80px',
                              backgroundColor: `var(--bs-${statusInfo.color})`,
                              color: 'white'
                            }}
                          >
                            <i className={`fas fa-${statusInfo.icon} fa-2x`}></i>
                          </div>
                          
                          <h4 className="fw-bold text-dark mb-2">{statusInfo.title}</h4>
                          <p className="text-muted mb-4">{statusInfo.message}</p>
                        </div>

                        {/* Profile Summary */}
                        <div className="row g-3 mb-4">
                          <div className="col-md-6">
                            <div className="card bg-light border-0">
                              <div className="card-body p-3">
                                <h6 className="card-title mb-1">
                                  <i className="fas fa-user me-2 text-primary"></i>
                                  Name
                                </h6>
                                <p className="card-text mb-0">{profileStatus.name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="card bg-light border-0">
                              <div className="card-body p-3">
                                <h6 className="card-title mb-1">
                                  <i className="fas fa-stethoscope me-2 text-primary"></i>
                                  Specialization
                                </h6>
                                <p className="card-text mb-0">{profileStatus.specialization}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="card bg-light border-0">
                              <div className="card-body p-3">
                                <h6 className="card-title mb-1">
                                  <i className="fas fa-clock me-2 text-primary"></i>
                                  Experience
                                </h6>
                                <p className="card-text mb-0">{profileStatus.experience}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="card bg-light border-0">
                              <div className="card-body p-3">
                                <h6 className="card-title mb-1">
                                  <i className="fas fa-calendar me-2 text-primary"></i>
                                  Submitted
                                </h6>
                                <p className="card-text mb-0">
                                  {new Date(profileStatus.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                          {profileStatus.status === 'Approved' && (
                            <a href="/choose-plan" className="btn btn-primary btn-sm">
                              <i className="fas fa-crown me-2"></i>
                              Choose Plan
                            </a>
                          )}
                          
                          {profileStatus.status === 'Rejected' && (
                            <a href="/browse-doctors" className="btn btn-outline-primary btn-sm">
                              <i className="fas fa-search me-2"></i>
                              Continue as Patient
                            </a>
                          )}
                          
                          {profileStatus.status === 'pending' && (
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={fetchProfileStatus}
                            >
                              <i className="fas fa-refresh me-2"></i>
                              Refresh Status
                            </button>
                          )}
                        </div>

                        {/* Recent Notifications */}
                        {notifications.length > 0 && (
                          <div className="mt-4">
                            <h6 className="text-center text-muted mb-3">Recent Notifications</h6>
                            <div className="list-group">
                              {notifications.slice(0, 5).map((notification, index) => (
                                <div key={notification._id} className="list-group-item border-0 bg-light mb-2 rounded">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="mb-1 fw-bold">{notification.title}</h6>
                                      <p className="mb-1 text-muted small">{notification.message}</p>
                                      <small className="text-muted">
                                        {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                                      </small>
                                    </div>
                                    <span className={`badge ${
                                      notification.type === 'profile_approved' ? 'bg-success' :
                                      notification.type === 'profile_rejected' ? 'bg-danger' :
                                      notification.type === 'subscription_expired' ? 'bg-warning' :
                                      'bg-info'
                                    }`}>
                                      {notification.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="mt-4">
                          <h6 className="text-center text-muted mb-4">Application Timeline</h6>
                          <div className="d-flex justify-content-center align-items-center position-relative" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            {/* Step 1: Submitted */}
                            <div className="text-center position-relative">
                              <div className="rounded-circle bg-success d-inline-flex align-items-center justify-content-center mb-2 shadow-sm" 
                                   style={{ width: '50px', height: '50px', zIndex: 2, position: 'relative' }}>
                                <i className="fas fa-check text-white" style={{ fontSize: '18px' }}></i>
                              </div>
                              <div className="fw-semibold text-success" style={{ fontSize: '13px' }}>Submitted</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>
                                {new Date(profileStatus.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {/* Connection Line 1 */}
                            <div className="flex-grow-1 mx-3 position-relative" style={{ height: '3px' }}>
                              <div className={`w-100 h-100 ${profileStatus.status !== 'pending' ? 'bg-success' : 'bg-light'}`}></div>
                            </div>
                            
                            {/* Step 2: Reviewed */}
                            <div className="text-center position-relative">
                              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow-sm ${
                                profileStatus.status === 'Approved' ? 'bg-success' :
                                profileStatus.status === 'Rejected' ? 'bg-danger' :
                                'bg-light border'
                              }`} style={{ width: '50px', height: '50px', zIndex: 2, position: 'relative' }}>
                                <i className={`fas ${
                                  profileStatus.status === 'Approved' ? 'fa-check text-white' :
                                  profileStatus.status === 'Rejected' ? 'fa-times text-white' :
                                  'fa-clock text-muted'
                                }`} style={{ fontSize: '18px' }}></i>
                              </div>
                              <div className={`fw-semibold ${
                                profileStatus.status === 'Approved' ? 'text-success' :
                                profileStatus.status === 'Rejected' ? 'text-danger' :
                                'text-muted'
                              }`} style={{ fontSize: '13px' }}>Reviewed</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>
                                {profileStatus.status !== 'pending' ? 'Completed' : 'In Progress'}
                              </div>
                            </div>
                            
                            {/* Connection Line 2 - Only show for approved */}
                            {profileStatus.status === 'Approved' && (
                              <>
                                <div className="flex-grow-1 mx-3 position-relative" style={{ height: '3px' }}>
                                  <div className="w-100 h-100 bg-light"></div>
                                </div>
                                
                                {/* Step 3: Payment */}
                                <div className="text-center position-relative">
                                  <div className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center mb-2 shadow-sm" 
                                       style={{ width: '50px', height: '50px', zIndex: 2, position: 'relative' }}>
                                    <i className="fas fa-credit-card text-muted" style={{ fontSize: '18px' }}></i>
                                  </div>
                                  <div className="fw-semibold text-muted" style={{ fontSize: '13px' }}>Payment</div>
                                  <div className="text-muted" style={{ fontSize: '11px' }}>Pending</div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}