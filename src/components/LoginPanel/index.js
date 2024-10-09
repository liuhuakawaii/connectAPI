import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { AiOutlineGithub } from 'react-icons/ai';
import { useLocation, useNavigate } from 'react-router-dom';
// import heic2any from 'heic2any';
import {
    getExternalRedirectUrl,
    login,
    resetPassword,
    sendCode,
    sendResetCode,
    signUp,
    updateAvatar,
    updateInfo,
    updatePassword
} from '../../utils/net';
import { croppedImageAtom, initialLoginStageAtom, showLoginAtom } from '../../store';
import style from './login.module.css';
import { useTips } from '../../common/GlobalTips';
// import AvatarEditor from "react-avatar-editor";
import googleIcon from '../../assets/google.svg';
import Viewer from '../widgets/render/viewer';
import * as Sentry from "@sentry/react";
import { useTranslation } from "react-i18next";
import { checkMobile } from "../../utils/format";
import { PermissionContext } from "../../utils/context";
import {Turnstile} from "@marsidev/react-turnstile";
import ReactGA from "react-ga4";
import {handleCaptchaVerification} from "../../utils/auth";


function LoginPanel() {
    const locating = useLocation();
    const [loginStage, setLoginStage] = useState(0);
    const [username, setUsername] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [isRemember, setIsRemember] = useState(true);
    const [tips, setTips] = useState('');
    const [showLogin, setShowLogin] = useRecoilState(showLoginAtom);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const loginConRef = useRef(null);
    const [resetCode, setResetCode] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newAvatar, setNewAvatar] = useState(false)
    // const [avatarFile, setAvatarFile] = useState(null);
    const initialLoginStage = useRecoilValue(initialLoginStageAtom);
    const navi = useNavigate();
    const tip = useTips();
    // const editorRef = useRef(null);
    const { t } = useTranslation();
    const conRef = useRef(null);
    const objectFileMap = useRecoilValue(croppedImageAtom);
    const [showUploadPreview, setShowUploadPreview] = useState(false);
    const [uploadPreviewUrl, setUploadPreviewUrl] = useState(undefined);
    const [uploadFileExtension, setUploadFileExtension] = useState(undefined);
    const [uploadType, setUploadType] = useState(undefined);
    const [upDating, setUpDating] = useState(false);
    const navigate = useNavigate();
    const { isAllowedTo } = useContext(PermissionContext);
    const turnstileRef = useRef()

    const handleClose = () => {
        setSidebarVisible(false);
        setShowLogin(false);

        // use web history to go back for the special case of signup
        if (window.location.pathname === '/signup') {
            const urlSearchParams = new URLSearchParams(window.location.search);
            const referralCode = urlSearchParams.get('referral_code');

            if (referralCode) {
                const newUrl = '/?referral_code=' + encodeURIComponent(referralCode);
                window.history.pushState({}, '', newUrl);
            } else {
                window.history.pushState({}, '', '/');
            }
        }
    };



    useEffect(() => {
        const isMobile = checkMobile()
        if (showLogin && isMobile) {
            navigate('/customlogin');
            setShowLogin(false)
        } else if (showLogin) {
            setTimeout(() => {
                setSidebarVisible(true);
            }, 50);
        }

        // dirty state hook to catch the referral code
        // when the user is directed to the /signup page, the login panel will be opened
        // and the state will be set to 1, which is the stage for sending the verification code
        // so we can catch the referral code here
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('referral_code');
        setReferralCode(referralCode);
    }, [showLogin]);

    const handleSwitch = (stage) => () => {
        setTips('');
        setPassword('');
        setIsRemember(true);
        setLoginStage(stage);
        setNewUsername('');
        setNewPassword('');
        // setAvatarFile(null);
    };

    useEffect(() => {
        // console.log(initialLoginStage)
        if (initialLoginStage) {
            setLoginStage(initialLoginStage);
        }
    }, [initialLoginStage]);

    const handleLogin = async () => {
        _czc.push(['_trackEvent', 'Pop Up', 'Sign In', 'Login Panel']);
        if (!email) {
            tip({
                type: 'warning',
                content: t('TIP_WRAN_LOGINPANEL_EMAIL'),
            });
            return;
        }

        if (!password) {
            tip({
                type: 'warning',
                content: t('TIP_WRAN_LOGINPANEL_PASSWORD'),
            });
            return;
        }

        try {
            const captchaToken = await handleCaptchaVerification(turnstileRef, isAllowedTo('captcha.feature'))

            const res = await login({
                password,
                ...(email ? { email } : null)
            }, captchaToken);
            if (res.data?.error?.length > 0) {
                throw new Error(res.data.error);
            } else {
                localStorage.setItem('user_uuid', res.data.user_uuid);
                localStorage.setItem('token', res.data.token);
                if (!isRemember) localStorage.setItem('remember', 1);
                if (locating.pathname === '/error') {
                    navi('/');
                } else {
                    navi(locating.pathname);
                }
                window.location.reload(true);
            }
        } catch (e) {
            if (e.message !== "NO_SUCH_USER") {
                Sentry.captureException(e)
            }
        }
    };

    const handleUpdateInfo = async () => {
        setUpDating(true);
        _czc.push(['_trackEvent', 'Pop Up', 'Change Username', 'User Panel']);
        try {
            const res = await updateInfo({
                user_uuid: localStorage.getItem('user_uuid'),
                username: newUsername,
            });
            if (res.data?.error?.length > 0) {
                throw new Error(res.data.error);
            } else {
                tip({
                    type: 'success',
                    content: t('TIP_SUCCESS_USERNAME_UPDATE'),
                });
                window.location.reload();
            }
        } catch (e) {
            Sentry.captureException(e)
        }
        setUpDating(false);
    };

    const handleUpdatePassword = async () => {
        setUpDating(true);
        _czc.push(['_trackEvent', 'Pop Up', 'Change Password', 'User Panel']);
        try {
            const res = await updatePassword({
                user_uuid: localStorage.getItem('user_uuid'),
                old_password: password,
                new_password: newPassword,
            }).catch(e => {
                tip({
                    type: "error",
                    content: e.response?.data?.message
                })
            });
            if (res.data?.error) {
                throw new Error(res.data.error);
            } else {
                tip({
                    type: 'success',
                    content: t('TIP_SUCCESS_PASSWORD_UPDATE'),
                });
            }
        } catch (e) {
            Sentry.captureException(e)
        }
        setUpDating(false);
    };

    const handleUpdateAvatar = async () => {
        setUpDating(true);
        _czc.push(['_trackEvent', 'Pop Up', 'Change Avatar', 'User Panel']);
        if(objectFileMap==='' || objectFileMap?.size===0 || objectFileMap?.size===undefined){
            return;
        }else{
            const file = objectFileMap.get('image');
            if (!file) return;
            const formData = new FormData();
            const multerFile = new File([file], file.name, {
                type: file.type,
            });
            formData.append('file', multerFile);

            try {
                const res = await updateAvatar(formData);
                if (res.data?.error) {
                    // console.log(res.data.error);
                    throw new Error(res.data.error);
                } else {
                    tip({
                        type: 'success',
                        content: t('TIP_SUCCESS_AVATAR_UPDATE'),
                    });
                    window.location.reload();
                }
            } catch (e) {
                Sentry.captureException(e)
            }
            setNewAvatar(false)
            setUpDating(false);
        }
    };

    const handleSendCode = async () => {
        _czc.push(['_trackEvent', 'Pop Up', 'Send Code', 'Login Panel']);
        const reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/

        if (!email || !reg.test(email)) {
            tip({
                type: 'error',
                content: t('TIP_ERR_LOGINPANEL_EMAIL'),
            });
            return;
        }

        try {
            const captchaToken = await handleCaptchaVerification(turnstileRef, isAllowedTo('captcha.feature'))

            const res = await sendCode({ email }, captchaToken);

            if (res.data?.error) {
                throw new Error(res.data.error);
            } else {
                handleSwitch(2)();
            }
        } catch (e) {
            Sentry.captureException(e)
            handleSwitch(loginStage)();
        }
    };

    const handleSignup = async () => {
      if (!username) {
        tip({
          type: "error",
          content: t("TIP_ERR_LOGINPANEL_USERNAME"),
        });
        return;
      }

      if (!email) {
        tip({
          type: "error",
          content: t("TIP_ERR_LOGINPANEL_EMAIL"),
        });
        return;
      }

      if (!code && isAllowedTo("verification.register.feature")) {
        tip({
          type: "error",
          content: t("TIP_ERR_LOGINPANEL_VER_CODE"),
        });
        return;
      }

      if (!password) {
        tip({
          type: "error",
          content: t("TIP_ERR_LOGINPANEL_PASSWORD"),
        });
        return;
      }

      if (password.length < 6 || password.length > 20) {
        tip({
          type: "error",
          content: t("TIP_ERR_LOGINPANEL_PASSWORD_LENGTH"),
        });
        return;
      }

      try {
          const captchaToken = await handleCaptchaVerification(turnstileRef, isAllowedTo('captcha.feature'))

          const res = await signUp({
          username,
          email,
          password,
          email_verification_code: isAllowedTo("verification.register.feature")
            ? code
            : "000000",
          referral_code: referralCode,
        }, captchaToken);

        if (res.data?.error) {
          throw new Error(res.data.error);
        } else {
          localStorage.setItem("user_uuid", res.data.user_uuid);
          localStorage.setItem("token", res.data.token);
          if (!isRemember) localStorage.setItem("unremember", 1);

          ReactGA.gtag("event", "conversion_event_signup_4", {});

          const redirectUrl =
            window.location.origin +
            "/?utm_source=yt_analytics&utm_campaign=yt_registered"; // TODO: a more universal solution and a standard format should be established
            window.location.assign(redirectUrl);
        }
      } catch (e) {
        Sentry.captureException(e);
        handleSwitch(loginStage)();
      }
    };

    const handleExternalLogin = async (provider) => {
        if (provider === 'google') {
            _czc.push(['_trackEvent', 'Pop Up', 'OAuth Google', 'Login Panel']);
        }
        if (provider === 'github') {
            _czc.push(['_trackEvent', 'Pop Up', 'OAuth Github', 'Login Panel']);
        }

        try {
            const captchaToken = await handleCaptchaVerification(turnstileRef, isAllowedTo('captcha.feature'))
            const { data: redirectUrl } = await getExternalRedirectUrl(provider, captchaToken);
            window.location.href = redirectUrl.redirect_url;
        } catch (e) {
            Sentry.captureException(e);
        }
    };

    const handleGithubLogin = async () => {
        await handleExternalLogin('github');
    }

    const handleGoogleLogin = async () => {
        await handleExternalLogin('google');
    }

    const handleResetPassword = async () => {
        if (!email) {
            tip({
                type: 'error',
                content: t('TIP_ERR_LOGINPANEL_EMAIL_INVALID'),
            });
            return;
        }
        if (!resetCode) {
            tip({
                type: 'error',
                content: t('TIP_ERR_LOGINPANEL_EMAIL_VER_CODE'),
            });
            return;
        }
        if (!password) {
            tip({
                type: 'error',
                content: t('TIP_ERR_LOGINPANEL_PASSWORD_INVALID'),
            });
            return;
        }

        try {
            const captchaToken = await handleCaptchaVerification(turnstileRef, isAllowedTo('captcha.feature'))

            const res = await resetPassword({
                email,
                emailVerificationCode: resetCode,
                password,
            }, captchaToken);
            if (res.data?.error) {
                throw new Error(res.data.error);
            } else {
                setLoginStage(0);
                tip({
                    type: 'success',
                    content: t('TIP_SUCCESS_PASSWORD_RESET'),
                });
            }
        } catch (e) {
            Sentry.captureException(e)
        }
    };

    const handleForgetPassword = async () => {
        if (!isAllowedTo('forget_password.register.feature')) {
            tip({
                type: 'error',
                content: t('TIP_ERR_LOGINPANEL_FEATURE'),
            });
            return;
        }
        if (!email) {
            tip({
                type: 'error',
                content: t('TIP_ERR_LOGINPANEL_EMAIL_INVALID'),
            });
            return;
        }

        try {
            const captchaToken = await handleCaptchaVerification(turnstileRef, isAllowedTo('captcha.feature'))

            const res = await sendResetCode({ email }, captchaToken);
            if (res.data?.error) {
                throw new Error(res.data.error);
            } else {
                setLoginStage(3);
            }
        } catch (e) {
            Sentry.captureException(e)
        }
    };

    const handlerInputChange = (event) => {
        // setAvatarFile(event.target.files[0])

        const file = event.target.files[0];
        if (file) {
            setNewAvatar(true)
            const maxSize = 20 * 1024 * 1024;
            if (file.size > maxSize) {
                tip({
                    type: 'warning',
                    content: t('TIP_WRAN_LOGINPANEL_FILE_SIZE'),
                });
                return;
            }
            const fileExtension = file.name.split('.').pop().toLowerCase();
            setUploadFileExtension(fileExtension);
            setUploadType('image');
            const reader = new FileReader();
            reader.onload = async (e) => setUploadPreviewUrl(e.target.result)

            reader.readAsDataURL(file);
            setShowUploadPreview(true);
        }
        event.target.value = '';
    };

    return (
        <div className={style.con} ref={conRef} style={{ zIndex: '10000' }}>
            <div className={style.mask} onPointerDown={handleClose} />
            <div
                ref={loginConRef}
                className={`${style.loginCon} ${sidebarVisible ? style.slideIn : ''}`}
            >
                <div className={style.title}>HyperHuman</div>

                {loginStage === 2 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_USERNAME')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_USERNAME_ENTER_PLACEHOLDER')}
                            value={username}
                            onChange={(ev) => setUsername(ev.currentTarget.value)}
                        />
                    </>
                ) : null}

                {loginStage === 0 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_EMAIL_ADDRESS')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_EMAIL_PLACEHOLDER')}
                            value={email}
                            onChange={(ev) => setEmail(ev.currentTarget.value)}
                            data-cy="header-login-email"
                        />
                    </>
                ) : null}

                {loginStage === 0 || loginStage === 2 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_PASSWORD')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_PASSWORD_PLACEHOLDER')}
                            type="password"
                            value={password}
                            onChange={(ev) => setPassword(ev.currentTarget.value)}
                            data-cy="header-login-password"
                        />
                    </>
                ) : null}

                {loginStage === 2 && isAllowedTo('verification.register.feature') ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_VER_CODE')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_EMAIL_VER_CODE_PLACEHOLDER')}
                            value={code}
                            onChange={(ev) => setCode(ev.currentTarget.value)}
                        />
                    </>
                ) : null}

                {loginStage === 3 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_VER_CODE')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_EMAIL_VER_CODE_PLACEHOLDER')}
                            value={resetCode}
                            onChange={(ev) => setResetCode(ev.currentTarget.value)}
                        />
                    </>
                ) : null}

                {loginStage === 3 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_NEW_PASSWORD')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_PASSWORD_PLACEHOLDER')}
                            type="password"
                            value={password}
                            onChange={(ev) => setPassword(ev.currentTarget.value)}
                        />
                    </>
                ) : null}


                {loginStage === 1 || loginStage === 2 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_EMAIL')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_EMAIL_PLACEHOLDER')}
                            value={email}
                            onChange={(ev) => setEmail(ev.currentTarget.value)}
                        />
                    </>
                ) : null}

                {loginStage === 4 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_NEW_USERNAME')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_USERNAME_PLACEHOLDER')}
                            value={newUsername}
                            onChange={(ev) => setNewUsername(ev.currentTarget.value)}
                        />
                        <div className={style.spinerBox}>
                            <div
                                className={style.spiner}
                                style={{
                                    display: upDating ? 'block' : 'none',
                                }}
                            />
                            <button className={style.btn} style={{ cursor: newUsername !== '' ? 'pointer' : 'not-allowed' }} onClick={newUsername !== '' ? handleUpdateInfo : () => { }}>{t('SETTINGS_LOGIN_UPDATE_USERNAME')}</button>
                        </div>
                    </>
                ) : null}

                {loginStage === 5 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_CURRENT_PASSWORD')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_CURRENT_PASSWORD_PLACEHOLDER')}
                            type="password"
                            value={password}
                            onChange={(ev) => setPassword(ev.currentTarget.value)}
                        />
                        <div className={style.label}>{t('SETTINGS_LOGIN_NEW_PASSWORD')}</div>
                        <input
                            className={style.ipt}
                            placeholder={t('SETTINGS_NEW_PASSWORD_PLACEHOLDER')}
                            type="password"
                            value={newPassword}
                            onChange={(ev) => setNewPassword(ev.currentTarget.value)}
                        />

                        <div className={style.spinerBox}>
                            <div
                                className={style.spiner}
                                style={{
                                    display: upDating ? 'block' : 'none',
                                }}
                            />
                            <button className={style.btn} style={{ cursor: newPassword !== '' && password !== '' ? 'pointer' : 'not-allowed' }} onClick={newPassword !== '' && password !== '' ? handleUpdatePassword : () => { }}>{t('SETTINGS_LOGIN_UPDATE_PASSWORD')}</button>
                        </div>
                    </>
                ) : null}
                {loginStage === 6 ? (
                    <>
                        <div className={style.label}>{t('SETTINGS_LOGIN_UPLOAD_NEW_AVATAR')}</div>
                        <label className={style.fileInputWrapper}>
                            {t('SETTINGS_LOGIN_CHOOSE_FILE')}
                            <input
                                className={style.fileInput}
                                type="file"
                                onChange={handlerInputChange}
                                accept=".jpg, .jpeg, .png, .webp, .gif"
                            />
                        </label>
                        {/* {avatarFile && (
              <div>
                <AvatarEditor
                  ref={editorRef}
                  image={avatarFile}
                  width={300}
                  height={300}
                  border={50}
                  borderRadius={150}
                  scale={1.2}
                />
              </div>
            )} */}
                        <div className={`${style.viewer} ${showUploadPreview ? style.showViewer : style.hideViewr}`}>
                            <Viewer
                                src={uploadPreviewUrl}
                                fileSuffix={uploadFileExtension}
                                uploadType={uploadType}
                                cropMode={false}
                                style={{
                                    width: '26rem',
                                    height: '18rem',
                                    borderRadius: '0.5rem',
                                }}
                            />
                        </div>
                        <div className={style.spinerBox}>
                            <div
                                className={style.spiner}
                                style={{
                                    display: upDating ? 'block' : 'none',
                                }}
                            />
                            <button className={style.btn} style={{ cursor: newAvatar ? 'pointer' : 'not-allowed' }} onClick={newAvatar ? handleUpdateAvatar : () => { }}>{t('SETTINGS_LOGIN_UPDATE_AVATAR')}</button>
                        </div>
                    </>
                ) : null}

                {loginStage === 0 ? (
                    <div className={style.remCon}>
                        <input
                            type="checkbox"
                            checked={isRemember}
                            onPointerDown={() => setIsRemember(!isRemember)}
                            onChange={(e) => e}
                        />
                        <span
                            onPointerDown={() => {
                                setIsRemember(!isRemember);
                                _czc.push([
                                    '_trackEvent',
                                    'Pop Up',
                                    'Remember Me',
                                    'Login Panel',
                                ]);
                            }}
                        >
                            {t('SETTINGS_LOGIN_REMEMBER')}
                        </span>
                        <span className={style.spaceholder} />
                        <span
                            onPointerDown={() => {
                                handleForgetPassword();
                                _czc.push([
                                    '_trackEvent',
                                    'Pop Up',
                                    'Forgot Password',
                                    'Login Panel',
                                ]);
                            }}
                            className={style.forgetPassword}
                        >
                            {t('SETTINGS_LOGIN_FORGET_PASSWORD')}?
                        </span>
                    </div>
                ) : null}

                {loginStage === 0 ? (
                    <div
                        className={`${style.btn} ${style.sign}`}
                        onPointerDown={handleLogin}
                        data-cy="header-login-exec"
                    >
                        {t('SETTINGS_LOGIN_SIGN_IN')}
                    </div>
                ) : null}

                {loginStage === 1 ? (
                    <div
                        className={`${style.btn} ${style.sign}`}
                        onPointerDown={handleSendCode}
                    >
                        {t('SETTINGS_LOGIN_SEND_CODE')}
                    </div>
                ) : null}

                {loginStage === 2 ? (
                    <div
                        className={`${style.btn} ${style.sign}`}
                        onPointerDown={() => {
                            handleSignup();
                            _czc.push(['_trackEvent', 'Pop Up', 'Sign Up', 'Login Panel']);
                        }}
                    >
                        {t('SETTINGS_LOGIN_SIGN_UP')}
                    </div>
                ) : null}

                {loginStage === 3 ? (
                    <div
                        className={`${style.btn} ${style.sign}`}
                        onPointerDown={handleResetPassword}
                    >
                        {t('SETTINGS_LOGIN_RESET_PASSWORD')}
                    </div>
                ) : null}

                <br />
                {tips ? (
                    <div className={style.tips}>
                        {tips}
                    </div>
                ) : null}
                {loginStage === 0 || loginStage === 1 ? (
                    <>
                        {isAllowedTo('oauth.login.feature') && (
                            <>
                                <div className={style.splitCon}>
                                    <div className={style.split} />
                                    <div className={style.text}>OR</div>
                                </div>
                                <div
                                    className={`${style.btn} ${style.google}`}
                                    onClick={handleGoogleLogin}
                                >
                                    <img src={googleIcon} alt="google" />
                                    {' '}
                                    &nbsp;Sign in with Google
                                </div>

                                <div
                                    className={`${style.btn} ${style.github}`}
                                    onClick={handleGithubLogin}
                                >
                                    <AiOutlineGithub size="1.5em" />
                                    Sign in with Github
                                </div>
                            </>
                        )}
                    </>
                ) : null}
                <div className={style.spaceholder} />

                {loginStage === 0 ? (
                    <div className={style.foot}>
                        <span
                            onClick={!isAllowedTo('verification.register.feature') ? handleSwitch(2) : handleSwitch(1)}
                            onPointerDown={() => {
                                _czc.push([
                                    '_trackEvent',
                                    'Pop Up',
                                    'Bottom Sign Up',
                                    'Login Panel',
                                ]);
                            }}
                            style={{ fontWeight: 'bold' }}
                        >
                            {t('SETTINGS_LOGIN_SIGN_UP')}
                        </span>
                        {' '}
                        {t('SETTINGS_LOGIN_SIGN_IN_TIP')}!
                    </div>
                ) : null}

                {loginStage === 1 || loginStage === 2 || loginStage === 3 ? (
                    <div className={style.foot}>
                        {t('SETTINGS_LOGIN_SIGN_UP_TIP')}?
                        {' '}
                        <span
                            onClick={handleSwitch(0)}
                            onPointerDown={() => {
                                _czc.push([
                                    '_trackEvent',
                                    'Pop Up',
                                    'Bottom Sign In',
                                    'Login Panel',
                                ]);
                            }}
                            style={{ fontWeight: 'bold' }}
                        >
                            {t('SETTINGS_LOGIN_SIGN_IN')}!
                        </span>
                    </div>
                ) : null}
            </div>
            <Turnstile ref={turnstileRef} siteKey='0x4AAAAAAAg4lvegmJ9lPsyB'
                       style={{ display: "none" }}
                       options={{ appearance: 'interaction-only', execution: 'execute' }}/>
        </div>
    );
}

export { LoginPanel };
