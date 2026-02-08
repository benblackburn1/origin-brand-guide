import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import api from '../utils/api';

const FixedNav = () => {
  const { togglePanel } = useChat();
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await api.get('/assets/grouped');
        const logos = res.data?.data?.logos;
        // Find primary logo
        const primaryLogo = logos?.['logo-primary']?.[0] || logos?.['logo-wordmark']?.[0];
        if (primaryLogo?.preview_url) {
          setLogoUrl(primaryLogo.preview_url);
        } else if (primaryLogo?.files?.[0]?.file_url) {
          setLogoUrl(primaryLogo.files[0].file_url);
        }
      } catch (err) {
        // Logo not available
      }
    };
    fetchLogo();
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 30,
        left: 30,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 50,
        background: 'transparent',
        padding: 0,
        border: 'none',
      }}
    >
      {/* App Icon Button - AI Assistant */}
      <button
        onClick={togglePanel}
        title="Brand Assistant"
        style={{
          width: 64,
          height: 64,
          background: 'rgba(19, 19, 19, 0.10)',
          backdropFilter: 'blur(12.1px)',
          WebkitBackdropFilter: 'blur(12.1px)',
          padding: '18px 19px',
          border: 'none',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(19, 19, 19, 0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(19, 19, 19, 0.10)';
        }}
      >
        {/* AI/Sparkle Icon */}
        <svg
          width="26"
          height="28"
          viewBox="0 0 26 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 0L15.5 10.5L26 14L15.5 17.5L13 28L10.5 17.5L0 14L10.5 10.5L13 0Z"
            fill="#131313"
          />
        </svg>
      </button>

      {/* Client Logo Container */}
      <div
        style={{
          height: 64,
          background: 'rgba(19, 19, 19, 0.10)',
          backdropFilter: 'blur(12.1px)',
          WebkitBackdropFilter: 'blur(12.1px)',
          padding: '18px 19px',
          border: 'none',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Client Logo"
            style={{
              maxHeight: 28,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#131313',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            BRAND
          </span>
        )}
      </div>
    </nav>
  );
};

export default FixedNav;
