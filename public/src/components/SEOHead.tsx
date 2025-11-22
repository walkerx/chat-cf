import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export function SEOHead() {
    const { t, i18n } = useTranslation();

    return (
        <Helmet>
            <html lang={i18n.language} />
            <title>{t('app.title')}</title>
            <meta name="description" content={t('meta.description')} />
            <meta name="keywords" content={t('meta.keywords')} />

            {/* Open Graph */}
            <meta property="og:title" content={t('app.title')} />
            <meta property="og:description" content={t('meta.description')} />
            <meta property="og:locale" content={i18n.language === 'zh-CN' ? 'zh_CN' : 'en_US'} />

            {/* Twitter */}
            <meta name="twitter:title" content={t('app.title')} />
            <meta name="twitter:description" content={t('meta.description')} />
        </Helmet>
    );
}
