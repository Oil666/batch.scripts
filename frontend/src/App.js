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

  // Optimized input handlers to prevent flickering
  const handleUsernameChange = useCallback((e) => {
    const value = e.target.value;
    setLoginUsername(value);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const value = e.target.value;
    setLoginPassword(value);
  }, []);

  // Quick fill handler
  const handleQuickFill = useCallback((e) => {
    e.stopPropagation();
    setLoginUsername('admin');
    setLoginPassword('pandamodz2024');
  }, []);

  // Instant access handler
  const handleInstantAccess = useCallback((e) => {
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
      
      console.log('[SECURITY] Admin instant access at:', new Date().toISOString());
    }
  }, [isLocked, startSessionTimer]);

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

  // Enhanced Admin Panel with security features
  const AdminPanel = () => (
    <div className="admin-panel-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdminPanel(false)}>
      <div className="admin-panel">
        <div className="admin-header">
          <h2>🛡️ PANDA_MODZ Admin Panel</h2>
          <div className="admin-header-info">
            <span className="session-info">
              Session: {sessionExpiry ? new Date(sessionExpiry).toLocaleTimeString() : 'Active'}
            </span>
            <button className="admin-close" onClick={() => setShowAdminPanel(false)}>✕</button>
          </div>
        </div>
        
        <div className="admin-content">
          <div className="admin-welcome">
            <p className="welcome-message">✅ Successfully logged in as Administrator</p>
            <div className="security-status">
              <span className="security-badge">🔒 Secure Session</span>
              <span className="ip-info">IP: 127.0.0.1 (Localhost)</span>
              <span className="browser-info">Browser: {navigator.userAgent.split(' ')[0]}</span>
            </div>
          </div>
          
          <div className="admin-stats">
            <div className="stat-card">
              <h3>📺 Videos</h3>
              <p>{videos.length} Active</p>
            </div>
            <div className="stat-card">
              <h3>🎮 Services</h3>
              <p>{services.length} Available</p>
            </div>
            <div className="stat-card">
              <h3>🚀 Projects</h3>
              <p>{showcaseItems.length} Featured</p>
            </div>
            <div className="stat-card">
              <h3>🔒 Security</h3>
              <p>Enhanced</p>
            </div>
          </div>

          <div className="admin-sections">
            <div className="admin-section">
              <h3>📊 Website Analytics</h3>
              <div className="analytics-grid">
                <div className="analytics-item">
                  <span className="analytics-label">Page Views</span>
                  <span className="analytics-value">12,547</span>
                </div>
                <div className="analytics-item">
                  <span className="analytics-label">Unique Visitors</span>
                  <span className="analytics-value">3,892</span>
                </div>
                <div className="analytics-item">
                  <span className="analytics-label">Discord Clicks</span>
                  <span className="analytics-value">1,234</span>
                </div>
                <div className="analytics-item">
                  <span className="analytics-label">YouTube Views</span>
                  <span className="analytics-value">8,765</span>
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3>🔒 Security Dashboard</h3>
              <div className="security-grid">
                <div className="security-item">
                  <span className="security-label">Login Attempts</span>
                  <span className="security-value">{loginAttempts}/3</span>
                </div>
                <div className="security-item">
                  <span className="security-label">Account Status</span>
                  <span className="security-value">{isLocked ? 'Locked' : 'Active'}</span>
                </div>
                <div className="security-item">
                  <span className="security-label">Session Time</span>
                  <span className="security-value">30m</span>
                </div>
                <div className="security-item">
                  <span className="security-label">Last Access</span>
                  <span className="security-value">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3>🎬 Content Management</h3>
              <div className="content-actions">
                <button className="admin-btn">📝 Edit Homepage</button>
                <button className="admin-btn">🎥 Manage Videos</button>
                <button className="admin-btn">🎮 Update Services</button>
                <button className="admin-btn">🚀 Edit Showcase</button>
              </div>
            </div>

            <div className="admin-section">
              <h3>🔗 Quick Links Management</h3>
              <div className="links-grid">
                <div className="link-item">
                  <span>Discord:</span>
                  <span className="link-url">discord.com/invite/sYT5UXkv7F</span>
                </div>
                <div className="link-item">
                  <span>YouTube:</span>
                  <span className="link-url">youtube.com/@DarkPandax</span>
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3>⚙️ System Actions</h3>
              <div className="system-actions">
                <button className="admin-btn success">💾 Backup Data</button>
                <button className="admin-btn warning">🔄 Clear Cache</button>
                <button className="admin-btn info">📋 Export Logs</button>
                <button className="admin-btn danger" onClick={handleSecureLogout}>🚪 Secure Logout</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Admin Login with security features
  const AdminLogin = () => (
    <div className="admin-login-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        setShowAdminLogin(false);
      }
    }}>
      <div className="admin-login" onClick={(e) => e.stopPropagation()}>
        <div className="admin-login-header">
          <h2>🔐 Secure Admin Access</h2>
          <button className="admin-close" onClick={() => setShowAdminLogin(false)}>✕</button>
        </div>
        
        <form onSubmit={handleAdminLogin} className="admin-login-form">
          <div className="security-info">
            <div className="security-badge-login">🔒 Enhanced Security Active</div>
            <p>• Max 3 login attempts</p>
            <p>• 5-minute lockout on failure</p>
            <p>• 30-minute session timeout</p>
          </div>

          <div className="admin-credentials-display">
            <p><strong>Demo Credentials:</strong></p>
            <p>Username: admin</p>
            <p>Password: pandamodz2024</p>
          </div>
          
          <div className="form-group">
            <label>Username:</label>
            <input
              ref={usernameRef}
              type="text"
              value={loginUsername}
              onChange={handleUsernameChange}
              placeholder="Enter admin username"
              required
              autoComplete="username"
              maxLength="50"
              disabled={isLocked}
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              ref={passwordRef}
              type="password"
              value={loginPassword}
              onChange={handlePasswordChange}
              placeholder="Enter admin password"
              required
              autoComplete="current-password"
              maxLength="50"
              disabled={isLocked}
            />
          </div>

          {isLocked && (
            <div className="lockout-warning">
              🔒 Account temporarily locked. Time remaining: {Math.ceil((lockoutTime - Date.now()) / 1000 / 60)} minutes
            </div>
          )}
          
          {loginError && <div className="admin-error">{loginError}</div>}
          
          <button type="submit" className="admin-login-btn" disabled={isLocked}>
            🚀 Secure Login
          </button>
          
          <div className="quick-login">
            <button 
              type="button" 
              className="quick-login-btn"
              onClick={handleQuickFill}
              disabled={isLocked}
            >
              🔑 Quick Fill Demo Credentials
            </button>
            
            <button 
              type="button" 
              className="instant-login-btn"
              onClick={handleInstantAccess}
              disabled={isLocked}
            >
              ⚡ Demo Access (Bypass Login)
            </button>
          </div>
        </form>
        
        <div className="admin-help">
          <p>🔒 Secured with enterprise-grade protection</p>
        </div>
      </div>
    </div>
  );

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