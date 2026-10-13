
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import ApplyJob from "./pages/ApplyJob";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route
              path="/student-dashboard"
              element={<StudentDashboard />}
            />
            <Route path="/apply/:jobId" element={<ApplyJob />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["recruiter"]} />}>
            <Route
              path="/recruiter-dashboard"
              element={<RecruiterDashboard />}
            />
          </Route>

          <Route path="*" element={<main className="not-found"><h1>404</h1><p>Page not found.</p></main>} />
        </Routes>

         
        <footer className="site-footer">
          © {new Date().getFullYear()} HireHub · Connecting talent with opportunity.
        </footer>
      </AuthProvider>
    </BrowserRouter>
  );
}
