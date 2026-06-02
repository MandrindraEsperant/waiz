// axiosConfig.js
import axios from 'axios';

const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      
      console.log(`🌐 Requête vers: ${config.url}`);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Token ajouté aux headers');
      } else {
        console.log('⚠️ Pas de token trouvé dans localStorage');
      }
      
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // Intercepteur pour GÉRER les réponses
  axios.interceptors.response.use(
    response => response,
    error => {
      if (!error.response && error.request) {
        console.error('🔌 Erreur réseau ou CORS détectée : aucune réponse du serveur. Vérifiez la configuration Access-Control-Allow-Origin du backend.');
      }

      if (error.response?.status === 401) {
        console.error('🔒 Erreur 401: Non autorisé');
        
        // Ne pas rediriger si on est déjà sur la page de login
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('token');
          localStorage.removeItem('chauffeur_id');
          localStorage.removeItem('user');
          
          // Sauvegarder l'URL actuelle pour redirection après login
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};


export default setupAxiosInterceptors;