import "@fortawesome/fontawesome-free/css/all.min.css";

export default function Footer() {
  return (
    <footer className="bg-white border-top mt-auto" style={{ 
      borderTop: '1px solid #e2e8f0',
      minHeight: '60px'
    }}>
      <div className="container-fluid px-4 py-3">
        <div className="row align-items-center">
          {/* Left Section */}
          <div className="col-md-6">
            <div className="d-flex align-items-center">
              <span className="text-muted" style={{ fontSize: '14px' }}>
                © 2024 Healthcare Platform. All rights reserved.
              </span>
            </div>
          </div>

          {/* Right Section */}
          <div className="col-md-6">
            <div className="d-flex align-items-center justify-content-md-end justify-content-start mt-2 mt-md-0">
              <div className="d-flex align-items-center">
                <a href="/privacy" className="text-muted text-decoration-none me-3" style={{ fontSize: '14px' }}>
                  Privacy Policy
                </a>
                <a href="/terms" className="text-muted text-decoration-none me-3" style={{ fontSize: '14px' }}>
                  Terms of Service
                </a>
                <a href="/support" className="text-muted text-decoration-none" style={{ fontSize: '14px' }}>
                  Support
                </a>
              </div>
              
              <div className="ms-3 d-flex align-items-center">
                <span className="text-muted me-2" style={{ fontSize: '12px' }}>Follow us:</span>
                <a href="#" className="text-muted me-2" style={{ fontSize: '16px' }}>
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="text-muted me-2" style={{ fontSize: '16px' }}>
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-muted" style={{ fontSize: '16px' }}>
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
