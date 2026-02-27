
import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router';

export function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-400 py-8 text-center border-t border-slate-800">
        <div className="container mx-auto px-4">
          <p className="text-sm">&copy; 2026 AutoProxyPH. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
