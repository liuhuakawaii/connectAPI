import { atom } from 'recoil';

export const fileListAtom = atom({
    key: 'fileListAtom',
    default: new Set(),
});

export const fileMapAtom = atom({
    key: 'fileMapAtom',
    default: new Map(),
});

export const urlListAtom = atom({
    key: 'urlListAtom',
    default: [],
});

export const hashAtom = atom({
    key: 'hashAtom',
    default: '',
});

export const cardLoadingAtom = atom({
    key: 'cardLoadingAtom',
    default: false,
});

export const croppedImageAtom = atom({
    key: 'croppedImageAtom',
    default: '',
});

export const currentDBAtom = atom({
    key: 'currentDBAtom',
    default: 'sketchfab',
});

export const taskUUidAtom = atom({
    key: 'taskUUidAtom',
    default: '',
});
