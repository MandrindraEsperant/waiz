import React, { useState, useCallback, useEffect } from 'react';
import { 
  FaUsers, 
  FaCar, 
  FaFileAlt, 
  FaMapMarkerAlt, 
  FaBars, 
  FaChevronRight, 
  FaChartBar,
  FaCog,
  FaList,
  FaCalendarCheck,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Menu.css';

// Import des traductions
import fr from '../locales/menu/fr.json';
import mg from '../locales/menu/mg.json';
import en from '../locales/menu/en.json';

const locales = {
  fr: fr,
  mg: mg,
  en: en
};

function Menu({ onToggle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const location = useLocation();

  // Utilisation du contexte de langue
  const { language: currentLanguage } = useLanguage();

  // Fonction utilitaire pour obtenir les traductions
  const t = (key, variables = {}) => {
    const keys = key.split('.');
    let translation = locales[currentLanguage];
    
    for (const k of keys) {
      translation = translation?.[k];
      if (!translation) break;
    }
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key.split('.').pop();
    }
    
    return translation.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] || match;
    });
  };

  const toggleSidebar = useCallback(() => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  }, [isSidebarOpen, onToggle]);

  const toggleSubMenu = useCallback((menuId) => {
    setOpenSubMenu(prev => prev === menuId ? null : menuId);
  }, []);

  const RIDE_SUB_ITEMS = [
    { 
      id: 'ride-list',
      name: t('rides.list'), 
      icon: React.createElement(FaList), 
      path: "/course/affichage-courses",
      description: t('rides.listDescription'),
      tooltip: t('rides.list')
    },
    { 
      id: 'ride-reservation',
      name: t('rides.reservation'), 
      icon: React.createElement(FaCalendarCheck), 
      path: "/course/reservation",
      description: t('rides.reservationDescription'),
      tooltip: t('rides.reservation')
    }
  ];

  // Éléments du menu avec des IDs fixes
  const SIDEBAR_ITEMS = [
    { 
      id: 'dashboard',
      name: t('dashboard.name'), 
      icon: React.createElement(FaChartBar), 
      path: "/dashboard",
      description: t('dashboard.description'),
      tooltip: t('dashboard.name'),
      hasSubMenu: false
    },
    { 
      id: 'rides',
      name: t('rides.name'), 
      icon: React.createElement(FaCar), 
      path: "/course/affichage-courses",
      description: t('rides.description'),
      tooltip: t('rides.name'),
      hasSubMenu: true,
      subItems: RIDE_SUB_ITEMS,
      subMenuPaths: ["/course/affichage-courses", "/course/reservation"] // Chemins des sous-menus
    },
    { 
      id: 'zones',
      name: t('zones.name'), 
      icon: React.createElement(FaMapMarkerAlt), 
      path: "/zone/cart-service",
      description: t('zones.description'),
      tooltip: t('zones.name'),
      hasSubMenu: false
    },
    { 
      id: 'calendar',
      name: t('calendar.name'), 
      icon: React.createElement(FaFileAlt), 
      path: "/generateur-donnees/generateur-donnees",
      description: t('calendar.description'),
      tooltip: t('calendar.name'),
      hasSubMenu: false
    },
    { 
      id: 'clients',
      name: t('clients.name'), 
      icon: React.createElement(FaUsers), 
      path: "/affichage", 
      description: t('clients.description'),
      tooltip: t('clients.name'),
      hasSubMenu: false
    },
  ];

  const PARAMETRE_ITEM = {
    id: 'settings',
    name: t('parametre.name'), 
    icon: React.createElement(FaCog), 
    path: "/parametre", 
    description: t('parametre.description'),
    tooltip: t('parametre.name'),
    hasSubMenu: false
  };

  // Effet pour ouvrir automatiquement le sous-menu si on est dans un de ses chemins
  useEffect(() => {
    const ridesItem = SIDEBAR_ITEMS.find(item => item.id === 'rides');
    if (ridesItem && ridesItem.subMenuPaths) {
      const isInRidesSubMenu = ridesItem.subMenuPaths.some(path => 
        location.pathname === path
      );
      
      if (isInRidesSubMenu && openSubMenu !== 'rides') {
        setOpenSubMenu('rides');
      }
    }
  }, [location.pathname, openSubMenu]);

  const isActive = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  const isSubItemActive = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Vérifier si un des sous-menus est actif
  const isAnySubItemActive = useCallback((subMenuPaths) => {
    return subMenuPaths?.some(path => location.pathname === path) || false;
  }, [location.pathname]);

  const renderNavItem = (item, isParameter = false) => {
    const isItemActive = isActive(item.path) || (item.hasSubMenu && isAnySubItemActive(item.subMenuPaths));
    const hasSubMenu = item.hasSubMenu && isSidebarOpen;
    const isSubMenuOpen = openSubMenu === item.id;

    const content = (
      <>
        <div 
          className={`nav-item ${isItemActive ? 'nav-item-active' : ''} ${hasSubMenu ? 'has-submenu' : ''}`}
          data-tooltip={item.tooltip}
          onClick={hasSubMenu ? (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSubMenu(item.id);
          } : undefined}
        >
          <div className="nav-icon-container">
            <span className="nav-icon">{item.icon}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </div>
          
          {isSidebarOpen && (
            <div className="nav-content">
              <div className="nav-title">
                {item.name}
                {isItemActive && !hasSubMenu && <FaChevronRight className="active-arrow" size={12} />}
                {hasSubMenu && (
                  <span className="submenu-arrow">
                    {isSubMenuOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                  </span>
                )}
              </div>
              <div className="nav-description">{item.description}</div>
            </div>
          )}
        </div>

        {/* Sous-menu */}
        {hasSubMenu && isSubMenuOpen && (
          <div className="submenu-container">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.id}
                to={subItem.path}
                className="submenu-link"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div 
                  className={`submenu-item ${isSubItemActive(subItem.path) ? 'submenu-item-active' : ''}`}
                  data-tooltip={subItem.tooltip}
                >
                  <span className="submenu-icon">{subItem.icon}</span>
                  {isSidebarOpen && (
                    <div className="submenu-content">
                      <div className="submenu-title">{subItem.name}</div>
                      <div className="submenu-description">{subItem.description}</div>
                    </div>
                  )}
                  {isSubItemActive(subItem.path) && isSidebarOpen && (
                    <FaChevronRight className="active-arrow" size={10} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </>
    );

    if (hasSubMenu) {
      return (
        <div key={item.id} className="nav-link-wrapper">
          {content}
        </div>
      );
    }

    return (
      <Link 
        key={item.id} 
        to={item.path} 
        className="nav-link"
        onClick={() => {
          // Ferme le sous-menu si on clique sur un autre menu principal
          if (openSubMenu && openSubMenu !== item.id) {
            setOpenSubMenu(null);
          }
        }}
      >
        {content}
      </Link>
    );
  };

  return (
    <div className={`sidebar-menu ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        {isSidebarOpen && (
          <div className="logo-container">
            <div className="logo-icon">
              <span className="logo-text">w.z</span>
            </div>
            <div className="logo-text-container">
              <h2 className="logo-title">{t('logo.title')}</h2>
              <span className="logo-subtitle">{t('logo.subtitle')}</span>
            </div>
          </div>
        )}
        
        <button onClick={toggleSidebar} className="sidebar-toggle" aria-label="Toggle sidebar">
          <FaBars size={18} />
        </button>
      </div>

      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => {
            if (!item.path) {
              return (
                <div 
                  key={item.id} 
                  className="nav-link disabled"
                >
                  <div 
                    className="nav-item"
                    data-tooltip={item.tooltip}
                  >
                    <div className="nav-icon-container">
                      <span className="nav-icon">{item.icon}</span>
                      {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </div>
                    
                    {isSidebarOpen && (
                      <div className="nav-content">
                        <div className="nav-title">{item.name}</div>
                        <div className="nav-description">{item.description}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return renderNavItem(item);
          })}
        </nav>

        {/* Section Paramètre en bas */}
        <div className="parametre-section">
          {renderNavItem(PARAMETRE_ITEM, true)}
        </div>
      </div>
    </div>
  );
}

export default Menu;