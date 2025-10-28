
import React from 'react';
import { User } from '../types';

interface AdminTabProps {
  users: User[];
  onClearData: () => void;
  onClearTodaysAttendance: () => void;
  onDeleteUser: (userId: string) => void;
  selectedUserId: string;
  onSelectedUserChange: (userId: string) => void;
}

const AdminTab: React.FC<AdminTabProps> = ({ 
  users, 
  onClearData, 
  onClearTodaysAttendance, 
  onDeleteUser,
  selectedUserId,
  onSelectedUserChange 
}) => {

  return (
    <div className="p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Admin Panel</h2>
      
      <div className="space-y-8">
        
        {/* Section 1: Manage Individual Users */}
        <div>
          <h3 className="font-bold text-lg text-gray-200">Manage Individual Users</h3>
          <p className="text-gray-400 mt-1">
            Select a user to permanently delete them and all of their attendance records.
          </p>
          {users.length > 0 ? (
            <div className="flex items-center gap-4 flex-wrap mt-3">
              <label htmlFor="user-delete-select" className="sr-only">Select a User to Delete</label>
              <select
                id="user-delete-select"
                value={selectedUserId}
                onChange={(e) => onSelectedUserChange(e.target.value)}
                className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Select a User to Delete --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <button
                onClick={() => onDeleteUser(selectedUserId)}
                disabled={!selectedUserId}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                🗑️ Delete Selected User
              </button>
            </div>
          ) : (
             <p className="text-gray-400 mt-3">No users registered to manage.</p>
          )}
        </div>

        <hr className="border-gray-700" />

        {/* Section 2: Clear Today's Attendance */}
        <div>
            <h3 className="font-bold text-lg text-gray-200">Clear Today's Attendance</h3>
            <p className="text-gray-400 mt-1">
                This action will remove all attendance entries for the current day. User registrations will not be affected.
            </p>
            <button
                onClick={onClearTodaysAttendance}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 mt-3"
            >
                🧹 Clear Today's Records
            </button>
        </div>
        
        <hr className="border-gray-700" />

        {/* Section 3: Danger Zone */}
        <div className="bg-red-900/20 border border-red-500 p-4 rounded-md">
            <h3 className="font-bold text-lg text-red-300">Danger Zone</h3>
            <p className="text-red-400 mt-1">
              This action will permanently delete all registered users and attendance records. Use with extreme caution as this cannot be undone.
            </p>
            <button
                onClick={onClearData}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 mt-3"
            >
                🗑️ Delete All Data
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTab;