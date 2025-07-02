const API_BASE_URL = 'http://localhost/api'; // Update this to match your actual PHP server path

export class APIService {
  private static async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 15000 // Increased timeout for better reliability
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please check your server connection');
      }
      console.error('API Request failed:', error);
      throw error;
    }
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const text = await response.text();
    console.log('API Response:', { url: response.url, body: text }); // Debug logging
    
    if (!text.trim()) {
      throw new Error('Empty response from server');
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Invalid JSON response:', text);
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`);
    }
  }

  // Test connection method
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing API connection to:', API_BASE_URL);
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_dashboard_stats.php`, {}, 5000);
      await this.handleResponse(response);
      return { success: true, message: 'API connection successful' };
    } catch (error) {
      console.error('API connection test failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  static async getCurrentSessions() {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_current_sessions.php`);
      const data = await this.handleResponse(response);
      console.log('Current sessions data:', data);
      return data;
    } catch (error) {
      console.error('Failed to get current sessions:', error);
      throw error;
    }
  }

  static async submitAttendance(attendanceData: any) {
    try {
      console.log('Submitting attendance:', attendanceData);
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/submit_attendance.php`, {
        method: 'POST',
        body: JSON.stringify(attendanceData),
      });
      const result = await this.handleResponse(response);
      console.log('Attendance submission result:', result);
      return result;
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      throw error;
    }
  }

  static async getAbsenteeReport(filters: any) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const url = `${API_BASE_URL}/get_absentee_report.php${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching absentee report from:', url);
      
      const response = await this.fetchWithTimeout(url);
      const data = await this.handleResponse(response);
      console.log('Absentee report data:', data);
      return data;
    } catch (error) {
      console.error('Failed to get absentee report:', error);
      throw error;
    }
  }

  static async getDashboardStats() {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_dashboard_stats.php`);
      const data = await this.handleResponse(response);
      console.log('Dashboard stats data:', data);
      return data;
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }

  static async getStudents() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_students.php`);
    return this.handleResponse(response);
  }

  static async getFields() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_fields.php`);
    return this.handleResponse(response);
  }

  static async getTimetable() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_timetable.php`);
    return this.handleResponse(response);
  }

  static async addStudent(studentData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_student.php`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    return this.handleResponse(response);
  }

  static async updateStudent(studentData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_student.php`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    return this.handleResponse(response);
  }

  static async deleteStudent(studentId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_student.php`, {
      method: 'POST',
      body: JSON.stringify({ id: studentId }),
    });
    return this.handleResponse(response);
  }

  static async addField(fieldData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_field.php`, {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
    return this.handleResponse(response);
  }

  static async updateField(fieldData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_field.php`, {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
    return this.handleResponse(response);
  }

  static async deleteField(fieldId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_field.php`, {
      method: 'POST',
      body: JSON.stringify({ id: fieldId }),
    });
    return this.handleResponse(response);
  }

  static async addTimetableEntry(entryData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_timetable_entry.php`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return this.handleResponse(response);
  }

  static async updateTimetableEntry(entryData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_timetable_entry.php`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return this.handleResponse(response);
  }

  static async deleteTimetableEntry(entryId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_timetable_entry.php`, {
      method: 'POST',
      body: JSON.stringify({ id: entryId }),
    });
    return this.handleResponse(response);
  }

  // Admin Management APIs
  static async getAdminUsers() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_admin_users.php`);
    return this.handleResponse(response);
  }

  static async addAdminUser(adminData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_admin_user.php`, {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
    return this.handleResponse(response);
  }

  static async updateAdminUser(adminData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_admin_user.php`, {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
    return this.handleResponse(response);
  }

  static async deleteAdminUser(adminId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_admin_user.php`, {
      method: 'POST',
      body: JSON.stringify({ id: adminId }),
    });
    return this.handleResponse(response);
  }

  static async authenticateAdmin(credentials: { email: string; password: string }) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/authenticate_admin.php`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response);
  }
}