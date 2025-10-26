import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord, Tab } from './types';
import RegisterTab from './components/RegisterTab';
import AttendTab from './components/AttendTab';
import SummaryTab from './components/SummaryTab';
import AdminTab from './components/AdminTab';
import TodaysAttendance from './components/TodaysAttendance';
import { UserPlusIcon, CameraIcon, CalendarDaysIcon, WrenchScrewdriverIcon } from './components/Icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('face-attendance-users');
      return savedUsers ? JSON.parse(savedUsers) : [];
    } catch (error) {
      console.error("Failed to parse users from localStorage", error);
      return [];
    }
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const savedAttendance = localStorage.getItem('face-attendance-records');
      return savedAttendance ? JSON.parse(savedAttendance) : [];
    } catch (error) {
      console.error("Failed to parse attendance from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('face-attendance-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('face-attendance-records', JSON.stringify(attendance));
  }, [attendance]);

  const handleRegister = (newUser: User) => {
    setUsers([...users, newUser]);
    alert(`User ${newUser.name} registered successfully!`);
    setActiveTab('attend');
  };

  const handleMarkAttendance = (newRecord: Omit<AttendanceRecord, 'id'>) => {
    setAttendance([...attendance, { ...newRecord, id: Date.now().toString() }]);
  };

  const handleClearData = () => {
    localStorage.removeItem('face-attendance-users');
    localStorage.removeItem('face-attendance-records');
    setUsers([]);
    setAttendance([]);
  };

  const handleClearTodaysAttendance = () => {
    const today = new Date().toDateString();
    const updatedAttendance = attendance.filter(
        record => new Date(record.timestamp).toDateString() !== today
    );
    setAttendance(updatedAttendance);
  };
  
  const TABS = [
      { id: 'register', label: 'Register', icon: UserPlusIcon },
      { id: 'attend', label: 'Attendance', icon: CameraIcon },
      { id: 'summary', label: 'Summary', icon: CalendarDaysIcon },
      { id: 'admin', label: 'Admin', icon: WrenchScrewdriverIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">
            🎯 Smart Face Recognition Attendance
          </h1>
          <p className="text-gray-400 mt-2">A Hybrid Local & Cloud Compatible System</p>
        </header>

        <nav className="mb-6">
            <div className="flex flex-wrap border-b border-gray-700">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-4 py-3 font-semibold transition duration-300 border-b-2 ${activeTab === tab.id ? 'text-cyan-400 border-cyan-400' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>

        <main>
          {activeTab === 'register' && <RegisterTab onRegister={handleRegister} users={users}/>}
          {activeTab === 'attend' && <AttendTab users={users} attendance={attendance} onMarkAttendance={handleMarkAttendance} />}
          {activeTab === 'summary' && <SummaryTab users={users} attendance={attendance} />}
          {activeTab === 'admin' && <AdminTab onClearData={handleClearData} onClearTodaysAttendance={handleClearTodaysAttendance} />}
        </main>
        
        <TodaysAttendance attendance={attendance} />

        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Powered by React. Face verification powered by Gemini.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;