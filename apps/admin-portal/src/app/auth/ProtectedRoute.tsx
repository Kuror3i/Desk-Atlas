import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, Role } from './AuthProvider';

type Props = {
  children: ReactNode;
  allowedRoles?: Role[];
};

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // redirect to appropriate area for their role
    if (user.role === 'staff') return <Navigate to="/staff" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}
