import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const leetcodeAPI = {
  syncUser: async (leetcodeUsername, sessionCookie) => {
    const response = await api.post('/sync', { leetcodeUsername, sessionCookie });
    return response.data;
  },
  
  getUser: async (username) => {
    const response = await api.get(`/user/${username}`);
    return response.data;
  },

  getRoadmap: async (username) => {
    const response = await api.get(`/roadmap/${username}`);
    return response.data;
  },

  getRandomQuestion: async (params) => {
    // params: { username, mode, topic, includeUnsolved }
    const response = await api.get('/random', { params });
    return response.data;
  },

  getTopics: async () => {
    const response = await api.get('/topics');
    return response.data;
  }
};

export default api;
