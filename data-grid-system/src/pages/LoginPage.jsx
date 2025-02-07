import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { getColumns, getRows } from '../services/apiService';
import { jwtDecode } from 'jwt-decode';
import '../assets/css/loginPage.css';
import logo from '../assets/imgs/centaurea.jpg';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login: loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await login(username, password);
      console.log("API Response (Token):", token);
  
      if (!token || typeof token !== 'string') {
        throw new Error("Invalid token received from API");
      }
  
      localStorage.setItem('authToken', token);
  
      // Decode JWT to extract user details
      const decodedUser = jwtDecode(token);
      console.log("Decoded JWT Token:", decodedUser);
  
      const decodedUsername = decodedUser["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      const role = decodedUser["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  
      if (!decodedUsername || !role) {
        throw new Error("Invalid token structure");
      }
  
      loginUser({ username: decodedUsername, role });
  
      // Redirect based on role
      if (role === 'Administrator') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error.message || 'Invalid username or password');
    }
  };  

  return (
    <div className="login-page">
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Centaurea Logo" className="logo-img" />
          </Link>
          <nav className="navigation">
            <ul className="nav-links">
              <li><Link to="/" className="nav-link">Home</Link></li>
              <li><Link to="#about" className="nav-link">About</Link></li>     
              <li><Link to="#contact" className="nav-link">Contact</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="login-form-container">
        <div className="login-form">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-button">Login</button>
          </form>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <p className="signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Dynamic Data Grid System. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
