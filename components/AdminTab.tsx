import React, { useState } from 'react';

interface AdminTabProps {
  onClearData: () => void;
  onClearTodaysAttendance: () => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ onClearData, onClearTodaysAttendance }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 5000); // Clear message after 5 seconds
  };
  
  const handleDeleteAll = () => {
    if (window.confirm("⚠️ Are you sure you want to delete ALL data? This includes all registered users, their images, and all attendance records. This action cannot be undone.")) {
      onClearData();
      showFeedback("All application data has been successfully deleted.");
    }
  };

  const handleDeleteToday = () => {
    if (window.confirm("Are you sure you want to clear only today's attendance records? User registrations will not be affected.")) {
        onClearTodaysAttendance();
        showFeedback("Today's attendance records have been cleared.");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-red-400">Admin Panel</h2>
      
      <div className="space-y-6">
        {/* Clear Today's Attendance */}
        <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded-md space-y-3">
          <h3 className="font-bold text-lg text-yellow-300">Clear Today's Attendance</h3>
          <p className="text-yellow-400">
            This action will remove all attendance entries for the current day. User registrations will not be affected.
          </p>
          <button
            onClick={handleDeleteToday}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            🧹 Clear Today's Records
          </button>
        </div>

        {/* Reset Application Data */}
        <div className="bg-red-900/20 border border-red-500 p-4 rounded-md space-y-3">
          <h3 className="font-bold text-lg">Reset Application Data</h3>
          <p className="text-red-300">
            This action will permanently delete all registered users and attendance records. Use with caution.
          </p>
          <button
            onClick={handleDeleteAll}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            🗑️ Delete All Data
          </button>
        </div>
      </div>
      
      {feedback && (
        <div className="mt-4 p-3 bg-green-900/50 border border-green-500 text-green-300 rounded-md transition-opacity duration-300">
          {feedback}
        </div>
      )}
    </div>
  );
};

export default AdminTab;