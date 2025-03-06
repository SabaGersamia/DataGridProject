import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, role }) => {
  let user = null;

  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user = JSON.parse(storedUser);
    } else {
      // If user is missing decoding from authToken
      const token = localStorage.getItem('authToken');
      if (token) {
        const decodedUser = jwtDecode(token);
        user = {
          username: decodedUser["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
          role: decodedUser["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
        };
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
  } catch (error) {
    console.error("Error parsing user data in ProtectedRoute:", error);
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