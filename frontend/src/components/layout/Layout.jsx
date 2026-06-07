import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* Permanent sidebar on left */}
      <Sidebar />

      {/* Top Navbar */}
      <Navbar />

      {/* Page Content Area */}
      <main style={{
        paddingLeft: 'var(--sidebar-width)',
        paddingTop: 'var(--navbar-height)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
