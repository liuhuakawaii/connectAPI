import { atom } from 'recoil';

export const walletInfoAtom = atom({
    key: 'walletInfoAtom',
    default: {
        type: 'Group',
        uuid: '',
        confirm: false
    },
});

export const showWalletAtom = atom({
    key: 'showWalletAtom',
    default: {
        open: false,
        type: ''
    }
});

export const iframeAtom = atom({
    key: 'iframeAtom',
    default: {
        type: false,
        src: false,
    },
});

export const textGenerateAtom = atom({
    key: 'textGenerateAtom',
    default: false,
});

export const openRecommendPreviewAtom = atom({
    key: 'openRecommendPreviewAtom',
    default: {
        type: 'DreamFace',// 'DreamFace' "ImagineFace" 
        state: false,
    },
});

export const haveSearchTabAtom = atom({
    key: 'haveSearchTabAtom',
    default: false,
});