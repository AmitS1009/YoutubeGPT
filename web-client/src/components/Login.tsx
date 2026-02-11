import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-text font-sans">
            {/* Left Brand Panel */}
            <div className="hidden lg:flex w-1/2 bg-surface relative flex-col justify-between p-12 border-r border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10 pointer-events-none" />

                <div className="z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <Settings className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold tracking-tight">YoutubeGPT</span>
                    </div>
                    <h1 className="text-5xl font-extrabold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Chat with any<br />Video content.
                    </h1>
                    <p className="text-xl text-muted max-w-md">
                        Unlock the power of RAG with advanced long-term memory and precise recall.
                    </p>
                </div>

                <div className="z-10 text-sm text-muted/60">
                    © 2026 AntiGravity Intelligence.
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold">Welcome back</h2>
                        <p className="text-muted mt-2">Enter your credentials to access your workspace.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted uppercase tracking-wider">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2 group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center text-sm text-muted">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary hover:underline font-medium">
                            Create one now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
