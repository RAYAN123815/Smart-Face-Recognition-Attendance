import React, { useState } from 'react';
import { User, AttendanceRecord } from '../types';
import { generateAttendanceSummary } from '../services/geminiService';
import { SparklesIcon } from './Icons';

interface SummaryTabProps {
  users: User[];
  attendance: AttendanceRecord[];
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SummaryTab: React.FC<SummaryTabProps> = ({ users, attendance }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUserId(e.target.value);
    setAiSummary(null); // Reset AI summary when user changes
  };
  
  const handleGetAiSummary = async () => {
    if (!selectedUserId) return;
    setIsLoading(true);
    setAiSummary(null);
    const selectedUser = users.find(u => u.id === selectedUserId);
    const userAttendance = attendance.filter(rec => rec.userId === selectedUserId);
    
    if (selectedUser) {
        const summary = await generateAttendanceSummary(selectedUser.name, userAttendance);
        setAiSummary(summary);
    }
    setIsLoading(false);
  };

  const selectedUserAttendance = attendance.filter(rec => rec.userId === selectedUserId);
  const summaryData = WEEK_DAYS.map(day => {
    const isPresent = selectedUserAttendance.some(rec => rec.day === day);
    return { Day: day, Status: isPresent ? '✅ Present' : '❌ Absent' };
  });

  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Weekly Summary</h2>
      {users.length === 0 ? (
        <p className="text-gray-400">No users registered yet.</p>
      ) : (
        <div className="space-y-4">
          <select
            value={selectedUserId}
            onChange={handleUserChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">-- Select a User --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          {selectedUserId && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-gray-700 rounded-md">
                  <thead>
                    <tr className="bg-gray-900/50">
                      <th className="p-3">Day</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map(item => (
                      <tr key={item.Day} className="border-t border-gray-600">
                        <td className="p-3">{item.Day}</td>
                        <td className="p-3">{item.Status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <button
                  onClick={handleGetAiSummary}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500"
                >
                  <SparklesIcon className="w-5 h-5" />
                  {isLoading ? 'Generating...' : 'Get AI Summary'}
                </button>
                {aiSummary && (
                  <div className="mt-4 p-3 bg-gray-700 border-l-4 border-purple-400 rounded-r-md">
                    <p className="font-semibold text-purple-300">AI Insights:</p>
                    <p className="text-gray-200">{aiSummary}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryTab;