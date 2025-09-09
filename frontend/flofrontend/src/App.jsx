import { Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Auth from './authentication/auth';
import DoctorProfile from './DoctorProfile';
import AdminProfileRequests from './components/AdminProfileRequests';
import ProfileStatus from './components/ProfileStatus';
import AdminPlans from './components/AdminPlans';
import Subscription from './components/Subscription';
import UpgradePlan from './components/UpgradePlan';
import ProtectedRoute from './components/ProtectedRoute';
const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={<Auth />} />

        {/* Protected dashboard shell at root */}
        <Route path="/" element={<ProtectedRoute element={Dashboard} />}>
          <Route index element={<ProfileStatus />} />
          <Route path="doctor-profile" element={<DoctorProfile />} />
          <Route path="profile-status" element={<ProfileStatus />} />
          <Route path="admin/profile-requests" element={<AdminProfileRequests />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="upgrade-plan" element={<UpgradePlan />} />
          <Route path="appointments" element={<div className="p-4">Appointments Page</div>} />
          <Route path="slots" element={<div className="p-4">Slot Management Page</div>} />
          <Route path="clinic" element={<div className="p-4">Clinic Information Page</div>} />
          <Route path="admin/patients" element={<div className="p-4">Patient Management Page</div>} />
          <Route path="admin/plans" element={<AdminPlans />} />
          <Route path="admin/doctors" element={<div className="p-4">Doctors & Subscriptions Page</div>} />
          <Route path="my-appointments" element={<div className="p-4">My Appointments Page</div>} />
          <Route path="browse-doctors" element={<div className="p-4">Browse Doctors Page</div>} />
          <Route path="my-subscriptions" element={<div className="p-4">Subscriptions Page</div>} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;