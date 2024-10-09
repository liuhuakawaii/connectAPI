import { atom } from 'recoil';

export const cardsTypeConst = {
    Recent: 'Recent',
    Featured: 'Featured',
    Mine: 'Mine',
    Search: 'Search',
    Group: 'Group'
};

export const cardsAtom = atom({
    default: [],
    key: 'cardsAtom',
});

export const cardsTypeAtom = atom({
    default: process.env.REACT_APP_DEFAULT_GALLERY_CARD ? process.env.REACT_APP_DEFAULT_GALLERY_CARD : cardsTypeConst.Featured,
    key: 'cardsTypeAtom',
});

export const searchKeyWordAtom = atom({
    default: '',
    key: 'searchKeyWordAtom',
});

export const rodinCardsTypeAtom = atom({
    default: 'Sketchfab',
    key: 'rodinCardsTypeAtom',
});

export const isImgto3dAtom = atom({
    key: 'isImgto3dAtom',
    default: false,
});

export const showCardsConAtom = atom({
    key: 'showCardsConAtom',
    default: false,
});

export const bodyOpacityTransitionAtom = atom({
    key: 'bodyOpacityTransitionAtom',
    default: false,
});

export const isEditorOpenAtom = atom({
    key: 'isEditorOpenAtom',
    default: false,
});

export const panoramaCardsTypeAtom = atom({
    key: 'panoramaCardsTypeAtom',
    default: 'Featured',
});

export const packingStateAtom = atom({
    key: 'packingStateAtom',
    default: 'Done',
});

export const progressCheckingQueueAtom = atom({
    key: 'progressCheckingQueueAtom',
    default: [],
});

export const progressStateQueueAtom = atom({
    key: 'progressStateQueueAtom',
    default: [],
});

export const showUploadModalAtom = atom({
    key: 'showUploadModalAtom',
    default: false,
});


export const showGoActBrand = atom({
    key: 'showGoActBrand',
    default: false,
});