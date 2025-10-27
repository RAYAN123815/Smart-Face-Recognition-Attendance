
import React, { useState } from 'react';
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
      const savedUsers = window.localStorage.getItem('face-attendance-users');
      return savedUsers ? JSON.parse(savedUsers) : [];
    } catch (error) {
      console.error("Failed to load users from localStorage", error);
      return [];
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const savedAttendance = window.localStorage.getItem('face-attendance-records');
      return savedAttendance ? JSON.parse(savedAttendance) : [];
    } catch (error) {
      console.error("Failed to load attendance from localStorage", error);
      return [];
    }
  });

  // State for AdminTab is now managed here
  const [userToDeleteId, setUserToDeleteId] = useState<string>('');

  const handleRegister = (newUser: User) => {
    const newUsers = [...users, newUser];
    try {
      window.localStorage.setItem('face-attendance-users', JSON.stringify(newUsers));
      setUsers(newUsers);
      alert(`User ${newUser.name} registered successfully!`);
      setActiveTab('attend');
    } catch (error) {
      console.error("Failed to save users:", error);
      alert("Error: Could not save user data.");
    }
  };

  const handleMarkAttendance = (newRecord: Omit<AttendanceRecord, 'id'>) => {
    const newAttendance = [...attendance, { ...newRecord, id: Date.now().toString() }];
    try {
        window.localStorage.setItem('face-attendance-records', JSON.stringify(newAttendance));
        setAttendance(newAttendance);
    } catch (error) {
        console.error("Failed to save attendance:", error);
        alert("Error: Could not save attendance data.");
    }
  };

  // --- REBUILT & CENTRALIZED ADMIN ACTIONS ---

  const handleClearData = () => {
    if (window.confirm("⚠️ Are you sure you want to delete ALL data? This includes all registered users and all attendance records. This action cannot be undone.")) {
      try {
        window.localStorage.removeItem('face-attendance-users');
        window.localStorage.removeItem('face-attendance-records');
        setUsers([]);
        setAttendance([]);
        alert("All application data has been successfully cleared.");
      } catch (error) {
        console.error("Failed to clear data:", error);
        alert("Error: Could not clear application data.");
      }
    }
  };

  const handleClearTodaysAttendance = () => {
    if (window.confirm("Are you sure you want to clear only today's attendance records? User registrations will not be affected.")) {
      try {
        const today = new Date().toDateString();
        const newAttendance = attendance.filter(
            record => new Date(record.timestamp).toDateString() !== today
        );
        window.localStorage.setItem('face-attendance-records', JSON.stringify(newAttendance));
        setAttendance(newAttendance);
        alert("Today's attendance records have been cleared.");
      } catch (error) {
        console.error("Failed to clear today's attendance:", error);
        alert("Error: Could not clear today's attendance data.");
      }
    }
  };
  
  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (window.confirm(`Are you sure you want to delete ${userToDelete.name}? This will remove the user and all their attendance records permanently.`)) {
      try {
        const newUsers = users.filter(user => user.id !== userId);
        const newAttendance = attendance.filter(record => record.userId !== userId);

        window.localStorage.setItem('face-attendance-users', JSON.stringify(newUsers));
        window.localStorage.setItem('face-attendance-records', JSON.stringify(newAttendance));

        setUsers(newUsers);
        setAttendance(newAttendance);
        setUserToDeleteId(''); // Reset the dropdown selection atomically

        alert(`User "${userToDelete.name}" and all associated data have been deleted.`);
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert("Error: Could not delete user data.");
      }
    }
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
          {activeTab === 'admin' && (
            <AdminTab 
              users={users} 
              onClearData={handleClearData} 
              onClearTodaysAttendance={handleClearTodaysAttendance} 
              onDeleteUser={handleDeleteUser}
              selectedUserId={userToDeleteId}
              onSelectedUserChange={setUserToDeleteId}
            />
          )}
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
