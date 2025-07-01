import React, { useState, useEffect } from 'react';
import { Filter, Calendar, Users, BookOpen, Phone, MessageCircle, Download, TrendingDown, X } from 'lucide-react';
import ReportTable from '../components/ReportTable';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import type { AbsenteeRecord } from '../types';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  fieldName: string;
  level: string;
  reportType: 'daily' | 'weekly' | 'monthly';
}

export default function Reports() {
  const [absentees, setAbsentees] = useState<AbsenteeRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    fieldName: '',
    level: '',
    reportType: 'daily',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Available options for filters
  const [availableFields] = useState([
    'Computer Science', 'Software Engineering', 'Information Technology', 'Cybersecurity', 'Data Science'
  ]);
  const [availableLevels] = useState([
    'Level 100', 'Level 200', 'Level 300', 'Level 400'
  ]);

  useEffect(() => {
    loadAbsenteeReport();
  }, [filters.reportType]);

  const loadAbsenteeReport = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const filterParams = {
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        report_type: filters.reportType,
        ...(filters.fieldName && { field: filters.fieldName }),
        ...(filters.level && { level: filters.level }),
      };
  
      const reportData = await APIService.getAbsenteeReport(filterParams);
  
      if (Array.isArray(reportData)) {
        setAbsentees(reportData);
        LocalDBService.cacheData('rollcall_cached_reports', reportData);
      } else {
        throw new Error('Invalid response format');
      }
  
    } catch (error) {
      console.error('Failed to load absentee report:', error);
      setError('Failed to load absentee report. Please try again.');
      setAbsentees([]); // Clear old data
    } finally {
      setLoading(false);
    }
  };
  

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadAbsenteeReport();
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      fieldName: '',
      level: '',
      reportType: 'daily',
    });
  };

  const handleCallParent = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber).catch(console.error);
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleSendSMS = (phoneNumber: string, studentName: string) => {
    const message = `Hello, this is regarding ${studentName}'s attendance. Please contact the school for more information.`;
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:${phoneNumber}?body=${encodedMessage}`;
  };

  const exportReport = () => {
    const csvContent = [
      ['Student Name', 'Matricule', 'Field', 'Level', 'Course', 'Parent Name', 'Parent Phone', 'Date'].join(','),
      ...absentees.map(record => [
        record.studentName,
        record.matricule,
        record.fieldName,
        record.level,
        `${record.courseTitle} (${record.courseCode})`,
        record.parentName,
        record.parentPhone,
        new Date(record.date).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `absentee-report-${filters.reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    switch (filters.reportType) {
      case 'daily':
        return 'Daily Absentee Report';
      case 'weekly':
        return 'Weekly Absentee Report';
      case 'monthly':
        return 'Monthly Absentee Report';
      default:
        return 'Absentee Report';
    }
  };

  const getReportDescription = () => {
    switch (filters.reportType) {
      case 'daily':
        return `Today's absentees (${new Date().toLocaleDateString()})`;
      case 'weekly':
        return 'This week\'s absentees';
      case 'monthly':
        return 'This month\'s absentees';
      default:
        return 'Student absentee records';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getReportTitle()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {getReportDescription()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          {absentees.length > 0 && (
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1">
          {[
            { key: 'daily', label: 'Daily', icon: Calendar },
            { key: 'weekly', label: 'Weekly', icon: TrendingDown },
            { key: 'monthly', label: 'Monthly', icon: BookOpen }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleFilterChange('reportType', key as 'daily' | 'weekly' | 'monthly')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filters.reportType === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Filter Reports
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date From */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>From Date</span>
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>To Date</span>
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Field */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Field</span>
                  </label>
                  <select
                    value={filters.fieldName}
                    onChange={(e) => handleFilterChange('fieldName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Fields</option>
                    {availableFields.map(field => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4" />
                    <span>Level</span>
                  </label>
                  <select
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Levels</option>
                    {availableLevels.map(level => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={handleApplyFilters}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Loading...' : 'Apply Filters'}
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading reports...</span>
        </div>
      )}

      {/* Report Table */}
      {!loading && (
        <ReportTable
          absentees={absentees}
          onCallParent={handleCallParent}
          onSendSMS={handleSendSMS}
        />
      )}
    </div>
  );
}