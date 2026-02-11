import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { Login } from './components/Login'
import { Signup } from './components/Signup'
import { Toaster, toast } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background text-primary">Loading...</div>;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Main Dashboard Layout
const Dashboard = () => {
  const [threadId, setThreadId] = useState<string | null>(null);

  const handleIngestSuccess = (msg: string) => {
    toast.success(msg, {
      style: { background: '#1e293b', color: '#fff' }
    });
  }

  const handleIngestError = (msg: string) => {
    toast.error(msg, {
      style: { background: '#1e293b', color: '#fff' }
    });
  }

  return (
    <div className="flex h-screen w-full bg-background text-text overflow-hidden">
      <Sidebar
        onIngestSuccess={handleIngestSuccess}
        onIngestError={handleIngestError}
        onThreadChange={(id) => setThreadId(id)}
      />
      <main className="flex-1 h-full relative">
        <ChatArea threadId={threadId} />
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  )
}

export default App
