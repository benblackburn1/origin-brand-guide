import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on scroll (for mobile)
  useEffect(() => {
    if (!isExpanded) return;
    const handleScroll = () => {
      if (isMobile) setIsExpanded(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExpanded, isMobile]);

  const handleTriggerInteraction = useCallback(() => {
    if (isMobile) {
      setIsExpanded(true);
    }
  }, [isMobile]);

  const handleTriggerHover = useCallback(() => {
    if (!isMobile) {
      setIsExpanded(true);
    }
  }, [isMobile]);

  const handleSidebarLeave = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleOverlayClick = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/guidelines',
      label: 'Brand Assets',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/templates',
      label: 'Brand Application',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    },
    {
      path: '/creator',
      label: 'Creator',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Sidebar Trigger Bar - Vertically centered on left edge */}
      <div
        onClick={handleTriggerInteraction}
        onMouseEnter={handleTriggerHover}
        style={{
          position: 'fixed',
          left: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 15,
          height: 138,
          background: 'rgba(19, 19, 19, 0.20)',
          border: 'none',
          borderRadius: 5,
          boxShadow: 'none',
          cursor: 'pointer',
          zIndex: 40,
          opacity: isExpanded ? 0 : 1,
          pointerEvents: isExpanded ? 'none' : 'auto',
          transition: 'opacity 250ms ease-in-out',
        }}
      />

      {/* Sidebar overlay (dim background) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.10)',
          zIndex: 40,
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition: 'opacity 250ms ease-in-out',
        }}
        onClick={handleOverlayClick}
      />

      {/* Sidebar panel */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%',
          width: 256,
          background: '#F0EEE0',
          boxShadow: isExpanded ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none',
          zIndex: 50,
          transform: isExpanded ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
        onMouseLeave={!isMobile ? handleSidebarLeave : undefined}
      >
        {/* Navigation - centered vertically */}
        <nav style={{ padding: '0 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsExpanded(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  background: isActive(item.path)
                    ? '#802A02'
                    : 'rgba(19, 19, 19, 0.10)',
                  backdropFilter: isActive(item.path) ? 'none' : 'blur(12.1px)',
                  WebkitBackdropFilter: isActive(item.path) ? 'none' : 'blur(12.1px)',
                  color: isActive(item.path) ? '#F0EEE0' : '#131313',
                  textDecoration: 'none',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'rgba(19, 19, 19, 0.18)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'rgba(19, 19, 19, 0.10)';
                  }
                }}
              >
                <span style={{ color: isActive(item.path) ? '#EEC8B3' : '#802A02' }}>
                  {item.icon}
                </span>
                <span style={{
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  fontSize: '14px'
                }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer - absolute positioned at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px',
            borderTop: '1px solid #EEC8B3',
          }}
        >
          <p style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#802A02',
          }}>
            Brand Hub
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
