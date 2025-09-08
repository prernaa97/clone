import { Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Auth from './authentication/auth';
import DoctorProfile from './DoctorProfile';
import AdminProfileRequests from './components/AdminProfileRequests';
import ProfileStatus from './components/ProfileStatus';
import AdminPlans from './components/AdminPlans';
import Subscription from './components/Subscription';
const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Auth route: no dashboard wrapper, only auth.css applies */}
        <Route path="/" element={<Auth />} />

        {/* App routes: wrapped by Dashboard, global style.css applies when Dashboard is loaded */}
        <Route element={<Dashboard /> }>
          <Route path="/doctor-profile" element={<DoctorProfile />} />
          {/* <Route path="/profile-status" element={<ProfileStatus />} /> */}
          <Route path="/admin/profile-requests" element={<AdminProfileRequests />} />
          
          {/* Doctor Routes */}
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/upgrade-plan" element={<div className="p-4">Upgrade Plan Page</div>} />
          <Route path="/appointments" element={<div className="p-4">Appointments Page</div>} />
          <Route path="/slots" element={<div className="p-4">Slot Management Page</div>} />
          <Route path="/clinic" element={<div className="p-4">Clinic Information Page</div>} />

          {/* Admin Routes */}
          <Route path="/admin/patients" element={<div className="p-4">Patient Management Page</div>} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="/admin/doctors" element={<div className="p-4">Doctors & Subscriptions Page</div>} />

          {/* Patient Routes */}
          <Route path="/my-appointments" element={<div className="p-4">My Appointments Page</div>} />
          <Route path="/browse-doctors" element={<div className="p-4">Browse Doctors Page</div>} />
          <Route path="/my-subscriptions" element={<div className="p-4">Subscriptions Page</div>} />
                  <Route path="/profile-status" element={<ProfileStatus />} />

        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;