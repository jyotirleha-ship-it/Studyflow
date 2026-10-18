import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import NeuralBackground from '../common/NeuralBackground.jsx';
import FloatingMentor from '../common/FloatingMentor.jsx';
import MentorRobot from '../MentorRobot/MentorRobot.jsx';
import StreakCelebration from '../common/StreakCelebration.jsx';
import './appLayout.css';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <NeuralBackground />
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
      <MentorRobot />
      <FloatingMentor />
      <StreakCelebration />
    </div>
  );
};

export default AppLayout;
