import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationBell } from './components/NotificationBell';
import './App.css';
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import { Computer } from './screens/Computer';
import Profile from './screens/Profile';
import Login from './components/Login';
import Signup from './components/Singup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { GoogleOAuthProvider } from '@react-oauth/google';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return children;
};

const AuthRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuth();
  if (token) return <Navigate to="/" />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
      <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
      <Route path="/computer" element={<ProtectedRoute><Computer /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
      <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
    </Routes>
  );
};

function App() {
  const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "no-client-id-provided";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <div className='min-h-screen bg-chess-dark text-chess-text flex justify-center w-full'>
        <BrowserRouter basename='/'>
          <AuthProvider>
            <SocketProvider>
               <>
                 <AppRoutes />
                 <NotificationBell />
               </>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
