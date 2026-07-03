import { Navigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../lib/auth-storage';

export function HomePage() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <p>Role: {user.role}</p>
      <p>Interests: {user.interests.join(', ') || 'none yet'}</p>
      <button
        type="button"
        onClick={() => {
          clearSession();
          window.location.href = '/login';
        }}
      >
        Log out
      </button>
    </div>
  );
}
