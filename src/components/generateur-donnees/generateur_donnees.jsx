import React, { useState, useEffect } from 'react';
import { 
    FaCalendarAlt, 
    FaStickyNote, 
    FaPlus, 
    FaTrash, 
    FaEdit,
    FaSave,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaBell
} from 'react-icons/fa';
import './generateur_donnees.css';
import MenuApp from '../Menu';
import { useLanguage } from '../../contexts/LanguageContext';

// Import des traductions
import fr from '../../locales/generateur-donnees/fr.json';
import en from '../../locales/generateur-donnees/en.json';
import mg from '../../locales/generateur-donnees/mg.json';

const locales = {
  fr: fr,
  mg: mg,
  en: en
};

// Clé unique pour le localStorage
const STORAGE_KEY = 'generateur_donnees_notes';

const Generateur_donnees = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState(null);
    const [editText, setEditText] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    // Utilisation du contexte de langue
    const { language } = useLanguage();
    const t = (key) => {
        const keys = key.split('.');
        let value = locales[language]?.generateur;
        
        for (const k of keys) {
            value = value?.[k];
        }
        
        return value || locales.fr.generateur[keys[keys.length - 1]] || key;
    };

    // Months array basé sur la langue
    const months = t('calendar.months');

    // Years array (last 5 years and next 5 years)
    const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

    // Load notes from localStorage on component mount - UNE SEULE FOIS
    useEffect(() => {
        const loadNotes = () => {
            try {
                const savedNotes = localStorage.getItem(STORAGE_KEY);
                console.log('🔍 Chargement des notes depuis localStorage:', savedNotes);
                
                if (savedNotes) {
                    const parsedNotes = JSON.parse(savedNotes);
                    // Validation des données chargées
                    if (Array.isArray(parsedNotes)) {
                        setNotes(parsedNotes);
                        console.log(`✅ ${parsedNotes.length} notes chargées avec succès`);
                        
                        // Calculer les événements à venir
                        calculateUpcomingEvents(parsedNotes);
                    } else {
                        console.warn('⚠️ Les données sauvegardées ne sont pas un tableau, initialisation avec tableau vide');
                        setNotes([]);
                        setUpcomingEvents([]);
                    }
                } else {
                    console.log('ℹ️ Aucune note sauvegardée trouvée, initialisation avec tableau vide');
                    setNotes([]);
                    setUpcomingEvents([]);
                }
            } catch (error) {
                console.error('❌ Erreur lors du chargement des notes:', error);
                setNotes([]);
                setUpcomingEvents([]);
            } finally {
                setIsInitialized(true);
            }
        };

        if (!isInitialized) {
            loadNotes();
        }
    }, [isInitialized]);

    // Calculer les événements à venir pour les notifications
    const calculateUpcomingEvents = (notesList) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = notesList
            .map(note => {
                const eventDate = new Date(note.date);
                eventDate.setHours(0, 0, 0, 0);
                const timeDiff = eventDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                
                return {
                    ...note,
                    daysDiff: daysDiff
                };
            })
            .filter(note => note.daysDiff >= 0 && note.daysDiff <= 7) // Événements dans les 7 prochains jours
            .sort((a, b) => a.daysDiff - b.daysDiff);
        
        setUpcomingEvents(upcoming);
        console.log('📅 Événements à venir calculés:', upcoming);
    };

    // Save notes to localStorage whenever notes change
    useEffect(() => {
        const saveNotes = () => {
            try {
                console.log('💾 Sauvegarde des notes:', notes);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
                console.log('✅ Notes sauvegardées avec succès');
                
                // Recalculer les événements à venir après sauvegarde
                calculateUpcomingEvents(notes);
                
                // Déclencher un événement de stockage pour notifier le Header
                window.dispatchEvent(new Event('storage'));
            } catch (error) {
                console.error('❌ Erreur lors de la sauvegarde des notes:', error);
            }
        };

        // Sauvegarder seulement si les notes ont changé ET le composant est initialisé
        if (isInitialized) {
            saveNotes();
        }
    }, [notes, isInitialized]);

    // Generate calendar data
    const generateCalendar = () => {
        const year = selectedYear;
        const month = selectedMonth;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const calendar = [];
        let dayCounter = 1;

        // Generate weeks
        for (let week = 0; week < 6; week++) {
            const weekDays = [];
            
            // Generate days for each week
            for (let day = 0; day < 7; day++) {
                if ((week === 0 && day < startingDay) || dayCounter > daysInMonth) {
                    weekDays.push(null);
                } else {
                    const date = new Date(year, month, dayCounter);
                    const dateString = date.toISOString().split('T')[0];
                    const dayNotes = notes.filter(note => note.date === dateString);
                    
                    weekDays.push({
                        date: date,
                        dateString: dateString,
                        day: dayCounter,
                        hasNotes: dayNotes.length > 0,
                        notesCount: dayNotes.length,
                        isToday: date.toDateString() === new Date().toDateString(),
                        isSelected: selectedDate && selectedDate.toDateString() === date.toDateString()
                    });
                    dayCounter++;
                }
            }
            
            if (weekDays.some(day => day !== null)) {
                calendar.push(weekDays);
            }
        }

        return calendar;
    };

    // Handle month/year change
    const handleMonthChange = (e) => {
        setSelectedMonth(parseInt(e.target.value));
        setCurrentDate(new Date(selectedYear, parseInt(e.target.value), 1));
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
        setCurrentDate(new Date(parseInt(e.target.value), selectedMonth, 1));
    };

    // Menu
    const handleMenuToggle = (isOpen) => {
        setIsMenuOpen(isOpen);
    };

    // Navigation
    const goToPreviousMonth = () => {
        setSelectedMonth(prev => {
            const newMonth = prev === 0 ? 11 : prev - 1;
            const newYear = prev === 0 ? selectedYear - 1 : selectedYear;
            setSelectedYear(newYear);
            setCurrentDate(new Date(newYear, newMonth, 1));
            return newMonth;
        });
    };

    const goToNextMonth = () => {
        setSelectedMonth(prev => {
            const newMonth = prev === 11 ? 0 : prev + 1;
            const newYear = prev === 11 ? selectedYear + 1 : selectedYear;
            setSelectedYear(newYear);
            setCurrentDate(new Date(newYear, newMonth, 1));
            return newMonth;
        });
    };

    // Note handlers
    const handleAddNote = () => {
        if (newNote.trim() && selectedDate) {
            const note = {
                id: Date.now() + Math.random(),
                date: selectedDate.toISOString().split('T')[0],
                text: newNote.trim(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setNotes(prev => {
                const newNotes = [...prev, note];
                console.log('📝 Nouvelle note ajoutée:', note);
                return newNotes;
            });
            setNewNote('');
        }
    };

    const handleEditNote = (note) => {
        setEditingNote(note.id);
        setEditText(note.text);
    };

    const handleSaveEdit = () => {
        if (editText.trim()) {
            setNotes(prev => {
                const updatedNotes = prev.map(note =>
                    note.id === editingNote 
                        ? { ...note, text: editText.trim(), updatedAt: new Date().toISOString() }
                        : note
                );
                return updatedNotes;
            });
            setEditingNote(null);
            setEditText('');
        }
    };

    const handleCancelEdit = () => {
        setEditingNote(null);
        setEditText('');
    };

    const handleDeleteNote = (noteId) => {
        console.log('🗑️ Suppression de la note:', noteId);
        setNotes(prev => {
            const filteredNotes = prev.filter(note => note.id !== noteId);
            console.log('📋 Notes après suppression:', filteredNotes);
            return filteredNotes;
        });
    };

    // Clear all notes (fonction utilitaire pour debug)
    const clearAllNotes = () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les notes ? Cette action est irréversible.')) {
            setNotes([]);
            localStorage.removeItem(STORAGE_KEY);
            console.log('🧹 Toutes les notes ont été supprimées');
            setUpcomingEvents([]);
        }
    };

    const getNotesForSelectedDate = () => {
        if (!selectedDate) return [];
        const dateString = selectedDate.toISOString().split('T')[0];
        return notes.filter(note => note.date === dateString);
    };

    // Formater la date selon la langue
    const formatDate = (date) => {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 
                                     language === 'mg' ? 'mg-MG' : 'en-US', options);
    };

    // Formater le texte des événements à venir
    const getEventTimeText = (daysDiff) => {
        if (daysDiff === 0) return t('events.today');
        if (daysDiff === 1) return t('events.tomorrow');
        return `${t('events.days')} ${daysDiff}`;
    };

    const calendar = generateCalendar();
    const selectedDateNotes = getNotesForSelectedDate();
    const totalNotes = notes.length;

    // Afficher un indicateur de chargement pendant l'initialisation
    if (!isInitialized) {
        return (
            <div className="data-generator">
                <MenuApp onToggle={handleMenuToggle} />
                <div className={`generator-container ${!isMenuOpen ? 'menu-collapsed' : ''}`}>
                    <div className="loading-container">
                        <div className="loading-spinner-large"></div>
                        <p>{t('loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="data-generator">
            <MenuApp onToggle={handleMenuToggle} />
            <div className={`generator-container ${!isMenuOpen ? 'menu-collapsed' : ''}`}>
                {/* Header Section */}
                <div className="generator-header">
                    <div className="header-title-section">
                        <h1>
                            <FaCalendarAlt className="header-icon" />
                            {t('title')}
                        </h1>
                        <p>{t('subtitle')}</p>
                    </div>

                    {/* Notifications des événements à venir */}
                    {upcomingEvents.length > 0 && (
                        <div className="upcoming-events-alert">
                            <FaBell className="alert-icon" style={{color:'#f3f5f7ff'}}/>
                            <span className="alert-text">
                                {upcomingEvents.length} {t('upcomingEvents')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Stats Section */}
                <div className="stats-section" style={{marginTop:'20px'}}>
                    <div className="stat-card">
                        <div className="stat-number" style={{fontSize:'40px', fontWeight:'bold'}}>{totalNotes}</div>
                        <div className="stat-label">{t('stats.totalNotes')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number" style={{fontSize:'40px', fontWeight:'bold'}}>
                            {notes.filter(note => {
                                const noteDate = new Date(note.date);
                                const today = new Date();
                                return noteDate.toDateString() === today.toDateString();
                            }).length}
                        </div>
                        <div className="stat-label">{t('stats.todayNotes')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number" style={{fontSize:'40px', fontWeight:'bold'}}>
                            {upcomingEvents.length}
                        </div>
                        <div className="stat-label">{t('stats.weekEvents')}</div>
                    </div>
                </div>

                {/* Section Événements à venir */}
                {upcomingEvents.length > 0 && (
                    <div className="upcoming-events-section">
                        <div className="section-header">
                            <h3>
                                <FaBell className="section-icon"/>
                                {t('events.upcoming')}
                            </h3>
                        </div>
                        <div className="upcoming-events-list">
                            {upcomingEvents.map(event => (
                                <div key={event.id} className="upcoming-event-item">
                                    <div className="event-date-badge">
                                        {getEventTimeText(event.daysDiff)}
                                    </div>
                                    <div className="event-content">
                                        <div className="event-text">{event.text}</div>
                                        <div className="event-meta">
                                            {formatDate(new Date(event.date))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="generator-content">
                    {/* Calendar Section */}
                    <div className="calendar-section">
                        <div className="section-header">
                            <h2>{t('calendar.title')}</h2>
                            <div className="calendar-controls">
                                <div className="month-navigation">
                                    <button className="nav-btn" onClick={goToPreviousMonth}>
                                        <FaChevronLeft />
                                    </button>
                                    
                                    <div className="date-selectors">
                                        <select 
                                            value={selectedMonth} 
                                            onChange={handleMonthChange}
                                            className="month-select"
                                        >
                                            {months.map((month, index) => (
                                                <option key={month} value={index}>
                                                    {month}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        <select 
                                            value={selectedYear} 
                                            onChange={handleYearChange}
                                            className="year-select"
                                        >
                                            {years.map(year => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <button className="nav-btn" onClick={goToNextMonth}>
                                        <FaChevronRight />
                                    </button>
                                </div>
                                
                                <button 
                                    className="today-btn"
                                    onClick={() => {
                                        const today = new Date();
                                        setSelectedMonth(today.getMonth());
                                        setSelectedYear(today.getFullYear());
                                        setCurrentDate(today);
                                        setSelectedDate(today);
                                    }}
                                >
                                    {t('calendar.today')}
                                </button>
                            </div>
                        </div>

                        <div className="calendar">
                            <div className="calendar-header">
                                {t('calendar.days').map(day => (
                                    <div key={day} className="week-day">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="calendar-body">
                                {calendar.map((week, weekIndex) => (
                                    <div key={weekIndex} className="calendar-week">
                                        {week.map((day, dayIndex) => (
                                            <div
                                                key={dayIndex}
                                                className={`calendar-day ${
                                                    day ? 
                                                    `${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''} ${day.hasNotes ? 'has-notes' : ''}` 
                                                    : 'empty'
                                                }`}
                                                onClick={() => day && setSelectedDate(day.date)}
                                            >
                                                {day && (
                                                    <>
                                                        <span className="day-number">{day.day}</span>
                                                        {day.hasNotes && (
                                                            <div className="notes-indicator">
                                                                <FaStickyNote />
                                                                <span className="notes-count">{day.notesCount}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="notes-section">
                        <div className="section-header">
                            <h2 style={{fontSize:'25px', fontWeight:'bold'}}>
                                <FaStickyNote />
                                {t('notes.title')} {selectedDate ? formatDate(selectedDate) : t('notes.selectDate')}
                            </h2>
                            {selectedDateNotes.length > 0 && (
                                <div className="notes-count-badge">
                                    {selectedDateNotes.length} {t('notes.notesCount')}
                                </div>
                            )}
                        </div>

                        {selectedDate ? (
                            <div className="notes-content">
                                <div className="add-note-form">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder={t('notes.addPlaceholder')}
                                        className="note-input"
                                        rows="3"
                                    />
                                    <button 
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim()}
                                        className="add-note-btn"
                                    >
                                        <FaPlus />
                                        {t('notes.addButton')}
                                    </button>
                                </div>

                                <div className="notes-list">
                                    {selectedDateNotes.length === 0 ? (
                                        <div className="no-notes">
                                            <FaStickyNote />
                                            <p>{t('notes.noNotes')}</p>
                                            <small>{t('notes.firstNote')}</small>
                                        </div>
                                    ) : (
                                        selectedDateNotes.map(note => (
                                            <div key={note.id} className="note-item">
                                                {editingNote === note.id ? (
                                                    <div className="note-edit">
                                                        <textarea
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="edit-input"
                                                            rows="3"
                                                        />
                                                        <div className="edit-actions">
                                                            <button 
                                                                onClick={handleSaveEdit}
                                                                className="save-btn"
                                                            >
                                                                <FaSave /> {t('notes.save')}
                                                            </button>
                                                            <button 
                                                                onClick={handleCancelEdit}
                                                                className="cancel-btn"
                                                            >
                                                                <FaTimes /> {t('notes.cancel')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="note-content">
                                                            <div className="note-text">
                                                                {note.text}
                                                            </div>
                                                            <div className="note-meta">
                                                                <span className="note-date">
                                                                    {t('notes.created')} {new Date(note.createdAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'mg' ? 'mg-MG' : 'en-US')}
                                                                </span>
                                                                {note.updatedAt !== note.createdAt && (
                                                                    <span className="note-updated">
                                                                        • {t('notes.modified')} {new Date(note.updatedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'mg' ? 'mg-MG' : 'en-US')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="note-actions">
                                                            <button 
                                                                onClick={() => handleEditNote(note)}
                                                                className="edit-btn"
                                                                title={t('notes.edit')}
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteNote(note.id)}
                                                                className="delete-btn"
                                                                title={t('notes.delete')}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="no-date-selected">
                                <FaCalendarAlt />
                                <p>{t('notes.selectDate')}</p>
                                <small>{t('notes.clickToStart')}</small>
                            </div>
                        )}
                    </div>
                </div>

                {/* Debug buttons */}
                <div className="debug-buttons">
                    <button 
                        onClick={clearAllNotes}
                        className="clear-notes-btn"
                        title={`Debug: ${t('clearAll')}`}
                    >
                        🧹 {t('clearAll')}
                    </button>
                </div>

                {/* Footer */}
                <div className="generator-footer">
                    <div className="total-count">
                        ✅ {totalNotes} {t('saved')}
                        {upcomingEvents.length > 0 && ` • ${upcomingEvents.length} ${t('upcomingEvents')}`}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Generateur_donnees;