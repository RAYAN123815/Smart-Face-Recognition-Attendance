import React from 'react';
import { AttendanceRecord } from '../types';

interface TodaysAttendanceProps {
  attendance: AttendanceRecord[];
}

const TodaysAttendance: React.FC<TodaysAttendanceProps> = ({ attendance }) => {
  const today = new Date().toDateString();
  const todaysRecords = attendance
    .filter(rec => new Date(rec.timestamp).toDateString() === today)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Deduplicate to show only the last entry per user for today
  const uniqueTodaysRecords = todaysRecords.reduce((acc, current) => {
    if (!acc.find(item => item.userId === current.userId)) {
      acc.push(current);
    }
    return acc;
  }, [] as AttendanceRecord[]);

  return (
    <div className="mt-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-cyan-400">📅 Today's Attendance</h2>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {uniqueTodaysRecords.length === 0 ? (
          <p className="p-4 text-gray-400">No attendance recorded today yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-900/50">
                  <th className="p-3">Name</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {uniqueTodaysRecords.map(record => (
                  <tr key={record.id} className="border-t border-gray-700">
                    <td className="p-3">{record.name}</td>
                    <td className="p-3">{new Date(record.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 text-green-400">{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysAttendance;