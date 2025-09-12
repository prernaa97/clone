import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

// Clinic Creation Form Component
function ClinicCreationForm({ currentUser, selectedDoctor, userRoles, onClinicCreated }) {
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('clinicTiming.')) {
      const timingField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        clinicTiming: {
          ...prev.clinicTiming,
          [timingField]: timingField === 'slotDuration' ? parseInt(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'consultationFee' ? parseFloat(value) : value
      }));
    }
  };

  const handleDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      clinicTiming: {
        ...prev.clinicTiming,
        days: prev.clinicTiming.days.includes(day)
          ? prev.clinicTiming.days.filter(d => d !== day)
          : [...prev.clinicTiming.days, day]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Cookies.get('token');
      
      // Determine the correct doctorId based on context
      // If current user is a doctor viewing their own profile, use currentUser.id
      // If viewing another doctor's profile, use selectedDoctor's userId or _id
      const isCurrentUserDoctor = userRoles?.includes('Doctor');
      const doctorId = isCurrentUserDoctor && selectedDoctor?.userId === currentUser?.id 
        ? currentUser.id 
        : selectedDoctor?.userId || selectedDoctor?._id;

      console.log('=== CLINIC CREATION DEBUG ===');
      console.log('Current user is doctor:', isCurrentUserDoctor);
      console.log('Current user ID:', currentUser?.id);
      console.log('Selected doctor userId:', selectedDoctor?.userId);
      console.log('Selected doctor _id:', selectedDoctor?._id);
      console.log('Using doctorId for clinic creation:', doctorId);
      console.log('=== END DEBUG ===');

      if (!doctorId) {
        toast.error('Doctor ID not found. Please try again.');
        return;
      }

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
        onClinicCreated(response.data.clinic);
        toast.success(`Your clinic created successfully! ${response.data.slotsCreated} slots generated.`);
      } else {
        toast.error(response.data?.message || 'Failed to create clinic');
      }
    } catch (error) {
      console.error('Error creating clinic:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create clinic';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-4">
        <i className="fas fa-clinic-medical mb-3" style={{ fontSize: '3rem', color: '#667eea' }}></i>
        <h5 style={{ color: '#1e293b', fontWeight: '600' }}>Setup Your Clinic</h5>
        <p style={{ color: '#64748b' }}>
          Configure your clinic details to start accepting appointments
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <label style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              <i className="fas fa-clinic-medical me-2" style={{ color: '#667eea' }}></i>
              Clinic Name *
            </label>
            <input
              type="text"
              name="clinicName"
              value={formData.clinicName}
              onChange={handleInputChange}
              placeholder="Enter clinic name"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div className="col-md-6 mb-3">
            <label style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              <i className="fas fa-rupee-sign me-2" style={{ color: '#667eea' }}></i>
              Consultation Fee *
            </label>
            <input
              type="number"
              name="consultationFee"
              value={formData.consultationFee}
              onChange={handleInputChange}
              placeholder="Enter fee amount"
              min="1"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-8 mb-3">
            <label style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              <i className="fas fa-map-marker-alt me-2" style={{ color: '#667eea' }}></i>
              Clinic Address *
            </label>
            <input
              type="text"
              name="clinicAddress"
              value={formData.clinicAddress}
              onChange={handleInputChange}
              placeholder="Enter complete clinic address"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div className="col-md-4 mb-3">
            <label style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              <i className="fas fa-city me-2" style={{ color: '#667eea' }}></i>
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Enter city"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div className="mb-4">
          <label style={{ color: '#1e293b', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
            <i className="fas fa-calendar-week me-2" style={{ color: '#667eea' }}></i>
            Working Days *
          </label>
          <div className="d-flex flex-wrap gap-2">
            {dayOptions.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayChange(day)}
                style={{
                  padding: '8px 16px',
                  border: `2px solid ${formData.clinicTiming.days.includes(day) ? '#667eea' : '#e2e8f0'}`,
                  background: formData.clinicTiming.days.includes(day) ? '#667eea' : 'white',
                  color: formData.clinicTiming.days.includes(day) ? 'white' : '#64748b',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <label style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              <i className="fas fa-clock me-2" style={{ color: '#667eea' }}></i>
              Start Time *
            </label>
            <select
              name="clinicTiming.startTime"
              value={formData.clinicTiming.startTime}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-3">
            <label style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              <i className="fas fa-clock me-2" style={{ color: '#667eea' }}></i>
              End Time *
            </label>
            <select
              name="clinicTiming.endTime"
              value={formData.clinicTiming.endTime}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-3">
            <label style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              <i className="fas fa-hourglass-half me-2" style={{ color: '#667eea' }}></i>
              Slot Duration (minutes) *
            </label>
            <select
              name="clinicTiming.slotDuration"
              value={formData.clinicTiming.slotDuration}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>

        <div className="text-center">
          <button
            type="submit"
            disabled={loading || formData.clinicTiming.days.length === 0}
            style={{
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Creating Clinic & Generating Slots...
              </>
            ) : (
              <>
                <i className="fas fa-plus-circle me-2"></i>
                Create My Clinic & Generate Slots
              </>
            )}
          </button>
          
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '8px' }}>
              <i className="fas fa-info-circle me-2" style={{ color: '#667eea' }}></i>
              Need more advanced clinic management features?
            </p>
            <a 
              href="/clinic" 
              style={{ 
                color: '#667eea', 
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              Visit the full Clinic Management page →
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function DoctorPortfolio() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [clinicInfo, setClinicInfo] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;
    
    const payload = decode(token);
    if (!payload?.sub) return;
    
    setCurrentUser({ id: payload.sub, name: payload.name, email: payload.email });
    
    // Fetch user roles and then doctors data
    axios.get(`http://localhost:5000/users/${payload.sub}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => {
      const fetchedRoles = r.data || [];
      setUserRoles(fetchedRoles);
      
      console.log('=== ROLE DEBUG ===');
      console.log('User roles:', fetchedRoles);
      console.log('Is Doctor:', fetchedRoles.includes('Doctor'));
      console.log('=== END ROLE DEBUG ===');
      
      // Now fetch doctors data with the correct roles
      fetchDoctors(token, payload.sub, fetchedRoles);
    }).catch(() => {
      // Fallback path - try the alternate endpoint
      axios.get(`http://localhost:5000/users/roles/${payload.sub}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => {
        const fetchedRoles = r.data || [];
        setUserRoles(fetchedRoles);
        
        console.log('=== ROLE DEBUG (FALLBACK) ===');
        console.log('User roles:', fetchedRoles);
        console.log('Is Doctor:', fetchedRoles.includes('Doctor'));
        console.log('=== END ROLE DEBUG ===');
        
        fetchDoctors(token, payload.sub, fetchedRoles);
      }).catch(() => {
        console.error('Failed to fetch user roles');
        setLoading(false);
      });
    });
  }, []);

  const fetchDoctors = async (token, userId, roles) => {
    try {
      const isDoctor = roles.includes('Doctor');
      const isUser = roles.includes('User');

      if (isDoctor) {
        // Doctor can only see their own profile - get from all doctors and filter by current user
        const response = await axios.get('http://localhost:5000/api/doctors/profiles/approved', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          const allDoctors = response.data.data || [];
          // Find the doctor profile that belongs to the current user
          const doctorProfile = allDoctors.find(doctor => 
            doctor.userId === userId || doctor._id === userId
          );
          
          console.log('=== DOCTOR PROFILE DEBUG ===');
          console.log('Current user ID:', userId);
          console.log('All doctors count:', allDoctors.length);
          console.log('All doctors IDs:', allDoctors.map(d => ({ userId: d.userId, _id: d._id, name: d.name })));
          console.log('Found doctor profile:', doctorProfile);
          console.log('=== END DEBUG ===');
          
          if (doctorProfile) {
            setDoctors([doctorProfile]);
            setSelectedDoctor(doctorProfile);
            
            // Auto-load clinic and slot information for doctor
            const doctorId = doctorProfile.userId || doctorProfile._id || userId;
            console.log('Using doctorId for auto-load:', doctorId);
            
            if (doctorId) {
              fetchClinicInfo(doctorId);
              fetchSlots(doctorId);
            } else {
              console.error('No valid doctorId found for auto-loading clinic/slots');
            }
          } else {
            console.error('Doctor profile not found for current user');
            toast.error('Doctor profile not found. Please make sure your profile is approved.');
          }
        }
      } else {
        // Users and admins can see all approved doctors
        const response = await axios.get('http://localhost:5000/api/doctors/profiles/approved', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          setDoctors(response.data.data || []);
          if (response.data.data?.length > 0) {
            setSelectedDoctor(response.data.data[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctor profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicInfo = async (doctorId) => {
    try {
      const token = Cookies.get('token');
      console.log('Fetching clinic info for doctorId:', doctorId);
      
      if (!doctorId) {
        console.warn('No doctorId provided for clinic info');
        setClinicInfo(null);
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/clinic/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Clinic info response:', response.data);
      
      if (response.data?.success) {
        setClinicInfo(response.data.clinic);
      } else {
        setClinicInfo(null);
      }
    } catch (error) {
      // Handle 404 as expected behavior - doctor doesn't have a clinic yet
      if (error.response?.status === 404) {
        console.log('No clinic found for doctor - this is normal if clinic is not set up yet');
        setClinicInfo(null);
      } else {
        // Log other errors as they might indicate real issues
        console.error('Error fetching clinic info:', error);
        setClinicInfo(null);
      }
    }
  };

  const fetchSlots = async (doctorId) => {
    try {
      const token = Cookies.get('token');
      console.log('Fetching slots for doctorId:', doctorId);
      
      if (!doctorId) {
        console.warn('No doctorId provided for slots');
        setSlots([]);
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/slots/doctor/${doctorId}?limit=10&availability=available`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Slots response:', response.data);
      
      if (response.data?.success) {
        setSlots(response.data.data || []);
      } else {
        setSlots([]);
      }
    } catch (error) {
      // Handle 404 as expected behavior - doctor doesn't have slots yet
      if (error.response?.status === 404) {
        console.log('No slots found for doctor - this is normal if slots are not created yet');
        setSlots([]);
      } else {
        // Log other errors as they might indicate real issues
        console.error('Error fetching slots:', error);
        setSlots([]);
      }
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setActiveTab('profile');
    setClinicInfo(null);
    setSlots([]);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'clinic' && selectedDoctor) {
      const doctorId = selectedDoctor.userId || selectedDoctor._id || currentUser?.id;
      console.log('Fetching clinic info for doctorId:', doctorId);
      fetchClinicInfo(doctorId);
    } else if (tab === 'slots' && selectedDoctor) {
      const doctorId = selectedDoctor.userId || selectedDoctor._id || currentUser?.id;
      console.log('Fetching slots for doctorId:', doctorId);
      fetchSlots(doctorId);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Pending': return 'bg-warning';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const handleVideoCall = () => {
    toast.info('Video call feature will be implemented soon');
  };

  const handleMessage = () => {
    toast.info('Messaging feature will be implemented soon');
  };

  if (loading || !currentUser) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user is a Doctor
  const isDoctor = userRoles.includes('Doctor');
  const isUser = userRoles.includes('User');

  return (
    <div style={{ padding: '24px', background: 'linear-gradient(135deg, rgb(241, 245, 249) 0%, rgb(226, 232, 240) 100%)', minHeight: '100vh', paddingBottom: '100px' }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="mb-4">
        <div className="text-center mb-4 p-4" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: '16px', 
          color: 'white', 
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)' 
        }}>
          <h2 className="mb-2" style={{ fontSize: '2.2rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <i className="fas fa-user-md me-3"></i>
            {isDoctor ? 'My Profile' : 'Doctor Portfolio'}
          </h2>
          <p className="mb-0" style={{ fontSize: '1.1rem', opacity: '0.9' }}>
            {isDoctor ? 'Manage your professional profile and clinic information' : 'Browse and connect with our qualified healthcare professionals'}
          </p>
        </div>
      </div>

      {/* Doctor Selection - Carousel for Users and Admins only - NOT for Doctors */}
      {!userRoles.includes('Doctor') && doctors.length > 0 ? (
        <div className="mb-4">
          <h5 className="mb-3" style={{ color: '#1e293b', fontWeight: '600' }}>
            <i className="fas fa-users me-2" style={{ color: '#667eea' }}></i>
            Select a Doctor ({doctors.length})
          </h5>
          <div id="doctorCarousel" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-inner">
              {doctors.map((doctor, index) => (
                <div key={doctor._id} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                  <div className="row g-3">
                    {doctors.slice(index, index + 3).map((doc) => (
                      <div key={doc._id} className="col-md-4">
                        <div 
                          className={`card border-0 shadow-sm h-100 ${selectedDoctor?._id === doc._id ? 'border-primary' : ''}`}
                          onClick={() => handleDoctorSelect(doc)}
                          style={{ 
                            cursor: 'pointer', 
                            transition: 'all 0.3s ease',
                            border: selectedDoctor?._id === doc._id ? '2px solid #667eea !important' : ''
                          }}
                        >
                          <div className="card-body text-center p-4">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto mb-3"
                              style={{ 
                                width: '70px', 
                                height: '70px', 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontSize: '1.5rem'
                              }}
                            >
                              {doc.name ? doc.name.charAt(0).toUpperCase() : 'D'}
                            </div>
                            <h6 className="fw-bold mb-1">Dr. {doc.name}</h6>
                            <p className="text-muted small mb-2">{doc.specialization}</p>
                            <span className={`badge ${getStatusBadgeClass(doc.status)} small`}>
                              {doc.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {doctors.length > 3 && (
              <>
                <button className="carousel-control-prev" type="button" data-bs-target="#doctorCarousel" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#doctorCarousel" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Doctor Details */}
      {selectedDoctor ? (
        <div>
          {/* Navigation Tabs */}
          <div className="mb-4">
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '0' }}>
                <ul className="nav nav-tabs border-0" style={{ marginBottom: '0' }}>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                      onClick={() => handleTabChange('profile')}
                      style={{
                        border: 'none',
                        background: activeTab === 'profile' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                        color: activeTab === 'profile' ? 'white' : '#64748b',
                        fontWeight: '600',
                        padding: '16px 24px',
                        borderRadius: activeTab === 'profile' ? '12px 12px 0 0' : '0'
                      }}
                    >
                      <i className="fas fa-user me-2"></i>
                      Profile
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'clinic' ? 'active' : ''}`}
                      onClick={() => handleTabChange('clinic')}
                      style={{
                        border: 'none',
                        background: activeTab === 'clinic' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                        color: activeTab === 'clinic' ? 'white' : '#64748b',
                        fontWeight: '600',
                        padding: '16px 24px',
                        borderRadius: activeTab === 'clinic' ? '12px 12px 0 0' : '0'
                      }}
                    >
                      <i className="fas fa-clinic-medical me-2"></i>
                      Clinic Info
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'slots' ? 'active' : ''}`}
                      onClick={() => handleTabChange('slots')}
                      style={{
                        border: 'none',
                        background: activeTab === 'slots' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                        color: activeTab === 'slots' ? 'white' : '#64748b',
                        fontWeight: '600',
                        padding: '16px 24px',
                        borderRadius: activeTab === 'slots' ? '12px 12px 0 0' : '0'
                      }}
                    >
                      <i className="fas fa-calendar-alt me-2"></i>
                      Available Slots
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="row">
                {/* Profile Header */}
                <div className="col-12 mb-4">
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    padding: '32px', 
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
                    border: '1px solid #e2e8f0' 
                  }}>
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{ 
                            width: '100px', 
                            height: '100px', 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '2rem',
                            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                          }}
                        >
                          {selectedDoctor.name ? selectedDoctor.name.charAt(0).toUpperCase() : 'D'}
                        </div>
                      </div>
                      <div className="col">
                        <h3 className="mb-2" style={{ color: '#1e293b', fontWeight: '700' }}>
                          Dr. {selectedDoctor.name}
                        </h3>
                        <p className="text-muted mb-2" style={{ fontSize: '1.1rem' }}>
                          <i className="fas fa-stethoscope me-2" style={{ color: '#667eea' }}></i>
                          {selectedDoctor.specialization}
                        </p>
                        <div className="d-flex gap-2 mb-3">
                          <span className={`badge ${getStatusBadgeClass(selectedDoctor.status)} px-3 py-2`} style={{ fontSize: '0.8rem' }}>
                            {selectedDoctor.status}
                          </span>
                          <span className="badge px-3 py-2" style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                            color: 'white',
                            fontSize: '0.8rem'
                          }}>
                            {selectedDoctor.experience} years experience
                          </span>
                        </div>
                        {!isDoctor && (
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm px-4 py-2"
                              onClick={handleVideoCall}
                              style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                color: 'white',
                                borderRadius: '8px',
                                fontWeight: '600',
                                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
                              }}
                            >
                              <i className="fas fa-video me-2"></i>
                              Video Call
                            </button>
                            <button 
                              className="btn btn-sm px-4 py-2"
                              onClick={handleMessage}
                              style={{
                                background: 'white',
                                border: '2px solid #667eea',
                                color: '#667eea',
                                borderRadius: '8px',
                                fontWeight: '600'
                              }}
                            >
                              <i className="fas fa-comment me-2"></i>
                              Message
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="col-md-6 mb-4">
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    padding: '24px', 
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
                    border: '1px solid #e2e8f0',
                    height: '100%'
                  }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                      padding: '16px 20px', 
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      <h6 className="mb-0" style={{ color: '#1e293b', fontWeight: '600' }}>
                        <i className="fas fa-address-card me-2" style={{ color: '#667eea' }}></i>
                        Contact Information
                      </h6>
                    </div>
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-envelope me-3" style={{ width: '20px', color: '#667eea' }}></i>
                          <div>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Email</small>
                            <span style={{ color: '#1e293b', fontWeight: '500' }}>{selectedDoctor.email || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-phone me-3" style={{ width: '20px', color: '#667eea' }}></i>
                          <div>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Contact Number</small>
                            <span style={{ color: '#1e293b', fontWeight: '500' }}>{selectedDoctor.contactNumber || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-map-marker-alt me-3" style={{ width: '20px', color: '#667eea' }}></i>
                          <div>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Address</small>
                            <span style={{ color: '#1e293b', fontWeight: '500' }}>{selectedDoctor.address || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="col-md-6 mb-4">
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    padding: '24px', 
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
                    border: '1px solid #e2e8f0',
                    height: '100%'
                  }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                      padding: '16px 20px', 
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      <h6 className="mb-0" style={{ color: '#1e293b', fontWeight: '600' }}>
                        <i className="fas fa-graduation-cap me-2" style={{ color: '#667eea' }}></i>
                        Professional Details
                      </h6>
                    </div>
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-certificate me-3" style={{ width: '20px', color: '#667eea' }}></i>
                          <div>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Degree</small>
                            <span style={{ color: '#1e293b', fontWeight: '500' }}>{selectedDoctor.degree || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-clock me-3" style={{ width: '20px', color: '#667eea' }}></i>
                          <div>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Experience</small>
                            <span style={{ color: '#1e293b', fontWeight: '500' }}>{selectedDoctor.experience} years</span>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-stethoscope me-3" style={{ width: '20px', color: '#667eea' }}></i>
                          <div>
                            <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Specialization</small>
                            <span style={{ color: '#1e293b', fontWeight: '500' }}>{selectedDoctor.specialization}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="col-12">
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    padding: '24px', 
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                      padding: '16px 20px', 
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      <h6 className="mb-0" style={{ color: '#1e293b', fontWeight: '600' }}>
                        <i className="fas fa-info-circle me-2" style={{ color: '#667eea' }}></i>
                        Account Details
                      </h6>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Profile Created</small>
                        <span style={{ color: '#1e293b', fontWeight: '500' }}>{formatDate(selectedDoctor.createdAt)}</span>
                      </div>
                      <div className="col-md-6">
                        <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Profile Status</small>
                        <span className={`badge ${getStatusBadgeClass(selectedDoctor.status)} px-3 py-1`} style={{ fontSize: '0.8rem' }}>
                          {selectedDoctor.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clinic Information Tab */}
            {activeTab === 'clinic' && (
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
                border: '1px solid #e2e8f0' 
              }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                  padding: '20px 24px', 
                  borderRadius: '16px 16px 0 0',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <h6 className="mb-0" style={{ color: '#1e293b', fontWeight: '600' }}>
                    <i className="fas fa-clinic-medical me-2" style={{ color: '#667eea' }}></i>
                    Clinic Information
                  </h6>
                </div>
                <div style={{ padding: '24px' }}>
                  {clinicInfo ? (
                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <div style={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                          padding: '20px', 
                          borderRadius: '12px', 
                          color: 'white',
                          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                        }}>
                          <small style={{ color: 'rgba(255,255,255,0.8)', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Clinic Name</small>
                          <h5 className="mb-0" style={{ fontWeight: '700' }}>{clinicInfo.clinicName}</h5>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                          padding: '20px', 
                          borderRadius: '12px', 
                          color: 'white',
                          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                        }}>
                          <small style={{ color: 'rgba(255,255,255,0.8)', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Consultation Fee</small>
                          <h5 className="mb-0" style={{ fontWeight: '700' }}>₹{clinicInfo.consultationFee}</h5>
                        </div>
                      </div>
                      <div className="col-12 mb-4">
                        <div style={{ 
                          background: '#f8fafc', 
                          padding: '20px', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0'
                        }}>
                          <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Complete Address</small>
                          <p className="mb-0" style={{ color: '#1e293b', fontWeight: '500', fontSize: '1rem' }}>
                            {clinicInfo.clinicAddress}, {clinicInfo.city}
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Working Days</small>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {clinicInfo.clinicTiming?.days?.map(day => (
                            <span key={day} className="badge px-3 py-2" style={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>{day}</span>
                          ))}
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Operating Hours</small>
                        <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '1rem' }}>
                          {clinicInfo.clinicTiming?.startTime} - {clinicInfo.clinicTiming?.endTime}
                        </span>
                      </div>
                      <div className="col-md-4 mb-3">
                        <small style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Slot Duration</small>
                        <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '1rem' }}>
                          {clinicInfo.clinicTiming?.slotDuration} minutes
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Only show clinic creation form if current user is a doctor AND viewing their own profile
                    // This ensures only the authenticated doctor can create their own clinic
                    isDoctor && selectedDoctor?.userId === currentUser?.id ? (
                      <ClinicCreationForm 
                        currentUser={currentUser}
                        selectedDoctor={selectedDoctor}
                        userRoles={userRoles}
                        onClinicCreated={(newClinic) => {
                          setClinicInfo(newClinic);
                          toast.success('Clinic created successfully!');
                        }}
                      />
                    ) : (
                      <div className="text-center py-5">
                        <i className="fas fa-clinic-medical text-muted mb-3" style={{ fontSize: '4rem', color: '#cbd5e1' }}></i>
                        <h5 style={{ color: '#1e293b', fontWeight: '600' }}>No clinic information available</h5>
                        <p style={{ color: '#64748b' }}>
                          This doctor hasn't set up their clinic information yet.<br />
                          {isDoctor && selectedDoctor?.userId !== currentUser?.id ? 
                            'Only the doctor can set up their own clinic.' :
                            'Clinic details will appear here once they complete their clinic setup.'
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Available Slots Tab */}
            {activeTab === 'slots' && (
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
                border: '1px solid #e2e8f0' 
              }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
                  padding: '20px 24px', 
                  borderRadius: '16px 16px 0 0',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <h6 className="mb-0" style={{ color: '#1e293b', fontWeight: '600' }}>
                    <i className="fas fa-calendar-alt me-2" style={{ color: '#667eea' }}></i>
                    Available Slots
                  </h6>
                </div>
                <div style={{ padding: '24px' }}>
                  {slots.length > 0 ? (
                    <div className="row">
                      {slots.map((slot) => (
                        <div key={slot._id} className="col-md-6 col-lg-4 mb-3">
                          <div style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                            padding: '20px', 
                            borderRadius: '12px', 
                            color: 'white',
                            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                            textAlign: 'center'
                          }}>
                            <div className="mb-2">
                              <i className="fas fa-calendar-day" style={{ fontSize: '1.5rem' }}></i>
                            </div>
                            <h6 className="mb-1" style={{ fontWeight: '700' }}>{formatDate(slot.start)}</h6>
                            <p className="mb-2" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </p>
                            <span className="badge px-3 py-1" style={{ 
                              background: 'rgba(255,255,255,0.2)', 
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>Available</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="fas fa-calendar-times mb-3" style={{ fontSize: '4rem', color: '#cbd5e1' }}></i>
                      <h5 style={{ color: '#1e293b', fontWeight: '600' }}>No available slots</h5>
                      <p style={{ color: '#64748b' }}>
                        This doctor doesn't have any available slots at the moment.<br />
                        Available appointment slots will appear here when the doctor creates them.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '60px 40px', 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <i className="fas fa-user-md mb-4" style={{ fontSize: '4rem', color: '#cbd5e1' }}></i>
          <h4 style={{ color: '#1e293b', fontWeight: '700', marginBottom: '16px' }}>Select a Doctor</h4>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Choose a doctor from the list above to view their detailed profile and information.</p>
        </div>
      )}
    </div>
  );
}
