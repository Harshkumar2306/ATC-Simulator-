import React, { useState } from 'react';

const LoginForm = ({ onLoginSuccess, onGuestLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.success) {
                onLoginSuccess(data.token);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight">ATC COMMAND</h1>
                    <p className="text-emerald-500 text-xs uppercase tracking-widest mt-2">Restricted Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2 uppercase tracking-wider">
                            Access Code
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                            placeholder="••••••••"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all
              ${loading
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                            }`}
                    >
                        {loading ? 'Authenticating...' : 'Initialize System'}
                    </button>

                    <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                        <button
                            type="button"
                            onClick={onGuestLogin}
                            className="text-slate-500 hover:text-emerald-400 text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 w-full"
                        >
                            View as Passenger
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
