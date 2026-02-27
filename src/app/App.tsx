
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from '../context/AuthContext';
import { AuthModalProvider } from '../context/AuthModalContext';
import { ThemeProvider } from '../context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthModalProvider>
          <RouterProvider router={router} />
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
