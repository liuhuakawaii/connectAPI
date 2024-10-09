import { atom } from 'recoil';

// 开启模态框，可以传参，可以组合打开chat，generate，detail，img3d等
export const modalObjAtom = atom({
    key: 'modalObjAtom',
    default: {
        type: 'generate',//'generate' 'DreamFace' "ImagineFace" Rodin
        taskUUid: '',
        state: false,
        visited: false,
        RODIN_STATUS: {}
    },
});

export const userPermissionAtom = atom({
    key: 'userPermissionAtom',
    default: {
        rodin_access: true,
        panorama_access: false,
        omnicraft_access: true,
        chatavatar_text_access: true,
        chatavatar_image_access: true,
        chatavatar_tab_group: false,
        chatavatar_allowed_style: false,
        chatavatar_allowed_topology: false,
        chatavatar_allowed_additional_process: false,
        chatavatar_additional_settings: false,
        chatavatar_menu_Mine: false,
        chatavatar_menu_Recent: false,
        subscribe: false,
        privateQuantity: 10
    },
});

export const isFeedbackModalOpenAtom = atom({
    key: 'isFeedbackModalOpenAtom',
    default: false
})

export const tipsAtom = atom({
    key: 'tipsAtom',
    default: [],
});

export const groupInfoAtom = atom({
    key: 'groupInfoAtom',
    default: false,
});

export const showStorageWrapperAtom = atom({
    key: 'showStorageWrapperAtom',
    default: false
})

export const currentNavAtom = atom({
    key: 'currentNavAtom',
    default: 'Rodin'
})

export const qrCodeUrlAtom = atom({
    key: 'qrCodeUrlAtom',
    default: ''
})

export const genMeInfoAtom = atom({
    key: 'genMeInfoAtom',
    default: {
        switch: false,
        state: "Created", // Created Generating Waiting  Canceled  Done 
        progress: 0
    }
})

export const showSubscribeAtom = atom({
    key: 'showSubscribeAtom',
    default: false
})

export const showSubscribeTimesAtom = atom({
    key: 'showSubscribeTimesAtom',
    default: 'yearly'
})

export const showThreeModelAtom = atom({
    key: 'showThreeModelAtom',
    default: false
})

export const chatWsInfoAtom = atom({
    key: 'chatWsInfoAtom',
    default: {
        run: false,
        subscription: "",
        task_uuid: "",
        lang: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone === 'Asia/Shanghai'
            ? 'Chinese'
            : 'English', //Chinese  English
        assistStatus: '',
        guessStatus: '',
        error: "",
    }
})

export const chatHistoryArrAtom = atom({
    key: 'chatHistoryArrAtom',
    default: []
})

export const groupWalletAtom = atom({
    key: 'groupWalletAtom',
    default: false
})

export const walletAtom = atom({
    key: 'walletAtom',
    default: false
})

export const showGenerateAreaAtom = atom({
    key: 'showGenerateAreaAtom',
    default: {
        state: false,
        type: 'text',  //text  image
        regenerate: false
    }
})

export const generatePrivateAtom = atom({
    key: 'generatePrivateAtom',
    default: false
})

export const generateLicenseAtom = atom({
    key: 'generateLicenseAtom',
    default: false
})



export const reGenerateInfoAtom = atom({
    key: 'reGenerateInfoAtom',
    default: {
        prompt: false,
        allprompt: [],
        style: false
    }
})

export const subscriptionsInfoAtom = atom({
    key: 'subscriptionsInfoAtom',
    default: {
        plan_level: null,
        plan_price: 30,
        wallet_balance: 0
    }
})

export const subscriptionsPreInfoAtom = atom({
    key: 'subscriptionsPreInfoAtom',
    default: []
})

export const checkboxStatesAtom = atom({
    key: 'checkboxStatesAtom',
    default: [
        {
            name: 'Keep Head Size',
            state: false,
            key: "constrain_skull_distance"
        },
        {
            name: 'Optimize Jawline',
            state: true,
            key: "jawline"
        },
        {
            name: 'Remove Specular',
            state: true,
            key: "remove_shadow"
        },
        {
            name: "Disable Local Deformation",
            state: false,
            key: "disable_local_pca"
        },
        {
            name: "Neutral Expression Only",
            state: false,
            key: "disable_exp_bs"
        },
        {
            name: "Neutral Close Mouth",
            state: true,
            key: "neutral_close_mouth"
        }
    ]
})

export const currentColorIndexAtom = atom({
    key: 'currentColorIndexAtom',
    default: 0
})

export const currentStyleIndexAtom = atom({
    key: 'currentStyleIndexAtom',
    default: 0
})

export const currencyAtom = atom({
    key: 'currencyAtom',
    default: 'CREDITS'
})

export const showFocusWrapperAtom = atom({
    key: 'showFocusWrapperAtom',
    default: false
})

export const checkbackAtom = atom({
    key: 'checkbackAtom',
    default: false
})

export const currentCameraIndexAtom = atom({
    key: 'currentCameraIndexAtom',
    default: 1
})

export const loadRenderImgAtom = atom({
    key: 'loadRenderImgAtom',
    default: false
})

export const showImgLoadAtom = atom({
    key: 'showImgLoadAtom',
    default: []
})

export const colorArrAtom = atom({
    key: 'colorArrAtom',
    default: ['#4737FF', '#FF9737', '#D7FF37', '#3787FF', '#9B37FF', '#FFD337', '#FF3797']
})

export const showImgUrlsArrAtom = atom({
    key: 'showImgUrlsArrAtom',
    default: []
})

export const repointerArrAtom = atom({
    key: 'repointerArrAtom',
    default: []
})

export const isSmallScreenAtom = atom({
    key: 'isSmallScreenAtom',
    default: false
})

export const packToMineAtom = atom({
    key: 'packToMineAtom',
    default: false
})

export const currentLengthAtom = atom({
    key: 'currentLengthAtom',
    default: 5
})

export const processedPrompt = atom({
    key: 'processedPrompt',
    default: []
})

export const showReferralAtom = atom({
    key: 'showReferralAtom',
    default: false
})

export const showApiDashboardAtom = atom({
    key: 'showApiDashboardAtom',
    default: false
})

export const balanceAtom = atom({
    key: 'balanceAtom',
    default: { selfBalance: 0, groupBalance: 0 } //balance.selfBalance   balance.groupBalance
})

export const rodinRenderAtom = atom({
    key: 'rodinRenderAtom',
    default: null
})
