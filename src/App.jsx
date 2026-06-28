import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AuroraBackground from './components/AuroraBackground.jsx';
import Sidebar from './components/Sidebar.jsx';
import BottomNav from './components/BottomNav.jsx';
import PageTransition from './components/PageTransition.jsx';
import LockScreen from './components/LockScreen.jsx';
import { AppLoader } from './components/ui.jsx';
import { useCloud } from './cloud.jsx';
import { useGymAutoStart } from './lib/useGymAutoStart.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ActiveWorkout = lazy(() => import('./pages/ActiveWorkout.jsx'));
const Library = lazy(() => import('./pages/Library.jsx'));
const Routines = lazy(() => import('./pages/Routines.jsx'));
const Progress = lazy(() => import('./pages/Progress.jsx'));
const Calendar = lazy(() => import('./pages/Calendar.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

const page = (El) => (
  <PageTransition>
    <Suspense fallback={<AppLoader />}>
      <El />
    </Suspense>
  </PageTransition>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={page(Dashboard)} />
        <Route path="/workout" element={page(ActiveWorkout)} />
        <Route path="/library" element={page(Library)} />
        <Route path="/routines" element={page(Routines)} />
        <Route path="/calendar" element={page(Calendar)} />
        <Route path="/progress" element={page(Progress)} />
        <Route path="/profile" element={page(Profile)} />
        <Route path="*" element={page(Dashboard)} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const { locked } = useCloud();
  useGymAutoStart({ disabled: locked });

  return (
    <>
      <AuroraBackground />
      <div className="lg:flex">
        <Sidebar />
        <main className="mx-auto w-full max-w-md px-4 pb-28 pt-[max(1rem,var(--safe-t))] lg:max-w-3xl lg:px-8 lg:pb-12">
          <AnimatedRoutes />
        </main>
      </div>
      <BottomNav />
      {locked && <LockScreen />}
    </>
  );
}
