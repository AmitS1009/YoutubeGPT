import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for API calls
api.interceptors.request.use(
    async config => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers = config.headers || {}; // Ensure headers exist
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user_id: string;
    full_name: string;
}

export interface ProcessVideoResponse {
    status: string;
    video_id: string;
    chunks: number;
}

export interface IngestPDFResponse {
    status: string;
    filename: string;
    chunks: number;
}

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const signupUser = async (email: string, password: string, full_name: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', { email, password, full_name });
    return response.data;
};

export const ingestVideo = async (url: string): Promise<ProcessVideoResponse> => {
    const response = await api.post('/ingest/youtube', { youtube_url: url });
    return response.data;
};

export const ingestPDF = async (file: File): Promise<IngestPDFResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/ingest/pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const createThread = async (): Promise<{ thread_id: string; title: string }> => {
    const response = await api.post('/threads');
    return response.data;
};

export const getThreads = async (): Promise<Array<{ id: string; title: string }>> => {
    const response = await api.get('/threads');
    return response.data;
};

// Streaming chat helper
export const getChatStreamUrl = () => `${API_BASE_URL}/chat`;

export default api;
