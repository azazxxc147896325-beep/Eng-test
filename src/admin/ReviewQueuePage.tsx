import { useTranslation } from 'react-i18next'
export function ReviewQueuePage() { const { t } = useTranslation(); return <main className="admin-page"><h1>{t('admin.reviewQueue')}</h1><p>{t('admin.emptyQueue')}</p></main> }
