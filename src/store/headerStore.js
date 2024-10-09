import { atom } from 'recoil';

export const logInfoAtom = atom({
    key: 'logInfoAtom',
    default: false,
});

export const showLoginAtom = atom({
    key: 'showLoginAtom',
    default: false,
});

export const initialLoginStageAtom = atom({
    key: 'initialLoginStageAtom',
    default: '',
});

export const showHistoryAtom = atom({
    key: 'showHistoryAtom',
    default: false,
});

export const openPaymentInfoAtom = atom({
    key: 'openPaymentInfoAtom',
    default: {
        balance: "",
        state: false,  //open close payment 
        group: false,
        type: 'Personal', // `Personal` : 'Group'
        payMethod: 'Stripe', //Alipay  Stripe  Code
        step: 1,// 1-home , 2-balance , 3-confirm , 4-success , 5-coderedeem 
        payMap: {
            "Alipay": 'CNY',
            "Stripe": 'USD'
        },
        exchangeRateMap: {
            "Alipay": '1 credit = 10 CNY',
            "Stripe": '1 credit = 1.5 USD'
        }
    },
});

export const rodinUploadedImages = atom({
    key: 'rodinUploadedImages',
    default: [],
});



