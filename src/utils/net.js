import axios from 'axios';
import { io } from 'socket.io-client';
import { getGlobalShowFeedBack, getGlobalShowLogin, getGlobalTip } from './tipsService';
import * as Sentry from "@sentry/react";
import { fileToBase64, isNumber } from './format';
import ReactGA from 'react-ga4';

const isMock = false;
const suffix = isMock ? '.json' : '';
const isImageRequest = (url) => /\.(jpe?g|png|gif|bmp)$/i.test(url);

const getEndpoint = (module) => {
    // const internalURL = 'http://10.219.33.10:3005/api';
    const internalURL = 'https://hyperhuman-backend.dev.deemos.com/api';
    // const internalURL = 'https://hyperhuman.deemos.com/api';
    const productionURL = 'https://hyperhuman.deemos.com/api';
    const rodinURL = 'https://hyperhuman.deemos.com';
    const overwriteURL = localStorage.getItem('backendURL');

    if (module === 'rodin') {
        if (process.env.REACT_APP_ONEAPI_URL) {
            return process.env.REACT_APP_ONEAPI_URL;
        }
        return rodinURL;
    }

    if (module === 'rodin-image-preprocess') {
        if (process.env.REACT_APP_ONEAPI_URL) {
            return process.env.REACT_APP_ONEAPI_URL + "/api";
        }
    }

    if (module === 'rodin-image-gen') {
        if (process.env.REACT_APP_ONEAPI_URL) {
            return process.env.REACT_APP_ONEAPI_URL + "/api";
        } else {
            return productionURL;
        }
    }



    if (process.env.REACT_APP_BACKEND_URL) {
        return process.env.REACT_APP_BACKEND_URL;
    }

    if (overwriteURL) {
        return overwriteURL;
    }

    switch (process.env.REACT_APP_ENV || process.env.NODE_ENV) {
        case 'dev':
            return internalURL;
        case 'preview':
        case 'production':
            return productionURL;
        default:
            return internalURL;
    }
};

const BASE_URL = getEndpoint();
const RODIN_URL = getEndpoint('rodin');
const RODIN_IMAGE_PREPROCESS_URL = getEndpoint('rodin-image-preprocess');
const RODIN_IMAGE_GEN_URL = getEndpoint('rodin-image-gen');

let axiosClient = axios.create();

if (localStorage.getItem('token')) {
    axiosClient = axios.create({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });
}

