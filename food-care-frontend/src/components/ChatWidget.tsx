import React, { useState, useEffect, useRef } from 'react';
import { chatApi } from '../services/chatApi';
import { X, Send, Loader2 } from 'lucide-react';


interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]); // In-memory only
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Clear chat if user is logged out
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            if (!token && messages.length > 0) {
                setMessages([]);
            }
        };

        // Check on mount and every time it opens
        if (isOpen) {
            checkAuth();
        }

        // Optional: listen for storage changes from other tabs
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        // Add user message to UI immediately
        const tempUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            // Call API
            const response = await chatApi.askQuestion(userMessage);

            // Add AI response
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                timestamp: new Date(response.timestamp),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Add error message
            const errorMsg: Message = {
                id: 'error-' + Date.now(),
                role: 'assistant',
                content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 p-1 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                    aria-label="Open Chat"
                >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white">
                        <img
                            src="/support-avatar.png"
                            alt="Support Agent"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse font-semibold shadow-md">
                        AI
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 shadow-lg">
                                <img
                                    src="/support-avatar.png"
                                    alt="Support Agent"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold">Food & Care AI</h3>
                                <p className="text-xs text-white/80">Trợ lý thông minh</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                            aria-label="Close Chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                                <p className="text-sm">👋 Xin chào! Tôi có thể giúp gì cho bạn?</p>
                                <div className="mt-4 space-y-2">
                                    <button
                                        onClick={() => setInput('Tìm sản phẩm sữa tươi')}
                                        className="block w-full text-left px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-sm hover:bg-emerald-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        🔍 Tìm sản phẩm
                                    </button>
                                    <button
                                        onClick={() => setInput('Kiểm tra đơn hàng')}
                                        className="block w-full text-left px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-sm hover:bg-emerald-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        📦 Kiểm tra đơn hàng
                                    </button>
                                    <button
                                        onClick={() => setInput('Subscription là gì?')}
                                        className="block w-full text-left px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-sm hover:bg-emerald-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        ⭐ Tìm hiểu Subscription
                                    </button>
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-md">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                        <p className="text-sm text-gray-600 dark:text-gray-300">AI đang trả lời...</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white text-sm"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Send Message"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

