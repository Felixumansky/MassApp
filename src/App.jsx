import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Sidebar from './components/Sidebar.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const AddMeal = lazy(() => import('./pages/AddMeal.jsx'));
const Progress = lazy(() => import('./pages/Progress.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

function PageFallback() {
  return (
    <div className="space-y-4" role="status" aria-label="טוען מסך">
      <div className="skeleton glass h-24" />
      <div className="skeleton glass h-64" />
      <span className="sr-only">טוען...</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-dvh">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="grain" aria-hidden="true" />

      <Sidebar />

      <div className="lg:ms-64">
        <main className="mx-auto max-w-md px-4 pt-6 pb-32 lg:max-w-5xl lg:px-10 lg:pt-10 lg:pb-16">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<AddMeal />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
