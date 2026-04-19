const API_BASE_URL = 'https://dbms-student-feedback-system.onrender.com'; // Connecting directly to backend port
export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    GOOGLE_AUTH: `${API_BASE_URL}/api/auth/google`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/auth/update-profile`,
    COURSES: `${API_BASE_URL}/api/courses`,
    FEEDBACK: `${API_BASE_URL}/api/feedback`,
    CHECK_FEEDBACK: (studentId, courseId, facultyId) => `${API_BASE_URL}/api/feedback/check/${studentId}/${courseId}/${facultyId}`,
    ADMIN_STATS: `${API_BASE_URL}/api/admin/stats`,
    ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
    ADMIN_CONTACT: `${API_BASE_URL}/api/admin/contact`,
    EXPORT_FEEDBACK: `${API_BASE_URL}/api/admin/export/feedback`,
    FACULTY_STATS: (id) => `${API_BASE_URL}/api/faculty/stats/${id}`,
    SYSTEM_RESET: `${API_BASE_URL}/api/admin/system/reset`,
    FACULTY_UPDATE: (email) => `${API_BASE_URL}/api/admin/users/${email}`,
    USER_DELETE: (email) => `${API_BASE_URL}/api/admin/users/${email}`,
    ADD_FACULTY: `${API_BASE_URL}/api/admin/faculty`,
    DELETE_COURSE: (id) => `${API_BASE_URL}/api/courses/${id}`,
};

export const handleResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
    } else {
        const text = await response.text();
        return { message: text || response.statusText };
    }
};

export default API_ENDPOINTS;
