import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-text">𝓟𝓐𝓝𝓓𝓐_𝓜𝓞𝓓𝓩</span>
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