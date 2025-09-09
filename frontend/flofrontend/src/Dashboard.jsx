import { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import "./css/style.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { HeaderProvider, useHeader } from "./context/HeaderContext";
import { StatsProvider, useStats } from "./context/StatsContext";

function decode(token){
  try{
    const b = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(decodeURIComponent(atob(b).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')));
  }catch{return null}
}

function DashboardContent(){
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pendingCount, refreshStats } = useStats();
  const { headerInfo } = useHeader();

  useEffect(() => {
    const token = Cookies.get("token");
    if(!token) return;
    const payload = decode(token);
    if(!payload?.sub) return;
    setUser({ id: payload.sub, name: payload.name, email: payload.email });
    axios.get(`http://localhost:5000/users/${payload.sub}/roles`,{
      headers:{ Authorization:`Bearer ${token}` }
    }).then(r=>{
      const userRoles = r.data || [];
      setRoles(userRoles);
      
      if(userRoles.includes('Admin')) {
        refreshStats(token);
      }
    }).catch(()=>{
      // fallback path
      axios.get(`http://localhost:5000/users/roles/${payload.sub}`,{
        headers:{ Authorization:`Bearer ${token}` }
      }).then(r=> {
        const userRoles = r.data || [];
        setRoles(userRoles);
        
        if(userRoles.includes('Admin')) {
          refreshStats(token);
        }
      }).catch(()=>{});
    });
  }, []);


  const isDoctor = useMemo(()=>roles.includes('Doctor'),[roles]);
  const isAdmin = useMemo(()=>roles.includes('Admin'),[roles]);
  const isPatient = useMemo(()=>roles.includes('User'),[roles]);

  const handleLogout = () => {
    Cookies.remove("token");
    window.location.href = "/";
  };

  const itemBaseStyle = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 12, color: '#64748b',
    textDecoration: 'none', fontSize: 14, fontWeight: 500,
    transition: 'all 0.2s ease', position: 'relative'
  };

  const renderItem = (to, label, icon, badge = null) => (
    <NavLink
      to={to}
      style={({isActive})=>({
        ...itemBaseStyle,
        background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
        color: isActive ? '#fff' : '#64748b',
        boxShadow: isActive ? '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none',
        transform: isActive ? 'translateX(2px)' : 'none'
      })}
      onMouseEnter={(e) => {
        if (!e.target.closest('a').classList.contains('active')) {
          e.target.closest('a').style.background = 'rgba(102, 126, 234, 0.08)';
          e.target.closest('a').style.transform = 'translateX(2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!e.target.closest('a').classList.contains('active')) {
          e.target.closest('a').style.background = 'transparent';
          e.target.closest('a').style.transform = 'none';
        }
      }}
    >
      <i className={`fas ${icon}`} style={{width:20, textAlign:'center', fontSize:16}}/>
      <span style={{flex:1}}>{label}</span>
      {badge && (
        <span style={{
          background:'#ef4444', color:'#fff', fontSize:10, fontWeight:600,
          padding:'2px 6px', borderRadius:10, minWidth:18, textAlign:'center'
        }}>{badge}</span>
      )}
    </NavLink>
  );

  return (
    <div className="d-flex flex-column" style={{ margin: '0', padding: '0', width: '100vw', maxWidth: '100vw', overflow: 'hidden', height: '100vh' }}>
      <Header title={headerInfo.title} subtitle={headerInfo.subtitle} />
      
      <div className="d-flex flex-grow-1" style={{ margin: '0', padding: '0', width: '100%', minHeight: 0 }}>
        <aside 
          className={`${sidebarCollapsed ? 'collapsed' : ''}`}
          style={{
            width: sidebarCollapsed ? '60px' : '250px',
            background:'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 
            borderRight:'1px solid #e2e8f0',
            boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
            transition: 'width 0.3s ease',
            position: 'relative',
            flexShrink: 0
          }}
        >
          {/* Collapse Toggle */}
          <div className="p-3 border-bottom" style={{borderBottom:'1px solid #e2e8f0'}}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
              style={{border:'1px solid #e2e8f0', borderRadius:8}}
            >
              <i className={`fas fa-${sidebarCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
              {!sidebarCollapsed && <span className="ms-2">Collapse</span>}
            </button>
          </div>

          {/* User Info */}
          {!sidebarCollapsed && (
            <div className="p-4" style={{borderBottom:'1px solid #e2e8f0'}}>
              <div className="text-center mb-3">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{
                  width:50, height:50, 
                  background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  color:'#fff', fontWeight:700, fontSize:18,
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  {(user?.name||'U').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 text-center">
                  <div style={{fontSize:15, color:'#1e293b', fontWeight:600, lineHeight:1.2}}>
                    {user?.name||'User'}
                  </div>
                  <div style={{
                    fontSize:11, color:'#64748b', marginTop:2,
                    background:'rgba(102, 126, 234, 0.1)', 
                    padding:'2px 8px', borderRadius:12, display:'inline-block'
                  }}>
                    {roles.join(' • ')||'Guest'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <nav className={`${sidebarCollapsed ? 'px-2' : 'p-4'}`} style={{display:'flex', flexDirection:'column', gap:4}}>
            {isDoctor && (
              <>
                {!sidebarCollapsed && (
                  <div style={{
                    fontSize:11, letterSpacing:1, color:'#94a3b8', 
                    textTransform:'uppercase', marginBottom:8, marginTop:8,
                    fontWeight:600
                  }}>
                    🩺 Doctor Panel
                  </div>
                )}
                 {renderItem('/doctor-profile', sidebarCollapsed ? '' : 'Profile','fa-user-md')}
                 {renderItem('/profile-status', sidebarCollapsed ? '' : 'Profile Status','fa-clipboard-check')}
                 {renderItem('/subscription', sidebarCollapsed ? '' : 'My Subscription','fa-crown')}
                 {renderItem('/upgrade-plan', sidebarCollapsed ? '' : 'Upgrade Plan','fa-rocket')}
                 {renderItem('/appointments', sidebarCollapsed ? '' : 'Appointments','fa-calendar-check', '3')}
                 {renderItem('/slots', sidebarCollapsed ? '' : 'Slot Management','fa-clock')}
                 {renderItem('/clinic', sidebarCollapsed ? '' : 'Clinic Information','fa-hospital-alt')}
              </>
            )}

            {isAdmin && (
              <>
                {!sidebarCollapsed && (
                  <div style={{
                    fontSize:11, letterSpacing:1, color:'#94a3b8', 
                    textTransform:'uppercase', marginBottom:8, marginTop:8,
                    fontWeight:600
                  }}>
                    ⚡ Admin Panel
                  </div>
                )}
                {renderItem('/admin/profile-requests', sidebarCollapsed ? '' : 'Profile Requests','fa-user-check', pendingCount > 0 ? pendingCount : null)}
                {renderItem('/admin/patients', sidebarCollapsed ? '' : 'Patient Management','fa-users')}
                {renderItem('/admin/plans', sidebarCollapsed ? '' : 'Plan Creation','fa-layer-group')}
                {renderItem('/admin/doctors', sidebarCollapsed ? '' : 'Doctors & Subscriptions','fa-user-md')}
              </>
            )}

            {isPatient && !isDoctor && !isAdmin && (
              <>
                {!sidebarCollapsed && (
                  <div style={{
                    fontSize:11, letterSpacing:1, color:'#94a3b8', 
                    textTransform:'uppercase', marginBottom:8, marginTop:8,
                    fontWeight:600
                  }}>
                    💊 Patient Portal
                  </div>
                )}
                 {renderItem('/my-appointments', sidebarCollapsed ? '' : 'My Appointments','fa-calendar-alt')}
                 {renderItem('/browse-doctors', sidebarCollapsed ? '' : 'Browse Doctors','fa-stethoscope')}
                 {renderItem('/profile-status', sidebarCollapsed ? '' : 'Profile Status','fa-clipboard-check')}
                 {renderItem('/my-subscriptions', sidebarCollapsed ? '' : 'Subscriptions','fa-credit-card')}
              </>
            )}
          </nav>
        </aside>
        <main className="flex-grow-1" style={{
          background:'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          padding: '0',
          margin: '0',
          width: '100%',
          overflow: 'auto',
          minHeight: 0
        }}>
          <div style={{ padding: '0', margin: '0', width: '100%', height: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export default function Dashboard() {
  return (
    <HeaderProvider>
      <StatsProvider>
        <DashboardContent />
      </StatsProvider>
    </HeaderProvider>
  );
}


