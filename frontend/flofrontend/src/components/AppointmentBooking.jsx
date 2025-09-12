import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AppointmentBooking.css';

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

export default function AppointmentBooking() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [appointmentType, setAppointmentType] = useState('virtual');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorSlots();
    }
  }, [selectedDoctor, currentDate]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/doctors');
      if (response.data?.success) {
        setDoctors(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSlots = async () => {
    if (!selectedDoctor) return;
    
    try {
      setLoading(true);
      const fromDate = new Date(currentDate);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(currentDate);
      toDate.setDate(toDate.getDate() + 7); // Next 7 days
      toDate.setHours(23, 59, 59, 999);

      const response = await axios.get(
        `http://localhost:5000/api/slots/doctor/${selectedDoctor._id}?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`
      );
      
      if (response.data?.success) {
        setSlots(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupSlotsByDate = () => {
    const grouped = {};
    slots.forEach(slot => {
      const date = new Date(slot.start).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
  };

  const getSlotStatusClass = (availability) => {
    switch(availability) {
      case 'available': return 'slot-available';
      case 'booked': return 'slot-booked';
      case 'hold': return 'slot-hold';
      case 'blocked': return 'slot-blocked';
      default: return 'slot-available';
    }
  };

  const handleSlotSelect = (slot) => {
    if (slot.availability !== 'available') {
      toast.error('This slot is not available for booking');
      return;
    }
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;

    try {
      setLoading(true);
      const token = Cookies.get('token');
      if (!token) {
        toast.error('Please login to book appointment');
        return;
      }

      const payload = decode(token);
      const userId = payload?.sub;
      if (!userId) {
        toast.error('Invalid session. Please login again');
        return;
      }

      // Prepare appointment
      const prepareResponse = await axios.post(
        'http://localhost:5000/api/appointments/prepare',
        {
          slotId: selectedSlot._id,
          userId: userId,
          type: appointmentType,
          confirmOverride: true
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (prepareResponse.data?.success || prepareResponse.data?.needsConfirmation) {
        const fee = prepareResponse.data?.fee || selectedDoctor?.consultationFee || 500;
        
        // Create Razorpay order
        const orderResponse = await axios.post('http://localhost:5000/api/payment/checkout', {
          amount: fee,
          currency: 'INR'
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // Add 10 second timeout
        });

        if (orderResponse.data?.success) {
          setBookingData({
            slot: selectedSlot,
            doctor: selectedDoctor,
            fee: fee,
            order: orderResponse.data.order,
            userId: userId,
            appointmentType: appointmentType
          });
          setShowBookingModal(false);
          setShowPaymentModal(true);
        } else {
          toast.error('Failed to create payment order');
        }
      } else {
        toast.error(prepareResponse.data?.message || 'Failed to prepare appointment');
      }
    } catch (error) {
      console.error('Error preparing appointment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to prepare appointment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = () => {
    if (!bookingData) return;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RCgSKXFcOMhnGT',
      amount: bookingData.order.amount,
      currency: bookingData.order.currency,
      name: 'Healthcare Platform',
      description: `Appointment with Dr. ${bookingData.doctor.name || 'Doctor'}`,
      order_id: bookingData.order.id,
      handler: async function (response) {
        try {
          const token = Cookies.get('token');
          const finalizeResponse = await axios.post(
            'http://localhost:5000/api/appointments/finalize',
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              slotId: bookingData.slot._id,
              userId: bookingData.userId,
              type: bookingData.appointmentType,
              confirmOverride: true
            },
            {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (finalizeResponse.data?.success) {
            toast.success('Appointment booked successfully!');
            setShowPaymentModal(false);
            setSelectedSlot(null);
            setBookingData(null);
            // Refresh slots
            fetchDoctorSlots();
          } else {
            toast.error('Payment verification failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast.error('Payment verification failed');
        }
      },
      prefill: {
        name: bookingData.doctor.name || '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#667eea'
      }
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

  const changeWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const groupedSlots = groupSlotsByDate();
  const dates = Object.keys(groupedSlots).sort();

  return (
    <div className="appointment-booking-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="booking-header">
        <h2>
          <i className="fas fa-calendar-plus me-3"></i>
          Book Appointment
        </h2>
        <p className="subtitle">Select a doctor and choose your preferred time slot</p>
      </div>

      {/* Doctor Selection */}
      <div className="doctor-selection-card">
        <h3>
          <i className="fas fa-user-md me-2"></i>
          Select Doctor
        </h3>
        <div className="doctors-grid">
          {doctors.map(doctor => (
            <div 
              key={doctor._id} 
              className={`doctor-card ${selectedDoctor?._id === doctor._id ? 'selected' : ''}`}
              onClick={() => setSelectedDoctor(doctor)}
            >
              <div className="doctor-avatar">
                <i className="fas fa-user-md"></i>
              </div>
              <div className="doctor-info">
                <h4>{doctor?.name || 'Dr. Name'}</h4>
        <p className="doctor-specialty">{doctor?.specialization|| 'General Practice'}</p>
                <p className="doctor-fee"> ₹{doctor.clinics?.[0]?.consultationFee || 500}</p>
              </div>
              {selectedDoctor?._id === doctor._id && (
                <div className="selected-indicator">
                  <i className="fas fa-check-circle"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar/Slots Section */}
      {selectedDoctor && (
        <div className="slots-calendar-card">
          <div className="calendar-header">
            <h3>
              <i className="fas fa-calendar-alt me-2"></i>
              Available Time Slots
            </h3>
            <div className="week-navigation">
              <button 
                className="btn-nav-week" 
                onClick={() => changeWeek(-1)}
                disabled={loading}
              >
                <i className="fas fa-chevron-left"></i>
                Previous Week
              </button>
              <span className="current-week">
                Week of {formatDate(currentDate)}
              </span>
              <button 
                className="btn-nav-week" 
                onClick={() => changeWeek(1)}
                disabled={loading}
              >
                Next Week
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-slots">
              <i className="fas fa-spinner fa-spin me-2"></i>
              Loading available slots...
            </div>
          ) : dates.length > 0 ? (
            <div className="calendar-grid">
              {dates.map(date => (
                <div key={date} className="date-column">
                  <div className="date-header">
                    <div className="date-day">
                      {new Date(date).toLocaleDateString('en-IN', { weekday: 'short' })}
                    </div>
                    <div className="date-number">
                      {new Date(date).getDate()}
                    </div>
                    <div className="date-month">
                      {new Date(date).toLocaleDateString('en-IN', { month: 'short' })}
                    </div>
                  </div>
                  <div className="slots-list">
                    {groupedSlots[date].map(slot => (
                      <div
                        key={slot._id}
                        className={`slot-item ${getSlotStatusClass(slot.availability)}`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <div className="slot-time">
                          {formatTime(slot.start)}
                        </div>
                        <div className="slot-duration">
                          {Math.round((new Date(slot.end) - new Date(slot.start)) / (1000 * 60))} min
                        </div>
                        <div className={`slot-status ${slot.availability}`}>
                          {slot.availability}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-slots">
              <i className="fas fa-calendar-times"></i>
              <p>No slots available for this week</p>
              <p className="text-muted">Try selecting a different week or doctor</p>
            </div>
          )}

          {/* Slot Status Legend */}
          <div className="slot-legend">
            <h4>Status Legend:</h4>
            <div className="legend-items">
              <span className="legend-item available">
                <span className="legend-color"></span>
                Available
              </span>
              <span className="legend-item booked">
                <span className="legend-color"></span>
                Booked
              </span>
              <span className="legend-item hold">
                <span className="legend-color"></span>
                On Hold
              </span>
              <span className="legend-item blocked">
                <span className="legend-color"></span>
                Blocked
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingModal && selectedSlot && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-check me-2"></i>
                  Confirm Appointment
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowBookingModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="appointment-summary">
                  <div className="summary-row">
                    <strong>Doctor:</strong>
                    <span>{selectedDoctor?.name || 'Dr. Name'}</span>
                  </div>
                  <div className="summary-row">
                    <strong>Date:</strong>
                    <span>{formatDate(new Date(selectedSlot.start))}</span>
                  </div>
                  <div className="summary-row">
                    <strong>Time:</strong>
                    <span>{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</span>
                  </div>
                  <div className="summary-row">
                    <strong>Consultation Fee:</strong>
                    <span>₹{selectedDoctor?.consultationFee || 500}</span>
                  </div>
                </div>

                <div className="appointment-type-selection">
                  <label className="form-label">
                    <strong>Appointment Type:</strong>
                  </label>
                  <div className="type-options">
                    <label className="type-option">
                      <input
                        type="radio"
                        name="appointmentType"
                        value="virtual"
                        checked={appointmentType === 'virtual'}
                        onChange={(e) => setAppointmentType(e.target.value)}
                      />
                      <span className="type-label">
                        <i className="fas fa-video me-2"></i>
                        Virtual Consultation
                      </span>
                    </label>
                    <label className="type-option">
                      <input
                        type="radio"
                        name="appointmentType"
                        value="walk-in"
                        checked={appointmentType === 'walk-in'}
                        onChange={(e) => setAppointmentType(e.target.value)}
                      />
                      <span className="type-label">
                        <i className="fas fa-walking me-2"></i>
                        Walk-in Visit
                      </span>
                    </label>
                    <label className="type-option">
                      <input
                        type="radio"
                        name="appointmentType"
                        value="home-visit"
                        checked={appointmentType === 'home-visit'}
                        onChange={(e) => setAppointmentType(e.target.value)}
                      />
                      <span className="type-label">
                        <i className="fas fa-home me-2"></i>
                        Home Visit
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowBookingModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleBookAppointment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-credit-card me-2"></i>
                      Proceed to Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && bookingData && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="fas fa-credit-card me-2"></i>
                  Payment
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowPaymentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="payment-summary">
                  <h6>Payment Summary</h6>
                  <div className="summary-row">
                    <span>Consultation Fee:</span>
                    <span>₹{bookingData.fee}</span>
                  </div>
                  <div className="summary-row total">
                    <strong>Total Amount:</strong>
                    <strong>₹{bookingData.fee}</strong>
                  </div>
                </div>
                <p className="payment-note">
                  Click "Pay Now" to proceed with secure payment via Razorpay.
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={processPayment}
                >
                  <i className="fas fa-credit-card me-2"></i>
                  Pay Now ₹{bookingData.fee}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
