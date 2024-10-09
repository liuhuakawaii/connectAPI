import { atom } from 'recoil';

export const taskInitAtom = atom({
    key: 'taskInitAtom',
    default: false,
});

export const taskDetailAtom = atom({
    key: 'taskDetailAtom',
    default: false,
});

export const meshProfileAtom = atom({
    key: 'meshProfileAtom',
    default: false,
});

export const chatHistoryAtom = atom({
    key: 'chatHistoryAtom',
    default: {},
});

export const chatGuessAtom = atom({
    key: 'chatGuessAtom',
    default: [],
});

export const promptAtom = atom({
    key: 'promptAtom',
    default: false,
});

export const stopChatAtom = atom({
    key: 'stopChatAtom',
    default: false,
});

export const assistantChatStatusAtom = atom({
    key: 'assistantChatStatusAtom',
    default: '',
});
export const chatImageURLAtom = atom({
    key: 'chatImageURLAtom',
    default: '',
});
export const posterGenerateAtom = atom({
    key: 'posterGenerateAtom',
    default: false,
});
export const guessChatStatusAtom = atom({
    key: 'guessChatStatusAtom',
    default: '',
});

export const chatTextAtom = atom({
    key: 'chatTextAtom',
    default: '',
});

export const chatLangAtom = atom({
    key: 'chatLangAtom',
    default: 'English',
});

export const needStartWsAtom = atom({
    key: 'needStartWsAtom',
    default: false,
});

export const showDownloadAtom = atom({
    key: 'showDownloadAtom',
    default: false,
});
export const showSharePopupAtom = atom({
    default: false,
    key: 'showSharePopupAtom',
});

export const setGenerateAtom = atom({
    default: false,
    key: 'setGenerateAtom',
});

export const lastGenerateUUIDAtom = atom({
    default: false,
    key: 'lastGenerateUUIDAtom',
});

export const showProgressAtom = atom({
    key: 'showProgressAtom',
    default: false,
});

export const downloadProgressAtom = atom({
    key: 'downloadProgressAtom',
    default: new Map(),
});

export const publishColorInfoAtom = atom({
    key: 'publishColorInfoAtom',
    default: false,
});

export const isOpenImg3dGenerateAtom = atom({
    key: 'isOpenImg3dGenerateAtom',
    default: false,
});

export const viewSelectionDataAtom = atom({
    key: 'viewSelectionDataAtom',
    default: {
        imgUrlsArr: [],
        prompt: []
    },
});

export const showPayCardAtom = atom({
    key: 'showPayCardAtom',
    default: false,
});

export const currentPreviewIndexAtom = atom({
    key: 'currentPreviewIndexAtom',
    default: 0,
});

export const cameraParamsAtom = atom({
    key: 'cameraParamsAtom',
    default: false,
});

export const showThreePalaceGridAtom = atom({
    key: 'showThreePalaceGridAtom',
    default: true,
});

export const showRegenerateAtom = atom({
    key: 'showRegenerateAtom',
    default: false,
});

export const showPanoramaBordAtom = atom({
    key: 'showPanoramaBordAtom',
    default: false,
});

export const clickHideAtom = atom({
    key: 'clickHideAtom',
    default: false,
});

export const cardsProgressStateAtom = atom({
    key: 'cardsProgressStateAtom',
    default: [],
});

export const canStartWsAtom = atom({
    key: 'canStartWsAtom',
    default: true,
});

export const prohibitAtom = atom({
    key: 'prohibitAtom',
    default: false,
});

export const regenePrivateSetAtom = atom({
    key: 'regenePrivateSetAtom',
    default: {
        oldPrivate: '',
        currentPrivate: '',
        privatedChange: '',
    },
});

export const isPurchasedAtom = atom({
    key: 'isPurchasedAtom',
    default: null,
});

export const packInfoAtom = atom({
    key: 'packInfoAtom',
    default: {
        details: {},
        isPaid: null,
        isPackFinished: false
    },
});

export const lastGenerateInfoAtom = atom({
    key: 'lastGenerateInfoAtom',
    default: {
        privateType: "",  //group
        privateStatus: false,
        licenseStatus: false,
    },
});

export const stylizedStrAtom = atom({
    key: 'stylizedStrAtom',
    default: "",
});

export const recommendCardsAtom = atom({
    key: 'recommendCardsAtom',
    default: [],
});

export const descriptionAtom = atom({
    key: 'descriptionAtom',
    default: "",
});

export const promptKeyWordsAtom = atom({
    key: 'promptKeyWordsAtom',
    default: "",
});







