// ===================================================
// src/App.jsx — Main Application Container
// ===================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LogPracticeModal } from './components/LogPracticeModal';
import { CreateSkillModal } from './components/CreateSkillModal';
import { CreateGoalModal } from './components/CreateGoalModal';
import { CreatePostModal } from './components/CreatePostModal';
import { CloudArchitectureModal } from './components/CloudArchitectureModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import { DashboardView } from './views/DashboardView';
import { SkillsView } from './views/SkillsView';
import { PracticeView } from './views/PracticeView';
import { FeedView } from './views/FeedView';
import { AnalyticsView } from './views/AnalyticsView';
import { CommunityView } from './views/CommunityView';
import { AuthView } from './views/AuthView';

export function App() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // App-level data
  const [skills, setSkills] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Modals state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [selectedSkillForGoal, setSelectedSkillForGoal] = useState(null);

  const fetchGlobalData = async () => {
    if (!isAuthenticated) return;
    try {
      const [skillsRes, analyticsRes] = await Promise.all([
        api.getSkills().catch(() => ({ skills: [] })),
        api.getDashboardAnalytics().catch(() => ({ stats: {} })),
      ]);
      setSkills(skillsRes.skills || []);
      setDashboardStats(analyticsRes.stats || {});
    } catch (err) {
      console.error('Error fetching global data:', err);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d14' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="flame-icon" style={{ fontSize: '3rem', marginBottom: '14px' }}>🚀</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.1rem' }}>
            Initializing SkillCloud Services...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const handleSessionLogged = () => {
    fetchGlobalData();
  };

  const handleSkillCreated = (newSkill) => {
    setSkills((prev) => [...prev, newSkill]);
    fetchGlobalData();
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          activeTab={activeTab}
          onOpenLogModal={() => setLogModalOpen(true)}
          onOpenCloudModal={() => setCloudModalOpen(true)}
          stats={dashboardStats}
        />

        <main className="content-body">
          <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenLogModal={() => setLogModalOpen(true)}
                onOpenSkillModal={() => setSkillModalOpen(true)}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'skills' && (
              <SkillsView
                onOpenSkillModal={() => setSkillModalOpen(true)}
                onOpenLogModal={() => setLogModalOpen(true)}
                onOpenGoalModal={() => setGoalModalOpen(true)}
                setSelectedSkillForGoal={setSelectedSkillForGoal}
              />
            )}

            {activeTab === 'practice' && (
              <PracticeView
                skills={skills}
                onSessionLogged={handleSessionLogged}
              />
            )}

            {activeTab === 'feed' && (
              <FeedView
                onOpenPostModal={() => setPostModalOpen(true)}
                skills={skills}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView />
            )}

            {activeTab === 'community' && (
              <CommunityView />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Modals */}
      <LogPracticeModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        skills={skills}
        onSessionLogged={handleSessionLogged}
      />

      <CreateSkillModal
        isOpen={skillModalOpen}
        onClose={() => setSkillModalOpen(false)}
        onSkillCreated={handleSkillCreated}
      />

      <CreateGoalModal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        skill={selectedSkillForGoal || (skills[0] || null)}
        onGoalCreated={fetchGlobalData}
      />

      <CreatePostModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        skills={skills}
        onPostCreated={fetchGlobalData}
      />

      <CloudArchitectureModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
      />
    </div>
  );
}

export default App;
