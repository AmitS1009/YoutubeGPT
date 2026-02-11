import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Sparkles, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Signup: React.FC = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await signup(email, password, fullName);
            navigate('/');
        } catch (err: any) {
            console.error("Signup Error:", err);
            // Robust error parsing
            let msg = 'Signup failed. Please try again.';
            if (err.response) {
                const data = err.response.data;
                if (data?.detail) {
                    if (typeof data.detail === 'string') {
                        msg = data.detail;
                    } else if (Array.isArray(data.detail)) {
                        msg = data.detail.map((e: any) => e.msg).join(', ');
                    } else {
                        msg = JSON.stringify(data.detail);
                    }
                }
            } else {
                msg = "Network Error: Could not connect to server.";
            }
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-text font-sans">
            {/* Left Brand Panel */}
            <div className="hidden lg:flex w-1/2 bg-surface relative flex-col justify-between p-12 border-r border-white/5">
                <div className="absolute inset-0 bg-gradient-to-tl from-secondary/20 to-primary/10 pointer-events-none" />

                <div className="z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <Settings className="w-8 h-8 text-secondary" />
                        <span className="text-2xl font-bold tracking-tight">YoutubeGPT</span>
                    </div>
                    <h1 className="text-5xl font-extrabold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                        Join the <br />Future today.
                    </h1>
                    <p className="text-xl text-muted max-w-md">
                        Create your account to start building your personalized knowledge base.
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
                        <h2 className="text-3xl font-bold">Create Account</h2>
                        <p className="text-muted mt-2">Get started with your free account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted uppercase tracking-wider">Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
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
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-secondary/25 flex items-center justify-center gap-2 group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Access System <Sparkles className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center text-sm text-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="text-secondary hover:underline font-medium">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
