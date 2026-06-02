import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaExclamationTriangle, 
  FaCreditCard, 
  FaTimes, 
  FaSync, 
  FaCalendarTimes, 
  FaExclamationCircle 
} from 'react-icons/fa';
import './SubscriptionGuard.css';
import { checkSubscriptionEligibility } from '../../services/waizApi';

const SubscriptionGuard = ({ children }) => {
    const [isEligible, setIsEligible] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const checkEligibility = async () => {
        try {
            const status = await checkSubscriptionEligibility();
            setSubscriptionStatus(status);

            if (!status.hasActiveSubscription) {
                setShowBlockModal(true);
                setIsEligible(false);
            } else {
                setShowBlockModal(false);
                setIsEligible(true);
            }
        } catch (error) {
            console.error('Erreur vérification éligibilité:', error);
            // En cas d'erreur, on autorise l'accès (fallback)
            setIsEligible(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkEligibility();
        const interval = setInterval(checkEligibility, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleRenewSubscription = () => {
        navigate('/abonnement');
    };

    const handleTryAgain = () => {
        setIsLoading(true);
        checkEligibility();
    };

    if (isLoading) {
        return (
            <div className="subscription-loading">
                <div className="spinner"></div>
                <p>Vérification de votre abonnement...</p>
            </div>
        );
    }

    if (!isEligible) {
        return (
            <>
                {showBlockModal && (
                    <div className="subscription-block-modal">
                        <div className="block-modal-content">
                            <div className="block-modal-header">
                                <FaExclamationTriangle className="block-icon" />
                                <h2>Abonnement Requis</h2>
                            </div>
                            
                            <div className="block-modal-body">
                                {subscriptionStatus?.isExpired ? (
                                    <div className="expired-message">
                                        <FaCalendarTimes className="expired-icon" />
                                        <h3>Votre abonnement a expiré</h3>
                                        <p>Pour continuer à utiliser l'application, veuillez renouveler votre abonnement.</p>
                                    </div>
                                ) : subscriptionStatus?.hasUsedTrial ? (
                                    <div className="trial-used-message">
                                        <FaSync className="trial-icon" />
                                        <h3>Essai gratuit terminé</h3>
                                        <p>Vous avez déjà utilisé votre période d'essai gratuit. Pour continuer, souscrivez à un abonnement.</p>
                                    </div>
                                ) : (
                                    <div className="no-subscription-message">
                                        <FaCreditCard className="subscribe-icon" />
                                        <h3>Aucun abonnement actif</h3>
                                        <p>Un abonnement est requis pour accéder aux fonctionnalités de l'application.</p>
                                    </div>
                                )}

                                <div className="subscription-info">
                                    {subscriptionStatus?.currentPlan && (
                                        <div className="info-item">
                                            <span>Dernier plan:</span>
                                            <strong>{subscriptionStatus.currentPlan}</strong>
                                        </div>
                                    )}
                                    {subscriptionStatus?.expiryDate && (
                                        <div className="info-item">
                                            <span>Date d'expiration:</span>
                                            <strong>{new Date(subscriptionStatus.expiryDate).toLocaleDateString('fr-FR')}</strong>
                                        </div>
                                    )}
                                </div>

                                <div className="action-buttons">
                                    <button 
                                        className="btn-primary"
                                        onClick={handleRenewSubscription}
                                    >
                                        <FaCreditCard />
                                        Souscrire un abonnement
                                    </button>
                                    
                                    <button 
                                        className="btn-secondary"
                                        onClick={handleTryAgain}
                                    >
                                        <FaSync />
                                        Re-vérifier
                                    </button>
                                </div>

                                <div className="contact-support">
                                    <p>Besoin d'aide ? Contactez notre support :</p>
                                    <a href="mailto:support@waiz.com">support@waiz.com</a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="blocked-content">
                    <div className="blocked-overlay">
                        <div className="blocked-message">
                            <FaExclamationTriangle />
                            <h3>Accès restreint</h3>
                            <p>Veuillez souscrire à un abonnement pour accéder à cette fonctionnalité.</p>
                        </div>
                    </div>
                    {children}
                </div>
            </>
        );
    }

    return children;
};

export default SubscriptionGuard;