import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { CalibrationScreen } from './components/calibration/CalibrationScreen';
import { Dashboard } from './components/Dashboard';
import { MeasurementScreen } from './components/measurement/MeasurementScreen';
import { RelaxationScreen } from './components/relaxation/RelaxationScreen';
import { SessionSummary } from './components/summary/SessionSummary';
import { HistoryDashboard } from './components/history/HistoryDashboard';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { BottomNav } from './components/ui/BottomNav';

function AppRoutes() {
  const { onboarded, calibrated } = useAppStore();

  return (
    <>
      <Routes>
        {/* Redirect to onboarding/calibration if needed */}
        <Route
          path="/"
          element={
            !onboarded ? (
              <Navigate to="/onboarding" replace />
            ) : !calibrated ? (
              <Navigate to="/calibration" replace />
            ) : (
              <Dashboard />
            )
          }
        />
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/calibration" element={<CalibrationScreen />} />
        <Route path="/measurement" element={<MeasurementScreen />} />
        <Route path="/relaxation" element={<RelaxationScreen />} />
        <Route path="/summary" element={<SessionSummary />} />
        <Route path="/history" element={<HistoryDashboard />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
