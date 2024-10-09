// tipsService.js
let globalTip = null;
let globalShowLogin = null;
let globalShowFeedBack = null;

export const setGlobalTip = (tip) => {
    globalTip = tip;
};

export const getGlobalTip = () => {
    return globalTip;
};

export const setGlobalShowLogin = (cb) => {
    globalShowLogin = cb;
};

export const getGlobalShowLogin = () => {
    return globalShowLogin
};

export const setGlobalShowFeedBack = (cb) => {
    globalShowFeedBack = cb;
};

export const getGlobalShowFeedBack = () => {
    return globalShowFeedBack
}