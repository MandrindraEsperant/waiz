// hooks/useCurrency.js
import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Taux de conversion approximatifs
const EXCHANGE_RATES = {
  MGA_TO_USD: 0.00022, // 1 MGA = 0.00022 USD
  USD_TO_MGA: 4500,    // 1 USD ≈ 4500 MGA
  MGA_TO_EUR: 0.00020  // 1 MGA = 0.00020 EUR
};

const CURRENCY_CONFIG = {
  fr: {
    code: 'MGA',
    symbol: 'Ar',
    locale: 'fr-FR',
    format: (amount) => {
      return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' Ar';
    }
  },
  en: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    format: (amount) => {
      // Convertir MGA en USD puis formater
      const amountInUSD = amount * EXCHANGE_RATES.MGA_TO_USD;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amountInUSD);
    }
  },
  mg: {
    code: 'MGA',
    symbol: 'Ar',
    locale: 'mg-MG',
    format: (amount) => {
      return new Intl.NumberFormat('mg-MG').format(Math.round(amount)) + ' Ar';
    }
  }
};

export const useCurrency = () => {
  const { language } = useLanguage();
  
  const config = CURRENCY_CONFIG[language] || CURRENCY_CONFIG.fr;

  const formatCurrency = useMemo(() => {
    return (amount) => {
      if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
      }
      return config.format(amount);
    };
  }, [language, config]);

  const convertCurrency = useMemo(() => {
    return (amount, targetCurrency = 'USD') => {
      if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
      }
      
      if (language === 'en') {
        // Si on est déjà en anglais, on retourne le montant tel quel
        return amount;
      }
      
      // Conversion de MGA vers USD
      if (targetCurrency === 'USD') {
        return amount * EXCHANGE_RATES.MGA_TO_USD;
      }
      
      return amount;
    };
  }, [language]);

  const getCurrencySymbol = () => {
    return config.symbol;
  };

  const getCurrencyCode = () => {
    return config.code;
  };

  const getExchangeRate = () => {
    return {
      MGA_TO_USD: EXCHANGE_RATES.MGA_TO_USD,
      USD_TO_MGA: EXCHANGE_RATES.USD_TO_MGA,
      formatted: `1 USD ≈ ${EXCHANGE_RATES.USD_TO_MGA.toLocaleString('fr-FR')} Ar`
    };
  };

  return {
    formatCurrency,
    convertCurrency,
    getCurrencySymbol,
    getCurrencyCode,
    getExchangeRate,
    language
  };
};