const exponentialBackoff = async (fn) => {
    const retries = 10;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            Sentry.captureException(error)
            if (i === retries - 1) {
                throw error;
            }
            const delay = 2 ** i * 3000;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

const exponentialBackoffForFile = async (fn) => {
    const retries = 10;
    for (let i = 0; i < retries; i++) {
        const response = await fn();
        const fileNotFound = response.data?.url === 'FILE_NOT_FOUND';

        if (!fileNotFound || i === retries - 1) {
            return response;
        }

        const delay = 2 ** i * 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const tip = getGlobalTip();

    tip({
        type: 'error',
        presetText: 'ERROR',
        content: 'FILE_NOT_FOUND',
    });

};

export const getAxiosClient = () => axiosClient();

const parseError = (error, actionEnum) => {

    const errorEnum = {
        // OK: "Permission has been denied for this operation.",
        NO_SUCH_GROUP: "Group not found",
        NO_SUCH_USER: "The username of email not found. Plase try again.",
        NO_SUCH_TASK: "The specified task does not exist.",
        USER_NOT_FOUND: "Please login to proceed.",
        GROUP_NOT_FOUND: "The group was not found. Check the availability of your group. Contact us for more information.",
        INVALID_REQUEST: "The request is invalid. Send feedback to us!", // automaticallt jump to feedback page.
        PERMISSION_DENIED: "You do not have permission to perform this operation.",
        INSUFFICIENT_BALANCE: "Insufficient balance. Please top up your account.", // jump to to charge page.
        TASK_INCOMPLETE: "The task is incomplete. Please wait a while.",
        SUBSCRIPTION_REQUIRED: "A subscription is required to access this feature.",
        USER_NOT_IN_GROUP: "The user is not a member of the specified group. Contact your group administrator to get more information.",
        CODE_NOT_EXIST: "The provided code does not exist or has been used.",
        GROUP_EXPIRED: "The group has expired. Plase contact your group administrator for more information.",
        ALREADY_LOGGEDIN: "The user is already logged in.", // do not set banner, jump to normal page.
        WRONG_PASSWORD: "The password entered is incorrect. Please try again.",
        USER_FORBIDDEN: "The user is forbidden from performing this operation.",
        EXTERNAL_AUTH_FAILED: "External authentication failed.", //jump to feedback page.
        EXTERNAL_ALREADY_BINDED: "The external account is already bound to another account. Please login.", // Jump to login page.
        USER_ALREADY_REDEEMED_PUBLIC_CODE: "The user has already redeemed the public code.",
        INVALID_EMAIL_VERIFICATION_CODE: "The email verification code is invalid. Please try again.",
        DUPLICATE_EMAIL: "The email address is already in use. Please login.", // Jump to login page.
        WRONG_OLD_PASSWORD: "The old password entered is not correct. Please try again.",
        FAILED_TO_SEND: "Sorry, we can't send email to you. Please send feedback to us.", // Jump to feedback page.
        RATE_LIMITED: "You've reached the rate limit. Please check your spam mailbox or try again later." // add 60s countdown to guide user.
    }

    if (errorEnum[error]) {
        if (['EXTERNAL_ALREADY_BINDED', 'DUPLICATE_EMAIL'].includes(error)) {
            actionEnum.login(true)
        }
        if (['INVALID_REQUEST', 'EXTERNAL_AUTH_FAILED', 'FAILED_TO_SEND'].includes(error)) {
            actionEnum.feedBack(true)
        }
        return errorEnum[error];
    } else {
        return 'Unknown Error';
    }
}

const handleLogout = async () => {
    _czc.push(['_trackEvent', 'Pop Up', 'Logout Icon', 'User Panel']);
    localStorage.setItem('user_uuid', '');
    localStorage.setItem('privileged', '')
    localStorage.setItem('token', '');
    localStorage.setItem('group_uuid', '');
    await logout();
    window.location.href = location.pathname;
};

const updateAuthorizationHeader = (token) => {
    axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const updateCaptchaHeader = (token) => {
    axiosClient.defaults.headers.common['cf-turnstile-response'] = `${token}`;
};

const initNet = (token) => {
    if (token) {
        updateAuthorizationHeader(token);
    }
};

axiosClient.interceptors.response.use(
    async (response) => {
        const fileNotFound = response.data?.url === 'FILE_NOT_FOUND';
        if (fileNotFound) {
            const retryRequest = async () => axios.request(response.config);
            return await exponentialBackoffForFile(retryRequest);
        }

        if (response?.data?.error) {
            if (['PERMISSION_DENIED', 'OK'].includes(response?.data?.error)) {
                // For permission denied, handle at the component level
                return response
            }
            const tip = getGlobalTip();
            const actionEnum = {
                login: getGlobalShowLogin(),
                feedBack: getGlobalShowFeedBack(),
            }
            if (!response?.config?.skipParseError) {
                tip({
                    type: 'error',
                    content: parseError(response?.data?.error, actionEnum),
                });
                // mark the error as handled
                response.errorHandled = true;
            }

            return response
        }
        return response
    },
    async (error) => {
        try {
            const tip = getGlobalTip();

            if (axios.isCancel(error)) {
                return;
            }

            if (error.message === 'Network Error') {
                tip({
                    type: 'error',
                    presetText: 'ERROR',
                    content: 'Network Error',
                });
                return;
            }

            if (
                error.response
                && (error.response.status === 404 || error.response.status === 400)
                && (error.request.responseType === 'blob'
                    || error.request.responseType === 'arraybuffer'
                    || isImageRequest(error.config.url))
            ) {
                const retryRequest = async () => axios.request(error.config);
                return await exponentialBackoff(retryRequest);
            } else if (error.response) {
                const { config } = error;
                config.__retryCount = config.__retryCount || 0;

                if (config.__retryCount < 3) {
                    config.__retryCount += 1;
                    const delay = Math.pow(2, config.__retryCount) * 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return axiosClient.request(config);
                }
            }

            if (error.response) {
                let errorMessage;
                switch (error.response.status) {
                    case 400:
                        errorMessage = 'Bad Request';
                        break;
                    case 401:
                        await handleLogout();
                        break;
                    case 403:
                        errorMessage = 'Unauthorized';
                        break;
                    case 404:
                        errorMessage = 'Resource Not Found';
                        break;
                    case 500:
                        errorMessage = 'Internal Server Error';
                        break;
                    case 502:
                        errorMessage = 'Bad Gateway';
                        break;
                    case 503:
                        errorMessage = 'Service Unavailable';
                        break;
                    default:
                        errorMessage = 'Unknown Error';
                        break;
                }

                if (tip) {
                    tip({
                        type: 'error',
                        presetText: 'ERROR',
                        content: errorMessage,
                    });
                    // mark the error as handled
                    error.errorHandled = true;
                }
            }

            return Promise.reject(error);
        } catch (error) {
            // Sentry.captureException(error)
            console.error("Error handling AXIOS error", error);
        }
    },
);

const helperGetGoogleAnalyticsClientID = () => {
    try {
        var cookie = {};
        document.cookie.split(";").forEach(function (el) {
            var splitCookie = el.split("=");
            var key = splitCookie[0].trim();
            var value = splitCookie[1];
            cookie[key] = value;
        });
        if (!cookie["_ga"] || cookie["_ga"].length < 7) {
            throw new Error("Invalid GA cookie format");
        }
        var client_id = cookie["_ga"].substring(6);
        return client_id;
    } catch (error) {
        console.error("Error getting Google Analytics Client ID", error);
        return null;
    }
};

const login = (payload, token) => {
    updateCaptchaHeader(token)
    console.log("cftoken", token)
    return axiosClient.post(`${BASE_URL}/user/login`, payload)
};

const sendCode = (payload, token) => {
    updateCaptchaHeader(token)
    return axiosClient.post(`${BASE_URL}/user/send_email_verification_code`, {
        ...payload,
        type: 'Register',
    })
};

const sendResetCode = (payload, token) => {
    updateCaptchaHeader(token)
    return axiosClient.post(`${BASE_URL}/user/send_email_verification_code`, {
        ...payload,
        type: 'ResetPassword'
    });
};

const signUp = (payload, token) => {
    updateCaptchaHeader(token)
    return axiosClient.post(`${BASE_URL}/user/register`, payload)
};

const resetPassword = ({
    email,
    emailVerificationCode,
    password,
}, token) => {
    updateCaptchaHeader(token)
    return axiosClient.post(`${BASE_URL}/user/reset_password`, {
        email,
        email_verification_code: emailVerificationCode,
        new_password: password,
    })
};

const send_email_verification_code = ({
    email,
    type
}) => axiosClient.post(`${BASE_URL}/user/send_email_verification_code`, {
    email,
    type,
});

const getUserInfo = (payload) => axiosClient.post(`${BASE_URL}/user/get_info`, payload);

let ws;
const startChat = async () => {
    if (ws) return false;
    // console.log('start chat')
    return axiosClient.get(`${BASE_URL}/chat${suffix}`);
};

const wsSend = async ({
    task_uuid, content, language, summary,
}) => {
    if (!ws || ws.disconnected) return Promise.reject(new Error("Failed to establish connection to message server"));

    // console.log('ws send')

    return ws.emit('message', {
        content,
        summary,
        task_uuid,
        provider: 'user',
        language,
    });
};

const startWebsocket = async (subscription, task_uuid, language) => {
    if (ws) return ws;

    // console.log('start ws')

    ws = io(`${BASE_URL}/chat_socket`, {
        query: {
            subscription,
        },
        path: '',
        transports: ['websocket', 'polling'],
    });
    await new Promise((res) => {
        ws.on('connect', async () => {
            await wsSend({
                task_uuid,
                content: '[KICKOFF]',
                language,
            });
            res();
        });
    });
    return ws;
};

const reconnectWebsocket = () => {
    if (ws && ws.disconnected) {
        ws.connect();
    }
};

const getWs = () => ws;

const closeWebsocket = () => {
    if (ws && ws.connected) {
        // console.log('close ws')
        ws.close();
        // console.log(ws)
    }
};

const disposeWebsocket = () => {
    if (ws) {
        // console.log('dispose ws')
        ws = null;
    }
};

// task
const generateDetail = ({ task_uuid, prompt, seed, type, style, group_uuid }) => {
    const params = { task_uuid, prompt, settings: { seed, type, style } }
    if (group_uuid) {
        params.group_uuid = group_uuid
    }
    return axiosClient.post(`${BASE_URL}/task/generate`, params)
};

const generateDownload = (payload, token) => {
    updateCaptchaHeader(token)
    return axiosClient.post(`${BASE_URL}/task/unlock`, payload);
}

const getGenerateProgress = (task_uuid) => axiosClient.post(`${BASE_URL}/task/check_progress/${task_uuid}`);

let cancelRequest;

const getCards = ({ type, page_num, task_type = null, needCancel = true, user_type, task_step }) => {
    if (needCancel && cancelRequest) {
        cancelRequest.cancel('Previous request canceled');
    }
    const params = { type, page_num, task_type }
    if (type === 'Mine') {
        params.user_type = user_type
    }
    if (type === 'Group') {
        params.group_uuid = localStorage.getItem('group_uuid')
    }
    if (task_type === 'Rodin') {
        params.task_step = task_step
    }

    if (needCancel) {
        cancelRequest = axios.CancelToken.source();
    }

    return axiosClient.post(
        `${BASE_URL}/task/cards`,
        params,
        {
            cancelToken: needCancel ? cancelRequest.token : undefined,
        }
    )
        .catch((error) => {
            if (axios.isCancel(error)) {
                console.warn('Cards request canceled');
            } else if (error.message === 'Network Error') {
                console.error('Network Error: Please check your internet connection.');
            } else {
                throw Error(error);
            }
        });

};
const search = ({ keyword, page_num }) => axiosClient.post(`${BASE_URL}/task/search`, { keyword, page_num });

const getTaskDetail = (task_uuid) => axiosClient.post(`${BASE_URL}/task/card/${task_uuid}`);

const likeCard = ({ task_uuid, operation }) => axiosClient.post(`${BASE_URL}/like/v1`, { task_uuid, operation });

const generateDetailImageTo3D = ({
    task_uuid,
    cameraOption,
    view_weights,
    constrain_skull_distance,
    jawline,
    remove_shadow,
    disable_local_pca,
    disable_exp_bs,
    neutral_close_mouth,
    strong_eyesmall,
    skin_color_selected,
    isCustom,
    styleParam,
    uuid,
    prompt,
    caption_style
}) => {
    const settings = { view_weights, constrain_skull_distance, jawline, remove_shadow, disable_local_pca, disable_exp_bs, neutral_close_mouth, strong_eyesmall, caption_style };
    const params = {
        task_uuid,
        settings,
        prompt
    }
    if (isCustom) {
        settings.f_36 = cameraOption;
    } else {
        settings.f_36_box = cameraOption;
    }
    if (uuid) {
        params.group_uuid = uuid
    }

    if (styleParam !== 'default') {
        settings.style = styleParam;
    }

    if (skin_color_selected !== '') {
        settings.skin_color_selected = skin_color_selected;
    }

    return axiosClient.post(`${BASE_URL}/task/imagineface_generate`, params);
};

const getTaskDownload = (task_uuid) => axiosClient
    .post(`${BASE_URL}/task/get_download`, { task_uuid })
    .then((data) =>
        // console.log(file_uuid, data.data.url)
        data.data);

const selectCandidate = (task_uuid, candidateIndex) => axiosClient.post(`${BASE_URL}/task/select_candidate`, {
    uuid: task_uuid,
    selected_id: candidateIndex,
});

const getExternalRedirectUrl = (provider, token) => {
    updateCaptchaHeader(token)
    return axiosClient.post(`${BASE_URL}/user/external/${provider}`)
};

const authorizeExternal = (provider, params, token) => {
    updateCaptchaHeader(token)
    return axiosClient.get(`${BASE_URL}/user/external/${provider}/authorize`, {
        params,
        headers: {
            Authorization: undefined
        }
    })
};

const paymentValidationAlipay = (params) => axiosClient.get(`${BASE_URL}/wallet/charge_alipay_return`, { params });


const fetchPriceStripe = (token_amount) => axiosClient.get(
    `${BASE_URL}/wallet/charge_stripe?token_amount=${token_amount}`,
);

const fetchPriceAlipay = (token_amount) => axiosClient.get(
    `${BASE_URL}/wallet/charge_alipay?token_amount=${token_amount}`,
);

const fetchPriceAlipayCNY = (currency_cny_cents) => axiosClient.get(
    `${BASE_URL}/wallet/charge_alipay?currency_cny_cents=${currency_cny_cents}`,
);

const fetchPriceStripeUSD = (currency_usd_cents) => axiosClient.get(
    `${BASE_URL}/wallet/charge_stripe?currency_usd_cents=${currency_usd_cents}`,
);


const fetchPaymentURLAlipay = ({ token_amount, group_uuid }) => {
    const param = { token_amount }
    if (group_uuid) {
        param.group_uuid = group_uuid
    }
    return axiosClient.post(`${BASE_URL}/wallet/charge_alipay`, param)
};

const fetchPaymentSecretStripe = ({ token_amount, group_uuid }) => {
    const ga_client_id = helperGetGoogleAnalyticsClientID();
    const param = { token_amount }
    if (group_uuid) {
        param.group_uuid = group_uuid
    }
    if (ga_client_id) {
        param.ga_client_id = ga_client_id;
    }
    return axiosClient.post(`${BASE_URL}/wallet/charge_stripe`, param)
};

const fetchPaymentStatusStripe = (payment_intent_id) => axiosClient.get(
    `${BASE_URL}/wallet/charge_stripe_return?payment_intent_id=${payment_intent_id}`
)

const logout = () => axiosClient.post(`${BASE_URL}/user/logout`);

const updatePassword = ({
    user_uuid,
    old_password,
    new_password
}) => axiosClient.post(`${BASE_URL}/user/update_password`, {
    user_uuid,
    old_password,
    new_password,
});

const updateInfo = ({ user_uuid, username }) => axiosClient.post(`${BASE_URL}/user/update_info`, { user_uuid, username });

const reedemCode = ({ tcode, group_uuid }) => {
    const param = { tcode }
    if (group_uuid) {
        param.group_uuid = group_uuid
    }
    return axiosClient.post(`${BASE_URL}/wallet/cash_tcode`, param)
};

const getPosterImage = ({ task_uuid, type, name }) => axiosClient.post(`${BASE_URL}/task/get_download`, {
    task_uuid,
    type,
    name
});

const getMagicPrompt = () => axiosClient.get(`${BASE_URL}/chat/get_chat_settings`);

const getTotal = () => axiosClient.get(`${BASE_URL}/task/static`);


//GET --> POST  get_wallet_history 
const getTradeHistory = async ({ user_uuid, username }) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axiosClient.get(
            `${BASE_URL}/wallet/get_charge_history?userUUID=${user_uuid}&username=${username}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        const { data } = response;
        return data;
    } catch (error) {
        Sentry.captureException(error)
        console.error(error);
    }
};

const getExpenseHistory = async ({ user_uuid, username }) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axiosClient.get(
            `${BASE_URL}/wallet/get_expense_history?userUUID=${user_uuid}&username=${username}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        const { data } = response;
        return data;
    } catch (error) {
        Sentry.captureException(error)
        console.error(error);
    }
};

const getWalletHistory = (type, wallet_info) => axiosClient.post(`${BASE_URL}/wallet/get_wallet_history`, { type, wallet_info })

const setPrivate = (task_uuid) => axiosClient.post(`${BASE_URL}/task/set_private`, { task_uuid });

const purchaseLicense = ({ task_uuid }) => axiosClient.post(`${BASE_URL}/task/purchase_license`, { task_uuid });

const updateAvatar = (formData) => axiosClient.post(`${BASE_URL}/user/update_info`, formData, {
    // headers: {
    //     'Content-Type': 'multipart/form-data',
    // },
});

const searchModels = async ({
    database_name,
    input_type,
    fileMap,
    prompt,
    page_num,
    hash,
    onUploadProgress,
}) => {
    // console.log(database_name);
    const form = new FormData();
    form.append('database_name', database_name || 'sketchfab');
    if (!hash) {
        form.append('input_type', input_type);
        if (input_type === 'text') {
            form.append('prompt', prompt);
        } else {
            fileMap.forEach((value) => {
                form.append('files', value);
            });
        }
    }

    if (hash) {
        form.append('hash', hash);
    }

    form.append('page_num', page_num);

    const response = await axiosClient.post(`${RODIN_URL}/api/rodin/search`, form, {
        onUploadProgress,
    });
    return response;
};

// imagineface

const imaginefaceSubmit = async (formData, onUploadProgress) => axiosClient.post(`${BASE_URL}/task/imagineface_submit`, formData, { onUploadProgress });

const imaginefaceBlender = async (task_uuid) => axiosClient.post(`${BASE_URL}/task/imagineface_blender`, { task_uuid });

const imaginefaceViewSelection = async (task_uuid) => axiosClient.post(`${BASE_URL}/task/imagineface_view_selection`, {
    task_uuid,
}, {

    skipParseError: true
});


const imaginefacePreview = async (task_uuid) => axiosClient.post(`${BASE_URL}/task/imagineface_preview`, { task_uuid });

const imaginfaceGenme = async (formData) => axiosClient.post(`${BASE_URL}/task/imagineface_genme`, formData);


// panorama

const getBanner = () => axiosClient.get(`${BASE_URL}/task/get_banner`);

const setBanner = (task_uuid) => axiosClient.post(`${BASE_URL}/task/set_banner`, { task_uuid });

const queryPanaromaCards = (page_num = 0, type = 'Recent') => axiosClient.post(`${BASE_URL}/task/cards_panorama`, {
    page_num,
    type,
});

const getPanoromaDetail = (task_uuid) => axiosClient.post(`${BASE_URL}/task/card_panorama/${task_uuid}`);

const panoramaGenerate = (prompt, style, generate_depth, use_prompt_image, remix_id) => axiosClient.post(`${BASE_URL}/task/panorama_generate`, {
    prompt,
    style,
    generate_depth,
    use_prompt_image,
    remix_id,
});

// Canary
const creatCanary = (user_uuid, name) => axiosClient.post(`${BASE_URL}/canary/create`, { user_uuid, name });

const deleteCanary = (user_uuid, name) => axiosClient.post(`${BASE_URL}/canary/delete`, { user_uuid, name });

const checkCanary = ({ user_uuid, email, name }) => axiosClient.post(`${BASE_URL}/canary/check`, { user_uuid, email, name });

//Group
const getGroupList = () => axiosClient.get(`${BASE_URL}/group/get_group_list`);

const queryGroupInfo = (group_uuid) => axiosClient.post(`${BASE_URL}/group/group_info`, { group_uuid });

const creatGroup = (group_name) => axiosClient.post(`${BASE_URL}/group/create_group`, { group_name });

const extendGroupEXP = (group_uuid, extend_weeks) => axiosClient.post(`${BASE_URL}/group/extend_group_expiration`, { group_uuid, extend_weeks });

const deleteGroup = (group_uuid) => axiosClient.post(`${BASE_URL}/group/delete_group`, { group_uuid });

const addMember = (user_uuid, group_uuid) => axiosClient.post(`${BASE_URL}/group/add_member`, { user_uuid, group_uuid });

const removeMember = (user_uuid, group_uuid) => axiosClient.post(`${BASE_URL}/group/remove_member`, { user_uuid, group_uuid });

const getGroupMemberList = (group_uuid) => axiosClient.post(`${BASE_URL}/group/get_group_member_list`, { group_uuid });

const getGroupSettings = () => axiosClient.get(`${BASE_URL}/group/get_group_settings`);

//twitter
const uploadPoster = (formData, task_uuid) => axiosClient.post(`${BASE_URL}/task/upload_poster/${task_uuid}`,
    formData,
    {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

const getPoster = (task_uuid) => axiosClient.post(`${BASE_URL}/task/get_poster/${task_uuid}`)

//qr create
const createQr = () => axiosClient.post(`${BASE_URL}/task/create_qr`)

// Subscription
const getDashBoardLink = () => axiosClient.get(`${BASE_URL}/subscription/subscription_stripe_get_dashboard_link`)

const subscribeToPlan = ({ billing_provider, plan_level, plan_monthly_price, yearly }) => {
    const ga_client_id = helperGetGoogleAnalyticsClientID();
    const params = { billing_provider, plan_level, plan_monthly_price, yearly };
    if (ga_client_id) {
        params.ga_client_id = ga_client_id;
    }
    return axiosClient.post(`${BASE_URL}/subscription/subscribe_to_plan`, params)
}

const changePlan = ({ billing_provider, plan_level, plan_monthly_price, yearly }) => axiosClient.post(`${BASE_URL}/subscription/change_subscription`, { billing_provider, plan_level, plan_monthly_price, yearly })

const getSubscriptionStatus = () => axiosClient.get(`${BASE_URL}/subscription/list_subscriptions`)

const searchEmbedding = async ({ formData, keyword, page_num, task_type }) => {
    if (formData) {
        return axiosClient.post(`${BASE_URL}/task/search_embedding`, formData)
    } else {
        return axiosClient.post(`${BASE_URL}/task/search_embedding`, { keyword, page_num, task_type })
    }
}

// Rodin
const prompt2Img = async (prompt, retries = 5) => {
    const formData = new FormData();
    formData.append('prompt', prompt);

    try {
        const response = await axiosClient.post(`${RODIN_IMAGE_GEN_URL}/rodin/image_gen`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            responseType: 'arraybuffer'
        });
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return prompt2Img(prompt, retries - 1);
        } else {
            throw new Error('Image generation failed after retries');
        }
    }
};

const rodinMesh = ({ prompt, group_uuid, settings, images }) => {
    const formData = new FormData();

    if (prompt != null) {
        formData.append('prompt', prompt);
    }
    if (group_uuid != null) {
        formData.append('group_uuid', group_uuid);
    }
    formData.append('settings', JSON.stringify(settings));

    images.forEach((image) => {
        if (image.file instanceof File) {
            formData.append('images', image.file);
        }
    });

    return axiosClient.post(`${BASE_URL}/task/rodin_mesh`, formData, {
        headers: {
        },
    });
};

const rodinUpdate = ({
    prompt,
    uuid,
    view_weights = false,
    reference_image,
    escore = null,
    seed = 0,
    reference_scale = 1,
    condition_mode,
    image_label,
    bbox_condition = null,
    voxel_condition = null,
    voxel_condition_cfg = true,
    voxel_condition_weight = 1,
    pcd_condition = null,
    pcd_condition_uncertainty = null,
    inference_steps,
    guidance_scale,
    negative_prompt,
    geoseed,
    rest_bias,
    image_mode,
    enable_advance_option = null,
    face_enhance = false
}) => {
    if (view_weights) {
        const settings = {
            view_weights: view_weights, condition_mode, image_label, bbox_condition, voxel_condition, pcd_condition, pcd_condition_uncertainty, voxel_condition_cfg, voxel_condition_weight
        }
        if (isNumber(escore)) {
            settings.escore = escore
            settings.seed = seed
        }
        if (inference_steps) {
            settings.inference_steps = inference_steps
        }
        if (guidance_scale) {
            settings.guidance_scale = guidance_scale
        }
        if (negative_prompt) {
            settings.negative_prompt = negative_prompt
        }
        if (geoseed) {
            settings.seed = geoseed
        }
        if (rest_bias !== false && rest_bias >= 0) {
            settings.rest_bias = rest_bias
        }
        if (image_mode) {
            settings.image_mode = image_mode
        }
        if (enable_advance_option !== null) {
            settings.enable_advance_option = enable_advance_option
        }
        settings.face_enhance = face_enhance
        return axiosClient.post(`${BASE_URL}/task/rodin_update`, { prompt, uuid, settings });
    } else {
        return axiosClient.post(`${BASE_URL}/task/rodin_update`, {
            prompt, uuid, reference_image,
            settings: { escore, seed, reference_scale, face_enhance }
        });
    }
};

const rodinConfirm = ({ uuid, quality, symmetric, version, reference_image, use_hyper }) => {
    const payload = {
        uuid: uuid,
        settings: {
            quality: quality || "medium",
            symmetric: symmetric !== undefined ? symmetric : true,
            use_hyper: use_hyper
        },
        version: version,
        reference_image: reference_image,
    };

    return axiosClient.post(`${BASE_URL}/task/rodin_confirm`, payload);
};

const getTaskSettings = () => axiosClient.get(`${BASE_URL}/task/get_task_settings`,);

const rodinHistory = ({ uuid, step }) => axiosClient.post(`${BASE_URL}/task/rodin_history`, { uuid, step })

const rodinTexture = ({ prompt, uuid, texture_reference_filename, image, escore, face_enhance = false, reference_scale = 1 }) => {

    const formData = new FormData();
    formData.append('uuid', uuid);

    if (image) {
        formData.append('images', image);
        formData.append('texture_reference_file_index', 0);
    } else {
        formData.append('texture_reference_filename', texture_reference_filename)
    }

    formData.append('prompt', prompt);
    const settingValue = JSON.stringify({ escore: escore, reference_scale: reference_scale, face_enhance: face_enhance });
    formData.append('settings', settingValue);
    return axiosClient.post(`${BASE_URL}/task/rodin_texture`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

const rodinFaceEnhance = (formData) => {
    return axiosClient.post(`${RODIN_URL}/api/rodin/face_enhance_detect`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

const rodinUnlock = ({ task_uuid, resolution, geometry, geometry_file_format, material, height }, token) => {
    updateCaptchaHeader(token)
    const params = { task_uuid, resolution, geometry, geometry_file_format, material }
    if (height) {
        params.height = height
    }
    return axiosClient.post(`${BASE_URL}/task/rodin_unlock`, { ...params })
}

const rodinPreprocessImage = ({ generate_prompt = false, image }) => {
    const formData = new FormData();
    formData.append('generate_prompt', generate_prompt);

    if (image instanceof File) {
        formData.append('images', image);
    }

    const endpointOverwrite = localStorage.getItem('gptApi');
    const endpoint = endpointOverwrite ? endpointOverwrite : `${RODIN_IMAGE_PREPROCESS_URL}/task/rodin_mesh_image_process`;

    const attemptRequest = (attemptsLeft) => {
        return axiosClient.post(endpoint, formData, {})
            .then(response => response)
            .catch(error => {
                if (attemptsLeft === 0) {
                    throw error;
                }
                console.log(`Request failed, attempting retry... (${5 - attemptsLeft + 1}/5)`);
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(attemptRequest(attemptsLeft - 1));
                    }, 2000);
                });
            });
    };

    if (process.env.REACT_APP_PRE_PROCESS_BYPASS === "true") {
        return attemptRequest(1).catch(async error => {
            console.error("Request failed, generating fake response:", error);
            const fakePrompt = "This is a generated prompt for demonstration.";
            const dataUrl = await fileToBase64(image);

            return {
                data: {
                    prompt: fakePrompt,
                    processed_image: dataUrl
                }
            };
        });
    } else {
        return attemptRequest(5);
    }
};


const getFullTagList = () => axiosClient.get(`${BASE_URL}/task/get_all_tags`);

const getReferralLink = () => {
    return axiosClient.get(`${BASE_URL}/referral/get_referral_link`);
}

const createSelfServiceApiKey = (descr) => {
    const payload = {
        description: descr
    };
    return axiosClient.post(`${BASE_URL}/auth/create_key`, payload);
}

const listSelfServiceApiKeys = () => {
    return axiosClient.post(`${BASE_URL}/auth/list_keys`);
}

const deprecateSelfServiceApiKey = (id, operation) => {
    const payload = {
        id: id,
        operation: operation
    };
    return axiosClient.post(`${BASE_URL}/auth/deprecate_key`, payload);
}


const getEduVerify = async () => {
    return axiosClient.get(`${BASE_URL}/education/status`,)
}

const getEduState = async () => {
    return axiosClient.get(`${BASE_URL}/education/status`)
}

const sendEduEmail = async (email) => {
    return axiosClient.post(`${BASE_URL}/education/start-challenge`, { email })
}

const EduSubmit = async (email, code, data) => {
    return axiosClient.post(`${BASE_URL}/education/submit-challenge`, { email, code, data })
}

const createVideoRequest = async (videoData) => {
    // https://rodin-share.deemos.dev/create_video
    const response = await axios.post(`https://hyperhuman.deemos.com/api/rodin/create_video`, videoData, {
        headers: {
            'Content-Type': 'application/json'
        },
        responseType: 'blob'
    });
    return response.data;
}

const sendFeedback = async (feedbackData) => {
    const response = await axios.post(`https://feedback.deemos.dev/feedback`, feedbackData, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    return response.data;
}

const uploadToSketchfab = async (access_token, formData) => {
    return axios.post(`https://api.sketchfab.com/v3/models`, formData, {
        headers: {
            Authorization: `Bearer ${access_token}`,

        },
    });
}

const getSketchfabState = async (access_token, uid) => {
    return axios.get(`https://api.sketchfab.com/v3/models/${uid}`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })
}

const checkPrivilege = async (privilegeItem) => {
    return axiosClient.post(`${BASE_URL}/privilege/check`, {
        privilege_item: privilegeItem
    });
}

export {
    initNet,
    logout,
    getTotal,
    fetchPaymentURLAlipay,
    fetchPaymentSecretStripe,
    fetchPaymentStatusStripe,
    fetchPriceStripeUSD,
    fetchPriceAlipayCNY,
    fetchPriceAlipay,
    fetchPriceStripe,
    sendFeedback,
    paymentValidationAlipay,
    updateAvatar,
    rodinPreprocessImage,
    getMagicPrompt,
    getPosterImage,
    reedemCode,
    updatePassword,
    updateInfo,
    generateDetailImageTo3D,
    getExternalRedirectUrl,
    authorizeExternal,
    login,
    sendCode,
    signUp,
    resetPassword,
    send_email_verification_code,
    getUserInfo,
    searchModels,
    startChat,
    startWebsocket,
    getWs,
    wsSend,
    reconnectWebsocket,
    closeWebsocket,
    disposeWebsocket,
    generateDetail,
    generateDownload,
    getTaskSettings,
    getGenerateProgress,
    getTaskDetail,
    getCards,
    search,
    likeCard,
    getTaskDownload,
    selectCandidate,
    sendResetCode,
    getTradeHistory,
    getExpenseHistory,
    getWalletHistory,
    setPrivate,
    purchaseLicense,
    imaginefaceSubmit,
    imaginefaceViewSelection,
    imaginefacePreview,
    imaginefaceBlender,
    panoramaGenerate,
    getPanoromaDetail,
    queryPanaromaCards,
    getBanner,
    setBanner,
    creatCanary,
    deleteCanary,
    checkCanary,
    getGroupList,
    queryGroupInfo,
    creatGroup,
    extendGroupEXP,
    deleteGroup,
    addMember,
    removeMember,
    getGroupMemberList,
    getGroupSettings,
    uploadPoster,
    getPoster,
    createQr,
    imaginfaceGenme,
    getDashBoardLink,
    subscribeToPlan,
    getSubscriptionStatus,
    searchEmbedding,
    prompt2Img,
    rodinMesh,
    rodinUpdate,
    rodinConfirm,
    rodinHistory,
    rodinTexture,
    rodinUnlock,
    getFullTagList,
    getReferralLink,
    createSelfServiceApiKey,
    listSelfServiceApiKeys,
    deprecateSelfServiceApiKey,
    createVideoRequest,
    uploadToSketchfab,
    getEndpoint,
    getSketchfabState,
    getEduVerify,
    getEduState,
    sendEduEmail,
    EduSubmit,
    changePlan,
    checkPrivilege,
    rodinFaceEnhance
};
