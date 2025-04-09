import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  // Get authentication data from localStorage
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");

  console.log("ProtectedRoute - Token:", token);
  console.log("ProtectedRoute - UserRole:", role);
  console.log("ProtectedRoute - Allowed Roles:", allowedRoles);

  if (!token) {
    // Redirect to login if there's no token
    console.log("No token found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // If the role doesn't match or is missing, redirect to unauthorized page
    console.log(`Role ${role} not allowed, redirecting to unauthorized`);
    return <Navigate to="/unauthorized" replace />;
  }

  // If all checks pass, render the children (protected content)
  return children;
};

export default ProtectedRoute;