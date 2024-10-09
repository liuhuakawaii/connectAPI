import React, {useContext, useEffect, useRef, useState} from 'react';
import { authorizeExternal } from '../..//utils/net';
import style from './oauth.module.css';
import * as Sentry from "@sentry/react";
import {Turnstile} from "@marsidev/react-turnstile";
import {handleCaptchaVerification} from "../../utils/auth";
import LoadingPlaceholder from "../LoadingPlaceholder";
import {PermissionContext} from "../../utils/context";

function OAuthHandler() {
    const [urlParams, setUrlParams] = useState(null);
    const [error, setError] = useState(null);
    const [provider, setProvider] = useState(null);
    const turnstileRef = useRef()
    const { isAllowedTo } = useContext(PermissionContext);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const provider = params.get('oauth');
        setError(null);
        setProvider(provider);
        if (params.toString()) {
            setUrlParams(Object.fromEntries(params));
        }
    }, []);

    useEffect(() => {
        if (urlParams?.error) {
            setError("External login failed, please try again later");
        } else if (urlParams) {
            // waiting for turnstile init
            setTimeout(() => {
                handleOauthLogin();
            }, 300)
        }
    }, [urlParams]);

    const handleOauthLogin = async () => {
        try {
            const captchaToken = await handleCaptchaVerification(turnstileRef, isAllowedTo('captcha.feature'))

            const { data } = await authorizeExternal(provider, urlParams, captchaToken);
            if (data.error) {
                throw new Error(data.error);
            } else {
                localStorage.setItem('user_uuid', data.user_uuid);
                localStorage.setItem('token', data.token);
                window.location.href = '/';
            }
        } catch (e) {
            if (e.message !== "INVALID_GOOGLE_OAUTH_CALLBACK") {
                Sentry.captureException(e)
                setError(e.message);
            }
        }
    };

    const handlerBack = () => window.location.href = '/'

    return (
        <div className={style.page}>
            {error ? (
                <>
                    <div className={style.loginfailed} >Login Failed</div>
                    <div className={style.loginfaileddetail} >{error}</div>
                    <button className={style.backBtn} onClick={handlerBack}>Back to Hyperhuman</button>
                </>
            ) : (
                <LoadingPlaceholder />
            )}

            <Turnstile ref={turnstileRef} siteKey='0x4AAAAAAAg4lvegmJ9lPsyB'
                       style={{ display: "none" }}
                       options={{ appearance: 'interaction-only', execution: 'execute' }}/>
        </div>
    );
}

export default OAuthHandler;
