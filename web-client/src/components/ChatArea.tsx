import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getChatStreamUrl } from '../services/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatAreaProps {
    threadId: string | null;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ threadId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    // Clear messages when thread changes
    useEffect(() => {
        setMessages([]);
    }, [threadId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsStreaming(true);

        // Initial assistant message holder
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const token = localStorage.getItem('access_token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(getChatStreamUrl(), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    message: userMsg,
                    session_id: threadId || 'default'
                }),
            });

            if (!response.ok) {
                // Check for 403 or 401
                if (response.status === 401 || response.status === 403) {
                    setMessages(prev => [...prev, { role: 'assistant', content: '**Access Denied.** Please log in again or start a new chat.' }]);
                    // Optionally redirect to /login via window.location but that's harsh inside a chat component.
                    // Better to just show error.
                    return;
                }
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Request failed');
            }

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    const chunkValue = decoder.decode(value, { stream: true });
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const lastMsg = newMsgs[newMsgs.length - 1];
                        if (lastMsg.role === 'assistant') {
                            lastMsg.content += chunkValue;
                        }
                        return newMsgs;
                    });
                }
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Connection Error.';
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-background relative">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted opacity-50 animate-pulse">
                        <Bot className="w-20 h-20 mb-6 text-primary" />
                        <p className="text-2xl font-light">How can I help you today?</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div className={`max-w-3xl px-6 py-4 rounded-3xl ${msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-sm shadow-md'
                            : 'bg-surface text-text rounded-bl-sm shadow-md border border-slate-700/50'
                            }`}>
                            <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed break-words">
                                <ReactMarkdown>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-background/80 backdrop-blur-xl border-t border-white/5 z-10">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask anything about your documents..."
                        disabled={isStreaming}
                        className="w-full bg-surface border border-slate-700 text-text rounded-2xl pl-6 pr-16 py-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 shadow-2xl transition-all disabled:opacity-50 placeholder:text-slate-500"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        className="absolute right-3 top-3 bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:bg-slate-700 shadow-lg hover:shadow-primary/50 transform hover:scale-105 active:scale-95"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
                <div className="text-center mt-3">
                    <p className="text-xs text-muted/60">Powered by Artificial Intelligence</p>
                </div>
            </div>
        </div>
    );
};
