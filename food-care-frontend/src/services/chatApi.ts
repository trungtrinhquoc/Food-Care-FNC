import axios from 'axios';

const API_BASE_URL = 'http://localhost:5022/api';

export interface AskQuestionRequest {
    question: string;
}

export interface ChatResponse {
    answer: string;
    timestamp: string;
}

class ChatApi {
    private getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    // Ask a question (stateless)
    async askQuestion(question: string): Promise<ChatResponse> {
        const response = await axios.post<ChatResponse>(
            `${API_BASE_URL}/chat/ask`,
            { question },
            { headers: this.getAuthHeader() }
        );
        return response.data;
    }
}

export const chatApi = new ChatApi();
