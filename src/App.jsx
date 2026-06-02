import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { setupAxiosInterceptors } from './services/api';

// Composants & Layouts
import Header from './components/Header';
import SeoManager from './components/SeoManager';
import DashboardLayout from './layouts/DashboardLayout';
import SubscriptionGuard from './components/subscription-guard/SubscriptionGuard';

// Pages Chauffeurs
import Dashboard from './components/dashboard/dashboard';
import Affichage from './components/client/affichage';
import NouveauClient from './components/client/NouveauClient';
import CarteService from './components/zone/carteService';
import AffichageCourses from './components/course/affichageCourses';
import NouvelleCourse from './components/course/NouvelleCourse';
import Reservation from './components/course/reservation';
import GenerateurDonnees from './components/generateur-donnees/generateur_donnees';
import ExportePage from './components/exporte/exporte_donnees';
import Parametre from './components/parametres/parametre';
import Inscription from './components/chauffeur/inscription';

// Pages Passagers & Communes
import Login from './components/Login';
import Verification from './components/verification-email/verification';
import Validation from './components/validation-code/validation';
import NouveauMotDePasse from './components/nouveau-mot-de-passe/nouveau_mot_de_passe';
import Abonnement from './components/abonnements/abonnement'; 
import Accueil from './components/passagers/acceuil/Acceuil'; // Orthographe corrigée localement si besoin
import Etape from './components/passagers/etape/etape';
import Reserver from './components/passagers/reserver_trajet/reserver';

import './App.css';

// Initialiser les intercepteurs Axios
setupAxiosInterceptors();

// Helper pour centraliser la récupération du type d'utilisateur
const getUserType = (userType, currentUser) => {
  return userType || currentUser?.type || localStorage.getItem('user_type') || 'passager';
};

// 🔧 COMPOSANT DE PROTECTION DES ROUTES
function ProtectedRoute({ children, allowedUserType }) {
  const { isAuthenticated, loading, userType, currentUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-spinner">Chargement...</div>;
  }

  if (!isAuthenticated) {
    console.log('🔒 Non authentifié - Redirection vers Login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentUserType = getUserType(userType, currentUser);
  console.log(`🔍 Vérification accès - Type actuel: ${currentUserType}, Type requis: ${allowedUserType || 'aucun'}`);

  if (allowedUserType && currentUserType !== allowedUserType) {
    console.log(`⛔ Accès refusé - Type ${currentUserType} ≠ ${allowedUserType}`);
    return currentUserType === 'chauffeur' 
      ? <Navigate to="/dashboard" replace /> 
      : <Navigate to="/reserver" replace />;
  }

  return children;
}

// 🔧 WRAPPER GLOBAL POUR REGROUPER LES WRAPPERS CHAUFFEUR (Évite la répétition)
function ChauffeurLayoutWrapper({ children }) {
  return (
    <ProtectedRoute allowedUserType="chauffeur">
      <SubscriptionGuard>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}

// Composant pour les pages non trouvées
function NotFound() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>404 - Page non trouvée</h2>
      <p>La page que vous recherchez n'existe pas.</p>
    </div>
  );
}

// 🔧 COMPOSANT DE REDIRECTION AUTOMATIQUE (LOGIN -> DASHBOARD)
function AutoRedirect() {
  const { isAuthenticated, loading, userType, currentUser } = useAuth();
  const location = useLocation();

  if (loading || !isAuthenticated) return null;

  const currentUserType = getUserType(userType, currentUser);

  if (location.pathname.toLowerCase() === '/login') {
    const redirectTo = currentUserType === 'chauffeur' ? '/dashboard' : '/reserver';
    console.log(`🔄 Redirection automatique depuis Login vers ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  return null;
}

// Composant principal
function MainApp() {
  const { isAuthenticated, userType, currentUser, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      console.log('✅ Token trouvé au démarrage');
    } else {
      console.log('⚠️ Aucun token trouvé au démarrage');
    }
  }, []);

  if (loading) {
    return <div className="loading-spinner">Chargement de l'application...</div>;
  }

  // Configuration de l'affichage du Header
  const publicPaths = ['/', '/login', '/inscription', '/verification', '/validation', '/nouveau_mot_de_passe', '/course/nouvelle-course', '/abonnement'];
  const currentUserType = getUserType(userType, currentUser);
  
  const shouldShowHeader = isAuthenticated &&
    !publicPaths.includes(location.pathname) &&
    location.pathname !== '/reserver' &&
    currentUserType !== 'passager';

  return (
    <div className='grid-container'>
      {shouldShowHeader && <Header />}
      <AutoRedirect />

      <main className="main-content">
        <Routes>
          {/* ROUTES PUBLIQUES */}
          <Route path="/" element={<Accueil />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/validation" element={<Validation />} />
          <Route path="/nouveau_mot_de_passe" element={<NouveauMotDePasse />} />
          <Route path="/abonnement" element={<Abonnement />} />
          <Route path="/acceuil" element={<Navigate to="/" replace />} />
          <Route path="/etape" element={<Etape />} />

          {/* ROUTES PROTÉGÉES POUR CHAUFFEURS (Utilisant le Wrapper optimisé) */}
          <Route path="/dashboard" element={<ChauffeurLayoutWrapper><Dashboard /></ChauffeurLayoutWrapper>} />
          <Route path="/affichage" element={<ChauffeurLayoutWrapper><Affichage /></ChauffeurLayoutWrapper>} />
          <Route path="/nouveau-client" element={<ChauffeurLayoutWrapper><NouveauClient /></ChauffeurLayoutWrapper>} />
          <Route path="/zone/cart-service" element={<ChauffeurLayoutWrapper><CarteService /></ChauffeurLayoutWrapper>} />
          <Route path="/carte-service" element={<ChauffeurLayoutWrapper><CarteService /></ChauffeurLayoutWrapper>} />
          <Route path="/course/nouvelle-course" element={<ChauffeurLayoutWrapper><NouvelleCourse /></ChauffeurLayoutWrapper>} />
          <Route path="/course/affichage-courses" element={<ChauffeurLayoutWrapper><AffichageCourses /></ChauffeurLayoutWrapper>} />
          <Route path="/course/reservation" element={<ChauffeurLayoutWrapper><Reservation /></ChauffeurLayoutWrapper>} />
          <Route path="/generateur-donnees/generateur-donnees" element={<ChauffeurLayoutWrapper><GenerateurDonnees /></ChauffeurLayoutWrapper>} />
          <Route path="/exporte" element={<ChauffeurLayoutWrapper><ExportePage /></ChauffeurLayoutWrapper>} />
          <Route path="/parametre" element={<ChauffeurLayoutWrapper><Parametre /></ChauffeurLayoutWrapper>} />

          {/* ROUTES PROTÉGÉES POUR PASSAGERS */}
          <Route path="/reserver" element={
            <ProtectedRoute allowedUserType="passager">
              <Reserver />
            </ProtectedRoute>
          } />

          {/* 404 CATCH-ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

// Wrapper racine
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <SeoManager />
          <MainApp />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;