import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${i18n.language === 'zh-CN' ? 'active' : ''}`}
        onClick={() => changeLanguage('zh-CN')}
        title="切换到中文"
      >
        中文
      </button>
      <button
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="Switch to English"
      >
        English
      </button>
    </div>
  );
}
