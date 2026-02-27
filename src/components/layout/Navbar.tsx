import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useTheme } from '../../context/ThemeContext';
import { Car, UserCircle, LogOut, ShieldCheck, MapPin, Settings, Moon, Sun, Bell } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { openLogin, openRegister } = useAuthModal();
  const { theme, toggleTheme } = useTheme();

  const basePath = location.pathname.startsWith('/automall%20proj')
    ? '/automall%20proj'
    : location.pathname.startsWith('/automall proj')
    ? '/automall proj'
    : '';
  const withBase = (path: string) => `${basePath}${path}`;
  const isActive = (path: string) => location.pathname === withBase(path) || location.pathname === `${withBase(path)}/`;

  const handleLogout = () => {
    logout();
    navigate(withBase('/'), { replace: true });
  };

  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = user
    ? [
        {
          id: 1,
          title: 'Welcome back',
          body: 'Check your dashboard for the latest offers and appointments.',
          time: 'Just now',
          read: false,
        },
      ]
    : [];

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Link to={withBase('/')} className="flex items-center space-x-2 group">
              <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">AutoProxy<span className="text-blue-400">PH</span></span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            <Link
              to={withBase('/')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Showroom</span>
            </Link>

            {user && (
              <Link
                to={withBase('/dashboard')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCircle className="h-4 w-4" />
                <span>My Dashboard</span>
              </Link>
            )}

            {user?.role === 'Admin' && (
              <Link
                to={withBase('/admin')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin') ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden md:inline-flex items-center justify-center p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-yellow-300 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="relative flex items-center space-x-4">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-sm font-medium text-white">{`${user.first_name} ${user.last_name}`}</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{user.role}</span>
                </div>

                {/* Notification bell placeholder for all authenticated users */}
                <button
                  type="button"
                  className="relative p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                  title="Notifications"
                  onClick={() => setShowNotifications(prev => !prev)}
                >
                  <Bell className="h-5 w-5" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1 right-1 inline-flex h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      <span className="text-[11px] text-slate-400">{notifications.length} item{notifications.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-slate-400 text-center">
                          You have no notifications yet.
                        </div>
                      ) : (
                        notifications.map(item => (
                          <div
                            key={item.id}
                            className="px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70 cursor-default border-b border-slate-800 last:border-b-0"
                          >
                            <p className="font-medium text-[13px] mb-0.5">{item.title}</p>
                            <p className="text-[12px] text-slate-400 mb-1">{item.body}</p>
                            <span className="text-[11px] text-slate-500">{item.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate(withBase('/settings'))}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openLogin}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
