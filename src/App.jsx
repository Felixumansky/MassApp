import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Sidebar from './components/Sidebar.jsx';
import Home from './pages/Home.jsx';
import AddMeal from './pages/AddMeal.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <div className="min-h-dvh">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <Sidebar />

      <div className="lg:ms-64">
        <main className="mx-auto max-w-md px-4 pt-6 pb-32 lg:max-w-5xl lg:px-10 lg:pt-10 lg:pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddMeal />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
