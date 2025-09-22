
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const { login, users } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Welcome to YDS AI Assistant</h1>
        <p className="text-text-secondary mb-8">Please enter your name to continue or select an existing profile.</p>

        <form onSubmit={handleLogin} className="bg-bg-secondary p-8 rounded-lg shadow-lg">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary text-center"
            required
          />
          <button
            type="submit"
            className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500"
            disabled={!username.trim()}
          >
            Continue
          </button>
        </form>

        {users.length > 0 && (
          <div className="mt-8">
            <h2 className="text-text-secondary mb-4">Or select an existing profile:</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {users.map(userProfile => (
                <button
                  key={userProfile}
                  onClick={() => login(userProfile)}
                  className="px-4 py-2 bg-bg-secondary hover:bg-gray-700 text-text-primary rounded-md transition duration-200"
                >
                  {userProfile}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
