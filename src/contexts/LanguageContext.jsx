import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext(null);

// อ่านค่าเริ่มต้นจาก localStorage (ค่าเริ่มต้น = TH)
function getInitialLang() {
  const saved = localStorage.getItem('lang');
  return saved === 'EN' || saved === 'TH' ? saved : 'TH';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === 'TH' ? 'EN' : 'TH'));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
