import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Fingerprint, 
  DollarSign, 
  Award, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  Plus, 
  Search, 
  ShieldCheck 
} from 'lucide-react';
import { User, ShiftRecord } from '../../types';
import { dbService } from '../../services/db';
import { posAudio } from '../../services/hardware';
import { BiometricAuthModal } from '../auth/BiometricAuthModal';

interface HRWorkspaceProps {
  currentUser: User | null;
}

export const HRWorkspace: React.FC<HRWorkspaceProps> = ({ currentUser }) => {
  const [tab, setTab] = useState<'roster' | 'shifts' | 'payroll'>('roster');
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Biometric punch-in trigger
  const [biometricTargetUser, setBiometricTargetUser] = useState<User | null>(null);

  const loadData = async () => {
    if (!currentUser) {
      setUsers([]);
      setShifts([]);
      return;
    }

    try {
      const [u, s] = await Promise.all([
        dbService.getUsers(),
        dbService.getShifts()
      ]);
      setUsers(u);
      setShifts(s.slice(-20).reverse());
    } catch (err) {
      console.warn('Failed to load HR workforce data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handlePunchTimeclock = async (targetUser: User, action: 'clock_in' | 'clock_out') => {
    if (!currentUser) {
      alert('Survey Mode: Timeclock shifts cannot be written to the database. Sign in with subscription to punch live employee shifts.');
      return;
    }
    posAudio.playScanBeep();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (action === 'clock_in') {
      const newShift: ShiftRecord = {
        id: `shift-${Date.now()}`,
        userId: targetUser.id,
        userName: targetUser.name,
        clockIn: timeStr,
        hoursWorked: 0,
        hourlyRate: targetUser.hourlyRate || 18.50,
        status: 'active'
      };
      await dbService.saveShift(newShift);
    } else {
      const activeShift = shifts.find(s => s.userId === targetUser.id && s.status === 'active');
      if (activeShift) {
        activeShift.clockOut = timeStr;
        activeShift.hoursWorked = 8.0; // Standard shift close calculation
        activeShift.status = 'completed';
        await dbService.saveShift(activeShift);
      }
    }
    await loadData();
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.branchName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Human Resources & Workforce</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Employee roster, biometric timeclock stamps, shift schedules, and payroll accruals
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setTab('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'roster' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Staff Directory ({users.length})
          </button>
          <button
            onClick={() => setTab('shifts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'shifts' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Timeclock Shifts
          </button>
          <button
            onClick={() => setTab('payroll')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'payroll' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Payroll Estimator
          </button>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {tab === 'roster' && (
          <div className="space-y-4">
            {/* Search filter */}
            <div className="flex justify-between items-center">
              <div className="w-72 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter personnel by name, role, branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
              <div className="text-xs text-slate-500">
                <span>Biometric Enrollment: </span>
                <span className="font-bold text-emerald-600">
                  {users.filter(u => u.biometricRegistered).length} / {users.length} enrolled
                </span>
              </div>
            </div>

            {/* User Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUsers.map(user => {
                const activeShift = shifts.find(s => s.userId === user.id && s.status === 'active');

                return (
                  <div 
                    key={user.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800" 
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase">
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{user.email}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{user.branchName} • Base ${user.hourlyRate || 20}/hr</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Fingerprint className={`w-4 h-4 ${user.biometricRegistered ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <span className="text-[11px] text-slate-500">
                          {user.biometricRegistered ? 'Biometric Active' : 'PIN Only'}
                        </span>
                      </div>

                      {/* Quick Punch Button */}
                      {activeShift ? (
                        <button
                          onClick={() => handlePunchTimeclock(user, 'clock_out')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Clock Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setBiometricTargetUser(user)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Clock In</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'shifts' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Staff Biometric Attendance Logs
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Clock In Time</th>
                  <th className="p-3">Clock Out Time</th>
                  <th className="p-3 text-right">Hours Worked</th>
                  <th className="p-3 text-right">Hourly Rate</th>
                  <th className="p-3 text-center">Shift Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shifts.map(shift => (
                  <tr key={shift.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{shift.userName}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{shift.clockIn}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{shift.clockOut || 'Currently on floor'}</td>
                    <td className="p-3 text-right font-mono font-bold">{shift.hoursWorked.toFixed(1)} hrs</td>
                    <td className="p-3 text-right font-mono">${shift.hourlyRate.toFixed(2)}/hr</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        shift.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payroll' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Bi-Weekly Payroll Accrual Summary
                </h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3 text-right">Standard Hours</th>
                    <th className="p-3 text-right">Overtime Hours</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Gross Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => {
                    const baseHours = 80;
                    const otHours = u.role === 'cashier' ? 4 : 0;
                    const rate = u.hourlyRate || 20;
                    const gross = (baseHours * rate) + (otHours * rate * 1.5);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                        <td className="p-3 text-slate-500 capitalize">{u.role.replace('_', ' ')}</td>
                        <td className="p-3 text-right font-mono">{baseHours} hrs</td>
                        <td className="p-3 text-right font-mono text-amber-600">{otHours} hrs</td>
                        <td className="p-3 text-right font-mono">${rate.toFixed(2)}/hr</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">${gross.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Biometric Scan Trigger Modal */}
      {biometricTargetUser && (
        <BiometricAuthModal
          user={biometricTargetUser}
          actionTitle="Biometric Timeclock Stamp"
          onSuccess={() => {
            handlePunchTimeclock(biometricTargetUser, 'clock_in');
            setBiometricTargetUser(null);
          }}
          onCancel={() => setBiometricTargetUser(null)}
        />
      )}
    </div>
  );
};
