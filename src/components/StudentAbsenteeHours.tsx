import React, { useState, useEffect } from 'react';
import { Clock, User, AlertTriangle } from 'lucide-react';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import type { Student } from '../types';

interface StudentAbsenteeHours {
  studentId: string;
  studentName: string;
  matricule: string;
  field: string;
  level: string;
  totalAbsentHours: number;
  absentSessions: Array<{
    date: string;
    course: string;
    duration: number;
  }>;
}

interface StudentAbsenteeHoursProps {
  students: Student[];
}

export default function StudentAbsenteeHours({ students }: StudentAbsenteeHoursProps) {
  const [absenteeHours, setAbsenteeHours] = useState<StudentAbsenteeHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>('');

  useEffect(() => {
    loadAbsenteeHours();
  }, [students]);

  const loadAbsenteeHours = async () => {
    try {
      setLoading(true);
      
      // Calculate absentee hours for each student
      const hoursData: StudentAbsenteeHours[] = students.map(student => {
        // Demo calculation - in real app, this would come from attendance records
        const randomAbsentHours = Math.floor(Math.random() * 20);
        const sessions = [];
        
        for (let i = 0; i < Math.floor(randomAbsentHours / 2); i++) {
          sessions.push({
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            course: `Course ${i + 1}`,
            duration: 2 // 2 hours per session
          });
        }

        return {
          studentId: student.id,
          studentName: student.name,
          matricule: student.matricule,
          field: student.field,
          level: student.level,
          totalAbsentHours: randomAbsentHours,
          absentSessions: sessions
        };
      });

      setAbsenteeHours(hoursData);
    } catch (error) {
      console.error('Failed to load absentee hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (!selectedField) return absenteeHours;
    return absenteeHours.filter(data => data.field === selectedField);
  };

  const getUniqueFields = () => {
    return [...new Set(absenteeHours.map(data => data.field))];
  };

  const getHighRiskStudents = () => {
    return absenteeHours.filter(data => data.totalAbsentHours >= 10);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-black">Loading absentee hours...</p>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const highRiskStudents = getHighRiskStudents();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Student Absentee Hours</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Total Students</span>
            </div>
            <div className="text-2xl font-bold mt-1">{absenteeHours.length}</div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">High Risk (≥10h)</span>
            </div>
            <div className="text-2xl font-bold mt-1">{highRiskStudents.length}</div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Avg Hours/Student</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {absenteeHours.length > 0 
                ? Math.round(absenteeHours.reduce((sum, data) => sum + data.totalAbsentHours, 0) / absenteeHours.length)
                : 0
              }h
            </div>
          </div>
        </div>
      </div>

      {/* Field Filter */}
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-black">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-black">Filter by Field:</label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
          >
            <option value="">All Fields</option>
            {getUniqueFields().map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
      </div>

      {/* High Risk Alert */}
      {highRiskStudents.length > 0 && (
        <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-600">High Risk Students</h3>
          </div>
          <p className="text-red-600 text-sm">
            {highRiskStudents.length} students have 10+ hours of absence and require immediate attention.
          </p>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Field & Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Absent Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Recent Absences
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-black">
              {filteredData.map((data) => (
                <tr key={data.studentId} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-black">{data.studentName}</div>
                      <div className="text-sm text-black">{data.matricule}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-black">{data.field}</div>
                    <div className="text-sm text-black">{data.level}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black">{data.totalAbsentHours}h</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      data.totalAbsentHours >= 15 
                        ? 'bg-red-600 text-white'
                        : data.totalAbsentHours >= 10
                        ? 'bg-red-100 text-red-600'
                        : data.totalAbsentHours >= 5
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-white text-black border-2 border-black'
                    }`}>
                      {data.totalAbsentHours >= 15 
                        ? 'Critical'
                        : data.totalAbsentHours >= 10
                        ? 'High'
                        : data.totalAbsentHours >= 5
                        ? 'Medium'
                        : 'Low'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black">
                      {data.absentSessions.slice(0, 2).map((session, index) => (
                        <div key={index} className="mb-1">
                          {session.course} ({session.duration}h) - {new Date(session.date).toLocaleDateString()}
                        </div>
                      ))}
                      {data.absentSessions.length > 2 && (
                        <div className="text-blue-600 font-medium">
                          +{data.absentSessions.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <User className="w-16 h-16 text-black mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">No data available</h3>
          <p className="text-black">No absentee hours data found for the selected criteria.</p>
        </div>
      )}
    </div>
  );
}