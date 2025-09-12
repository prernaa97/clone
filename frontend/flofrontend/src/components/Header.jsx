import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.min.css";

function decode(token) {
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
}

export default function Header({ title = "Dashboard", subtitle = "Upgrade or renew your doctor account" }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      const payload = decode(token);
      if (payload?.sub) {
        setUser({ 
          id: payload.sub, 
          name: payload.name || payload.email?.split('@')[0] || 'User', 
          email: payload.email 
        });
        
        // Fetch user roles
        fetchUserRoles(token, payload.sub);
        
        // Fetch notification count
        fetchNotificationCount(token);
      }
    }
  }, []);

  const fetchUserRoles = async (token, userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data || []);
    } catch (error) {
      // Fallback to alternate endpoint
      try {
        const response = await axios.get(`http://localhost:5000/users/roles/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoles(response.data || []);
      } catch (err) {
        console.log('Could not fetch user roles:', err.message);
        setRoles([]);
      }
    }
  };

  const fetchNotificationCount = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        setNotificationCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.log('Could not fetch notifications:', error.message);
    }
  };

  const handleLogout = () => {
    Cookies.remove("token");
    window.location.href = "/";
  };

  return (
    <header className="bg-white shadow-sm border-bottom" style={{ 
      borderBottom: '2px solid #667eea',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)'
    }}>
      <div className="container-fluid px-4">
        <div className="row align-items-center py-3">
          {/* Left Section - Page Info */}
          <div className="col-md-6">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{
                  width: '40px',
                  height: '40px', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  color: '#fff',
                  fontSize: '16px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  <i className="fas fa-stethoscope"></i>
                </div>
              </div>
              <div>
                <div className="d-flex align-items-center">
                  <span style={{
                    fontSize: '12px',
                    color: '#667eea',
                    background: 'rgba(102, 126, 234, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    marginRight: '8px',
                    fontWeight: '600',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}>
                    Healthcare Portal
                  </span>
                  <i className="fas fa-chevron-right" style={{ fontSize: '10px', color: '#94a3b8', margin: '0 4px' }}></i>
                <h4 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: '20px' }}>
                  {title}
                </h4>
                </div>
                <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - User Info */}
          <div className="col-md-6">
            <div className="d-flex align-items-center justify-content-end">
              {/* Notifications */}
              <div className="me-3 position-relative">
                <div 
                  className="position-relative" 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => { window.location.href = '/profile-status'; }}
                  title="View Profile Status"
                >
                  <i className="fas fa-bell text-muted" style={{ fontSize: '18px' }}></i>
                  {notificationCount > 0 && (
                    <span 
                      className="position-absolute badge rounded-pill bg-danger"
                      style={{
                        top: '-8px',
                        right: '-8px',
                        fontSize: '10px',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </div>
              </div>

              {/* User Profile Dropdown */}
              <div className="position-relative">
                <div 
                  className="d-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="me-2 text-end d-none d-md-block">
                    <div className="fw-semibold" style={{ fontSize: '14px', color: '#1e293b' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {user?.email || 'user@example.com'}
                    </div>
                    {roles.length > 0 && (
                      <span style={{
                        fontSize: '10px',
                        color: '#667eea',
                        background: 'rgba(102, 126, 234, 0.1)',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginTop: '2px',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                      }}>
                        {roles[0]}
                      </span>
                    )}
                  </div>
                  
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  
                  <i className="fas fa-chevron-down ms-2 text-muted" style={{ fontSize: '12px' }}></i>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="position-absolute end-0 mt-2 py-2 bg-white rounded-3 shadow-lg" style={{
                    minWidth: '200px',
                    border: '1px solid #e2e8f0',
                    zIndex: 1001
                  }}>
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-semibold" style={{ fontSize: '14px', color: '#1e293b' }}>
                        {user?.name || 'User'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '12px' }}>
                        {user?.email || 'user@example.com'}
                      </div>
                      {roles.length > 0 && (
                        <span style={{
                          fontSize: '10px',
                          color: '#667eea',
                          background: 'rgba(102, 126, 234, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          marginTop: '4px',
                          border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}>
                          {roles[0]}
                        </span>
                      )}
                    </div>
                    
                    <a href="/profile" className="d-block px-3 py-2 text-decoration-none text-dark" style={{ fontSize: '14px' }}>
                      <i className="fas fa-user me-2"></i>
                      My Profile
                    </a>
                    
                    <a href="/settings" className="d-block px-3 py-2 text-decoration-none text-dark" style={{ fontSize: '14px' }}>
                      <i className="fas fa-cog me-2"></i>
                      Settings
                    </a>
                    
                    <hr className="my-1" />
                    
                    <button 
                      onClick={handleLogout}
                      className="btn btn-link w-100 text-start px-3 py-2 text-danger" 
                      style={{ fontSize: '14px', textDecoration: 'none' }}
                    >
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100" 
          style={{ zIndex: 999 }}
          onClick={() => { setShowDropdown(false); }}
        ></div>
      )}
    </header>
  );
}
