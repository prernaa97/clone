import { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";
import Swal from 'sweetalert2';
import Cookies from "js-cookie";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useHeader } from "./context/HeaderContext";

/**
 * DoctorProfile Component
 * 
 * This component handles doctor profile submission to the backend API.
 * It includes proper validation, JWT token handling, and error management.
 * 
 * Features:
 * - JWT token validation and expiration check
 * - Comprehensive form validation matching backend requirements
 * - Proper error handling with user-friendly messages
 * - Automatic token cleanup on invalid/expired tokens
 */
export default function DoctorProfile() {
  const { updateHeader } = useHeader();
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    experience: "",
    email: "",
    contact_no: "",
    degree: "",
    specialization: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [existingProfilePicture, setExistingProfilePicture] = useState(null);
  const fileInputRef = useRef(null);

  // Update header when component mounts
  useEffect(() => {
    updateHeader("Doctor Registration", "Complete your profile to join our medical network");
  }, [updateHeader]);

  const specializations = [
    "Gynecology",
    "Obstetrics", 
    "Infertility & IVF",
    "Menstrual & Menopause Care",
    "PCOS/PCOD",
    "Reproductive Cancers",
    "Family Planning & Contraception",
    "Maternal & Child Health",
    "Sexual & Reproductive Health"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size should be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const validateForm = () => {
    const { name, bio, experience, email, contact_no, degree, specialization } = formData;
    
    if (!name.trim()) {
      toast.error("Name is required");
      return false;
    }
    
    if (!bio.trim()) {
      toast.error("Bio is required");
      return false;
    }
    
    if (!experience.trim()) {
      toast.error("Experience is required");
      return false;
    }
    
    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    
    // password removed from profile form; authentication handled at login
    
    if (!contact_no.trim()) {
      toast.error("Contact number is required");
      return false;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact_no.replace(/\s+/g, ''))) {
      toast.error("Contact number must be exactly 10 digits");
      return false;
    }
    
    if (!degree.trim()) {
      toast.error("Degree is required");
      return false;
    }
    
    if (!specialization) {
      toast.error("Please select a specialization");
      return false;
    }
    
    return true;
  };

  // Helper function to decode JWT token
  const decodeToken = (token) => {
    try {
      // JWT has 3 parts separated by dots: header.payload.signature
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Helper function to check if token is expired
  const isTokenExpired = (decodedToken) => {
    if (!decodedToken || !decodedToken.exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get and validate token from cookies
      const token = Cookies.get("token");
      if (!token) {
        toast.error("Please login first");
        setIsSubmitting(false);
        return;
      }

      // Decode token to get userId
      const decodedToken = decodeToken(token);
      if (!decodedToken || !decodedToken.sub) {
        toast.error("Invalid session. Please login again");
        Cookies.remove("token"); // Clear invalid token
        setIsSubmitting(false);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(decodedToken)) {
        toast.error("Session expired. Please login again");
        Cookies.remove("token"); // Clear expired token
        setIsSubmitting(false);
        return;
      }

      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      // Add profile picture if exists
      if (profilePicture) {
        submitData.append('profilePicture', profilePicture);
      }

      console.log('Submitting with profile picture:', !!profilePicture); // Debug log

      const response = await axios.post(
        "http://localhost:5000/api/profiles/submit",
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        Swal.fire({
          title: 'Success!',
          text: 'Your profile request has been submitted successfully. You will be notified once it is reviewed by the admin.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        
        // Reset form
        setFormData({
          name: "",
          bio: "",
          experience: "",
          email: "",
          password: "",
          contact_no: "",
          degree: "",
          specialization: ""
        });
        setProfilePicture(null);
        setProfilePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || "An error occurred";
        
        if (status === 400) {
          toast.error(message);
        } else if (status === 401) {
          toast.error("Authentication failed. Please login again");
          Cookies.remove("token");
        } else if (status === 403) {
          toast.error("Access denied. You don't have permission to perform this action");
        } else if (status === 500) {
          toast.error("Server error. Please try again later");
        } else {
          toast.error(message);
        }
      } else if (error.request) {
        // Network error
        toast.error("Network error. Please check your internet connection and try again");
      } else {
        // Something else happened
        toast.error("An unexpected error occurred. Please try again");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div style={{ 
        width: '100%',
        height: '100%',
        padding: '0',
        margin: '0',
        minHeight: "calc(100vh - 140px)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box'
      }}>
        <div className="row g-0 justify-content-center align-items-center" style={{ minHeight: "calc(100vh - 140px)" }}>
          <div className="col-12 col-xl-10 p-3">
              
          {/* Doctor Registration Form Card */}
              <div className="card border-0 shadow-lg w-100" style={{ 
                borderRadius: '20px', 
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden'
              }}>
                <div className="card-body p-3">
                  {/* Compact Header */}
                  <div className="text-center mb-3">
                    <h5 className="mb-1 fw-medium" style={{ color: '#667eea' }}>Doctor Registration</h5>
                    <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Join our medical network</p>
                  </div>

                  <div className="row g-0">
                    {/* Left Column - Profile Picture */}
                    <div className="col-md-4 d-flex flex-column align-items-center justify-content-center p-3">
                      <div className="position-relative mb-2">
                        {profilePreview || existingProfilePicture ? (
                          <div className="position-relative">
                            <img
                              src={profilePreview || existingProfilePicture}
                              alt="Profile Preview"
                              className="rounded-circle border border-2"
                              style={{ 
                                width: '140px', 
                                height: '140px', 
                                objectFit: 'cover',
                                borderColor: '#667eea !important',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm position-absolute top-0 end-0 rounded-circle border-0"
                              onClick={removeProfilePicture}
                              style={{ 
                                width: '25px', 
                                height: '25px',
                                background: '#ff4757',
                                fontSize: '12px',
                                color: 'white',
                                lineHeight: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center border border-2 border-dashed"
                            style={{ 
                              width: '140px', 
                              height: '140px', 
                              cursor: 'pointer',
                              borderColor: '#667eea',
                              background: 'linear-gradient(135deg, #f8f9ff 0%, #e3e7ff 100%)',
                              transition: 'all 0.3s ease'
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onMouseOver={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #e3e7ff 0%, #d1d9ff 100%)';
                              e.target.style.transform = 'scale(1.02)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'linear-gradient(135deg, #f8f9ff 0%, #e3e7ff 100%)';
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            <div className="text-center">
                              <i className="fas fa-camera" style={{ fontSize: '28px', color: '#667eea', marginBottom: '5px' }}></i>
                              <div style={{ fontSize: '11px', color: '#667eea', fontWeight: '500' }}>Click to upload</div>
                              <div style={{ fontSize: '9px', color: '#999' }}>JPG, PNG max 5MB</div>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="d-none"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary border-0"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ 
                          fontSize: '11px', 
                          borderRadius: '15px',
                          padding: '6px 16px',
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: '#667eea',
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#667eea';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                          e.target.style.color = '#667eea';
                        }}
                      >
                        <i className="fas fa-upload me-1"></i>
                        {profilePreview || existingProfilePicture ? 'Change Photo' : 'Upload Photo'}
                      </button>
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="col-md-8 p-3">
                      <form onSubmit={handleSubmit}>

                        {/* Ultra Compact Form Grid */}
                        <div className="row g-2">
                          {/* Row 1: Name & Email */}
                          <div className="col-6">
                            <label className="text-muted mb-1" style={{ fontSize: '11px' }}>Name</label>
                            <input
                              type="text"
                              className="form-control form-control-sm border-0"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Dr. John Doe"
                              required
                              style={{ 
                                borderRadius: '8px', 
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#f8f9fa',
                                height: '32px'
                              }}
                            />
                          </div>
                          <div className="col-6">
                            <label className="text-muted mb-1" style={{ fontSize: '11px' }}>Email</label>
                            <input
                              type="email"
                              className="form-control form-control-sm border-0"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="doctor@example.com"
                              autoComplete="email"
                              required
                              style={{ 
                                borderRadius: '8px', 
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#f8f9fa',
                                height: '32px'
                              }}
                            />
                          </div>

                          {/* Row 2: Phone */}
                          <div className="col-6">
                            <label className="text-muted mb-1" style={{ fontSize: '11px' }}>Phone</label>
                            <input
                              type="tel"
                              className="form-control form-control-sm border-0"
                              name="contact_no"
                              value={formData.contact_no}
                              onChange={handleInputChange}
                              placeholder="1234567890"
                              maxLength="10"
                              autoComplete="tel"
                              required
                              style={{ 
                                borderRadius: '8px', 
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#f8f9fa',
                                height: '32px'
                              }}
                            />
                          </div>

                          {/* Row 3: Degree & Experience */}
                          <div className="col-6">
                            <label className="text-muted mb-1" style={{ fontSize: '11px' }}>Degree</label>
                            <input
                              type="text"
                              className="form-control form-control-sm border-0"
                              name="degree"
                              value={formData.degree}
                              onChange={handleInputChange}
                              placeholder="MBBS, MD"
                              required
                              style={{ 
                                borderRadius: '8px', 
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#f8f9fa',
                                height: '32px'
                              }}
                            />
                          </div>
                          <div className="col-6">
                            <label className="text-muted mb-1" style={{ fontSize: '11px' }}>Experience</label>
                            <input
                              type="text"
                              className="form-control form-control-sm border-0"
                              name="experience"
                              value={formData.experience}
                              onChange={handleInputChange}
                              placeholder="5 years"
                              required
                              style={{ 
                                borderRadius: '8px', 
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#f8f9fa',
                                height: '32px'
                              }}
                            />
                          </div>

                          {/* Row 4: Specialization */}
                          <div className="col-12">
                            <label className="text-muted mb-1" style={{ fontSize: '11px' }}>Specialization</label>
                            <select
                              className="form-select form-select-sm border-0"
                              name="specialization"
                              value={formData.specialization}
                              onChange={handleInputChange}
                              required
                              style={{ 
                                borderRadius: '8px', 
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#f8f9fa',
                                height: '32px'
                              }}
                            >
                              <option value="">Choose specialization</option>
                              {specializations.map((spec, index) => (
                                <option key={index} value={spec}>{spec}</option>
                              ))}
                            </select>
                          </div>

                          {/* Row 5: Bio */}
                          <div className="col-12">
                            <label className="text-muted mb-1" style={{ fontSize: '11px' }}>Bio</label>
                            <textarea
                              className="form-control form-control-sm border-0"
                              name="bio"
                              value={formData.bio}
                              onChange={handleInputChange}
                              placeholder="Brief professional background..."
                              required
                              rows="2"
                              style={{ 
                                borderRadius: '8px', 
                                padding: '6px 10px',
                                fontSize: '12px',
                                background: '#f8f9fa',
                                resize: 'none'
                              }}
                            ></textarea>
                          </div>
                        </div>

                        {/* Compact Submit Button */}
                        <div className="mt-3 pt-2">
                          <button
                            type="submit"
                            className="btn w-100 border-0"
                            disabled={isSubmitting}
                            style={{ 
                              borderRadius: '8px',
                              fontSize: '12px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              padding: '8px 16px',
                              height: '36px'
                            }}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="spinner-border" style={{ width: '12px', height: '12px' }}></span>
                                <span className="ms-1">Submitting...</span>
                              </>
                            ) : (
                              'Submit Application'
                            )}
                          </button>
                          
                          <div className="text-center mt-2">
                            <small className="text-muted" style={{ fontSize: '10px' }}>
                              Review takes 24-48 hours
                            </small>
                          </div>
                        </div>
                      </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
