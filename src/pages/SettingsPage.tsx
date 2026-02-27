import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAPI } from '../lib/api';
import { Bell, Palette, UserCircle, Phone, Mail, BadgeCheck, CheckCircle2 } from 'lucide-react';

interface NotificationSettings {
  emailOffers: boolean;
  emailAppointments: boolean;
  marketingEmails: boolean;
}

const getDefaultNotificationSettings = (): NotificationSettings => ({
  emailOffers: true,
  emailAppointments: true,
  marketingEmails: false,
});

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationSettings>(getDefaultNotificationSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const { call: apiCallProfile, loading: isSavingProfile } = useAPI();
  const { call: apiCallPassword, loading: isChangingPassword } = useAPI();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailLocal, setEmailLocal] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const isStaffOrAdmin = user?.role === 'Staff' || user?.role === 'Admin';

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    if (user.email) {
      const [localPart, domainPart] = user.email.split('@');
      setEmailLocal(localPart || '');
      setEmailDomain(domainPart || '');
    } else {
      setEmailLocal('');
      setEmailDomain('');
    }
    setPhoneNumber(user.phone_number || '');
    const key = `automall_notifications_${user.user_id}`;
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as NotificationSettings;
        setNotifications({ ...getDefaultNotificationSettings(), ...parsed });
      } catch {
        setNotifications(getDefaultNotificationSettings());
      }
    } else {
      setNotifications(getDefaultNotificationSettings());
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const handleNotificationChange = (field: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMessage(null);

    const key = `automall_notifications_${user.user_id}`;
    window.localStorage.setItem(key, JSON.stringify(notifications));

    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Your settings have been saved.');
      setTimeout(() => setSaveMessage(null), 2500);
    }, 400);
  };

  const handleThemeSelect = (value: 'light' | 'dark') => {
    setTheme(value);
  };

  const handleProfileSave = async () => {
    setProfileError(null);
    setProfileMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setProfileError('First name and last name are required.');
      return;
    }

    if (phoneNumber && !/^09\d{9}$/.test(phoneNumber)) {
      setProfileError('Phone number must be in the format 09XXXXXXXXX.');
      return;
    }

    const trimmedLocal = emailLocal.trim();
    if (!trimmedLocal) {
      setProfileError('Email username is required.');
      return;
    }

    const effectiveDomain = emailDomain || (user.email?.split('@')[1] ?? '');
    if (!effectiveDomain) {
      setProfileError('Email domain is missing for this account.');
      return;
    }

    const fullEmail = `${trimmedLocal}@${effectiveDomain}`;

    try {
      const result = await apiCallProfile('auth/update_profile.php', {
        method: 'POST',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: fullEmail,
          phone_number: phoneNumber || undefined,
        }),
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (result?.data) {
        updateUser({
          first_name: result.data.first_name ?? firstName.trim(),
          last_name: result.data.last_name ?? lastName.trim(),
          email: result.data.email ?? fullEmail,
          phone_number: result.data.phone_number ?? phoneNumber,
        });
      } else {
        updateUser({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: fullEmail,
          phone_number: phoneNumber,
        });
      }

      setProfileMessage('Account details updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update account details.';
      setProfileError(message);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError(null);
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      await apiCallPassword('auth/change_password.php', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordError(message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 text-sm">
          Manage your profile details, notification preferences, and theme.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Account information */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Account information</h2>
              <p className="text-xs text-slate-500">Update your name and contact details used by staff and notifications.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">First name</label>
              <input
                type="text"
                placeholder="Enter your first name"
                title="First name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Last name</label>
              <input
                type="text"
                placeholder="Enter your last name"
                title="Last name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Email address</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <Mail className="w-4 h-4 text-slate-400 mr-1" />
                  <input
                    type="text"
                    className="flex-1 outline-none border-none text-sm text-slate-900 placeholder:text-slate-400 bg-transparent"
                    value={emailLocal}
                    onChange={e => setEmailLocal(e.target.value)}
                    placeholder="username"
                  />
                  <span className="text-slate-500 text-sm">@</span>
                  {isStaffOrAdmin ? (
                    <span className="text-slate-500 text-sm">
                      {emailDomain || (user.email?.split('@')[1] ?? '')}
                    </span>
                  ) : (
                    <input
                      type="text"
                      className="w-32 md:w-40 outline-none border-none text-right text-sm text-slate-900 placeholder:text-slate-400 bg-transparent"
                      value={emailDomain}
                      onChange={e => setEmailDomain(e.target.value.replace(/^@/, ''))}
                      placeholder="example.com"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Phone number</label>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="09XXXXXXXXX"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Account type</label>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-amber-300 px-3 py-1 text-[11px] uppercase tracking-[0.12em]">
                <BadgeCheck className="w-3 h-3" />
                <span>{user.role}</span>
              </div>
            </div>
          </div>

          {profileError && <p className="text-xs text-red-600 mt-2">{profileError}</p>}
          {profileMessage && !profileError && (
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {profileMessage}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={isSavingProfile}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isSavingProfile ? 'Saving…' : 'Save account details'}
            </button>

            <button
              type="button"
              onClick={() => setShowPasswordFields(prev => !prev)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <span>{showPasswordFields ? 'Hide change password' : 'Change password'}</span>
              <span
                className={`transition-transform text-slate-400 ${
                  showPasswordFields ? 'rotate-180' : ''
                }`}
              >
                ▾
              </span>
            </button>
          </div>

          <div
            className={`border-t border-slate-200 text-sm max-w-md overflow-hidden transition-all duration-300 ${
              showPasswordFields ? 'mt-4 pt-4 max-h-[320px] opacity-100' : 'mt-0 pt-0 max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Current password</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">New password</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Confirm new password</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>

              {passwordError && (
                <p className="text-xs text-red-600 mt-1">{passwordError}</p>
              )}
              {passwordMessage && !passwordError && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {passwordMessage}
                </p>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handlePasswordSave}
                  disabled={isChangingPassword}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {isChangingPassword ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Notification settings */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Notification preferences</h2>
              <p className="text-xs text-slate-500">Choose how AutoProxyPH keeps you updated.</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={notifications.emailOffers}
                onChange={() => handleNotificationChange('emailOffers')}
              />
              <div>
                <p className="font-medium text-slate-900">Email me for new offers</p>
                <p className="text-xs text-slate-500">Get an email whenever there is a new blind offer on one of your vehicles.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={notifications.emailAppointments}
                onChange={() => handleNotificationChange('emailAppointments')}
              />
              <div>
                <p className="font-medium text-slate-900">Email me for viewing schedules</p>
                <p className="text-xs text-slate-500">Receive reminders when buyers request showroom viewing slots or staff confirms them.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={notifications.marketingEmails}
                onChange={() => handleNotificationChange('marketingEmails')}
              />
              <div>
                <p className="font-medium text-slate-900">Tips and announcements</p>
                <p className="text-xs text-slate-500">Occasional product updates and optimization tips from the AutoProxyPH team.</p>
              </div>
            </label>
          </div>
        </section>

        {/* Theme settings */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-300 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Theme</h2>
              <p className="text-xs text-slate-500">Switch between light and dark mode for this browser.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              onClick={() => handleThemeSelect('light')}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                theme === 'light'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
              Light mode
            </button>

            <button
              type="button"
              onClick={() => handleThemeSelect('dark')}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full bg-slate-900" />
              Dark mode
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-dashed border-slate-200"
            >
              Quick toggle
            </button>
          </div>
        </section>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {saveMessage && (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                {saveMessage}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
