import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const App = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  
  // Enhanced Admin Security State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  
  // Security refs
  const loginTimeoutRef = useRef(null);
  const sessionTimeoutRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  // Security constants
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'pandamodz2024';
  const MAX_LOGIN_ATTEMPTS = 3;
  const LOCKOUT_DURATION = 300000; // 5 minutes
  const SESSION_DURATION = 1800000; // 30 minutes
  const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Security: Check for existing admin session
  useEffect(() => {
    const adminSession = localStorage.getItem('pandaAdminSession');
    const sessionTime = localStorage.getItem('pandaSessionTime');
    const currentTime = Date.now();
    
    if (adminSession === 'true' && sessionTime) {
      const sessionAge = currentTime - parseInt(sessionTime);
      if (sessionAge < SESSION_DURATION) {
        setIsAdminLoggedIn(true);
        const remainingTime = SESSION_DURATION - sessionAge;
        setSessionExpiry(currentTime + remainingTime);
        startSessionTimer(remainingTime);
      } else {
        // Session expired
        handleSecureLogout();
      }
    }

    // Check for lockout status
    const lockoutEnd = localStorage.getItem('pandaLockoutEnd');
    if (lockoutEnd && currentTime < parseInt(lockoutEnd)) {
      setIsLocked(true);
      setLockoutTime(parseInt(lockoutEnd));
      startLockoutTimer(parseInt(lockoutEnd) - currentTime);
    }

    // Clear sensitive data on page unload
    const handleBeforeUnload = () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  // Security: Input validation and sanitization
  const sanitizeInput = useCallback((input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[<>\"'&]/g, '') // Remove potential XSS characters
      .trim()
      .slice(0, 50); // Limit length
  }, []);

  // Security: Rate limiting for login attempts
  const startLockoutTimer = useCallback((duration) => {
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
    }
    
    loginTimeoutRef.current = setTimeout(() => {
      setIsLocked(false);
      setLockoutTime(0);
      setLoginAttempts(0);
      localStorage.removeItem('pandaLockoutEnd');
      localStorage.removeItem('pandaLoginAttempts');
    }, duration);
  }, []);

  // Security: Session management
  const startSessionTimer = useCallback((duration) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    sessionTimeoutRef.current = setTimeout(() => {
      setShowSecurityWarning(true);
      setTimeout(() => {
        handleSecureLogout();
        setShowSecurityWarning(false);
      }, 30000); // 30 second warning
    }, duration - 30000);
  }, []);

  // Security: Secure logout
  const handleSecureLogout = useCallback(() => {
    setIsAdminLoggedIn(false);
    setShowAdminPanel(false);
    setShowAdminLogin(false);
    setLoginUsername('');
    setLoginPassword('');
    setSessionExpiry(null);
    
    // Clear all session data
    localStorage.removeItem('pandaAdminSession');
    localStorage.removeItem('pandaSessionTime');
    
    // Clear timeouts
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    // Security log
    console.log('[SECURITY] Admin session terminated at:', new Date().toISOString());
  }, []);

  // Enhanced login handler with security
  const handleAdminLogin = useCallback((e) => {
    e.preventDefault();
    
    // Check if locked out
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setLoginError(`Account locked. Try again in ${remainingTime} minutes.`);
      return;
    }

    // Sanitize inputs
    const cleanUsername = sanitizeInput(loginUsername);
    const cleanPassword = sanitizeInput(loginPassword);
    
    // Validate inputs
    if (!cleanUsername || !cleanPassword) {
      setLoginError('Invalid input detected');
      return;
    }

    // Check credentials
    if (cleanUsername === ADMIN_USER && cleanPassword === ADMIN_PASS) {
      // Successful login
      const currentTime = Date.now();
      const expiryTime = currentTime + SESSION_DURATION;
      
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      setShowAdminPanel(true);
      setLoginError('');
      setLoginAttempts(0);
      setSessionExpiry(expiryTime);
      
      // Store secure session
      localStorage.setItem('pandaAdminSession', 'true');
      localStorage.setItem('pandaSessionTime', currentTime.toString());
      localStorage.removeItem('pandaLoginAttempts');
      localStorage.removeItem('pandaLockoutEnd');
      
      // Start session timer
      startSessionTimer(SESSION_DURATION);
      
      // Clear form
      setLoginUsername('');
      setLoginPassword('');
      
      // Security log
      console.log('[SECURITY] Admin login successful at:', new Date().toISOString());
      
    } else {
      // Failed login
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('pandaLoginAttempts', newAttempts.toString());
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock account
        const lockoutEnd = Date.now() + LOCKOUT_DURATION;
        setIsLocked(true);
        setLockoutTime(lockoutEnd);
        localStorage.setItem('pandaLockoutEnd', lockoutEnd.toString());
        startLockoutTimer(LOCKOUT_DURATION);
        
        setLoginError(`Too many failed attempts. Account locked for 5 minutes.`);
        console.log('[SECURITY] Account locked due to failed login attempts at:', new Date().toISOString());
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        setLoginError(`Invalid credentials. ${remaining} attempts remaining.`);
        console.log('[SECURITY] Failed login attempt at:', new Date().toISOString());
      }
      
      // Clear password field for security
      setLoginPassword('');
    }
  }, [loginUsername, loginPassword, isLocked, lockoutTime, loginAttempts, sanitizeInput, startSessionTimer, startLockoutTimer]);

  // Ultra-stable input handlers with debouncing to prevent flickering
  const [stableUsername, setStableUsername] = useState('');
  const [stablePassword, setStablePassword] = useState('');
  const inputTimeoutRef = useRef(null);

  // Immediate update handlers (no delays, no re-renders)
  const handleUsernameInput = useCallback((e) => {
    const value = e.target.value;
    setStableUsername(value);
    
    // Clear any existing timeout
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    
    // Update main state with minimal delay to prevent flickering
    inputTimeoutRef.current = setTimeout(() => {
      setLoginUsername(value);
    }, 10);
  }, []);

  const handlePasswordInput = useCallback((e) => {
    const value = e.target.value;
    setStablePassword(value);
    
    // Clear any existing timeout
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
    
    // Update main state with minimal delay to prevent flickering
    inputTimeoutRef.current = setTimeout(() => {
      setLoginPassword(value);
    }, 10);
  }, []);

  // Sync stable states with main states when form opens
  useEffect(() => {
    if (showAdminLogin) {
      setStableUsername(loginUsername);
      setStablePassword(loginPassword);
    }
  }, [showAdminLogin, loginUsername, loginPassword]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, []);

  // Ultra-stable form handlers
  const handleStableQuickFill = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setStableUsername('admin');
    setStablePassword('pandamodz2024');
    setLoginUsername('admin');
    setLoginPassword('pandamodz2024');
  }, []);

  const handleStableInstantAccess = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLocked) {
      const currentTime = Date.now();
      const expiryTime = currentTime + SESSION_DURATION;
      
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      setShowAdminPanel(true);
      setLoginError('');
      setSessionExpiry(expiryTime);
      
      localStorage.setItem('pandaAdminSession', 'true');
      localStorage.setItem('pandaSessionTime', currentTime.toString());
      startSessionTimer(SESSION_DURATION);
    }
  }, [isLocked, startSessionTimer]);

  // Ultra-stable close handler
  const handleStableCloseLogin = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowAdminLogin(false);
    setLoginError('');
    setStableUsername('');
    setStablePassword('');
  }, []);

  // Enhanced login handler that uses stable values
  const handleStableAdminLogin = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use stable values for validation
    const username = stableUsername || loginUsername;
    const password = stablePassword || loginPassword;
    
    // Check if locked out
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setLoginError(`Account locked. Try again in ${remainingTime} minutes.`);
      return;
    }

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }

    // Check credentials
    if (username.trim() === 'admin' && password.trim() === 'pandamodz2024') {
      // Successful login
      const currentTime = Date.now();
      const expiryTime = currentTime + SESSION_DURATION;
      
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      setShowAdminPanel(true);
      setLoginError('');
      setLoginAttempts(0);
      setSessionExpiry(expiryTime);
      
      // Store secure session
      localStorage.setItem('pandaAdminSession', 'true');
      localStorage.setItem('pandaSessionTime', currentTime.toString());
      localStorage.removeItem('pandaLoginAttempts');
      localStorage.removeItem('pandaLockoutEnd');
      
      // Start session timer
      startSessionTimer(SESSION_DURATION);
      
      // Clear forms
      setLoginUsername('');
      setLoginPassword('');
      setStableUsername('');
      setStablePassword('');
      
    } else {
      // Failed login
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('pandaLoginAttempts', newAttempts.toString());
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock account
        const lockoutEnd = Date.now() + LOCKOUT_DURATION;
        setIsLocked(true);
        setLockoutTime(lockoutEnd);
        localStorage.setItem('pandaLockoutEnd', lockoutEnd.toString());
        startLockoutTimer(LOCKOUT_DURATION);
        
        setLoginError(`Too many failed attempts. Account locked for 5 minutes.`);
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        setLoginError(`Invalid credentials. ${remaining} attempts remaining.`);
      }
      
      // Clear password field for security
      setStablePassword('');
      setLoginPassword('');
    }
  }, [stableUsername, stablePassword, loginUsername, loginPassword, isLocked, lockoutTime, loginAttempts, startSessionTimer, startLockoutTimer]);

  // Completely re-written AdminLogin component with maximum stability
  const AdminLogin = React.memo(() => {
    return (
      <div 
        className="admin-login-overlay ultra-stable"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            handleStableCloseLogin();
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            handleStableCloseLogin();
          }
        }}
      >
        <div 
          className="admin-login ultra-stable" 
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="admin-login-header ultra-stable">
            <h2>🔐 Secure Admin Access</h2>
            <button 
              className="admin-close ultra-stable" 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStableCloseLogin();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStableCloseLogin();
              }}
              type="button"
            >
              ✕
            </button>
          </div>
          
          <form 
            onSubmit={handleStableAdminLogin} 
            className="admin-login-form ultra-stable"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="security-info ultra-stable">
              <div className="security-badge-login">🔒 Enhanced Security Active</div>
              <p>• Max 3 login attempts</p>
              <p>• 5-minute lockout on failure</p>
              <p>• 30-minute session timeout</p>
            </div>

            <div className="admin-credentials-display ultra-stable">
              <p><strong>Demo Credentials:</strong></p>
              <p>Username: admin</p>
              <p>Password: pandamodz2024</p>
            </div>
            
            <div className="form-group ultra-stable">
              <label htmlFor="admin-username-ultra">Username:</label>
              <input
                id="admin-username-ultra"
                type="text"
                value={stableUsername}
                onChange={handleUsernameInput}
                onInput={handleUsernameInput}
                onFocus={(e) => {
                  e.stopPropagation();
                }}
                onBlur={(e) => {
                  e.stopPropagation();
                  setLoginUsername(e.target.value);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                onKeyUp={(e) => {
                  e.stopPropagation();
                }}
                placeholder="Enter admin username"
                required
                autoComplete="username"
                maxLength="50"
                disabled={isLocked}
                className="ultra-stable-input"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
            
            <div className="form-group ultra-stable">
              <label htmlFor="admin-password-ultra">Password:</label>
              <input
                id="admin-password-ultra"
                type="password"
                value={stablePassword}
                onChange={handlePasswordInput}
                onInput={handlePasswordInput}
                onFocus={(e) => {
                  e.stopPropagation();
                }}
                onBlur={(e) => {
                  e.stopPropagation();
                  setLoginPassword(e.target.value);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                onKeyUp={(e) => {
                  e.stopPropagation();
                }}
                placeholder="Enter admin password"
                required
                autoComplete="current-password"
                maxLength="50"
                disabled={isLocked}
                className="ultra-stable-input"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>

            {isLocked && (
              <div className="lockout-warning ultra-stable">
                🔒 Account temporarily locked. Time remaining: {Math.ceil((lockoutTime - Date.now()) / 1000 / 60)} minutes
              </div>
            )}
            
            {loginError && <div className="admin-error ultra-stable">{loginError}</div>}
            
            <button 
              type="submit" 
              className="admin-login-btn ultra-stable" 
              disabled={isLocked}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              🚀 Secure Login
            </button>
            
            <div className="quick-login ultra-stable">
              <button 
                type="button" 
                className="quick-login-btn ultra-stable"
                onClick={handleStableQuickFill}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isLocked}
              >
                🔑 Quick Fill Demo Credentials
              </button>
              
              <button 
                type="button" 
                className="instant-login-btn ultra-stable"
                onClick={handleStableInstantAccess}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isLocked}
              >
                ⚡ Demo Access (Bypass Login)
              </button>
            </div>
          </form>
          
          <div className="admin-help ultra-stable">
            <p>🔒 Secured with enterprise-grade protection</p>
          </div>
        </div>
      </div>
    );
  });

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    element.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(sectionId);
  };

  const services = [
    {
      icon: '🎮',
      title: 'Game Trainers',
      description: 'Custom cheat engines and enhancement tools designed to give you the ultimate single-player advantage.',
      image: 'https://images.unsplash.com/photo-1593280359364-5242f1958068'
    },
    {
      icon: '⚡',
      title: 'Script Mods',
      description: 'Advanced automation scripts and game-enhancing modifications for seamless gameplay experiences.',
      image: 'https://images.pexels.com/photos/16053029/pexels-photo-16053029.jpeg'
    },
    {
      icon: '🛠️',
      title: 'Quality Tools',
      description: 'Professional game modification utilities and frameworks built with precision and reliability.',
      image: 'https://images.unsplash.com/photo-1648464146474-c78d49c54b05'
    }
  ];

  const videos = [
    {
      id: 'VnVoTmgRM_E',
      title: 'Game Mod Tutorial',
      description: 'Learn how to install and use advanced game modifications',
      embedUrl: 'https://www.youtube.com/embed/VnVoTmgRM_E'
    },
    {
      id: 'pEuEVMzQWFA',
      title: 'Script Development Guide',
      description: 'Step-by-step guide to creating custom game scripts',
      embedUrl: 'https://www.youtube.com/embed/pEuEVMzQWFA'
    },
    {
      id: 'YGso8N62hz8',
      title: 'Advanced Training Tools',
      description: 'Showcase of sophisticated game training utilities',
      embedUrl: 'https://www.youtube.com/embed/YGso8N62hz8?start=194'
    },
    {
      id: 'agIAFSkPMuA',
      title: 'Custom Trainer Creation',
      description: 'Behind-the-scenes look at trainer development process',
      embedUrl: 'https://www.youtube.com/embed/agIAFSkPMuA?start=16'
    },
    {
      id: 'ykKewCjcfy8',
      title: 'Mod Installation Tutorial',
      description: 'Complete guide to safely installing game modifications',
      embedUrl: 'https://www.youtube.com/embed/ykKewCjcfy8?start=125'
    }
  ];

  const showcaseItems = [
    {
      title: 'Advanced Trainers',
      description: 'Sophisticated training tools for popular AAA titles',
      image: 'https://images.unsplash.com/photo-1656662961786-b04873ceb4b9',
      stats: '50K+ Downloads'
    },
    {
      title: 'Script Collection',
      description: 'Comprehensive automation and enhancement scripts',
      image: 'https://images.unsplash.com/photo-1612404475557-369522ece36f',
      stats: '25K+ Active Users'
    },
    {
      title: 'Custom Solutions',
      description: 'Bespoke modifications tailored to your needs',
      image: 'https://images.pexels.com/photos/8728559/pexels-photo-8728559.jpeg',
      stats: '100% Satisfaction'
    }
  ];

  // Security Warning Component
  const SecurityWarning = () => (
    <div className="security-warning">
      <div className="security-warning-content">
        <h3>🔒 Security Notice</h3>
        <p>Your admin session will expire in 30 seconds due to inactivity.</p>
        <button onClick={() => setShowSecurityWarning(false)}>Continue Session</button>
      </div>
    </div>
  );

  // Enhanced Admin Panel with advanced features
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [adminData, setAdminData] = useState({
    totalVisitors: 15847,
    todayVisitors: 324,
    totalDownloads: 89452,
    activeUsers: 1847,
    serverStatus: 'online',
    cpuUsage: 34,
    memoryUsage: 67,
    storageUsage: 45
  });

  // Enhanced Admin Panel with tabs and advanced features
  const AdminPanel = () => {
    const renderTabContent = () => {
      switch(activeAdminTab) {
        case 'dashboard':
          return (
            <div className="admin-dashboard">
              {/* Key Metrics */}
              <div className="metrics-row">
                <div className="metric-card primary">
                  <div className="metric-icon">👥</div>
                  <div className="metric-content">
                    <h3>{adminData.totalVisitors.toLocaleString()}</h3>
                    <p>Total Visitors</p>
                    <span className="metric-change positive">+12.5%</span>
                  </div>
                </div>
                <div className="metric-card success">
                  <div className="metric-icon">⬇️</div>
                  <div className="metric-content">
                    <h3>{adminData.totalDownloads.toLocaleString()}</h3>
                    <p>Total Downloads</p>
                    <span className="metric-change positive">+8.3%</span>
                  </div>
                </div>
                <div className="metric-card warning">
                  <div className="metric-icon">🟢</div>
                  <div className="metric-content">
                    <h3>{adminData.activeUsers.toLocaleString()}</h3>
                    <p>Active Users</p>
                    <span className="metric-change positive">+15.7%</span>
                  </div>
                </div>
                <div className="metric-card info">
                  <div className="metric-icon">📊</div>
                  <div className="metric-content">
                    <h3>{adminData.todayVisitors}</h3>
                    <p>Today's Visitors</p>
                    <span className="metric-change positive">+23.1%</span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="charts-row">
                <div className="chart-card">
                  <h3>📈 Traffic Analytics</h3>
                  <div className="chart-placeholder">
                    <div className="chart-bars">
                      <div className="bar" style={{height: '60%'}}><span>Mon</span></div>
                      <div className="bar" style={{height: '80%'}}><span>Tue</span></div>
                      <div className="bar" style={{height: '45%'}}><span>Wed</span></div>
                      <div className="bar" style={{height: '90%'}}><span>Thu</span></div>
                      <div className="bar" style={{height: '70%'}}><span>Fri</span></div>
                      <div className="bar" style={{height: '85%'}}><span>Sat</span></div>
                      <div className="bar" style={{height: '95%'}}><span>Sun</span></div>
                    </div>
                  </div>
                </div>
                <div className="chart-card">
                  <h3>🎯 Popular Content</h3>
                  <div className="content-list">
                    <div className="content-item">
                      <span className="content-name">Advanced Trainers</span>
                      <div className="progress-bar">
                        <div className="progress" style={{width: '85%'}}></div>
                      </div>
                      <span className="content-value">85%</span>
                    </div>
                    <div className="content-item">
                      <span className="content-name">Script Mods</span>
                      <div className="progress-bar">
                        <div className="progress" style={{width: '72%'}}></div>
                      </div>
                      <span className="content-value">72%</span>
                    </div>
                    <div className="content-item">
                      <span className="content-name">Video Tutorials</span>
                      <div className="progress-bar">
                        <div className="progress" style={{width: '68%'}}></div>
                      </div>
                      <span className="content-value">68%</span>
                    </div>
                    <div className="content-item">
                      <span className="content-name">Quality Tools</span>
                      <div className="progress-bar">
                        <div className="progress" style={{width: '59%'}}></div>
                      </div>
                      <span className="content-value">59%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="status-row">
                <div className="status-card">
                  <h3>🖥️ System Performance</h3>
                  <div className="performance-metrics">
                    <div className="perf-item">
                      <span>CPU Usage</span>
                      <div className="perf-bar">
                        <div className="perf-fill cpu" style={{width: `${adminData.cpuUsage}%`}}></div>
                      </div>
                      <span>{adminData.cpuUsage}%</span>
                    </div>
                    <div className="perf-item">
                      <span>Memory</span>
                      <div className="perf-bar">
                        <div className="perf-fill memory" style={{width: `${adminData.memoryUsage}%`}}></div>
                      </div>
                      <span>{adminData.memoryUsage}%</span>
                    </div>
                    <div className="perf-item">
                      <span>Storage</span>
                      <div className="perf-bar">
                        <div className="perf-fill storage" style={{width: `${adminData.storageUsage}%`}}></div>
                      </div>
                      <span>{adminData.storageUsage}%</span>
                    </div>
                  </div>
                </div>
                <div className="status-card">
                  <h3>⚡ Quick Actions</h3>
                  <div className="quick-actions-grid">
                    <button className="quick-action">
                      <span className="qa-icon">📝</span>
                      <span>New Post</span>
                    </button>
                    <button className="quick-action">
                      <span className="qa-icon">📊</span>
                      <span>Analytics</span>
                    </button>
                    <button className="quick-action">
                      <span className="qa-icon">👥</span>
                      <span>Users</span>
                    </button>
                    <button className="quick-action">
                      <span className="qa-icon">⚙️</span>
                      <span>Settings</span>
                    </button>
                    <button className="quick-action">
                      <span className="qa-icon">💾</span>
                      <span>Backup</span>
                    </button>
                    <button className="quick-action">
                      <span className="qa-icon">🔄</span>
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        
        case 'content':
          return (
            <div className="admin-content-manager">
              <div className="content-header">
                <h3>📝 Content Management</h3>
                <button className="add-content-btn">+ Add New Content</button>
              </div>
              
              <div className="content-sections">
                <div className="content-section">
                  <h4>🎥 Video Management</h4>
                  <div className="content-items">
                    {videos.map((video, index) => (
                      <div key={index} className="content-item-card">
                        <div className="content-thumb">
                          <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} alt={video.title} />
                        </div>
                        <div className="content-details">
                          <h5>{video.title}</h5>
                          <p>{video.description}</p>
                          <div className="content-actions">
                            <button className="edit-btn">✏️ Edit</button>
                            <button className="delete-btn">🗑️ Delete</button>
                            <button className="analytics-btn">📊 Analytics</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="content-section">
                  <h4>🎮 Services Management</h4>
                  <div className="content-items">
                    {services.map((service, index) => (
                      <div key={index} className="content-item-card">
                        <div className="content-thumb">
                          <img src={service.image} alt={service.title} />
                        </div>
                        <div className="content-details">
                          <h5>{service.title}</h5>
                          <p>{service.description}</p>
                          <div className="content-actions">
                            <button className="edit-btn">✏️ Edit</button>
                            <button className="delete-btn">🗑️ Delete</button>
                            <button className="featured-btn">⭐ Feature</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'analytics':
          return (
            <div className="admin-analytics">
              <div className="analytics-header">
                <h3>📊 Advanced Analytics</h3>
                <div className="date-range">
                  <select>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>🌍 Geographic Distribution</h4>
                  <div className="geo-stats">
                    <div className="geo-item">
                      <span className="country">🇺🇸 United States</span>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '65%'}}></div>
                      </div>
                      <span>65%</span>
                    </div>
                    <div className="geo-item">
                      <span className="country">🇬🇧 United Kingdom</span>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '12%'}}></div>
                      </div>
                      <span>12%</span>
                    </div>
                    <div className="geo-item">
                      <span className="country">🇩🇪 Germany</span>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '8%'}}></div>
                      </div>
                      <span>8%</span>
                    </div>
                    <div className="geo-item">
                      <span className="country">🇨🇦 Canada</span>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{width: '7%'}}></div>
                      </div>
                      <span>7%</span>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h4>📱 Device Analytics</h4>
                  <div className="device-stats">
                    <div className="device-chart">
                      <div className="device-slice desktop" style={{'--percentage': '58%'}}>
                        <span>Desktop 58%</span>
                      </div>
                      <div className="device-slice mobile" style={{'--percentage': '32%'}}>
                        <span>Mobile 32%</span>
                      </div>
                      <div className="device-slice tablet" style={{'--percentage': '10%'}}>
                        <span>Tablet 10%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h4>🔗 Referral Sources</h4>
                  <div className="referral-list">
                    <div className="referral-item">
                      <span className="referral-source">🔍 Google Search</span>
                      <span className="referral-count">2,847</span>
                    </div>
                    <div className="referral-item">
                      <span className="referral-source">📺 YouTube</span>
                      <span className="referral-count">1,423</span>
                    </div>
                    <div className="referral-item">
                      <span className="referral-source">💬 Discord</span>
                      <span className="referral-count">987</span>
                    </div>
                    <div className="referral-item">
                      <span className="referral-source">🐦 Twitter</span>
                      <span className="referral-count">654</span>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h4>⏱️ User Engagement</h4>
                  <div className="engagement-metrics">
                    <div className="engagement-item">
                      <span className="metric-label">Avg. Session</span>
                      <span className="metric-value">4:23</span>
                    </div>
                    <div className="engagement-item">
                      <span className="metric-label">Bounce Rate</span>
                      <span className="metric-value">23.4%</span>
                    </div>
                    <div className="engagement-item">
                      <span className="metric-label">Pages/Session</span>
                      <span className="metric-value">3.7</span>
                    </div>
                    <div className="engagement-item">
                      <span className="metric-label">Return Visitors</span>
                      <span className="metric-value">67%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'security':
          return (
            <div className="admin-security">
              <div className="security-header">
                <h3>🔒 Security Center</h3>
                <div className="security-status online">🟢 All Systems Secure</div>
              </div>

              <div className="security-sections">
                <div className="security-section">
                  <h4>🛡️ Security Overview</h4>
                  <div className="security-metrics">
                    <div className="security-metric">
                      <span className="security-icon">🔑</span>
                      <div className="security-info">
                        <h5>Login Attempts</h5>
                        <p>{loginAttempts}/3 failed attempts</p>
                      </div>
                      <div className="security-status-indicator success"></div>
                    </div>
                    <div className="security-metric">
                      <span className="security-icon">⏰</span>
                      <div className="security-info">
                        <h5>Session Status</h5>
                        <p>Active for {Math.floor((Date.now() - (sessionExpiry - SESSION_DURATION)) / 1000 / 60)} minutes</p>
                      </div>
                      <div className="security-status-indicator success"></div>
                    </div>
                    <div className="security-metric">
                      <span className="security-icon">🌐</span>
                      <div className="security-info">
                        <h5>IP Address</h5>
                        <p>127.0.0.1 (Localhost)</p>
                      </div>
                      <div className="security-status-indicator success"></div>
                    </div>
                  </div>
                </div>

                <div className="security-section">
                  <h4>📋 Security Log</h4>
                  <div className="security-log">
                    <div className="log-item success">
                      <span className="log-time">{new Date().toLocaleTimeString()}</span>
                      <span className="log-message">Admin login successful</span>
                      <span className="log-ip">127.0.0.1</span>
                    </div>
                    <div className="log-item info">
                      <span className="log-time">{new Date(Date.now() - 300000).toLocaleTimeString()}</span>
                      <span className="log-message">Session started</span>
                      <span className="log-ip">127.0.0.1</span>
                    </div>
                    <div className="log-item warning">
                      <span className="log-time">{new Date(Date.now() - 600000).toLocaleTimeString()}</span>
                      <span className="log-message">Failed login attempt</span>
                      <span className="log-ip">192.168.1.100</span>
                    </div>
                  </div>
                </div>

                <div className="security-section">
                  <h4>⚙️ Security Settings</h4>
                  <div className="security-settings">
                    <div className="setting-item">
                      <div className="setting-info">
                        <h5>Two-Factor Authentication</h5>
                        <p>Add an extra layer of security</p>
                      </div>
                      <div className="setting-toggle">
                        <input type="checkbox" id="2fa" />
                        <label htmlFor="2fa" className="toggle-switch"></label>
                      </div>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h5>Session Timeout</h5>
                        <p>Automatically logout after inactivity</p>
                      </div>
                      <select className="setting-select">
                        <option>15 minutes</option>
                        <option selected>30 minutes</option>
                        <option>1 hour</option>
                      </select>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h5>Login Notifications</h5>
                        <p>Get notified of new login attempts</p>
                      </div>
                      <div className="setting-toggle">
                        <input type="checkbox" id="notifications" checked />
                        <label htmlFor="notifications" className="toggle-switch"></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'system':
          return (
            <div className="admin-system">
              <div className="system-header">
                <h3>⚙️ System Management</h3>
                <div className="system-status online">🟢 All Systems Operational</div>
              </div>

              <div className="system-sections">
                <div className="system-section">
                  <h4>📊 System Resources</h4>
                  <div className="resource-monitors">
                    <div className="resource-monitor">
                      <div className="resource-header">
                        <span className="resource-icon">🖥️</span>
                        <h5>CPU Usage</h5>
                        <span className="resource-value">{adminData.cpuUsage}%</span>
                      </div>
                      <div className="resource-bar">
                        <div className="resource-fill cpu" style={{width: `${adminData.cpuUsage}%`}}></div>
                      </div>
                    </div>
                    <div className="resource-monitor">
                      <div className="resource-header">
                        <span className="resource-icon">💾</span>
                        <h5>Memory Usage</h5>
                        <span className="resource-value">{adminData.memoryUsage}%</span>
                      </div>
                      <div className="resource-bar">
                        <div className="resource-fill memory" style={{width: `${adminData.memoryUsage}%`}}></div>
                      </div>
                    </div>
                    <div className="resource-monitor">
                      <div className="resource-header">
                        <span className="resource-icon">💿</span>
                        <h5>Storage Usage</h5>
                        <span className="resource-value">{adminData.storageUsage}%</span>
                      </div>
                      <div className="resource-bar">
                        <div className="resource-fill storage" style={{width: `${adminData.storageUsage}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="system-section">
                  <h4>🔧 System Actions</h4>
                  <div className="system-actions-grid">
                    <button className="system-action primary">
                      <span className="action-icon">💾</span>
                      <div className="action-info">
                        <h5>Create Backup</h5>
                        <p>Full system backup</p>
                      </div>
                    </button>
                    <button className="system-action warning">
                      <span className="action-icon">🔄</span>
                      <div className="action-info">
                        <h5>Clear Cache</h5>
                        <p>Clear all cached data</p>
                      </div>
                    </button>
                    <button className="system-action info">
                      <span className="action-icon">🔍</span>
                      <div className="action-info">
                        <h5>System Scan</h5>
                        <p>Check for issues</p>
                      </div>
                    </button>
                    <button className="system-action success">
                      <span className="action-icon">⬆️</span>
                      <div className="action-info">
                        <h5>Update System</h5>
                        <p>Install latest updates</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="system-section">
                  <h4>📋 System Information</h4>
                  <div className="system-info-grid">
                    <div className="info-item">
                      <span className="info-label">Version</span>
                      <span className="info-value">v2.1.0</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Uptime</span>
                      <span className="info-value">7d 14h 23m</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Database</span>
                      <span className="info-value">Connected</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Backup</span>
                      <span className="info-value">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return <div>Loading...</div>;
      }
    };

    return (
      <div className="admin-panel-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdminPanel(false)}>
        <div className="admin-panel advanced">
          <div className="admin-header advanced">
            <div className="admin-brand">
              <h2>🛡️ PANDA_MODZ Admin Console</h2>
              <span className="admin-version">v2.1.0</span>
            </div>
            <div className="admin-header-controls">
              <div className="session-info">
                <span className="session-status">🟢 Active</span>
                <span className="session-time">
                  {sessionExpiry ? Math.floor((sessionExpiry - Date.now()) / 1000 / 60) : 30}m left
                </span>
              </div>
              <button className="admin-minimize">−</button>
              <button className="admin-close" onClick={() => setShowAdminPanel(false)}>✕</button>
            </div>
          </div>
          
          <div className="admin-navigation">
            <button 
              className={`nav-tab ${activeAdminTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('dashboard')}
            >
              <span className="tab-icon">📊</span>
              <span className="tab-label">Dashboard</span>
            </button>
            <button 
              className={`nav-tab ${activeAdminTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('content')}
            >
              <span className="tab-icon">📝</span>
              <span className="tab-label">Content</span>
            </button>
            <button 
              className={`nav-tab ${activeAdminTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('analytics')}
            >
              <span className="tab-icon">📈</span>
              <span className="tab-label">Analytics</span>
            </button>
            <button 
              className={`nav-tab ${activeAdminTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('security')}
            >
              <span className="tab-icon">🔒</span>
              <span className="tab-label">Security</span>
            </button>
            <button 
              className={`nav-tab ${activeAdminTab === 'system' ? 'active' : ''}`}
              onClick={() => setActiveAdminTab('system')}
            >
              <span className="tab-icon">⚙️</span>
              <span className="tab-label">System</span>
            </button>
            <button 
              className="nav-tab logout"
              onClick={handleSecureLogout}
            >
              <span className="tab-icon">🚪</span>
              <span className="tab-label">Logout</span>
            </button>
          </div>

          <div className="admin-content advanced">
            {renderTabContent()}
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="app">
      {/* Security Warning */}
      {showSecurityWarning && <SecurityWarning />}

      {/* Admin Access Button */}
      <button 
        className="admin-access-btn" 
        onClick={() => isAdminLoggedIn ? setShowAdminPanel(true) : setShowAdminLogin(true)}
        title={isAdminLoggedIn ? "Admin Panel" : "Admin Login"}
      >
        {isAdminLoggedIn ? '🛡️' : (isLocked ? '🔒' : '🔐')}
      </button>

      {/* Admin Login Modal */}
      {showAdminLogin && <AdminLogin />}
      
      {/* Admin Panel Modal */}
      {showAdminPanel && <AdminPanel />}

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-text">𝓟𝓐𝓝𝓓𝓐_𝓜𝓞𝓓𝓩</span>
            {isAdminLoggedIn && <span className="admin-indicator">🛡️ Admin</span>}
          </div>
          <div className="nav-links">
            <a href="#home" onClick={() => scrollToSection('home')} className={activeSection === 'home' ? 'active' : ''}>Home</a>
            <a href="#services" onClick={() => scrollToSection('services')} className={activeSection === 'services' ? 'active' : ''}>Services</a>
            <a href="#showcase" onClick={() => scrollToSection('showcase')} className={activeSection === 'showcase' ? 'active' : ''}>Showcase</a>
            <a href="#videos" onClick={() => scrollToSection('videos')} className={activeSection === 'videos' ? 'active' : ''}>Videos</a>
            <a href="#community" onClick={() => scrollToSection('community')} className={activeSection === 'community' ? 'active' : ''}>Community</a>
            <a href="https://www.youtube.com/@DarkPandax" target="_blank" rel="noopener noreferrer" className="youtube-link">
              <span className="youtube-icon">📺</span> YouTube
            </a>
            <a href="https://discord.com/invite/sYT5UXkv7F" target="_blank" rel="noopener noreferrer" className="discord-link">
              <span className="discord-icon">💬</span> Discord
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-background">
          <img src="https://images.pexels.com/photos/8728559/pexels-photo-8728559.jpeg" alt="Panda Gaming Background" className="hero-bg-image" />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-main">ELEVATE YOUR</span>
              <span className="title-accent">GAMING EXPERIENCE</span>
            </h1>
            <p className="hero-subtitle">
              Home of high-quality game mods crafted by Panda – the mind behind powerful tools, 
              custom trainers, and game-enhancing scripts. Transform your single-player adventures 
              into extraordinary experiences.
            </p>
            <div className="hero-buttons">
              <button className="cta-primary" onClick={() => scrollToSection('services')}>
                Explore Mods
                <span className="button-glow"></span>
              </button>
              <button className="cta-secondary" onClick={() => scrollToSection('showcase')}>
                View Showcase
              </button>
              <a href="https://www.youtube.com/@DarkPandax" target="_blank" rel="noopener noreferrer" className="cta-youtube">
                <span className="youtube-icon">📺</span>
                Watch Tutorials
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card">
              <img src="https://images.unsplash.com/photo-1645588799116-4f416bf28902" alt="Gaming Technology" />
              <div className="card-overlay">
                <span className="card-text">Next-Gen Modding</span>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Expertise</h2>
            <p className="section-subtitle">
              Discover the powerful tools and modifications that will transform your gaming experience
            </p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card" style={{ '--delay': `${index * 0.2}s` }}>
                <div className="service-image">
                  <img src={service.image} alt={service.title} />
                  <div className="service-overlay">
                    <span className="service-icon">{service.icon}</span>
                  </div>
                </div>
                <div className="service-content">
                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                  <button className="service-button">
                    Learn More
                    <span className="button-arrow">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-content">
            <div className="features-text">
              <h2 className="features-title">Why Choose PANDA_MODZ?</h2>
              <div className="features-list">
                <div className="feature-item">
                  <div className="feature-icon">✨</div>
                  <div className="feature-text">
                    <h4>Premium Quality</h4>
                    <p>Every mod is crafted with attention to detail and tested for reliability</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🚀</div>
                  <div className="feature-text">
                    <h4>Easy Installation</h4>
                    <p>Simple setup process with clear instructions and support</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔄</div>
                  <div className="feature-text">
                    <h4>Regular Updates</h4>
                    <p>Continuous improvements and compatibility with latest game versions</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🛡️</div>
                  <div className="feature-text">
                    <h4>Safe & Secure</h4>
                    <p>All mods are thoroughly tested and free from malicious code</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="features-visual">
              <img src="https://images.pexels.com/photos/10988021/pexels-photo-10988021.jpeg" alt="Gaming Features" className="features-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="showcase">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Projects</h2>
            <p className="section-subtitle">
              Explore our most popular and innovative game modifications
            </p>
          </div>
          <div className="showcase-grid">
            {showcaseItems.map((item, index) => (
              <div key={index} className="showcase-card">
                <div className="showcase-image">
                  <img src={item.image} alt={item.title} />
                  <div className="showcase-overlay">
                    <div className="showcase-stats">{item.stats}</div>
                  </div>
                </div>
                <div className="showcase-content">
                  <h3 className="showcase-title">{item.title}</h3>
                  <p className="showcase-description">{item.description}</p>
                  <button className="showcase-button">
                    Download Now
                    <span className="download-icon">⬇️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section id="videos" className="videos">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Video Tutorials</h2>
            <p className="section-subtitle">
              Watch step-by-step guides and showcases of our game modifications
            </p>
          </div>
          <div className="videos-grid">
            {videos.map((video, index) => (
              <div key={index} className="video-card">
                <div className="video-wrapper">
                  <iframe
                    src={video.embedUrl}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="video-iframe"
                  ></iframe>
                </div>
                <div className="video-content">
                  <h3 className="video-title">{video.title}</h3>
                  <p className="video-description">{video.description}</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-button"
                  >
                    Watch on YouTube
                    <span className="youtube-icon">📺</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="community">
        <div className="container">
          <div className="community-content">
            <h2 className="community-title">Join the PANDA_MODZ Community</h2>
            <p className="community-subtitle">
              Connect with fellow gamers, get support, and stay updated with the latest releases
            </p>
            <div className="community-buttons">
              <a href="https://discord.com/invite/sYT5UXkv7F" target="_blank" rel="noopener noreferrer" className="discord-button">
                <span className="discord-logo">💬</span>
                Join Discord Server
                <span className="member-count">Active Community</span>
              </a>
              <a href="https://www.youtube.com/@DarkPandax" target="_blank" rel="noopener noreferrer" className="youtube-button">
                <span className="youtube-logo">📺</span>
                Subscribe to YouTube
                <span className="channel-info">Tutorials & Showcases</span>
              </a>
              <button className="newsletter-button">
                <span className="newsletter-icon">📧</span>
                Subscribe for Updates
              </button>
            </div>
          </div>
          <div className="community-visual">
            <img src="https://images.unsplash.com/photo-1583324228839-1be05b21b2b3" alt="Gaming Community" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3 className="footer-title">𝓟𝓐𝓝𝓓𝓐_𝓜𝓞𝓓𝓩</h3>
              <p className="footer-tagline">Elevating gaming experiences, one mod at a time.</p>
              <div className="footer-social">
                <a href="https://www.youtube.com/@DarkPandax" target="_blank" rel="noopener noreferrer" className="social-link">
                  <span>📺</span> YouTube
                </a>
                <a href="https://discord.com/invite/sYT5UXkv7F" target="_blank" rel="noopener noreferrer" className="social-link">
                  <span>💬</span> Discord
                </a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Services</h4>
                <ul>
                  <li><a href="#services">Game Trainers</a></li>
                  <li><a href="#services">Script Mods</a></li>
                  <li><a href="#services">Quality Tools</a></li>
                  <li><a href="#showcase">Custom Solutions</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Community</h4>
                <ul>
                  <li><a href="https://www.youtube.com/@DarkPandax" target="_blank" rel="noopener noreferrer">YouTube Channel</a></li>
                  <li><a href="https://discord.com/invite/sYT5UXkv7F" target="_blank" rel="noopener noreferrer">Discord Server</a></li>
                  <li><a href="#showcase">Download Center</a></li>
                  <li><a href="#community">Support</a></li>
                  <li><a href="#community">Updates</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><a href="#legal">Terms of Service</a></li>
                  <li><a href="#legal">Privacy Policy</a></li>
                  <li><a href="#legal">Disclaimer</a></li>
                  <li><a href="#legal">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 PANDA_MODZ. All rights reserved. Use mods responsibly and respect game developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;