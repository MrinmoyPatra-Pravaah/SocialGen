import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Sparkles, 
  History, 
  Settings as SettingsIcon, 
  LogOut,
  Layers,
  MessageSquare,
  Repeat2,
  Hash,
  Mic,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// This is the Sidebar navigation component.
// It sits on the left side of the screen and lets the user click to switch between different pages.
const Sidebar = () => {
  // Destructuring logout function and current user info from AuthContext
  const { logout, user } = useAuth();
  
  // State to track if the sidebar is collapsed (shrunk) or expanded (full size)
  const [collapsed, setCollapsed] = useState(false);

  // Main navigation links (at the top part of the sidebar)
  const mainNav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'AI Generator', href: '/generate', icon: Sparkles },
    { name: 'Content Remixer', href: '/remix', icon: Repeat2 },
    { name: 'Hashtag Lab', href: '/hashtags', icon: Hash },
  ];

  // Secondary tools navigation links (at the bottom part of the sidebar)
  const secondaryNav = [
    { name: 'Social Inbox', href: '/inbox', icon: MessageSquare },
    { name: 'Social Accounts', href: '/connections', icon: Layers },
    { name: 'Brand Voice', href: '/brand-voice', icon: Mic },
    { name: 'Content History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  // Adjust sidebar width based on collapsed state
  const sidebarWidth = collapsed ? '72px' : '240px';

  return (
    <aside
      style={{
        position: 'fixed',
        inset: '0',
        right: 'auto',
        width: sidebarWidth,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRight: '1px solid #cccccc',
        zIndex: 30,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Brand logo header */}
      <div
        style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid #cccccc',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 4,
              background: '#007bff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <span style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>
              SocialGen
            </span>
          </NavLink>
        )}
        {collapsed && (
          <div style={{
            width: 30, height: 30, borderRadius: 4,
            background: '#007bff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
        )}
        
        {/* Button to collapse or expand the sidebar */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#666', display: 'flex', alignItems: 'center',
              padding: 4, borderRadius: 4,
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav style={{ flex: 1, padding: '15px 10px', overflowY: 'auto' }}>
        {/* Main section */}
        <div style={{ marginBottom: 15 }}>
          {!collapsed && (
            <span style={{
              fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase',
              color: '#999', padding: '0 10px', marginBottom: 8, display: 'block',
            }}>
              Main Tools
            </span>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: collapsed ? '10px 0' : '8px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? '#ffffff' : '#555555',
                    background: isActive ? '#007bff' : 'transparent',
                    transition: 'all 0.1s ease',
                  })}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Divider line */}
        <div style={{ height: 1, background: '#cccccc', margin: '15px 0' }} />

        {/* Secondary section */}
        <div>
          {!collapsed && (
            <span style={{
              fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase',
              color: '#999', padding: '0 10px', marginBottom: 8, display: 'block',
            }}>
              Social & Settings
            </span>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: collapsed ? '10px 0' : '8px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? '#ffffff' : '#555555',
                    background: isActive ? '#007bff' : 'transparent',
                    transition: 'all 0.1s ease',
                  })}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User profile footer & expand button */}
      <div style={{
        borderTop: '1px solid #cccccc',
        padding: '12px',
        flexShrink: 0,
      }}>
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#eeeeee',
              border: '1px solid #cccccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 'bold', color: '#666', textTransform: 'uppercase',
            }}>
              {user?.email ? user.email.slice(0, 2) : 'U'}
            </div>
            <button
              onClick={() => setCollapsed(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#666', display: 'flex', alignItems: 'center',
                padding: 4, borderRadius: 4,
              }}
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8f9fa', borderRadius: '4px',
            padding: '8px 10px', border: '1px solid #cccccc',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: '#eeeeee',
                border: '1px solid #cccccc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 'bold', color: '#666', textTransform: 'uppercase',
              }}>
                {user?.email ? user.email.slice(0, 2) : 'U'}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontSize: 12, fontWeight: 'bold', color: '#333',
                  margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user?.email?.split('@')[0] || 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log Out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#dc3545', display: 'flex', alignItems: 'center',
                padding: 4, borderRadius: 4,
              }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
