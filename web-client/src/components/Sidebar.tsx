import React, { useState } from 'react';
import { Upload, Settings, Play, Loader2, Check, Plus, LogOut, MessageSquare } from 'lucide-react';
import { ingestVideo, ingestPDF, createThread, getThreads } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    onIngestSuccess: (msg: string) => void;
    onIngestError: (msg: string) => void;
    onThreadChange: (threadId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onIngestSuccess, onIngestError, onThreadChange }) => {
    const { logout, user } = useAuth();
    const [videoUrl, setVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessed, setIsProcessed] = useState(false);
    const [isBackendLive, setIsBackendLive] = useState(false);
    const [threads, setThreads] = useState<Array<{ id: string; title: string }>>([]);

    React.useEffect(() => {
        const fetchHistory = async () => {
            try {
                const list = await getThreads();
                setThreads(list);
            } catch (e) {
                console.error("Failed to load threads", e);
            }
        };
        fetchHistory();

        const checkHealth = async () => {
            try {
                await fetch('http://localhost:8000/');
                setIsBackendLive(true);
            } catch (e) {
                setIsBackendLive(false);
            }
        };

        checkHealth();
    }, []);

    const handleNewChat = async () => {
        try {
            const res = await createThread();
            onThreadChange(res.thread_id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleVideoIngest = async () => {
        if (!videoUrl) return;
        setIsLoading(true);
        setIsProcessed(false);
        try {
            const res = await ingestVideo(videoUrl);
            onIngestSuccess(`Processed video: ${res.video_id} (${res.chunks} chunks)`);
            setIsProcessed(true);
        } catch (e: any) {
            console.error(e);
            onIngestError("Failed to process video");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setIsLoading(true);
        setIsProcessed(false);
        try {
            const res = await ingestPDF(e.target.files[0]);
            onIngestSuccess(`Processed PDF: ${res.filename} (${res.chunks} chunks)`);
            setIsProcessed(true);
        } catch (e: any) {
            console.error(e);
            onIngestError("Failed to process PDF");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-80 h-screen bg-surface border-r border-slate-700 flex flex-col p-5 shadow-2xl z-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <Settings className="w-6 h-6 text-primary" />
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        YoutubeGPT
                    </span>
                </div>
            </div>

            {/* New Chat Action */}
            <button
                onClick={handleNewChat}
                className="flex items-center justify-center gap-2 w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl p-3 mb-8 transition-all font-medium"
            >
                <Plus className="w-4 h-4" /> New Chat
            </button>

            <div className="space-y-8 flex-1 overflow-y-auto">
                {/* Input Section */}
                {isLoading ? (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 flex flex-col items-center justify-center gap-4 animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <div className="text-center">
                            <span className="text-sm font-medium text-primary block">Processing Content...</span>
                            <span className="text-xs text-muted">This may take a moment.</span>
                        </div>
                    </div>
                ) : isProcessed ? (
                    <div
                        className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:bg-green-500/20 transition-all group"
                        onClick={() => { setIsProcessed(false); setVideoUrl(''); }}
                    >
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Check className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-green-500 block">Processing Complete!</span>
                            <span className="text-xs text-green-500/80">Ask the question now.</span>
                        </div>
                        <span className="text-[10px] text-muted mt-2 underline opacity-0 group-hover:opacity-100 transition-opacity">Process another file</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider pl-1">Knowledge Source</h3>

                        {/* YouTube */}
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="Paste YouTube Link..."
                                    className="bg-background/50 border border-slate-700 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                                <button
                                    onClick={handleVideoIngest}
                                    disabled={isLoading || !isBackendLive || isProcessed}
                                    className={`rounded-lg p-2 transition-all flex-shrink-0 text-white shadow-lg ${isProcessed ? 'bg-green-500' : 'bg-primary hover:bg-primary/90'} disabled:opacity-50`}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isProcessed ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />)}
                                </button>
                            </div>
                        </div>

                        {/* PDF */}
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                disabled={isLoading || !isBackendLive}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                            />
                            <div className="bg-background/50 border border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                <div className="flex items-center justify-center gap-2 text-muted group-hover:text-primary mb-1">
                                    <Upload className="w-4 h-4" />
                                    <span className="text-xs font-medium">Upload PDF</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* History */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider pl-1">Recent Chats</h3>
                    {threads.length === 0 ? (
                        <div className="text-xs text-muted/50 pl-2 italic">No earlier chats found.</div>
                    ) : (
                        threads.map(t => (
                            <div
                                key={t.id}
                                onClick={() => onThreadChange(t.id)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer transition-all"
                            >
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <div className="text-xs truncate text-text/80">{t.title}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer / User */}
            <div className="mt-auto pt-4 border-t border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="text-xs">
                            <div className="font-medium text-text">{user?.full_name || 'User'}</div>
                            <div className="text-muted text-[10px]">Pro Plan</div>
                        </div>
                    </div>
                    <button onClick={logout} className="text-muted hover:text-red-400 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-[10px] text-muted flex items-center gap-2 justify-center bg-black/20 py-1 rounded-full">
                    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : (isBackendLive ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse')}`}></div>
                    {isLoading ? 'Processing...' : (isBackendLive ? 'System Online' : 'Offline')}
                </div>
            </div>
        </div>
    );
};
