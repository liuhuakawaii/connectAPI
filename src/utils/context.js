import { createContext } from 'react';

export const CardClickContext = createContext(() => {
})

export const ModalClickContext = createContext(() => {
});

export const CardDataContext = createContext(() => {
})

export const MobileCardClickContext = createContext(() => {
})

const defaultBehaviour = {
    isAllowedTo: () => false
};

export const PermissionContext = createContext(defaultBehaviour);