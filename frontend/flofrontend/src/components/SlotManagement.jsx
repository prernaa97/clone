import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SlotManagement.css';

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

export default function SlotManagement() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSlots, setTotalSlots] = useState(0);
  const slotsPerPage = 20;

  useEffect(() => {
    fetchSlots();
  }, [currentPage, filterDate, filterStatus]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      const payload = decode(token);
      const doctorId = payload?.sub;
      if (!doctorId) {
        toast.error('Invalid session. Please login again');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage,
        limit: slotsPerPage
      });
      
      if (filterDate) {
        const startDate = new Date(filterDate);
        const endDate = new Date(filterDate);
        endDate.setDate(endDate.getDate() + 1);
        params.append('from', startDate.toISOString());
        params.append('to', endDate.toISOString());
      }
      
      if (filterStatus) {
        params.append('availability', filterStatus);
      }

      const response = await axios.get(
        `http://localhost:5000/api/slots/doctor/${doctorId}?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data?.success) {
        setSlots(response.data.data || []);
        setTotalSlots(response.data.pagination?.total || response.data.data?.length || 0);
      } else {
        toast.error('Failed to fetch slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const updateSlotStatus = async (slotId, newStatus) => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/slots/${slotId}`,
        { availability: newStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.success) {
        toast.success(`Slot status updated to ${newStatus}`);
        // Update the slot in the local state
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot._id === slotId 
              ? { ...slot, availability: newStatus }
              : slot
          )
        );
      } else {
        toast.error('Failed to update slot status');
      }
    } catch (error) {
      console.error('Error updating slot:', error);
      toast.error('Failed to update slot status');
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        time: date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };
    } catch {
      return { date: 'Invalid Date', time: 'Invalid Time' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'booked': return 'primary';
      case 'hold': return 'warning';
      case 'blocked': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return 'fas fa-check-circle';
      case 'booked': return 'fas fa-calendar-check';
      case 'hold': return 'fas fa-clock';
      case 'blocked': return 'fas fa-ban';
      default: return 'fas fa-question-circle';
    }
  };

  const totalPages = Math.ceil(totalSlots / slotsPerPage);

  return (
    <div className="slot-management-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="page-header">
        <h2>
          <i className="fas fa-calendar-alt me-3"></i>
          Slot Management
        </h2>
        <p className="subtitle">
          Manage your appointment slots and availability
        </p>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="row align-items-end">
          <div className="col-md-4">
            <label htmlFor="filterDate" className="form-label">
              <i className="fas fa-calendar me-2"></i>
              Filter by Date
            </label>
            <input
              type="date"
              id="filterDate"
              className="form-control"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="filterStatus" className="form-label">
              <i className="fas fa-filter me-2"></i>
              Filter by Status
            </label>
            <select
              id="filterStatus"
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="hold">On Hold</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="col-md-4">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setFilterDate('');
                setFilterStatus('');
                setCurrentPage(1);
              }}
            >
              <i className="fas fa-times me-2"></i>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Slots List */}
      <div className="slots-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-list me-2"></i>
            Your Slots
          </h5>
          <span className="badge bg-primary">
            {totalSlots} Total Slots
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading your slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-times text-muted mb-3"></i>
            <h6>No slots found</h6>
            <p className="text-muted">
              {filterDate || filterStatus 
                ? 'Try adjusting your filters or create more slots from Clinic Information page'
                : 'Create your first clinic to generate slots'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="slots-grid">
              {slots.map((slot) => {
                const startDateTime = formatDateTime(slot.start);
                const endDateTime = formatDateTime(slot.end);
                
                return (
                  <div key={slot._id} className="slot-card" data-status={slot.availability}>
                    <div className="slot-header">
                      <div className="slot-date">
                        <i className="fas fa-calendar-day me-2"></i>
                        {startDateTime.date}
                      </div>
                      <div className={`slot-status badge bg-${getStatusColor(slot.availability)}`}>
                        <i className={`${getStatusIcon(slot.availability)} me-1`}></i>
                        {slot.availability.charAt(0).toUpperCase() + slot.availability.slice(1)}
                      </div>
                    </div>
                    
                    <div className="slot-time">
                      <i className="fas fa-clock me-2"></i>
                      {startDateTime.time} - {endDateTime.time}
                    </div>

                    <div className="slot-actions">
                      <div className="btn-group" role="group">
                        <button
                          className={`btn btn-sm ${slot.availability === 'available' ? 'btn-success' : 'btn-outline-success'}`}
                          onClick={() => updateSlotStatus(slot._id, 'available')}
                          disabled={slot.availability === 'available'}
                        >
                          <i className="fas fa-check me-1"></i>
                          Available
                        </button>
                        <button
                          className={`btn btn-sm ${slot.availability === 'hold' ? 'btn-warning' : 'btn-outline-warning'}`}
                          onClick={() => updateSlotStatus(slot._id, 'hold')}
                          disabled={slot.availability === 'hold'}
                        >
                          <i className="fas fa-clock me-1"></i>
                          Hold
                        </button>
                        <button
                          className={`btn btn-sm ${slot.availability === 'blocked' ? 'btn-danger' : 'btn-outline-danger'}`}
                          onClick={() => updateSlotStatus(slot._id, 'blocked')}
                          disabled={slot.availability === 'blocked'}
                        >
                          <i className="fas fa-ban me-1"></i>
                          Block
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
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
                        <i className="fas fa-chevron-right"></i>
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
  );
}
