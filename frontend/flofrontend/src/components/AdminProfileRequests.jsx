import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";
import Swal from 'sweetalert2';
import Cookies from "js-cookie";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useHeader } from "../context/HeaderContext";
import { useStats } from "../context/StatsContext";

export default function AdminProfileRequests() {
  const { updateHeader } = useHeader();
  const { refreshStats } = useStats();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Update header when component mounts
  useEffect(() => {
    updateHeader("Profile Requests", "Review and manage doctor profile submissions");
  }, [updateHeader]);

  useEffect(() => {
    fetchProfiles();
    fetchStats();
  }, [selectedStatus]);

  const fetchStats = async () => {
    try {
      const token = Cookies.get("token");
      const response = await axios.get(
        `http://localhost:5000/api/profiles/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const response = await axios.get(
        `http://localhost:5000/api/profiles/all?status=${selectedStatus}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setProfiles(response.data.profiles);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error("Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profileId) => {
    try {
      setActionLoading(profileId);
      const token = Cookies.get("token");
      
      const result = await Swal.fire({
        title: 'Approve Profile?',
        text: 'This will approve the doctor profile and send a notification to the user.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const response = await axios.put(
          `http://localhost:5000/api/profiles/${profileId}/approve`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          toast.success("Profile approved successfully! User has been notified.");
          fetchProfiles();
          fetchStats();
          refreshStats();
          // Send real-time notification
          sendNotification(profileId, 'approved');
        }
      }
    } catch (error) {
      console.error('Error approving profile:', error);
      toast.error("Failed to approve profile");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (profileId) => {
    try {
      setActionLoading(profileId);
      const token = Cookies.get("token");
      
      const result = await Swal.fire({
        title: 'Reject Profile?',
        text: 'This will reject the doctor profile and send a notification to the user.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const response = await axios.put(
          `http://localhost:5000/api/profiles/${profileId}/reject`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          toast.success("Profile rejected successfully! User has been notified.");
          fetchProfiles();
          fetchStats();
          refreshStats();
          // Send real-time notification
          sendNotification(profileId, 'rejected');
        }
      }
    } catch (error) {
      console.error('Error rejecting profile:', error);
      toast.error("Failed to reject profile");
    } finally {
      setActionLoading(null);
    }
  };

  const sendNotification = async (profileId, status) => {
    try {
      const token = Cookies.get("token");
      await axios.post(
        `http://localhost:5000/api/notifications/profile-status`,
        { profileId, status },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'warning', text: 'Pending Review', icon: 'clock' },
      Approved: { bg: 'success', text: 'Approved', icon: 'check-circle' },
      Rejected: { bg: 'danger', text: 'Rejected', icon: 'times-circle' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`badge bg-${config.bg} d-flex align-items-center`} style={{ fontSize: '12px' }}>
        <i className={`fas fa-${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  // Filter profiles based on search term
  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const currentProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const ProfileDetailModal = () => {
    if (!selectedProfile) return null;

    return (
      <div 
        className="modal fade show d-block" 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedProfile(null);
          }
        }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="fas fa-user-md me-2"></i>
                Profile Details
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setSelectedProfile(null)}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-4 text-center">
                  {selectedProfile.profilePictureUrl ? (
                    <img
                      src={selectedProfile.profilePictureUrl}
                      alt="Profile"
                      className="rounded-circle mb-3"
                      style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mb-3 mx-auto"
                      style={{ width: '150px', height: '150px' }}
                    >
                      <i className="fas fa-user fa-3x text-white"></i>
                    </div>
                  )}
                  <div className="mb-2">{getStatusBadge(selectedProfile.status)}</div>
                </div>
                <div className="col-md-8">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-bold">Name</label>
                      <p className="form-control-plaintext">{selectedProfile.name}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Email</label>
                      <p className="form-control-plaintext">{selectedProfile.email}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Phone</label>
                      <p className="form-control-plaintext">{selectedProfile.contact_no}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Experience</label>
                      <p className="form-control-plaintext">{selectedProfile.experience}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Degree</label>
                      <p className="form-control-plaintext">{selectedProfile.degree}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Specialization</label>
                      <p className="form-control-plaintext">{selectedProfile.specialization}</p>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Bio</label>
                      <p className="form-control-plaintext">{selectedProfile.bio || 'No bio provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedProfile.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      setSelectedProfile(null);
                      handleApprove(selectedProfile._id);
                    }}
                    disabled={actionLoading === selectedProfile._id}
                  >
                    <i className="fas fa-check me-1"></i>
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setSelectedProfile(null);
                      handleReject(selectedProfile._id);
                    }}
                    disabled={actionLoading === selectedProfile._id}
                  >
                    <i className="fas fa-times me-1"></i>
                    Reject
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedProfile(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ToastContainer />
      <div style={{ 
        width: '100%', 
        height: '100%',
        padding: '0', 
        margin: '0',
        boxSizing: 'border-box'
      }}>
        {/* Statistics Cards */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '20px',
          padding: '15px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white text-center">
                <i className="fas fa-clock fa-2x mb-2"></i>
                <h3 className="fw-bold">{stats.pending}</h3>
                <p className="mb-0">Pending</p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' }}>
              <div className="card-body text-white text-center">
                <i className="fas fa-check-circle fa-2x mb-2"></i>
                <h3 className="fw-bold">{stats.approved}</h3>
                <p className="mb-0">Approved</p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)' }}>
              <div className="card-body text-white text-center">
                <i className="fas fa-times-circle fa-2x mb-2"></i>
                <h3 className="fw-bold">{stats.rejected}</h3>
                <p className="mb-0">Rejected</p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #6f42c1 0%, #6610f2 100%)' }}>
              <div className="card-body text-white text-center">
                <i className="fas fa-users fa-2x mb-2"></i>
                <h3 className="fw-bold">{stats.total}</h3>
                <p className="mb-0">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '0 15px 15px 15px', width: '100%' }}>
          <div className="card border-0 shadow-sm" style={{ margin: '0', width: '100%' }}>
            <div className="card-body" style={{ padding: '1.5rem' }}>
                {/* Header with controls */}
                <div className="row align-items-center mb-4">
                  <div className="col-md-6">
                    <h5 className="card-title mb-0 d-flex align-items-center">
                      <i className="fas fa-user-check me-2 text-primary"></i>
                      Doctor Profile Requests
                    </h5>
                  </div>
                  <div className="col-md-6">
                    <div className="row">
                      <div className="col-md-6">
                        <select
                          className="form-select"
                          value={selectedStatus}
                          onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setCurrentPage(1);
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="">All Status</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="fas fa-search"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search profiles..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading profiles...</p>
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">No profiles found</h6>
                    <p className="text-muted">
                      {searchTerm ? `No profiles match "${searchTerm}"` : `No ${selectedStatus} profiles at the moment.`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Profile</th>
                            <th>Doctor Info</th>
                            <th>Specialization</th>
                            <th>Experience</th>
                            <th>Status</th>
                            <th>Submitted</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentProfiles.map((profile) => (
                            <tr key={profile._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {profile.profilePictureUrl ? (
                                    <img
                                      src={profile.profilePictureUrl}
                                      alt="Profile"
                                      className="rounded-circle me-2"
                                      style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div 
                                      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2"
                                      style={{ width: '40px', height: '40px' }}
                                    >
                                      <i className="fas fa-user text-white"></i>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div>
                                  <div className="fw-semibold">{profile.name}</div>
                                  <small className="text-muted">{profile.email}</small>
                                </div>
                              </td>
                              <td>{profile.specialization}</td>
                              <td>{profile.experience}</td>
                              <td>{getStatusBadge(profile.status)}</td>
                              <td>
                                <small className="text-muted">
                                  {new Date(profile.createdAt).toLocaleDateString()}
                                </small>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => setSelectedProfile(profile)}
                                    title="View Details"
                                  >
                                    <i className="fas fa-eye"></i>
                                  </button>
                                  {profile.status === 'pending' && (
                                    <>
                                      <button
                                        className="btn btn-outline-success"
                                        onClick={() => handleApprove(profile._id)}
                                        disabled={actionLoading === profile._id}
                                        title="Approve"
                                      >
                                        {actionLoading === profile._id ? (
                                          <div className="spinner-border spinner-border-sm" role="status"></div>
                                        ) : (
                                          <i className="fas fa-check"></i>
                                        )}
                                      </button>
                                      <button
                                        className="btn btn-outline-danger"
                                        onClick={() => handleReject(profile._id)}
                                        disabled={actionLoading === profile._id}
                                        title="Reject"
                                      >
                                        {actionLoading === profile._id ? (
                                          <div className="spinner-border spinner-border-sm" role="status"></div>
                                        ) : (
                                          <i className="fas fa-times"></i>
                                        )}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="text-muted">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length} entries
                        </div>
                        <nav>
                          <ul className="pagination mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                              >
                                First
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </button>
                            </li>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNumber;
                              if (totalPages <= 5) {
                                pageNumber = i + 1;
                              } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                              } else {
                                pageNumber = currentPage - 2 + i;
                              }
                              
                              return (
                                <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(pageNumber)}
                                  >
                                    {pageNumber}
                                  </button>
                                </li>
                              );
                            })}
                            
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                              >
                                Last
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      <ProfileDetailModal />
    </>
  );
}