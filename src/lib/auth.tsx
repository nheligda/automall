
// Legacy shim: delegate to the real API-backed AuthContext
// This keeps imports from './lib/auth' working without mock data.

export { AuthProvider, useAuth } from '../context/AuthContext';
