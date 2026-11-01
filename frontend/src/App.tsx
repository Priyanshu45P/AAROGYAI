import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./stores/auth";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PatientDashboard } from "./pages/PatientDashboard";
import { ReadingsPage } from "./pages/ReadingsPage";
import { MedicalHistoryPage } from "./pages/MedicalHistoryPage";
import { BehaviourPage } from "./pages/BehaviourPage";
import { AIInsightsPage } from "./pages/AIInsightsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { CarePlanPage } from "./pages/CarePlanPage";
import { ProgressPage } from "./pages/ProgressPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ClinicianDashboard } from "./pages/ClinicianDashboard";
import { PatientListPage } from "./pages/PatientListPage";
import { ClinicianPatientPage } from "./pages/ClinicianPatientPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminAuditPage } from "./pages/AdminAuditPage";
import { AdminAssignmentsPage } from "./pages/AdminAssignmentsPage";

function DashboardRedirect() {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={
        user.role === "PATIENT"
          ? "/patient"
          : user.role === "CLINICIAN"
          ? "/clinician"
          : "/admin"
      }
      replace
    />
  );
}

export default function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <Routes>
      <Route
        path="/"
        element={token ? <DashboardRedirect /> : <LandingPage />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/health" element={<ReadingsPage />} />
        <Route path="/patient/readings" element={<ReadingsPage />} />
        <Route path="/patient/medical" element={<MedicalHistoryPage />} />
        <Route path="/patient/behaviour" element={<BehaviourPage />} />
        <Route
          path="/patient/behaviour/assessment"
          element={<BehaviourPage />}
        />
        <Route path="/patient/ai" element={<AIInsightsPage />} />
        <Route path="/patient/ai-insights" element={<AIInsightsPage />} />
        <Route path="/patient/appointments" element={<AppointmentsPage />} />
        <Route path="/patient/care-plan" element={<CarePlanPage />} />
        <Route path="/patient/progress" element={<ProgressPage />} />
        <Route
          path="/patient/notifications"
          element={<NotificationsPage />}
        />
        <Route path="/patient/profile" element={<ProfilePage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={["CLINICIAN"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/clinician" element={<ClinicianDashboard />} />
        <Route
          path="/clinician/dashboard"
          element={<ClinicianDashboard />}
        />
        <Route path="/clinician/patients" element={<PatientListPage />} />
        <Route
          path="/clinician/patients/:id"
          element={<ClinicianPatientPage />}
        />
        <Route
          path="/clinician/patients/:id/clinical"
          element={<ClinicianPatientPage />}
        />
        <Route
          path="/clinician/patients/:id/ai"
          element={<ClinicianPatientPage />}
        />
        <Route
          path="/clinician/patients/:id/behaviour"
          element={<ClinicianPatientPage />}
        />
        <Route
          path="/clinician/patients/:id/appointments"
          element={<ClinicianPatientPage />}
        />
        <Route
          path="/clinician/patients/:id/care-plan"
          element={<ClinicianPatientPage />}
        />
        <Route
          path="/clinician/patients/:id/notes"
          element={<ClinicianPatientPage />}
        />
        <Route
          path="/clinician/appointments"
          element={<AppointmentsPage />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route
          path="/admin/assignments"
          element={<AdminAssignmentsPage />}
        />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
