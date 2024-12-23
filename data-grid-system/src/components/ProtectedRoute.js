import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  let user = null;

  try {
    // Try to parse the user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
  }

  console.log("Logged in user in ProtectedRoute:", user);

  // Ensure role 
  if (!user || (role && user.role.toLowerCase() !== role.toLowerCase())) {
    console.warn(`User role "${user?.role}" does not match required role "${role}"`);
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
