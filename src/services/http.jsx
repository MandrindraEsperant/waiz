import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000';

export const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL?.trim() ||
  `${API_BASE_URL}/graphql`;

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default http;