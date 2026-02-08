import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import FixedNav from './FixedNav';
import ChatPanel from './ChatPanel';

const Layout = () => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sidebar */}
      <Sidebar />

      {/* Fixed Nav - Top Left (AI Assistant + Logo) */}
      {user && <FixedNav />}

      {/* Auth Controls - Top Right */}
      <div className="fixed top-[30px] right-[30px] z-50 flex items-center gap-2">
        {user ? (
          <>
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 text-xs uppercase tracking-widest font-semibold text-[#131313] hover:text-[#802A02] transition-colors"
                style={{
                  background: 'rgba(19, 19, 19, 0.10)',
                  backdropFilter: 'blur(12.1px)',
                  WebkitBackdropFilter: 'blur(12.1px)',
                  borderRadius: 4,
                }}
              >
                Admin
              </Link>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 text-xs uppercase tracking-widest font-medium text-[#131313] opacity-70 hover:opacity-100 transition-opacity"
              style={{
                background: 'rgba(19, 19, 19, 0.10)',
                backdropFilter: 'blur(12.1px)',
                WebkitBackdropFilter: 'blur(12.1px)',
                borderRadius: 4,
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 text-xs uppercase tracking-widest font-semibold text-white bg-[#802A02] hover:bg-[#6B2302] transition-colors"
            style={{ borderRadius: 4 }}
          >
            Login
          </Link>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-[110px]">
        <Outlet />
      </main>

      {/* Chat Panel */}
      <ChatPanel />
    </div>
  );
};

export default Layout;
