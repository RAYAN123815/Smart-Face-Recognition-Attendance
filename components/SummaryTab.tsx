import React, { useState } from 'react';
import { User, AttendanceRecord } from '../types';
import { generateAttendanceSummary } from '../services/geminiService';
import { SparklesIcon, ArrowDownTrayIcon } from './Icons';

interface SummaryTabProps {
  users: User[];
  attendance: AttendanceRecord[];
}

const SummaryTab: React.FC<SummaryTabProps> = ({ users, attendance }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add state for date range, defaulting to the last 7 days
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUserId(e.target.value);
    setAiSummary(null); // Reset AI summary when user changes
  };

  const handleDateChange = () => {
    setAiSummary(null); // Reset AI summary when date changes
  };
  
  const handleGetAiSummary = async () => {
    if (!selectedUserId) return;
    setIsLoading(true);
    setAiSummary(null);
    const selectedUser = users.find(u => u.id === selectedUserId);
    
    // Filter attendance by both user and the selected date range
    const userAttendance = attendance.filter(rec => {
        if (rec.userId !== selectedUserId) return false;
        const recDate = new Date(rec.timestamp);
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return recDate >= start && recDate <= end;
    });
    
    if (selectedUser) {
        // Pass the date range to the service for a context-aware summary
        const summary = await generateAttendanceSummary(selectedUser.name, userAttendance, startDate, endDate);
        setAiSummary(summary);
    }
    setIsLoading(false);
  };

  const handleExportCsv = () => {
    if (!selectedUserId) return;
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) return;

    // Filter attendance for the selected user and date range
    const userAttendance = attendance.filter(rec => {
        if (rec.userId !== selectedUserId) return false;
        const recDate = new Date(rec.timestamp);
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return recDate >= start && recDate <= end;
    });

    if (userAttendance.length === 0) {
        alert("No attendance data to export for this period.");
        return;
    }
    
    // Create CSV content
    const headers = ['Date', 'Day', 'Name', 'Status', 'Timestamp'];
    const csvRows = [
      headers.join(','),
      ...userAttendance.map(rec => {
        const row = [
          new Date(rec.timestamp).toLocaleDateString(),
          rec.day,
          `"${rec.name}"`, // Enclose name in quotes to handle potential commas
          rec.status,
          rec.timestamp
        ];
        return row.join(',');
      })
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const filename = `attendance_${selectedUser.name.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Generate a list of dates and statuses for the selected range
  const getSummaryData = () => {
    if (!selectedUserId || !startDate || !endDate || new Date(startDate) > new Date(endDate)) {
        return [];
    }

    const userAttendanceForUser = attendance.filter(rec => rec.userId === selectedUserId);
    const presentDates = new Set(
      userAttendanceForUser.map(rec => new Date(rec.timestamp).toDateString())
    );

    const summary = [];
    const currentDate = new Date(startDate + 'T00:00:00');
    const finalDate = new Date(endDate + 'T00:00:00');

    while (currentDate <= finalDate) {
      const isPresent = presentDates.has(currentDate.toDateString());
      summary.push({
        // Format date for better readability
        Date: currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }),
        Status: isPresent ? '✅ Present' : '❌ Absent',
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return summary;
  };

  const summaryData = getSummaryData();

  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Attendance Summary</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-700/50 p-3 rounded-md">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); handleDateChange(); }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={e => { setEndDate(e.target.value); handleDateChange(); }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-96 border border-gray-700 rounded-md">
                <table className="w-full text-left bg-gray-700">
                  <thead className="sticky top-0 bg-gray-900/80 backdrop-blur-sm">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.length > 0 ? summaryData.map(item => (
                      <tr key={item.Date} className="border-t border-gray-600">
                        <td className="p-3 whitespace-nowrap">{item.Date}</td>
                        <td className="p-3">{item.Status}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-gray-400">
                          {new Date(startDate) > new Date(endDate) ? "Start date cannot be after end date." : "No attendance data for this period."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={handleGetAiSummary}
                        disabled={isLoading || new Date(startDate) > new Date(endDate)}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Generating...' : 'Get AI Summary'}
                    </button>
                    <button
                        onClick={handleExportCsv}
                        disabled={new Date(startDate) > new Date(endDate) || summaryData.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Export to CSV
                    </button>
                </div>
                {aiSummary && (
                  <div className="p-3 bg-gray-700 border-l-4 border-purple-400 rounded-r-md">
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