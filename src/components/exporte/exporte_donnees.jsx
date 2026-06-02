import React, { useState, useEffect } from 'react';
import { FaFileExport, FaCalendarAlt, FaDownload, FaUser, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './exporte_donnees.css';
import MenuApp from '../Menu';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchRides } from '../../services/waizApi';

// Import des traductions
import fr from '../../locales/exporte/fr.json';
import mg from '../../locales/exporte/mg.json';
import en from '../../locales/exporte/en.json';

const locales = {
  fr: fr,
  mg: mg,
  en: en
};

function ExportePage() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [exportData, setExportData] = useState({
        period: 'all',
        startDate: '',
        endDate: '',
        fileType: 'csv'
    });
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [userCoursesCount, setUserCoursesCount] = useState(0);
    const [debugInfo, setDebugInfo] = useState('');

    // Utilisation du contexte de langue
    const { language } = useLanguage();
    const t = (key, variables = {}) => {
        const keys = key.split('.');
        let value = locales[language]?.export;
        
        for (const k of keys) {
            value = value?.[k];
        }
        
        let result = value || locales.fr.export[keys[keys.length - 1]] || key;
        
        // Remplacer les variables dans le texte
        Object.keys(variables).forEach(variable => {
            result = result.replace(`{{${variable}}}`, variables[variable]);
        });
        
        return result;
    };

    const handleMenuToggle = (isOpen) => {
        setIsMenuOpen(isOpen);
    };

    // Récupérer l'utilisateur connecté au montage du composant
    useEffect(() => {
        const loadCurrentUser = () => {
            try {
                console.log('🔍 Recherche de l\'utilisateur connecté...');
                
                // Essayer différentes clés de stockage
                const possibleKeys = ['user', 'authUser', 'currentUser', 'chauffeur', 'client'];
                
                let userData = null;
                let userKey = null;
                
                for (const key of possibleKeys) {
                    const data = localStorage.getItem(key) || sessionStorage.getItem(key);
                    if (data) {
                        console.log(`✅ Utilisateur trouvé avec la clé: ${key}`);
                        userData = data;
                        userKey = key;
                        break;
                    }
                }
                
                if (userData) {
                    const user = JSON.parse(userData);
                    console.log('👤 Utilisateur connecté DÉTAILS:', {
                        key: userKey,
                        id: user.id,
                        chauffeur_ID: user.chauffeur_ID,
                        client_ID: user.client_ID,
                        Nom: user.Nom,
                        username: user.username,
                        nom: user.nom,
                        prenom: user.prenom,
                        role: user.role,
                        email: user.email,
                        téléphone: user.téléphone,
                        TEL: user.TEL,
                        fullObject: user
                    });
                    
                    // Normaliser l'utilisateur
                    if (!user.id) {
                        if (user.chauffeur_ID) user.id = user.chauffeur_ID;
                        else if (user.client_ID) user.id = user.client_ID;
                    }
                    
                    // Déterminer le rôle
                    if (!user.role) {
                        if (user.chauffeur_ID) user.role = 'chauffeur';
                        else if (user.client_ID) user.role = 'client';
                        else if (userKey === 'chauffeur') user.role = 'chauffeur';
                        else if (userKey === 'client') user.role = 'client';
                        else user.role = 'user';
                    }
                    
                    // S'assurer que le nom est accessible
                    if (!user.Nom) {
                        if (user.nom && user.prenom) user.Nom = `${user.prenom} ${user.nom}`;
                        else if (user.nom) user.Nom = user.nom;
                        else if (user.prenom) user.Nom = user.prenom;
                        else if (user.username) user.Nom = user.username;
                    }
                    
                    setCurrentUser(user);
                    console.log('👤 Utilisateur normalisé:', user);
                    
                    setDebugInfo(prev => prev + `\n👤 Utilisateur connecté: ${user.Nom} (ID: ${user.id}, Rôle: ${user.role})`);
                    return user;
                }
                
                console.warn('⚠️ Aucun utilisateur connecté trouvé');
                setDebugInfo(prev => prev + '\n⚠️ Aucun utilisateur connecté trouvé');
                return null;
                
            } catch (error) {
                console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
                setDebugInfo(prev => prev + '\n❌ Erreur chargement utilisateur');
                return null;
            }
        };

        const user = loadCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    // Charger les courses après avoir récupéré l'utilisateur
    useEffect(() => {
        if (currentUser) {
            console.log(`🔄 Chargement des courses pour l'utilisateur:`, currentUser);
            setDebugInfo(prev => prev + `\n🔄 Chargement courses pour: ${currentUser.Nom}`);
            loadCourses();
        } else {
            console.log('⏸️ Pas d\'utilisateur, pas de chargement des courses');
            setCourses([]);
            setFilteredCourses([]);
            setUserCoursesCount(0);
        }
    }, [currentUser]);

    // Définir les dates par défaut
    useEffect(() => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        setExportData(prev => ({
            ...prev,
            startDate: oneWeekAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
        }));
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            setDebugInfo(prev => prev + '\n📡 Début chargement courses...');
            
            // Récupérer toutes les courses
            setDebugInfo(prev => prev + '\n🌐 Appel GraphQL getRides...');
            const allCourses = await fetchRides({});
            console.log(`📊 Total des courses disponibles sur le serveur: ${allCourses.length}`);
            setDebugInfo(prev => prev + `\n📊 Courses totales API: ${allCourses.length}`);
            
            if (allCourses.length === 0) {
                setDebugInfo(prev => prev + '\n⚠️ Aucune course disponible sur le serveur');
                setCourses([]);
                setFilteredCourses([]);
                setUserCoursesCount(0);
                return;
            }

            // Afficher la structure de quelques courses pour debug
            if (allCourses.length > 0) {
                console.log('🔍 Structure d\'une course (première):', {
                    id: allCourses[0].cours_ID || allCourses[0].id,
                    chauffeur_ID: allCourses[0].chauffeur_ID,
                    chauffeur: allCourses[0].chauffeur,
                    client_ID: allCourses[0].client_ID,
                    client: allCourses[0].client,
                    chauffeur_Nom: allCourses[0].chauffeur_Nom,
                    client_Nom: allCourses[0].client_Nom
                });
                
                setDebugInfo(prev => prev + `\n🔍 Exemple course: chauffeur_ID=${allCourses[0].chauffeur_ID}, client_ID=${allCourses[0].client_ID}`);
            }

            // Fonction de filtrage des courses
            const filterCoursesForUser = (coursesList, user) => {
                const userId = user?.id;
                const userRole = user?.role;
                const userName = user?.Nom || user?.username || user?.nom || '';
                
                console.log(`🔍 Filtrage pour utilisateur:`, {
                    id: userId,
                    role: userRole,
                    name: userName,
                    chauffeur_ID: user?.chauffeur_ID,
                    client_ID: user?.client_ID
                });
                
                setDebugInfo(prev => prev + `\n🔍 Critères filtrage: ID=${userId}, Rôle=${userRole}, Nom=${userName}`);

                return coursesList.filter(course => {
                    const courseId = course.cours_ID || course.id;
                    const chauffeurId = course.chauffeur_ID;
                    const clientId = course.client_ID;
                    const chauffeurNom = course.chauffeur?.nom || course.chauffeur_Nom || '';
                    const clientNom = course.client?.nom || course.client_Nom || '';
                    
                    // Debug pour chaque course
                    const debugCourse = `\n   Course ${courseId}: chauffeur_ID=${chauffeurId}, client_ID=${clientId}, chauffeurNom="${chauffeurNom}", clientNom="${clientNom}"`;
                    console.log(debugCourse);
                    
                    // 1. Si l'utilisateur est un chauffeur
                    if (userRole === 'chauffeur') {
                        // Vérifier par ID chauffeur (exact)
                        if (userId && chauffeurId && parseInt(chauffeurId) === parseInt(userId)) {
                            console.log(`✅ Course ${courseId} - Correspond par chauffeur_ID exact`);
                            setDebugInfo(prev => prev + debugCourse + ' ✅ chauffeur_ID exact');
                            return true;
                        }
                        
                        // Vérifier par ID dans l'objet chauffeur
                        if (course.chauffeur) {
                            if (course.chauffeur.id && parseInt(course.chauffeur.id) === parseInt(userId)) {
                                console.log(`✅ Course ${courseId} - Correspond par chauffeur.id`);
                                setDebugInfo(prev => prev + debugCourse + ' ✅ chauffeur.id');
                                return true;
                            }
                            if (course.chauffeur.chauffeur_ID && parseInt(course.chauffeur.chauffeur_ID) === parseInt(userId)) {
                                console.log(`✅ Course ${courseId} - Correspond par chauffeur.chauffeur_ID`);
                                setDebugInfo(prev => prev + debugCourse + ' ✅ chauffeur.chauffeur_ID');
                                return true;
                            }
                        }
                        
                        // Vérifier par nom (insensible à la casse)
                        if (chauffeurNom && userName && 
                            chauffeurNom.toLowerCase().includes(userName.toLowerCase())) {
                            console.log(`✅ Course ${courseId} - Correspond par nom chauffeur: "${chauffeurNom}"`);
                            setDebugInfo(prev => prev + debugCourse + ` ✅ nom "${chauffeurNom}"`);
                            return true;
                        }
                        
                        // Vérifier si le nom de l'utilisateur est dans le nom du chauffeur
                        if (userName && chauffeurNom && 
                            chauffeurNom.toLowerCase().includes(userName.toLowerCase())) {
                            console.log(`✅ Course ${courseId} - Correspond par inclusion nom: "${chauffeurNom}"`);
                            setDebugInfo(prev => prev + debugCourse + ` ✅ inclusion nom`);
                            return true;
                        }
                    }
                    
                    // 2. Si l'utilisateur est un client
                    if (userRole === 'client') {
                        // Vérifier par ID client (exact)
                        if (userId && clientId && parseInt(clientId) === parseInt(userId)) {
                            console.log(`✅ Course ${courseId} - Correspond par client_ID exact`);
                            setDebugInfo(prev => prev + debugCourse + ' ✅ client_ID exact');
                            return true;
                        }
                        
                        // Vérifier par ID dans l'objet client
                        if (course.client) {
                            if (course.client.id && parseInt(course.client.id) === parseInt(userId)) {
                                console.log(`✅ Course ${courseId} - Correspond par client.id`);
                                setDebugInfo(prev => prev + debugCourse + ' ✅ client.id');
                                return true;
                            }
                            if (course.client.client_ID && parseInt(course.client.client_ID) === parseInt(userId)) {
                                console.log(`✅ Course ${courseId} - Correspond par client.client_ID`);
                                setDebugInfo(prev => prev + debugCourse + ' ✅ client.client_ID');
                                return true;
                            }
                        }
                        
                        // Vérifier par nom (insensible à la casse)
                        if (clientNom && userName && 
                            clientNom.toLowerCase().includes(userName.toLowerCase())) {
                            console.log(`✅ Course ${courseId} - Correspond par nom client: "${clientNom}"`);
                            setDebugInfo(prev => prev + debugCourse + ` ✅ nom client "${clientNom}"`);
                            return true;
                        }
                    }
                    
                    // 3. Si rôle inconnu, essayer toutes les méthodes
                    if (!userRole || userRole === 'user') {
                        // Essayer toutes les correspondances possibles
                        const userIdNum = parseInt(userId);
                        
                        // Par ID chauffeur
                        if (chauffeurId && parseInt(chauffeurId) === userIdNum) {
                            console.log(`✅ Course ${courseId} - Correspond par chauffeur_ID (rôle inconnu)`);
                            setDebugInfo(prev => prev + debugCourse + ' ✅ chauffeur_ID (rôle inconnu)');
                            return true;
                        }
                        
                        // Par ID client
                        if (clientId && parseInt(clientId) === userIdNum) {
                            console.log(`✅ Course ${courseId} - Correspond par client_ID (rôle inconnu)`);
                            setDebugInfo(prev => prev + debugCourse + ' ✅ client_ID (rôle inconnu)');
                            return true;
                        }
                        
                        // Par nom (chauffeur ou client)
                        if ((chauffeurNom && userName && chauffeurNom.toLowerCase().includes(userName.toLowerCase())) ||
                            (clientNom && userName && clientNom.toLowerCase().includes(userName.toLowerCase()))) {
                            console.log(`✅ Course ${courseId} - Correspond par nom (rôle inconnu)`);
                            setDebugInfo(prev => prev + debugCourse + ' ✅ nom (rôle inconnu)');
                            return true;
                        }
                    }
                    
                    console.log(`❌ Course ${courseId} - Ne correspond pas`);
                    setDebugInfo(prev => prev + debugCourse + ' ❌ non correspondante');
                    return false;
                });
            };

            // Filtrer les courses
            const userCourses = filterCoursesForUser(allCourses, currentUser);
            
            console.log(`✅ Courses trouvées pour ${currentUser?.Nom || 'utilisateur'}: ${userCourses.length}`);
            setDebugInfo(prev => prev + `\n✅ Courses trouvées: ${userCourses.length}`);
            
            // Afficher les détails des courses trouvées
            if (userCourses.length > 0) {
                console.log('📋 Détails des courses trouvées:');
                userCourses.forEach((course, index) => {
                    console.log(`  ${index + 1}. ID: ${course.cours_ID || course.id}, Chauffeur: "${course.chauffeur?.nom || course.chauffeur_Nom}", Client: "${course.client?.nom || course.client_Nom}"`);
                });
                
                setDebugInfo(prev => prev + `\n📋 Exemple courses: ${userCourses.slice(0, 3).map(c => `ID:${c.cours_ID || c.id}`).join(', ')}`);
            }

            setCourses(userCourses);
            setFilteredCourses(userCourses);
            setUserCoursesCount(userCourses.length);
            
        } catch (err) {
            console.error('❌ Erreur chargement courses:', err);
            setDebugInfo(prev => prev + `\n❌ Erreur API: ${err.message}`);
            alert(t('alerts.loadError'));
            setCourses([]);
            setFilteredCourses([]);
            setUserCoursesCount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setExportData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleExport = async () => {
        // Vérifier si l'utilisateur est connecté
        if (!currentUser) {
            alert(t('alerts.userNotConnected'));
            return;
        }

        // Vérifier s'il y a des courses à exporter
        if (courses.length === 0) {
            alert(t('alerts.noRidesForUser'));
            return;
        }

        // Validation des dates si période sélectionnée
        if (exportData.period === 'range') {
            if (!exportData.startDate || !exportData.endDate) {
                alert(t('alerts.dateRequired'));
                return;
            }
            
            if (new Date(exportData.startDate) > new Date(exportData.endDate)) {
                alert(t('alerts.invalidDate'));
                return;
            }
        }

        setLoading(true);
        try {
            // Filtrer les courses selon la période sélectionnée
            let coursesToExport = courses;
            
            if (exportData.period === 'range') {
                coursesToExport = courses.filter(course => {
                    const courseDate = new Date(course.Heure_depart || course.heure_depart || course.createdAt);
                    const startDate = new Date(exportData.startDate);
                    const endDate = new Date(exportData.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    
                    return courseDate >= startDate && courseDate <= endDate;
                });
            }
            
            setFilteredCourses(coursesToExport);
            
            // Vérifier si des courses sont disponibles après filtrage
            if (coursesToExport.length === 0) {
                alert(t('alerts.noDataInPeriod'));
                setLoading(false);
                return;
            }
            
            // Préparer les données pour l'export
            const exportDataFormatted = coursesToExport.map(course => ({
                'ID Course': course.cours_ID || course.id,
                'Date/Heure Départ': formatDateForExport(course.Heure_depart || course.heure_depart || course.createdAt),
                'Client': course.client?.nom || course.client_Nom || course.Client_Nom || 'N/A',
                'Chauffeur': course.chauffeur?.nom || course.chauffeur_Nom || course.Chauffeur_Nom || 'N/A',
                'Voiture': course.voiture?.marque || course.voiture_Marque || 'N/A',
                'Zone Départ': course.zones?.depart?.nom || course.zone_depart_Nom || course.Zone_depart || 'N/A',
                'Zone Arrivée': course.zones?.arrivee?.nom || course.zone_arriver_Nom || course.Zone_arriver || 'N/A',
                'Tarif Proposé': course.Tarif_proposer_client || course.tarif_propose || course.montant || 0,
                'Tarif Final': course.Tarif_final_accepter || course.tarif_final || course.Montant_final || 0,
                'Statut Tarif': course.Status_tarif || course.status_tarif || 'N/A',
                'Temps Attente': course.Temps_attente_avant_acceptation || course.temps_attente || 0,
                'Statut Course': course.Status_course || course.status_course || course.Statut || 'N/A',
                'Événement Spécial': course.Evenement_special || course.evenement_special || 'Aucun'
            }));

            // Exporter selon le format choisi
            switch (exportData.fileType) {
                case 'csv':
                    exportToCSV(exportDataFormatted);
                    break;
                case 'excel':
                    exportToExcel(exportDataFormatted);
                    break;
                case 'pdf':
                    exportToPDF(exportDataFormatted);
                    break;
                default:
                    exportToCSV(exportDataFormatted);
            }
            
        } catch (err) {
            console.error('❌ Erreur lors de l\'export:', err);
            alert(t('alerts.exportError'));
        } finally {
            setLoading(false);
        }
    };

    const formatDateForExport = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString(language === 'fr' ? 'fr-FR' : 
                                     language === 'mg' ? 'mg-MG' : 'en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Date invalide';
        }
    };

    const exportToCSV = (data) => {
        if (data.length === 0) {
            alert(t('alerts.noData'));
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');

        const fileName = `courses_${currentUser?.Nom || 'utilisateur'}_${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(t('alerts.success', { 
            format: 'CSV', 
            count: data.length 
        }));
    };

    const exportToExcel = (data) => {
        if (data.length === 0) {
            alert(t('alerts.noData'));
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join('\t'),
            ...data.map(row => 
                headers.map(header => row[header]).join('\t')
            )
        ].join('\n');

        const fileName = `courses_${currentUser?.Nom || 'utilisateur'}_${new Date().toISOString().split('T')[0]}.xls`;
        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(t('alerts.success', { 
            format: 'Excel', 
            count: data.length 
        }));
    };

    const exportToPDF = (data) => {
        if (data.length === 0) {
            alert(t('alerts.noData'));
            return;
        }

        const pdfWindow = window.open('', '_blank');
        
        // Obtenir les textes traduits pour le PDF
        const periodText = exportData.period === 'all' 
            ? t('summary.allPeriod')
            : `${t('pdf.period')} ${exportData.startDate} ${t('period.to')} ${exportData.endDate}`;
        
        const userInfo = currentUser ? 
            `<div class="user-info">
                <p><strong>${t('pdf.user')}:</strong> ${currentUser.Nom || currentUser.username || 'Utilisateur'}</p>
                <p><strong>${t('pdf.userId')}:</strong> ${currentUser.id || currentUser.chauffeur_ID || currentUser.client_ID}</p>
                <p><strong>${t('pdf.userRole')}:</strong> ${currentUser.role || 'Non spécifié'}</p>
                <p><strong>${t('pdf.coursesCount')}:</strong> ${data.length}</p>
            </div>` : '';
        
        const content = `
            <html>
                <head>
                    <title>${t('pdf.title')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #2c3e50; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .summary { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                        .user-info { background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
                        .user-info p { margin: 5px 0; }
                        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <h1>${t('pdf.title')}</h1>
                    ${userInfo}
                    <div class="summary">
                        <p><strong>${periodText}</strong></p>
                        <p><strong>${t('pdf.exportDate')}</strong> ${new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'mg' ? 'mg-MG' : 'en-US')}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => `
                                <tr>
                                    ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>${t('pdf.generatedBy')} ${currentUser?.Nom || 'System'} - ${new Date().toLocaleString()}</p>
                    </div>
                </body>
            </html>
        `;
        
        pdfWindow.document.write(content);
        pdfWindow.document.close();
        pdfWindow.print();
        
        alert(t('alerts.success', { 
            format: 'PDF', 
            count: data.length 
        }));
    };

    // Fonction pour recharger les courses manuellement
    const reloadCourses = () => {
        console.log('🔄 Rechargement manuel des courses...');
        setDebugInfo(prev => prev + '\n🔄 Rechargement manuel...');
        if (currentUser) {
            loadCourses();
        }
    };

    // Fonction pour afficher les détails de debug
    const showDebugInfo = () => {
        console.log('=== DEBUG INFO ===');
        console.log('Utilisateur:', currentUser);
        console.log('Total courses chargées:', courses.length);
        console.log('Courses:', courses);
        console.log('User ID:', currentUser?.id);
        console.log('User Nom:', currentUser?.Nom);
        console.log('User Role:', currentUser?.role);
        console.log('Chauffeur_ID:', currentUser?.chauffeur_ID);
        console.log('Client_ID:', currentUser?.client_ID);
        console.log('=================');
        
        alert(`DEBUG INFO:\n
Utilisateur: ${currentUser?.Nom || 'N/A'}
ID: ${currentUser?.id || 'N/A'}
Rôle: ${currentUser?.role || 'N/A'}
Chauffeur_ID: ${currentUser?.chauffeur_ID || 'N/A'}
Client_ID: ${currentUser?.client_ID || 'N/A'}
Total courses: ${courses.length}
Voir console pour plus de détails.`);
    };

    // Fonction pour nettoyer le debug
    const clearDebugInfo = () => {
        setDebugInfo('');
    };

    return (
        <div className="app-container">
            <MenuApp onToggle={handleMenuToggle} />
            
            <div className={`content-container ${isMenuOpen ? 'menu-open' : 'menu-closed'}`}>
                <div className="export-container">
                    <div className="export-header">
                        <h1 className="export-title">
                            <FaFileExport className="title-icon" />
                            {t('title')}
                        </h1>
                        <div className="header-actions">
                            <button 
                                className="btn-back"
                                onClick={() => navigate('/course/affichage-courses')}
                            >
                                {t('backButton')}
                            </button>
                        </div>
                    </div>

                    <div className="export-content">
                        <div className="export-form">
                            {/* Sélection de la période */}
                            <div className="form-section">
                                <h3 className="section-title-exporte">
                                    <FaCalendarAlt className="section-icon" style={{color:'#3498db'}}/>
                                    {t('period.title')}
                                </h3>
                                
                                <div className="radio-group">
                                    <div className="radio-option">
                                        <input 
                                            type="radio" 
                                            id="all" 
                                            name="period" 
                                            value="all" 
                                            checked={exportData.period === 'all'}
                                            onChange={(e) => handleInputChange('period', e.target.value)}
                                            disabled={!currentUser || loading}
                                        />
                                        <label htmlFor="all">{t('period.all')}</label>
                                    </div>
                                    <div className="radio-option">
                                        <input 
                                            type="radio" 
                                            id="range" 
                                            name="period" 
                                            value="range" 
                                            checked={exportData.period === 'range'}
                                            onChange={(e) => handleInputChange('period', e.target.value)}
                                            disabled={!currentUser || loading}
                                        />
                                        <label htmlFor="range">{t('period.range')}</label>
                                    </div>
                                </div>

                                {exportData.period === 'range' && (
                                    <div className="date-range">
                                        <div className="date-inputs">
                                            <div className="date-input">
                                                <label htmlFor="startDate">{t('period.startDate')}</label>
                                                <input
                                                    type="date"
                                                    id="startDate"
                                                    value={exportData.startDate}
                                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                    disabled={!currentUser || loading}
                                                />
                                            </div>
                                            <div className="date-input">
                                                <label htmlFor="endDate">{t('period.endDate')}</label>
                                                <input
                                                    type="date"
                                                    id="endDate"
                                                    value={exportData.endDate}
                                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                                    disabled={!currentUser || loading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sélection du format */}
                            <div className="form-section">
                                <h3 className="section-title-exporte">{t('format.title')}</h3>
                                <div className="select-group">
                                    <label htmlFor="fileType">{t('format.fileType')}</label>
                                    <select
                                        id="fileType"
                                        value={exportData.fileType}
                                        onChange={(e) => handleInputChange('fileType', e.target.value)}
                                        disabled={!currentUser || loading}
                                    >
                                        <option value="csv">{t('format.csv')}</option>
                                        <option value="excel">{t('format.excel')}</option>
                                        <option value="pdf">{t('format.pdf')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Informations utilisateur
                            <div className="form-section user-info-section">
                                <h3 className="section-title">
                                    <FaUser className="section-icon" />
                                    {t('user.title')}
                                </h3>
                                <div className="user-details">
                                    {currentUser ? (
                                        <>
                                            <div className="user-detail">
                                                <span className="detail-label">{t('user.name')}:</span>
                                                <span className="detail-value">{currentUser.Nom || 'Non spécifié'}</span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="detail-label">{t('user.id')}:</span>
                                                <span className="detail-value">{currentUser.id || 'N/A'}</span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="detail-label">{t('user.role')}:</span>
                                                <span className="detail-value">{currentUser.role || 'Non spécifié'}</span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="detail-label">Chauffeur_ID:</span>
                                                <span className="detail-value">{currentUser.chauffeur_ID || 'N/A'}</span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="detail-label">Client_ID:</span>
                                                <span className="detail-value">{currentUser.client_ID || 'N/A'}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-user-message">
                                            {t('user.notConnected')}
                                        </div>
                                    )}
                                </div>
                            </div> */}

                            {/* Bouton d'export */}
                            <div className="export-actions">
                                <button 
                                    className="btn-export"
                                    onClick={handleExport}
                                    disabled={loading || !currentUser || courses.length === 0}
                                >
                                    <FaDownload className="btn-icon" />
                                    {loading ? t('exporting') : t('exportButton')}
                                    {courses.length > 0 && ` (${courses.length})`}
                                </button>
                                
                                {!currentUser && (
                                    <div className="export-message warning">
                                        <FaExclamationTriangle className="message-icon" />
                                        <span>{t('alerts.userNotConnected')}</span>
                                    </div>
                                )}
                                
                                {currentUser && courses.length === 0 && (
                                    <div className="export-message info">
                                        <FaExclamationTriangle className="message-icon" />
                                        <span>{t('alerts.noRidesForUser')}</span>
                                        <button 
                                            className="btn-retry"
                                            onClick={reloadCourses}
                                            disabled={loading}
                                        >
                                            {t('reloadButton')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Résumé de l'export */}
                        <div className="export-summary">
                            <h3>{t('summary.title')}</h3>
                            <div className="summary-content">
                                <div className="summary-item">
                                    <span className="summary-label">{t('summary.period')}</span>
                                    <span className="summary-value">
                                        {exportData.period === 'all' 
                                            ? t('summary.allPeriod')
                                            : `${exportData.startDate} ${t('period.to')} ${exportData.endDate}`
                                        }
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">{t('summary.format')}</span>
                                    <span className="summary-value">
                                        {exportData.fileType === 'csv' && t('format.csv')}
                                        {exportData.fileType === 'excel' && t('format.excel')}
                                        {exportData.fileType === 'pdf' && t('format.pdf')}
                                    </span>
                                </div>
                               <div className="summary-item">
                                    <span className="summary-label">{t('summary.availableRides')}</span>
                                    <span className="summary-value">
                                        {currentUser ? (
                                            <strong>{userCoursesCount}</strong>
                                        ) : (
                                            <span className="no-user-text">{t('summary.noUserConnected')}</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExportePage;