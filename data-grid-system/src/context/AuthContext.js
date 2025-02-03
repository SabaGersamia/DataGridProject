import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (token && typeof token === 'string') {
      try {
        const decodedUser = jwtDecode(token);
        console.log("Decoded User on Load:", decodedUser);

        const username = decodedUser["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        const role = decodedUser["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        if (username && role) {
          setUser({ username, role });
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log("Logged in user:", userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
