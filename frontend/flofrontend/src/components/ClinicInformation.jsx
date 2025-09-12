import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ClinicInformation.css';

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

export default function ClinicInformation() {
  const [loading, setLoading] = useState(false);
  const [existingClinic, setExistingClinic] = useState(null);
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [showSlots, setShowSlots] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    clinicName: '',
    clinicAddress: '',
    city: '',
    consultationFee: '',
    clinicTiming: {
      days: [],
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      slotDuration: 30
    },
    generateDays: 7
  });

  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const timeSlots = [
    '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM', '10:00 PM'
  ];

  useEffect(() => {
    checkExistingClinic();
  }, []);

  // Auto-calculate generateDays whenever timing configuration changes
  useEffect(() => {
    if (!existingClinic) {
      const newGenerateDays = autoCalculateGenerateDaysForTiming(
        formData.clinicTiming, 
        formData.clinicTiming.days
      );
      
      if (newGenerateDays !== formData.generateDays) {
        setFormData(prev => ({
          ...prev,
          generateDays: newGenerateDays
        }));
      }
    }
  }, [formData.clinicTiming.startTime, formData.clinicTiming.endTime, formData.clinicTiming.slotDuration, formData.clinicTiming.days.length, existingClinic]);

  const checkExistingClinic = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;

      const payload = decode(token);
      const doctorId = payload?.sub;
      if (!doctorId) return;

      // Check if clinic already exists for this doctor
      const response = await axios.get(`http://localhost:5000/api/clinic/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success && response.data?.clinic) {
        setExistingClinic(response.data.clinic);
        // Pre-fill form with existing data
        const clinic = response.data.clinic;
        setFormData({
          clinicName: clinic.clinicName || '',
          clinicAddress: clinic.clinicAddress || '',
          city: clinic.city || '',
          consultationFee: clinic.consultationFee || '',
          clinicTiming: {
            days: clinic.clinicTiming?.days || [],
            startTime: clinic.clinicTiming?.startTime || '09:00 AM',
            endTime: clinic.clinicTiming?.endTime || '05:00 PM',
            slotDuration: clinic.clinicTiming?.slotDuration || 30
          },
          generateDays: 7
        });
      }
    } catch (error) {
      // Clinic doesn't exist yet, which is fine
      console.log('No existing clinic found');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('clinicTiming.')) {
      const timingField = name.split('.')[1];
      const newTiming = {
        ...formData.clinicTiming,
        [timingField]: timingField === 'slotDuration' ? parseInt(value) : value
      };
      
      // Auto-calculate generateDays when timing changes
      const newGenerateDays = autoCalculateGenerateDaysForTiming(newTiming, newTiming.days);
      
      setFormData(prev => ({
        ...prev,
        clinicTiming: newTiming,
        generateDays: newGenerateDays
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'consultationFee' || name === 'generateDays' ? parseInt(value) || '' : value
      }));
    }
  };

  // Helper function to parse time to minutes
  const parseTimeToMinutes = (timeStr) => {
    const match = timeStr.match(/^([0-1]?\d|2[0-3]):([0-5]\d)\s*(AM|PM)$/i);
    if (!match) return null;
    
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  };

  // Helper function to calculate how many slots will be generated
  const calculateSlotPreview = () => {
    const { startTime, endTime, slotDuration, days } = formData.clinicTiming;
    const { generateDays } = formData;
    
    if (!startTime || !endTime || !slotDuration || !generateDays) {
      return null;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return null;
    }

    // Calculate total working minutes per day
    const workingMinutesPerDay = endMinutes - startMinutes;
    
    // Calculate slots per day
    const slotsPerDay = Math.floor(workingMinutesPerDay / slotDuration);
    
    // Calculate total days that will have slots generated
    const totalSlotsGenerated = slotsPerDay * days.length * generateDays;
    
    return {
      slotsPerDay,
      workingDays: days.length,
      generateDays,
      totalSlots: totalSlotsGenerated,
      workingMinutesPerDay,
      workingHours: Math.floor(workingMinutesPerDay / 60),
      workingMinutesRemainder: workingMinutesPerDay % 60,
      hasWorkingDays: days.length > 0
    };
  };

  // Helper function to calculate generateDays for specific timing config
  const autoCalculateGenerateDaysForTiming = (timing, workingDays) => {
    const { startTime, endTime, slotDuration } = timing;
    
    if (!startTime || !endTime || !slotDuration) {
      return 7; // Default fallback
    }

    // Even if no working days selected yet, calculate based on timing for preview
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return 7; // Default fallback
    }

    // Calculate working minutes and slots per day
    const workingMinutesPerDay = endMinutes - startMinutes;
    const slotsPerDay = Math.floor(workingMinutesPerDay / slotDuration);
    
    // Calculate optimal days based on slots per day
    // For better user experience, suggest days based on slot density
    if (slotsPerDay >= 16) return 7;  // High slot density - generate for a week
    if (slotsPerDay >= 8) return 10;  // Medium slot density - generate for 10 days
    if (slotsPerDay >= 4) return 14;  // Low slot density - generate for 2 weeks
    return 21; // Very low slot density - generate for 3 weeks
  };

  // Auto-calculate and update generateDays based on slot configuration
  const autoCalculateGenerateDays = () => {
    const { startTime, endTime, slotDuration, days } = formData.clinicTiming;
    return autoCalculateGenerateDaysForTiming({ startTime, endTime, slotDuration }, days);
  };

  const handleDayChange = (day) => {
    const newDays = formData.clinicTiming.days.includes(day)
      ? formData.clinicTiming.days.filter(d => d !== day)
      : [...formData.clinicTiming.days, day];
    
    // Auto-calculate generateDays when working days change
    const newGenerateDays = autoCalculateGenerateDaysForTiming(formData.clinicTiming, newDays);
    
    setFormData(prev => ({
      ...prev,
      clinicTiming: {
        ...prev.clinicTiming,
        days: newDays
      },
      generateDays: newGenerateDays
    }));
  };

  const validateForm = () => {
    if (!formData.clinicName.trim()) {
      toast.error('Clinic name is required');
      return false;
    }
    if (!formData.clinicAddress.trim()) {
      toast.error('Clinic address is required');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!formData.consultationFee || formData.consultationFee <= 0) {
      toast.error('Valid consultation fee is required');
      return false;
    }
    if (formData.clinicTiming.days.length === 0) {
      toast.error('At least one working day must be selected');
      return false;
    }
    if (!formData.clinicTiming.startTime || !formData.clinicTiming.endTime) {
      toast.error('Start time and end time are required');
      return false;
    }
    if (formData.clinicTiming.slotDuration < 15 || formData.clinicTiming.slotDuration > 120) {
      toast.error('Slot duration must be between 15 and 120 minutes');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

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

      if (isEditing && existingClinic) {
        // Update existing clinic
        const updateData = {
          clinicName: formData.clinicName.trim(),
          clinicAddress: formData.clinicAddress.trim(),
          city: formData.city.trim(),
          consultationFee: formData.consultationFee,
          clinicTiming: formData.clinicTiming
        };

        const response = await axios.put(
          `http://localhost:5000/api/clinic/${existingClinic._id}`,
          updateData,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data?.success) {
          toast.success('Clinic updated successfully!');
          setExistingClinic(response.data.clinic);
          setIsEditing(false);
        } else {
          toast.error(response.data?.message || 'Failed to update clinic');
        }
      } else {
        // Create new clinic
        const requestData = {
          clinicName: formData.clinicName.trim(),
          clinicAddress: formData.clinicAddress.trim(),
          city: formData.city.trim(),
          consultationFee: formData.consultationFee,
          clinicTiming: formData.clinicTiming,
          generateDays: formData.generateDays
        };

        const response = await axios.post(
          'http://localhost:5000/api/slots/createClinicWithSlots',
          requestData,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data?.success) {
          toast.success('Clinic created and slots generated successfully!');
          setExistingClinic(response.data.clinic);
          
          // Show slots info
          setGeneratedSlots({
            count: response.data.slotsCreated,
            fromDate: response.data.fromDate,
            toDate: response.data.toDate,
            subscriptionEnd: response.data.subscriptionEnd,
            subscriptionCapped: response.data.subscriptionCapped
          });
          setShowSlots(true);
        } else {
          toast.error(response.data?.message || 'Failed to create clinic');
        }
      }
    } catch (error) {
      console.error('Error submitting clinic:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit clinic';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to existing clinic data
    if (existingClinic) {
      setFormData({
        clinicName: existingClinic.clinicName || '',
        clinicAddress: existingClinic.clinicAddress || '',
        city: existingClinic.city || '',
        consultationFee: existingClinic.consultationFee || '',
        clinicTiming: {
          days: existingClinic.clinicTiming?.days || [],
          startTime: existingClinic.clinicTiming?.startTime || '09:00 AM',
          endTime: existingClinic.clinicTiming?.endTime || '05:00 PM',
          slotDuration: existingClinic.clinicTiming?.slotDuration || 30
        },
        generateDays: 7
      });
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      const response = await axios.delete(
        `http://localhost:5000/api/clinic/${existingClinic._id}`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        toast.success('Clinic and all associated slots deleted successfully!');
        setExistingClinic(null);
        setShowDeleteModal(false);
        setGeneratedSlots([]);
        setShowSlots(false);
        // Reset form
        setFormData({
          clinicName: '',
          clinicAddress: '',
          city: '',
          consultationFee: '',
          clinicTiming: {
            days: [],
            startTime: '09:00 AM',
            endTime: '05:00 PM',
            slotDuration: 30
          },
          generateDays: 7
        });
      } else {
        toast.error(response.data?.message || 'Failed to delete clinic');
      }
    } catch (error) {
      console.error('Error deleting clinic:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete clinic';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const token = Cookies.get('token');
      const payload = decode(token);
      const doctorId = payload?.sub;
      
      const response = await axios.get(`http://localhost:5000/api/slots/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        const slots = response.data.data || [];
        setGeneratedSlots({
          slots: slots.slice(0, 20), // Show first 20 slots
          totalCount: slots.length
        });
        setShowSlots(true);
      }
    } catch (error) {
      toast.error('Failed to fetch slots');
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="clinic-info-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="clinic-info-header">
        <h2>
          <i className="fas fa-hospital-alt me-3"></i>
          {existingClinic ? 'Clinic Information' : 'Setup Your Clinic'}
        </h2>
        <p className="subtitle">
          {existingClinic 
            ? 'Manage your clinic details and view generated slots'
            : 'Configure your clinic details to start accepting appointments'
          }
        </p>
      </div>

      {existingClinic && (
        <div className="existing-clinic-banner">
          <div className="banner-content">
            <div className="banner-info">
              <i className="fas fa-info-circle me-2"></i>
              <span>Clinic: <strong>{existingClinic.clinicName}</strong></span>
            </div>
            <div className="banner-actions">
              <button className="btn-view-slots" onClick={fetchSlots}>
                <i className="fas fa-calendar-alt me-1"></i>
                View Slots
              </button>
              {!isEditing && (
                <button className="btn-edit" onClick={handleEdit}>
                  <i className="fas fa-edit me-1"></i>
                  Edit
                </button>
              )}
              <button className="btn-delete" onClick={() => setShowDeleteModal(true)}>
                <i className="fas fa-trash me-1"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="clinic-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clinicName">
                  <i className="fas fa-clinic-medical me-2"></i>
                  Clinic Name *
                </label>
                <input
                  type="text"
                  id="clinicName"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleInputChange}
                  placeholder="Enter clinic name"
                  disabled={existingClinic && !isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="consultationFee">
                  <i className="fas fa-rupee-sign me-2"></i>
                  Consultation Fee *
                </label>
                <input
                  type="number"
                  id="consultationFee"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleInputChange}
                  placeholder="Enter fee amount"
                  min="1"
                  disabled={existingClinic && !isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clinicAddress">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Clinic Address *
                </label>
                <textarea
                  id="clinicAddress"
                  name="clinicAddress"
                  value={formData.clinicAddress}
                  onChange={handleInputChange}
                  placeholder="Enter complete address"
                  rows="3"
                  disabled={existingClinic && !isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">
                  <i className="fas fa-city me-2"></i>
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  disabled={existingClinic && !isEditing}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Working Days</h3>
            <div className="days-selection">
              {dayOptions.map(day => (
                <label key={day} className={`day-checkbox ${formData.clinicTiming.days.includes(day) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.clinicTiming.days.includes(day)}
                    onChange={() => handleDayChange(day)}
                    disabled={existingClinic && !isEditing}
                  />
                  <span className="day-label">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Timing Configuration</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">
                  <i className="fas fa-clock me-2"></i>
                  Start Time *
                </label>
                <select
                  id="startTime"
                  name="clinicTiming.startTime"
                  value={formData.clinicTiming.startTime}
                  onChange={handleInputChange}
                  disabled={existingClinic && !isEditing}
                  required
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="endTime">
                  <i className="fas fa-clock me-2"></i>
                  End Time *
                </label>
                <select
                  id="endTime"
                  name="clinicTiming.endTime"
                  value={formData.clinicTiming.endTime}
                  onChange={handleInputChange}
                  disabled={existingClinic && !isEditing}
                  required
                >
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="slotDuration">
                  <i className="fas fa-hourglass-half me-2"></i>
                  Slot Duration (minutes) *
                </label>
                <select
                  id="slotDuration"
                  name="clinicTiming.slotDuration"
                  value={formData.clinicTiming.slotDuration}
                  onChange={handleInputChange}
                  disabled={existingClinic && !isEditing}
                  required
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="slotsPerDay">
                  <i className="fas fa-calendar-check me-2"></i>
                  Slots Per Day (Auto-calculated)
                </label>
                <input
                  type="number"
                  id="slotsPerDay"
                  name="slotsPerDay"
                  value={(() => {
                    const preview = calculateSlotPreview();
                    return preview ? preview.slotsPerDay : 0;
                  })()}
                  readOnly
                  className="auto-calculated-field"
                  placeholder="Select timing to see slots per day"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="generateDays">
                  <i className="fas fa-calendar-plus me-2"></i>
                  Generate Slots For (days)
                </label>
                <input
                  type="number"
                  id="generateDays"
                  name="generateDays"
                  value={formData.generateDays}
                  onChange={handleInputChange}
                  min="1"
                  max="30"
                  disabled={existingClinic && !isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="totalSlots">
                  <i className="fas fa-calculator me-2"></i>
                  Total Slots (Preview)
                </label>
                <input
                  type="number"
                  id="totalSlots"
                  name="totalSlots"
                  value={(() => {
                    const preview = calculateSlotPreview();
                    return preview ? preview.totalSlots : 0;
                  })()}
                  readOnly
                  className="auto-calculated-field"
                  placeholder="Total slots to be generated"
                />
              </div>
            </div>

          </div>

          {(!existingClinic || isEditing) && (
            <div className="form-actions">
              {isEditing ? (
                <div className="edit-actions">
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Updating Clinic...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update Clinic
                      </>
                    )}
                  </button>
                  <button type="button" className="btn-cancel" onClick={handleCancelEdit} disabled={loading}>
                    <i className="fas fa-times me-2"></i>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Creating Clinic & Generating Slots...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus-circle me-2"></i>
                      Create Clinic & Generate Slots
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {showSlots && generatedSlots && (
        <div className="slots-info-card">
          <h3>
            <i className="fas fa-calendar-check me-2"></i>
            Generated Slots Information
          </h3>
          
          {generatedSlots.count !== undefined ? (
            <div className="slots-summary">
              <div className="summary-item">
                <i className="fas fa-calendar-alt"></i>
                <span>Total Slots Created: <strong>{generatedSlots.count}</strong></span>
              </div>
              <div className="summary-item">
                <i className="fas fa-calendar-day"></i>
                <span>From Date: <strong>{formatDateTime(generatedSlots.fromDate)}</strong></span>
              </div>
              <div className="summary-item">
                <i className="fas fa-calendar-week"></i>
                <span>To Date: <strong>{formatDateTime(generatedSlots.toDate)}</strong></span>
              </div>
              <div className="summary-item">
                <i className="fas fa-crown"></i>
                <span>Subscription Until: <strong>{formatDateTime(generatedSlots.subscriptionEnd)}</strong></span>
              </div>
              {generatedSlots.subscriptionCapped && (
                <div className="summary-item warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>Slot generation was limited by subscription end date</span>
                </div>
              )}
            </div>
          ) : generatedSlots.slots ? (
            <div className="slots-list">
              <p>Showing {generatedSlots.slots.length} of {generatedSlots.totalCount} total slots</p>
              <div className="slots-grid">
                {generatedSlots.slots.map((slot, index) => (
                  <div key={index} className={`slot-item ${slot.availability}`}>
                    <div className="slot-time">
                      {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                    </div>
                    <div className={`slot-status ${slot.availability}`}>
                      {slot.availability}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Confirm Clinic Deletion
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowDeleteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  <strong>Warning:</strong> You are about to delete your clinic permanently.
                </p>
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  This action will also delete:
                  <ul className="mt-2 mb-0">
                    <li>All associated time slots</li>
                    <li>All future appointments</li>
                    <li>Clinic configuration</li>
                  </ul>
                </div>
                <p className="text-muted">
                  Clinic: <strong>{existingClinic?.clinicName}</strong>
                </p>
                <p className="text-danger">
                  <strong>This action cannot be undone.</strong>
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-2"></i>
                      Delete Clinic
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
