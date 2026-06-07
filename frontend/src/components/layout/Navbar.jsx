import React from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalState } from '../../context/GlobalStateContext';
import { useAuth } from '../../context/AuthContext';
import { Bell } from 'lucide-react';

// This is the Header/Navbar component at the top of the dashboard.
// It displays the title of the current page, shows loading states, and user details.
const Navbar = () => {
  const location = useLocation();
  const { activeJobsCount } = useGlobalState();
  const { user } = useAuth();

  // Simple function to map current URL path to a human readable page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Overview Dashboard';
      case '/calendar': return 'Marketing Calendar';
      case '/generate': return 'AI Content Generator';
      case '/remix': return 'Content Remixer';
      case '/hashtags': return 'Hashtag Lab';
      case '/inbox': return 'Social Inbox';
      case '/brand-voice': return 'Brand Voice Profile';
      case '/history': return 'Content History';
      case '/settings': return 'Account Settings';
      default: return 'SocialGen';
    }
  };

  // Simple function to map current URL path to a page description
  const getPageDescription = () => {
    switch (location.pathname) {
      case '/': return 'Track your content marketing performance';
      case '/calendar': return 'Plan and schedule campaigns';
      case '/generate': return 'Create AI-powered blog posts';
      case '/remix': return 'Transform content for every platform';
      case '/hashtags': return 'Discover trending hashtags';
      case '/inbox': return 'Manage all social interactions';
      case '/brand-voice': return 'Define your unique brand identity';
      case '/history': return 'Browse all generated content';
      case '/settings': return 'Manage your account';
      default: return '';
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: '240px', // Matches the expanded sidebar width
        zIndex: 20,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: '#ffffff',
        borderBottom: '1px solid #cccccc',
      }}
    >
      {/* Page Title & Description */}
      <div>
        <h1 style={{
          fontSize: '15px', fontWeight: 'bold', color: '#333',
          margin: 0,
        }}>
          {getPageTitle()}
        </h1>
        <p style={{
          fontSize: '11px', color: '#666',
          margin: 0,
        }}>
          {getPageDescription()}
        </p>
      </div>

      {/* Action buttons (Notification bell, AI loader, User email initials) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        
        {/* Active Jobs loading indicator */}
        {activeJobsCount > 0 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: '#eef2f7',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#007bff',
            }}
          >
            <span>Generating AI ({activeJobsCount})...</span>
          </div>
        )}

        {/* Basic Notification Bell */}
        <button 
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, color: '#555',
          }}
        >
          <Bell style={{ width: 16, height: 16 }} />
        </button>

        {/* User initials circle */}
        <div
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#007bff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 'bold', color: '#fff',
            textTransform: 'uppercase',
          }}
        >
          {user?.email ? user.email.slice(0, 2) : 'US'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
