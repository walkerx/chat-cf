import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useDocumentMeta() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = i18n.language;

    // Update title
    const title = t('app.title') + ' - ' + t('meta.description').substring(0, 30) + '...';
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('meta.description'));
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', t('meta.keywords'));
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', t('meta.description'));
    }

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      const locale = i18n.language === 'zh-CN' ? 'zh_CN' : 'en_US';
      ogLocale.setAttribute('content', locale);
    }

    // Update Twitter Card tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', t('meta.description'));
    }
  }, [t, i18n.language]);
}
