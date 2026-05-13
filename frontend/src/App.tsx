import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import RegisterStudent from './pages/RegisterStudent'
import RegisterTeacher from './pages/RegisterTeacher'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/student" element={<RegisterStudent />} />
        <Route path="/register/teacher" element={<RegisterTeacher />} />

        <Route path="/dashboard/student" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/teacher" element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App