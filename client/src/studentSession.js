export function getStudentSession() {
  if (typeof window === 'undefined') {
    return {
      email: '',
      displayName: 'Student',
      role: 'student',
    };
  }

  return {
    email: window.sessionStorage.getItem('samagama-email') || '',
    displayName: window.sessionStorage.getItem('samagama-display-name') || 'Student',
    role: window.sessionStorage.getItem('samagama-role') || 'student',
  };
}
