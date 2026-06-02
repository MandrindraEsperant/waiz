import React, { createContext, useState, useEffect, useContext } from 'react';
import { graphqlRequest } from '../services/graphql';
import { fetchRidesAsCourses } from '../services/rideService';
import { mapGraphQLUserToLocal, mapRoleToType } from '../utils/graphqlClient';
import { fetchRides, verifyToken } from '../services/waizApi';

const AuthContext = createContext();

const mapBackendUser = (user) => ({
  id: user.id,
  nom: user.name || user.nom || '',
  prenom: user.firstName || user.prenom || '',
  telephone: user.phone || user.telephone || '',
  email: user.email || '',
  role: user.role || '',
  type: user.role === 'DRIVER' ? 'chauffeur' : user.role === 'CUSTOMER' ? 'passager' : 'chauffeur'
});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Nouveaux états pour les publications du chauffeur
  const [chauffeurPublications, setChauffeurPublications] = useState([]);
  const [publicationsLoading, setPublicationsLoading] = useState(false);
  const [publicationsError, setPublicationsError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('chauffeur_token') ||
        localStorage.getItem('client_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const VERIFY_TOKEN_QUERY = `
          query VerifyBearerToken {
            verifyBearerToken {
              id
              name
              firstName
              phone
              email
              role
            }
          }
        `;

        const data = await graphqlRequest(VERIFY_TOKEN_QUERY);
        const backendUser = data?.verifyBearerToken;

        if (backendUser) {
          const normalizedUser = mapBackendUser(backendUser);
          localStorage.setItem('authToken', token);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          localStorage.setItem('user_type', normalizedUser.type);
          setIsAuthenticated(true);
          setCurrentUser(normalizedUser);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Token invalide ou échec de vérification:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Charger les publications quand l'utilisateur est un chauffeur connecté
  useEffect(() => {
    if (isAuthenticated && currentUser?.type === 'chauffeur') {
      loadChauffeurPublications(currentUser.id);
    } else {
      setChauffeurPublications([]);
      setPublicationsError(null);
    }
  }, [isAuthenticated, currentUser]);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      const verifiedUser = await verifyToken();
      const userData = verifiedUser || (storedUser ? JSON.parse(storedUser) : null);

      if (!userData) {
        logout();
        setLoading(false);
        return;
      }

      const userType = userData.type || mapRoleToType(userData.role) || localStorage.getItem('user_type') || 'passager';
      const userWithType = { ...userData, type: userType };

      localStorage.setItem('user', JSON.stringify(userWithType));
      localStorage.setItem('user_type', userType);
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);

      setIsAuthenticated(true);
      setCurrentUser(userWithType);
    } catch (error) {
      console.error('Erreur vérification token:', error);
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const userType = userData.type || mapRoleToType(userData.role) || 'passager';
          setIsAuthenticated(true);
          setCurrentUser({ ...userData, type: userType });
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }

    setLoading(false);
  };

  // NOUVELLE FONCTION : Charger les publications du chauffeur (version corrigée)
  const loadChauffeurPublications = async (chauffeurId) => {
    if (!chauffeurId) return;

    setPublicationsLoading(true);
    setPublicationsError(null);

    try {
      const rides = await fetchRides({});
      setChauffeurPublications(rides);
      localStorage.setItem(`chauffeur_${chauffeurId}_publications`, JSON.stringify({
        data: rides,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erreur chargement courses GraphQL:', error);
      setPublicationsError('Impossible de charger les courses');
      loadCachedPublications(chauffeurId);
    } finally {
      setPublicationsLoading(false);
    }
  };

  // NOUVELLE FONCTION : Charger depuis le cache
  const loadCachedPublications = (chauffeurId) => {
    try {
      const cached = localStorage.getItem(`chauffeur_${chauffeurId}_publications`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;

        // Utiliser le cache si moins de 5 minutes
        if (cacheAge < 5 * 60 * 1000) {
          setChauffeurPublications(data);
          console.log(`📦 Publications chargées depuis le cache (${data.length} trajets)`);
          return true;
        }
      }
    } catch (error) {
      console.error('Erreur lecture cache:', error);
    }
    return false;
  };

  // NOUVELLE FONCTION : Rafraîchir les publications
  const refreshChauffeurPublications = () => {
    if (currentUser?.type === 'chauffeur' && currentUser?.id) {
      loadChauffeurPublications(currentUser.id);
    }
  };

  // NOUVELLE FONCTION : Ajouter une publication (après création)
  const addChauffeurPublication = (newPublication) => {
    setChauffeurPublications(prev => [newPublication, ...prev]);
    // Mettre à jour le cache
    if (currentUser?.id) {
      localStorage.setItem(`chauffeur_${currentUser.id}_publications`, JSON.stringify({
        data: [newPublication, ...chauffeurPublications],
        timestamp: Date.now()
      }));
    }
  };

  // NOUVELLE FONCTION : Mettre à jour une publication
  const updateChauffeurPublication = (publicationId, updatedData) => {
    setChauffeurPublications(prev =>
      prev.map(pub =>
        pub.cours_ID === publicationId ? { ...pub, ...updatedData } : pub
      )
    );
  };

  // NOUVELLE FONCTION : Supprimer une publication
  const removeChauffeurPublication = (publicationId) => {
    setChauffeurPublications(prev =>
      prev.filter(pub => pub.cours_ID !== publicationId)
    );
  };

  // NOUVELLE FONCTION : Obtenir les statistiques des publications
  const getChauffeurStats = () => {
    if (!chauffeurPublications.length) {
      return {
        total: 0,
        enAttente: 0,
        confirmees: 0,
        terminees: 0,
        annulees: 0,
        revenuTotal: 0,
        passagersTotal: 0
      };
    }

    const stats = {
      total: chauffeurPublications.length,
      enAttente: 0,
      confirmees: 0,
      terminees: 0,
      annulees: 0,
      revenuTotal: 0,
      passagersTotal: 0
    };

    chauffeurPublications.forEach(pub => {
      // Compter par statut
      switch (pub.status) {
        case 'EN_ATTENTE': stats.enAttente++; break;
        case 'CONFIRMEE': stats.confirmees++; break;
        case 'TERMINEE': stats.terminees++; break;
        case 'ANNULEE': stats.annulees++; break;
      }

      // Calculer revenu (pour les courses terminées ou confirmées)
      if (pub.status === 'TERMINEE' || pub.status === 'CONFIRMEE') {
        stats.revenuTotal += (pub.prix_par_personne || 0) * (pub.nbr_passager || 0);
      }

      // Total passagers
      stats.passagersTotal += pub.nbr_passager || 0;
    });

    return stats;
  };

  // NOUVELLE FONCTION : Obtenir les publications filtrées
  const getFilteredPublications = (filters = {}) => {
    let filtered = [...chauffeurPublications];

    if (filters.status) {
      filtered = filtered.filter(pub => pub.status === filters.status);
    }

    if (filters.startDate) {
      filtered = filtered.filter(pub => new Date(pub.date_depart) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(pub => new Date(pub.date_depart) <= new Date(filters.endDate));
    }

    if (filters.minPrice) {
      filtered = filtered.filter(pub => (pub.prix_par_personne || 0) >= filters.minPrice);
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(pub => (pub.prix_par_personne || 0) <= filters.maxPrice);
    }

    // Trier par date (plus récent d'abord)
    filtered.sort((a, b) => new Date(b.date_depart) - new Date(a.date_depart));

    return filtered;
  };

  // 🔧 FONCTION LOGIN MODIFIÉE
  const login = (token, userData, options = {}) => {
    const { redirectPath } = options;

    // ✅ NETTOYER TOUTES LES ANCIENNES DONNÉES
    const keysToRemove = [
      'currentUser',
      'user',
      'client',
      'chauffeur',
      'authToken',
      'token',
      'chauffeur_token',
      'client_token',
      'user_type',
      'chauffeur_id',
      'client_id',
      'chauffeur_nom',
      'client_nom',
      'chauffeur_email',
      'client_email',
      'chauffeur_telephone',
      'client_telephone'
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('🧹 Anciennes données nettoyées');

    // 🔧 FIX: Déterminer le type d'utilisateur
    let userType = userData.type || mapRoleToType(userData.role);

    if (!userType) {
      // Pour l'instant, on met passager par défaut
      userType = 'passager';
      console.log('⚠️ Type non spécifié, utilisation de "passager" par défaut');
    }

    // S'assurer que userData a un type défini
    const userWithType = {
      ...userData,
      type: userType
    };

    console.log('✅ Nouvel utilisateur:', userWithType);

    // Stocker les nouvelles données
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userWithType));
    localStorage.setItem('token', token);
    localStorage.setItem('user_type', userType);

    // Stocker selon le type d'utilisateur
    if (userWithType.type === 'chauffeur') {
      localStorage.setItem('chauffeur_token', token);
      localStorage.setItem('chauffeur_id', userWithType.id);
      localStorage.setItem('chauffeur_nom', userWithType.nom);
      localStorage.setItem('chauffeur_email', userWithType.email);
      localStorage.setItem('chauffeur_telephone', userWithType.telephone);

      // ✅ Supprimer spécifiquement les données client
      localStorage.removeItem('client_id');
      localStorage.removeItem('client_nom');
      localStorage.removeItem('client_email');
      localStorage.removeItem('client_telephone');
    } else {
      localStorage.setItem('client_token', token);
      localStorage.setItem('client_id', userWithType.id);
      localStorage.setItem('client_nom', userWithType.nom);
      localStorage.setItem('client_email', userWithType.email);
      localStorage.setItem('client_telephone', userWithType.telephone);

      // ✅ Supprimer spécifiquement les données chauffeur
      localStorage.removeItem('chauffeur_id');
      localStorage.removeItem('chauffeur_nom');
      localStorage.removeItem('chauffeur_email');
      localStorage.removeItem('chauffeur_telephone');
    }

    // Mettre à jour l'état
    setIsAuthenticated(true);
    setCurrentUser(userWithType);

    // Rediriger selon le type ou selon l'option explicite
    const targetPath = redirectPath || (userWithType.type === 'chauffeur' ? '/dashboard' : '/reserver');
    if (targetPath) {
      setTimeout(() => {
        window.location.href = targetPath;
      }, 100);
    }
  };

  // Fonction logout modifiée
  const logout = () => {
    // Sauvegarder l'ID et le type du chauffeur avant de nettoyer
    const userId = currentUser?.id;
    const userType = currentUser?.type;

    // Supprimer TOUTES les données d'authentification
    const keysToRemove = [
      'authToken',
      'user',
      'token',
      'chauffeur_token',
      'chauffeur_id',
      'chauffeur_nom',
      'chauffeur_email',
      'chauffeur_telephone',
      'client_token',
      'client_id',
      'client_nom',
      'client_email',
      'client_telephone',
      'user_type',
      'user_role',
      'selectedDriverId'
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Optionnel : garder les publications en cache mais avec timestamp pour indiquer que c'est ancien
    if (userId && userType === 'chauffeur') {
      const cached = localStorage.getItem(`chauffeur_${userId}_publications`);
      if (cached) {
        const { data } = JSON.parse(cached);
        localStorage.setItem(`chauffeur_${userId}_publications`, JSON.stringify({
          data,
          timestamp: 0 // Marquer comme expiré
        }));
      }
    }

    // Mettre à jour l'état
    setIsAuthenticated(false);
    setCurrentUser(null);
    setChauffeurPublications([]);
    setPublicationsError(null);
  };

  const updateUser = (userData) => {
    const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUserData, ...userData };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    // Recharger les publications si le type change
    if (updatedUser.type === 'chauffeur' && updatedUser.id) {
      loadChauffeurPublications(updatedUser.id);
    }
  };

  // 🔧 FIX: S'assurer que userType est toujours défini
  const getUserType = () => {
    if (currentUser?.type) {
      return currentUser.type;
    }

    if (currentUser?.role) {
      const mapped = mapRoleToType(currentUser.role);
      if (mapped) {
        return mapped;
      }
    }

    // Essayer de récupérer depuis localStorage
    const storedType = localStorage.getItem('user_type');
    if (storedType) {
      return storedType;
    }

    // Vérifier les IDs
    if (localStorage.getItem('chauffeur_id')) {
      return 'chauffeur';
    }
    if (localStorage.getItem('client_id')) {
      return 'passager';
    }

    return 'passager'; // Type par défaut
  };

  const value = {
    // États existants
    isAuthenticated,
    currentUser,
    loading,

    // Nouveaux états pour les publications
    chauffeurPublications,
    publicationsLoading,
    publicationsError,

    // Fonctions existantes
    login,
    logout,
    checkAuth,
    updateUser,

    // Nouvelles fonctions pour les publications
    loadChauffeurPublications,
    refreshChauffeurPublications,
    addChauffeurPublication,
    updateChauffeurPublication,
    removeChauffeurPublication,
    getChauffeurStats,
    getFilteredPublications,

    // 🔧 FIX: Helpers pour le type d'utilisateur
    isChauffeur: getUserType() === 'chauffeur',
    isPassager: getUserType() === 'passager',
    userType: getUserType()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };