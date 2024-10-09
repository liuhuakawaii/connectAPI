import {logout} from "./net";
import { createTurnstileVerification } from '../common/Captcha';
import {useContext} from "react";
import {PermissionContext} from "./context";
import * as Sentry from "@sentry/react";

export const handleLogout = () => {
    _czc.push(['_trackEvent', 'Pop Up', 'Logout Icon', 'User Panel']);
    localStorage.setItem('user_uuid', '');
    localStorage.setItem('privileged', '')
    localStorage.setItem('token', '');
    localStorage.setItem('group_uuid', '');
    logout();
    window.location.href = location.pathname;
};

export async function handleCaptchaVerification(turnstileRef, enabled = true) {
    if (!enabled) {
        return false;
    }

    try {
        try {
            turnstileRef.current?.reset();
        } catch (e) {
            console.warn(e)
        }

        turnstileRef.current?.execute();
        return await turnstileRef.current?.getResponsePromise(5000, 2);
    } catch (e) {
        try {
            const verifyCaptcha = createTurnstileVerification();
            return await verifyCaptcha();
        } catch (error) {
            if (error.message === "Verification Closed") {
                console.warn(error);
            } else {
                Sentry.captureException(error);
                throw new Error("Captcha Verification Failed");
            }
        }
    }
}