import { useTranslation } from "react-i18next";

const { t } = useTranslation();
export const GUIDE_STEPS = [
    {
        selector: '.rodin-geo-redo',
        content: t('GUIDE_REDO'),
    },
    {
        selector: '.rodin-geo-selector',
        content: t('GUIDE_SELECT_GEOMETRY'),
    }
]