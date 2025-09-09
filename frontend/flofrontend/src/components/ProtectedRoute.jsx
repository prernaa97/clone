import Cookies from 'js-cookie';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ element: Component }){
  const token = Cookies.get('token');
  return token ? <Component /> : <Navigate to="/login" />;
}


