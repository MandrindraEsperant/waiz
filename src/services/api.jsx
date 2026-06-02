// axiosConfig.js
import http from './http';

const setupAxiosInterceptors = () => {
  return http;
};

export { http, setupAxiosInterceptors };
export default http;
