import React, { useEffect, useRef, useState } from 'react';
import {
    useRecoilState,
    useRecoilValue,
    //useSetRecoilState
} from 'recoil';
import QRCode from 'qrcode';
import { useTips } from '../GlobalTips';
import style from './sharePoster.module.css';
import chatAvatarTitle from '../../assets/chatAvatarTitle.jpg';
import {
    chatImageURLAtom,
    currentPreviewIndexAtom,
    promptAtom,
    showSharePopupAtom,
    taskDetailAtom,
    //logInfoAtom,
    //showLoginAtom
} from '../../store';
import { createVideoRequest, getTaskDetail, imaginefacePreview, uploadPoster } from '../../utils/net';
import { TfiTwitterAlt } from "react-icons/tfi";
import { IoMdDownload } from "react-icons/io";
import { TwitterCopywriting, TwitterRodinwriting } from '../../utils/map';
import { checkIsIOS, exportRodinPoster, url2Base64 } from '../../utils/format';
import * as Sentry from "@sentry/react";
import poster from './assets/posterBg.png'
import { useTranslation } from "react-i18next";
import banner from './assets/og-banner-simple.png'

function ShareRender({ qrCodeValue, type, waic, isMobile }) {
    const canvasRef = useRef(null);
    const chatImageURL = useRecoilValue(chatImageURLAtom);
    const taskDetail = useRecoilValue(taskDetailAtom);
    const prompt = useRecoilValue(promptAtom);
    const [loading, setLoading] = useState(true);
    const [loadlength, setLoadlength] = useState(0);
    const currentPreviewIndex = useRecoilValue(currentPreviewIndexAtom);
    const showSharePopup = useRecoilValue(showSharePopupAtom);
    const tip = useTips();
    const [qrCodeImg, setQrCodeImg] = useState(null);
    const { t } = useTranslation();
    const loadedImgUrls = useRef({
        leftUp: 'null',
        leftDown: 'null',
        right: 'null',
    });
    const img = useRef({ leftUp: 'null', leftDown: 'null', right: 'null' });
    const previewImgRef = useRef({
        face: 'null',
        render: 'null',
        renderStatue: 'null',
    });
    const [twitterLoading, setTwitterLoading] = useState(false);

    const setImg = (newImg) => {
        img.current = newImg;
    };

    const setPreviewRefImg = (newImg) => {
        previewImgRef.current = newImg;
    };

    const drawRoundedRect = (ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.fill();
    };

    const posterRender = async (canvas, ctx) => {
        try {
            setImg({
                leftUp: taskDetail.card_poster_info.render_cyber,
                leftDown: taskDetail.card_poster_info.render_geometry,
                right: taskDetail.card_poster_info.render_basic,
            });

            if (type === 'image') {
                const rep4 = await imaginefacePreview(taskDetail.task_uuid);

                if (!rep4.data.files[currentPreviewIndex]) {
                    tip({
                        type: 'error',
                        presetText: 'ERROR',
                        content: t('TIP_ERR_SHAREPOSTER_LOAD_PRE_IMG'),
                    });
                    return;
                }
                setPreviewRefImg({
                    face: rep4.data.files[currentPreviewIndex].face,
                    render: rep4.data.files[currentPreviewIndex].render,
                    renderStatue: rep4.data.files[currentPreviewIndex].render_statue,
                });
            }

            const drawPreviewImg = (src, x, y) => {
                const item = new Image();
                item.crossOrigin = 'anonymous';
                item.src = previewImgRef.current[src];

                item.onload = () => {
                    ctx.save();
                    const size = Math.min(item.width, item.height);
                    const sx = (item.width - size) / 2;
                    const sy = 0;
                    const xLeftUp = x;
                    const yLeftUp = y;
                    const width = 290;
                    const height = 290;
                    const roundRadius = 10;
                    ctx.rect(xLeftUp, yLeftUp, width, height);
                    drawRoundedRect(ctx, xLeftUp, yLeftUp, width, height, roundRadius);
                    ctx.clip();
                    ctx.drawImage(
                        item,
                        sx,
                        sy,
                        size,
                        size,
                        xLeftUp,
                        yLeftUp,
                        width,
                        height,
                    );
                    ctx.restore();
                    // onImageLoaded();
                    setLoadlength(pre => pre + 1)
                };
            };

            // Text Part
            // console.log("Rending Text Part")

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = '24px sans-serif';
            ctx.fillStyle = 'rgb(131, 131, 131)';
            ctx.fillText('Progressive Generation of', 20, 50);
            if (type === 'text') {
                ctx.fillText('Animatable 3D Faces Under Text Guidance', 20, 90);
            } else {
                ctx.fillText('Animatable 3D Faces from Image', 20, 90);
            }
            // const gradient = ctx.createLinearGradient(20, 380, 200, 460);
            // gradient.addColorStop(0, "rgb(177, 161, 231)");
            // gradient.addColorStop(1, "rgb(255, 255, 255)");
            // ctx.fillStyle = gradient;
            // drawRoundedRect(ctx, 28, 186, 440, 40, 10);

            ctx.fillStyle = 'rgb(242, 238, 250)';
            drawRoundedRect(ctx, 20, 256, type === 'text' ? 178 : 215, 70, 10);
            ctx.fillStyle = 'rgb(125, 95, 202)';
            ctx.font = 'bold 30px sans-serif';
            ctx.fillText(type === 'text' ? 'Text to 3D' : 'Image to 3D', 36, 302);

            ctx.font = '23px sans-serif';
            ctx.fillStyle = 'rgb(191, 191, 191)';
            ctx.fillText(
                'Scan QR code (to) get the avatar',
                type === 'text' ? 922 : 820,
                type === 'text' ? 180 : 302,
            );
            ctx.fillText(
                'And generate your own',
                type === 'text' ? 1018 : 915,
                type === 'text' ? 210 : 332,
            );

            // ctx.fillStyle = "rgb(0, 0, 0)";
            // ctx.font = "120px CourierNewCustom";
            // ctx.fillText("ChatAvatar", 20, 214);

            // ctx.beginPath();
            // ctx.fillStyle = "rgb(74, 0, 224)";
            // ctx.lineJoin = "round";
            // ctx.save();
            // ctx.translate(720, 145);
            // ctx.rotate((-60 * Math.PI) / 180);
            // ctx.fillRect(0, 0, 20, 8);
            // ctx.restore();

            // ctx.beginPath();
            // ctx.fillStyle = "rgb(74, 0, 224)";
            // ctx.lineJoin = "round";
            // ctx.save();
            // ctx.translate(730, 150);
            // ctx.rotate((-45 * Math.PI) / 180);
            // ctx.fillRect(0, 0, 30, 8);
            // ctx.restore();

            // ctx.beginPath();
            // ctx.fillStyle = "rgb(74, 0, 224)";
            // ctx.lineJoin = "round";
            // ctx.save();
            // ctx.translate(740, 160);
            // ctx.rotate((-25 * Math.PI) / 180);
            // ctx.fillRect(0, 0, 20, 8);
            // ctx.restore();

            if (type === 'image') {
                ctx.beginPath();
                ctx.moveTo(330, 620);
                ctx.lineTo(355, 660);
                ctx.lineTo(330, 700);
                ctx.lineJoin = 'round';
                ctx.lineWidth = 15;
                ctx.strokeStyle = '#CACACA';
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(355, 620);
                ctx.lineTo(380, 660);
                ctx.lineTo(355, 700);
                ctx.lineJoin = 'round';
                ctx.lineWidth = 15;
                ctx.strokeStyle = '#CACACA';
                ctx.stroke();
            }

            // QR Code Part
            // console.log("Rending QRCode Part")

            qrCodeValue = `http://hyperhuman.deemos.com/${type === 'text' ? 'chatavatar' : 'imageto3d'
                }/${taskDetail.task_uuid}`;
            QRCode.toDataURL(
                qrCodeValue === undefined ? 'https://deemos.com' : qrCodeValue,
                { width: type === 'text' ? 160 : 200, height: type === 'text' ? 160 : 200 },
                (error, url) => {
                    if (error) console.error(error);
                    const qrCodeImg = new Image();
                    qrCodeImg.crossOrigin = 'anonymous';
                    qrCodeImg.src = url;
                    qrCodeImg.onload = () => {
                        ctx.drawImage(
                            qrCodeImg,
                            type === 'text' ? 1120 : 990,
                            type === 'text' ? 2 : 84,
                            type === 'text' ? 160 : 200,
                            type === 'text' ? 160 : 200,
                        );

                        setLoadlength(pre => pre + 1)
                        // onImageLoaded();
                    };
                },
            );

            const titleImg = new Image();
            titleImg.src = chatAvatarTitle;
            titleImg.onload = () => {
                ctx.save();
                const sx = 0;
                const sy = 0;
                const xLeftUp = 20;
                const yLeftUp = 114;
                const width = 820;
                const height = 128;
                const roundRadius = 10;
                ctx.rect(xLeftUp, yLeftUp, width, height);
                drawRoundedRect(ctx, xLeftUp, yLeftUp, width, height, roundRadius);
                ctx.clip();
                ctx.drawImage(
                    titleImg,
                    sx,
                    sy,
                    titleImg.width,
                    titleImg.height,
                    xLeftUp,
                    yLeftUp,
                    width,
                    height,
                );
                ctx.restore();
                setLoadlength(pre => pre + 1)
            };
            // LeftUp Image
            // console.log("Rending LeftUp Image", img.current.leftUp)

            const leftUp = new Image();
            // CORS
            leftUp.crossOrigin = 'anonymous';
            leftUp.src = img.current.leftUp;
            // Onload
            leftUp.onload = () => {
                // console.log("LeftUp Image Onload")
                // Check if same as last loaded image
                if (leftUp.src !== loadedImgUrls.current.leftUp) {
                    // ("Left Up Image Not Repeat", leftUp.src, loadedImgUrls.current.leftUp)
                    loadedImgUrls.current = {
                        ...loadedImgUrls.current,
                        leftUp: leftUp.src,
                    };
                } else {
                    // console.log("Left Up Image Repeat", leftUp.src, loadedImgUrls.current.leftUp)
                }

                // Img Render
                ctx.save();
                const size = Math.min(leftUp.width, leftUp.height);
                const sx = (leftUp.width - size) / 2;
                const sy = 0;
                const xLeftUp = type === 'text' ? 20 : 400;
                const yLeftUp = 360;
                const width = 290;
                const height = 290;
                const roundRadius = 10;

                ctx.rect(xLeftUp, yLeftUp, width, height);
                drawRoundedRect(ctx, xLeftUp, yLeftUp, width, height, roundRadius);
                ctx.clip();
                ctx.drawImage(
                    leftUp,
                    sx,
                    sy,
                    size,
                    size,
                    xLeftUp,
                    yLeftUp,
                    width,
                    height,
                );
                ctx.restore();

                setLoadlength(pre => pre + 1)
                // Image
                // onImageLoaded();
            };

            // LeftDown Image
            // console.log("Rending LeftDown Image")

            const leftDown = new Image();
            leftDown.crossOrigin = 'anonymous';
            leftDown.src = img.current.leftDown;
            leftDown.onload = () => {
                if (leftDown.src !== loadedImgUrls.current.leftDown) {
                    // console.log("Left Up Image Not Repeat", leftDown.src, loadedImgUrls.current.leftDown)
                    loadedImgUrls.current = {
                        ...loadedImgUrls.current,
                        leftDown: leftDown.src,
                    };
                } else {
                    // console.log("Left Up Image Repeat", leftDown.src, loadedImgUrls.current.leftDown)
                }
                ctx.save();
                const size = Math.min(leftDown.width, leftDown.height);
                const sx = (leftDown.width - size) / 2;
                const sy = 0;
                const xLeftUp = type === 'text' ? 20 : 400;
                const yLeftUp = 672;
                const width = 290;
                const height = 290;
                const roundRadius = 10;
                ctx.rect(xLeftUp, yLeftUp, width, height);
                drawRoundedRect(ctx, xLeftUp, yLeftUp, width, height, roundRadius);
                ctx.clip();
                ctx.drawImage(
                    leftDown,
                    sx,
                    sy,
                    size,
                    size,
                    xLeftUp,
                    yLeftUp,
                    width,
                    height,
                );
                ctx.restore();
                setLoadlength(pre => pre + 1)
                // onImageLoaded();
            };

            // Right Image
            // console.log("Rending Right Image")

            const right = new Image();
            right.crossOrigin = 'anonymous';
            right.src = img.current.right;
            right.onload = () => {
                if (right.src !== loadedImgUrls.current.right) {
                    // console.log("Left Up Image Not Repeat", right.src, loadedImgUrls.current.right)
                    loadedImgUrls.current = {
                        ...loadedImgUrls.current,
                        right: right.src,
                    };
                } else {
                    // ("Left Up Image Repeat", right.src, loadedImgUrls.current.right)
                }
                ctx.save();
                const xLeftUp = type === 'text' ? 338 : 718;
                const yLeftUp = 360;
                const width = 460;
                const height = 600;
                const roundRadius = 10;
                drawRoundedRect(ctx, xLeftUp, yLeftUp, width, height, roundRadius);
                ctx.clip();
                ctx.drawImage(right, xLeftUp, yLeftUp, width, height);
                ctx.restore();
                setLoadlength(pre => pre + 1)
                // onImageLoaded();
            };

            // Prompt
            // console.log("Rending Prompt", prompt, "posterPrompt", posterPrompt)

            if (type === 'text') {
                let promptText = '';
                if (prompt !== false) {
                    promptText = prompt;
                } else {
                    promptText = false;
                }

                const maxWidth = 420;
                const ellipsis = '...';
                ctx.fillStyle = 'rgb(248, 248, 248)';
                drawRoundedRect(ctx, 820, 890, 460, 70, 10);
                ctx.fillStyle = 'rgb(170, 170, 170)';
                ctx.font = '20px sans-serif';
                const textMetrics = ctx.measureText(promptText);
                if (textMetrics.width > maxWidth) {
                    let currentWidth = 0;
                    let truncatedText = '';
                    for (let i = 0; i < promptText.length; i++) {
                        const currentChar = promptText[i];
                        const charWidth = ctx.measureText(currentChar).width;
                        if (
                            currentWidth + charWidth + ctx.measureText(ellipsis).width
                            <= maxWidth
                        ) {
                            truncatedText += currentChar;
                            currentWidth += charWidth;
                        } else {
                            break;
                        }
                    }
                    promptText = truncatedText + ellipsis;
                }

                const newTextMetrics = ctx.measureText(promptText);
                const textX = 840 + (maxWidth - newTextMetrics.width) / 2;
                const textY = 934;

                ctx.fillText(promptText, textX, textY);
                // Chat Image
                // console.log("Rending Chat Image")

                const chat = new Image();
                chat.crossOrigin = 'anonymous';
                chat.src = chatImageURL;
                chat.onload = () => {
                    ctx.save();
                    const xLeftUp = 820;
                    const yLeftUp = 360;
                    const width = 460;
                    const height = 520;
                    const roundRadius = 10;
                    drawRoundedRect(ctx, xLeftUp, yLeftUp, width, height, roundRadius);
                    ctx.clip();
                    // console.log("Chat Image Info", chat.width, chat.height)
                    ctx.drawImage(chat, xLeftUp, yLeftUp, width, height);
                    ctx.restore();
                    setLoadlength(pre => pre + 1)
                };
            } else {
                drawPreviewImg('face', 20, 360);
                drawPreviewImg('render', 20, 672);
            }
        } catch (e) {
            Sentry.captureException(e)
            tip({
                type: 'error',
                presetText: 'ERROR',
                content: e.message,
            });
        }
    };

    useEffect(() => {
        if ((type === 'text' && canvasRef.current && chatImageURL && showSharePopup) || (type === 'image' && canvasRef.current && showSharePopup)) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            setLoading(true);
            posterRender(canvas, ctx);
        }

    }, [canvasRef, chatImageURL, showSharePopup]);

    useEffect(() => {
        setLoadlength(0)
    }, [showSharePopup])

    const downloadImage = () => {
        const canvas = canvasRef.current;
        const imageURI = canvas.toDataURL('image/jpeg');
        const link = document.createElement('a');
        link.href = imageURI;
        link.download = 'poster.jpg';
        if (document.body) {
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    useEffect(() => {
        specialEditionQRCode();
    }, [taskDetail]);

    const handleUpload = async (data) => {
        // upload
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
            try {
                const response = await fetch("https://waic.deemos.aigleam.com/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    if (response.status === 409) {
                        return;
                    } else {
                        retryCount++;
                    }
                    continue;
                }
                return;
            } catch (error) {
                Sentry.captureException(error)
                const statusCode = error.response ? error.response.status : null;
                if (statusCode === 409) {
                    return;
                } else {
                    tip({
                        type: 'error',
                        presetText: 'ERROR',
                        content: t('TIP_ERR_SHAREPOSTER_UPLOAD'),
                    });
                    retryCount++;
                }
            }
        }
        console.error("Max retries reached. Upload failed.");
    };

    const specialEditionQRCode = () => {
        qrCodeValue = `https://waic.deemos.aigleam.com/` + taskDetail.task_uuid;
        QRCode.toDataURL(
            qrCodeValue === undefined ? "https://deemos.com" : qrCodeValue,
            { width: 300, height: 300 },
            (error, url) => {
                if (error) console.error(error);
                const qrCodeImg = new Image();
                qrCodeImg.crossOrigin = "anonymous";
                qrCodeImg.src = url;
                setQrCodeImg(qrCodeImg);
            }
        );
    };
    useEffect(() => {
        if (type === 'image' && loadlength >= 7 || type === 'text' && loadlength >= 6) {
            setLoading(false)
        }
    }, [loadlength])
    // eslint-disable-next-line no-unused-vars
    const uploadImage = async () => {
        try {
            const banner = new Image();
            banner.crossOrigin = "anonymous";
            banner.src = window.location.origin + "/assets/banner.jpg";
            let bannerImage = null;
            banner.onload = () => {
                bannerImage = banner;
                const bannerHeight = 241;
                const bannerWidth =
                    (bannerImage.width / bannerImage.height) * bannerHeight;
                const prevCanvas = canvasRef.current;
                const newCanvas = document.createElement("canvas");
                const newCtx = newCanvas.getContext("2d");
                if (newCanvas.width) {
                    newCanvas.width = Math.max(prevCanvas.width, bannerWidth) - 2;
                    newCanvas.height = 1220;
                    newCtx.drawImage(bannerImage, 0, 0, bannerWidth, bannerHeight);
                    newCtx.drawImage(prevCanvas, 0, bannerHeight);
                    const imageURL = newCanvas.toDataURL("image/jpeg", 0.5);
                    const base64Image = imageURL.split(";base64,").pop();
                    const data = {
                        name: `${taskDetail.task_uuid}.png`,
                        body: base64Image,
                    };
                    handleUpload(data);
                } else {
                    throw new Error("Unable to create poster canvas, please refresh and try again")
                }
            };
        } catch (e) {
            Sentry.captureException(e)
        }
    };
    const canvasToBlob = async (canvas, mimeType) => {
        const dataURL = await canvas.toDataURL(mimeType)
        const base64Data = dataURL.split(',')[1];
        const bytes = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(bytes.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.length; i++) {
            uint8Array[i] = bytes.charCodeAt(i);
        }
        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
        return new Blob([arrayBuffer], { type: mimeString });
    }

    const shareToTwitter = async () => {
        //const url = `${window.location.href}/${taskDetail.task_uuid}`;
        setTwitterLoading(true)
        //const url = `${window.location.origin}/${location.pathname.includes('/imageto3d') ? 'imageto3d/' : 'chatavatar/'}${taskDetail.task_uuid}`;
        const url = `https://hyperhuman.deemos.com/poster/${taskDetail.task_uuid}`
        //1300 x 980 --> 两边留白的 1.91宽高比的cavans
        const tempCanvas = document.createElement('canvas');
        const tempWidth = 800
        const tempHeight = 418
        tempCanvas.width = tempWidth
        tempCanvas.height = tempHeight
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = '#fff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        const scaleWidth = canvasRef.current.width / canvasRef.current.height * tempHeight
        const Xstart = (tempWidth - scaleWidth) / 2
        tempCtx.drawImage(canvasRef.current, Xstart, 0, scaleWidth, tempHeight);
        const formData = new FormData();
        const blob = await canvasToBlob(tempCanvas, 'image')
        formData.append('poster', blob);
        await uploadPoster(formData, taskDetail.task_uuid)
        const hashtags = ['ChatAvatar', 'GenerativeAI'];
        const text = TwitterCopywriting[Math.floor(Math.random() * 6)]
        const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags.join(',')}`;
        //ios window.open失效问题 setTimeout 代码在主线程上运行，而不是在异步线程上运行。
        if (checkIsIOS()) {
            let targetGun = document.createElement("a");
            targetGun.href = shareUrl;
            targetGun.click();
        } else {
            window.open(shareUrl, '_blank')
        }
        setTwitterLoading(false)
    }

    const handlerDownloadPoster = (e) => {
        e.stopPropagation();
        downloadImage();
    }

    const getScale = (width) => {
        if (width <= 360) {
            return 0.24
        } else if (width <= 400) {
            return 0.25
        } else if (width <= 430) { //iphone 14 pro max
            return 0.27
        } else {
            return 0.28
        }
    }

    const sizeObj = isMobile ? {
        canvasBoxWidth: "80vw",
        canvasBoxHeight: 'calc(80vw / 1.2)',
        loadingOverlayWidth: "80vw",
        loadingOverlayHeight: 260,
        canvasWidth: type === 'text' ? 1300 : 1200,
        canvasHeight: 980,
        canvasTransform: `scale(${getScale(document.body.clientWidth)})`,
        canvasMargin: "0 auto",
        btnsWight: "100%",
        btnsMarginTop: 8,
        twitterImgBtnWidth: type === 'text' ? "87%" : '85%',
    } : {
        canvasBoxWidth: "390px",
        canvasBoxHeight: "288px",
        loadingOverlayHeight: "288px",
        loadingOverlayWidth: type === 'text' ? 460 : 405,
        canvasWidth: type === 'text' ? 1300 : 1200,
        canvasHeight: 980,
        canvasTransform: 'scale(0.35)',
        canvasMargin: "40px auto 0",
        btnsWight: type === 'text' ? '455px' : '405px',
        btnsMarginTop: 60,
        twitterImgBtnWidth: type === 'text' ? "87%" : '85%',
    }

    return (
        <>
            {waic && !loading && (
                <div className={style.qrBox}
                    style={{
                        width: type === 'text' ? 460 : 405,
                    }}>
                    {qrCodeImg && (
                        <img
                            src={qrCodeImg.src}
                            style={{ marginTop: "35px" }}
                            alt="QR Code"
                        />
                    )}
                </div>
            )}
            {loading && (
                <div
                    style={{
                        height: sizeObj.loadingOverlayHeight,
                        width: sizeObj.loadingOverlayWidth
                    }}
                    className={style.loadingOverlay} >
                    Loading...
                </div>
            )}

            <div className={style.shareBox}>
                <div className={style.canvasBox} style={{
                    width: sizeObj.canvasBoxWidth,
                    height: sizeObj.canvasBoxHeight,
                }}>
                    <canvas
                        ref={canvasRef}
                        width={sizeObj.canvasWidth}
                        height={sizeObj.canvasHeight}
                        style={{
                            transform: sizeObj.canvasTransform,
                            margin: sizeObj.canvasMargin,
                        }}
                    />
                </div>
                <div
                    className={style.btns}
                    style={{
                        width: sizeObj.btnsWight,
                        marginTop: sizeObj.btnsMarginTop
                    }}>
                    <button
                        id='twitter-share-button'
                        className={style.twitterImgBtn}
                        style={{
                            width: sizeObj.twitterImgBtnWidth,
                        }}
                        onClick={shareToTwitter}>
                        <TfiTwitterAlt fontSize='20px' className='absolute ml-[100px]'/>
                        <span>
                            {twitterLoading ? 'Loading...' : 'Twitter'}
                        </span>
                    </button>
                    <button onClick={handlerDownloadPoster} className={style.downloadImgBtn}>
                        <IoMdDownload fontSize='20px' />
                    </button>
                </div>
            </div>
        </>
    );
}

export const RodinPoster = ({ setShareOpen }) => {
    const [taskDetail, setTaskDetail] = useRecoilState(taskDetailAtom);
    const [loading, setLoading] = useState(true);
    const [loadImg, setLoadImg] = useState(0)
    const [currentIndex, setCurrentIndex] = useState(0);
    // const genPipeline = useRecoilValue(rodinGenPipeline);
    const [download, setDownload] = useState(false)
    const posterRef = useRef(null)
    const shareRef = useRef(null)
    const animationRef = useRef(null)
    const [twitterImg,setTwitterImg]=useState(false)
    const [twitterLoading, setTwitterLoading] = useState(false);
    const tip = useTips();
    const { t } = useTranslation();
    const [posterInfo, setPosterInfo] = useState({
        qrInfo: {
            url: '',
            base64: ''
        },
        previewInfo: {
            url: taskDetail?.rodin_generate_info?.mesh_input_images['0000.png'],
            base64: ""
        },
        prompt: taskDetail.prompt,
        url_arr: [],

    })
    const fetchImg = async () => {
        const qr = `http://hyperhuman.deemos.com/rodin/${taskDetail.task_uuid}`
        QRCode.toDataURL(qr, { margin: 2, width: 200 }, (err, qr) => {
            if (err) return console.error(err);

            url2Base64(qr).then((qrBase64) => {
                setPosterInfo(pre => {
                    return {
                        ...pre,
                        qrInfo: {
                            url: qr,
                            base64: qrBase64
                        }
                    }
                })
            })
            const card_poster_info = taskDetail?.card_poster_info
            const oldUrls = [...posterInfo.url_arr]
            // const keys = Object.keys(card_poster_info).filter((i) => i !== 'render_video')
            if (taskDetail.step === 'ModelGenerate') {
                url2Base64(taskDetail.image_url).then((base64) => {
                    setPosterInfo(pre => {
                        return {
                            ...pre,
                            url_arr: [{
                                type: 'preview',
                                url: taskDetail.image_url,
                                base64: base64
                            }]
                        }
                    })
                })
            } else {
                const preferredOrder = ['material_video', 'material_image', 'geometry_video', 'geometry_image', 'preview_image'];
                const sortedKeys = preferredOrder.filter(key => key in card_poster_info);
                sortedKeys.map((item) => {
                    const tempObj = {
                        type: item,
                        url: card_poster_info[item],
                        base64: ''
                    }

                    if (tempObj.url !== 'FILE_NOT_FOUND') {
                        if (['geometry_image', 'material_image', 'preview_image'].includes(item)) {
                            url2Base64(tempObj.url).then((base64) => {
                                tempObj.base64 = base64
                                oldUrls.push(tempObj)
                            })
                        } else {
                            oldUrls.push(tempObj)
                        }
                        setPosterInfo(pre => {
                            return {
                                ...pre,
                                url_arr: oldUrls
                            }
                        })
                    }
                })
            }

            url2Base64(posterInfo.previewInfo.url).then((previewBase64) => {
                setPosterInfo(pre => {
                    return {
                        ...pre,
                        previewInfo: {
                            ...pre.previewInfo,
                            base64: previewBase64
                        }
                    }
                })
            })
        });
    }

    const handleOutsideClick = (e) => {
        if (download) {
            tip({
                type: 'primary',
                content: t('TIP_PRIMARY_SHAREPOSTER_BEING_DOWN')
            })
            return
        }
        if (shareRef.current && !shareRef.current.contains(e.target)) {
            setShareOpen(false);
        }
    };

    useEffect(() => {
        fetchImg()
    }, [taskDetail])

    const updateTaskDetail = async () => {
        const rep = await getTaskDetail(taskDetail.task_uuid);
        if (!rep?.data?.type) {
            throw new Error('getTaskDetail error');
        }
        setTaskDetail(rep.data);
    }

    useEffect(() => {
        updateTaskDetail()
        window.addEventListener('click', handleOutsideClick);
        return () => {
            window.removeEventListener('click', handleOutsideClick);
        };
    }, [])

    useEffect(() => {
        if (animationRef?.current?.style?.opacity) {
            animationRef.current.style.opacity = 0.5
            setTimeout(() => {
                animationRef.current.style.opacity = 1
            }, 150);
        }
    }, [currentIndex])

    const downloadVideo = async (videoData) => {
        try {
            const videoBlob = await createVideoRequest(videoData);
            const downloadUrl = window.URL.createObjectURL(videoBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', 'share.mp4');
            document.body.appendChild(link);
            link.click();

            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Failed to download video:', error);
        }
    }

    const handlerDownloadPoster = async (e) => {
        e.stopPropagation();
        setDownload(true)

        if (['geometry_image', 'material_image', 'preview', 'preview_image'].includes(posterInfo.url_arr[currentIndex]?.type)) {
            await exportRodinPoster(posterRef.current, 'poster.png')
            setDownload(false)
        } else {

            const videoData = {
                video_url: posterInfo?.url_arr[currentIndex]?.url,
                assert_url: `http://hyperhuman.deemos.com/rodin/${taskDetail.task_uuid}`,
                preview_img_url: posterInfo.previewInfo.url,
                prompt: posterInfo.prompt
            };
            await downloadVideo(videoData);
            setDownload(false)
        }
    }

    const handlePosterLoad = () => {
        setLoadImg(pre => pre + 1)
    }

    useEffect(() => {
        setLoading(loadImg < 3)
    }, [loadImg])

    const handleSub = (e) => {
        e.stopPropagation()
        setCurrentIndex(pre => pre - 1 < 0 ? posterInfo.url_arr.length - 1 : pre - 1)
    }

    const handleAdd = (e) => {
        e.stopPropagation()
        setCurrentIndex(pre => pre + 1 > posterInfo.url_arr.length - 1 ? 0 : pre + 1)
    }

    const handleCloseShare = (e) => {
        e.stopPropagation()
        if (download) {
            tip({
                type: 'primary',
                content: t('TIP_PRIMARY_SHAREPOSTER_BEING_DOWN')
            })
            return
        }
        setShareOpen(false)
    }

    const canvasToBlob = async (canvas, mimeType) => {
        const dataURL = await canvas.toDataURL(mimeType)
        const base64Data = dataURL.split(',')[1];
        const bytes = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(bytes.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.length; i++) {
            uint8Array[i] = bytes.charCodeAt(i);
        }
        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
        return new Blob([arrayBuffer], { type: mimeString });
    }

    const shareToTwitter = async () => {
        if(posterRef.current){
            setTwitterLoading(true)
            const url = `https://hyperhuman.deemos.com/poster/${taskDetail.task_uuid}`
            //1300 x 980 --> 两边留白的 1.91宽高比的cavans
            const tempCanvas = document.createElement('canvas');
            const tempWidth = 800
            const tempHeight = 418
            tempCanvas.width = tempWidth
            tempCanvas.height = tempHeight
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = '#fff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            const scaleWidth = posterRef.current.clientWidth / posterRef.current.clientHeight * tempHeight
            // const Xstart = tempWidth - scaleWidth
            if(posterInfo.url_arr.length>1){
                setTwitterImg(true)
            }
            import('html-to-image').then(htmlToImage => {
                htmlToImage.toPng(posterRef.current, {pixelRatio: 3})
                    .then((dataUrl) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.src = dataUrl
                        img.onload = async () => {
                            const newCanvas = document.createElement('canvas');
                            newCanvas.width = img.width
                            newCanvas.height = img.height
                            newCanvas.getContext('2d').drawImage(img, 0, 0)
                            tempCtx.drawImage(newCanvas, tempWidth - scaleWidth, 0, scaleWidth, tempHeight)
                            const image = new Image();
                            image.crossOrigin = 'anonymous';
                            image.src = banner
                            image.onload = async () => {
                                const newCanvas = document.createElement('canvas');
                                newCanvas.width = image.width
                                newCanvas.height = image.height
                                newCanvas.getContext('2d').drawImage(image, 0, 0)
                                tempCtx.drawImage(newCanvas, 0, 0, tempWidth - scaleWidth, tempHeight)
                                setTwitterImg(false)
                                const formData = new FormData();
                                const blob = await canvasToBlob(tempCanvas, 'image')
                                formData.append('poster', blob);
                                const res = await uploadPoster(formData, taskDetail.task_uuid)
                                if (res && res.data) {
                                    const index = Math.floor(Math.random() * 5)
                                    const text = TwitterRodinwriting[index]
                                    let hashtags = ['RodinGen1', 'GenerativeAI'];
                                    if (index === 0 || index === 3) {
                                        hashtags = ['RodinGen1', 'GenerativeAI', '3DAssets'];
                                    }
                                    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags.join(',')}`;
                                    //ios window.open失效问题 setTimeout 代码在主线程上运行，而不是在异步线程上运行。
                                    if (checkIsIOS()) {
                                        let targetGun = document.createElement("a");
                                        targetGun.href = shareUrl;
                                        targetGun.click();
                                    } else {
                                        window.open(shareUrl, '_blank')
                                    }
                                    setTwitterLoading(false)
                                }
                            }


                        }
                    })
            })
            
        }
        
    }

    return (
        <>
            <div className='fixed w-[100vw] h-[100vh] z-[10000]' onClick={handleCloseShare}></div>
            <div ref={shareRef} className='w-[246px] h-[400px] xs:w-[300px] xs:h-[470px] sm:w-[360px] sm:h-[564px] md:w-[393px] md:h-[639px] lg:w-[450px] lg:h-[725px] bg-white pb-4 [box-shadow:0_0_10px_10px_rgba(0,0,0,0.2)] flex flex-col items-center justify-between rounded-lg absolute right-0 bottom-0 z-[20000] translate-y-[100%]'>
                {loading && <div className='w-full h-full absolute top-0 left-0 flex items-center justify-center backdrop-blur-sm text-[#333] z-[30000] opacity-80 bg-[rgba(255,255,255,0.5)] rounded-xl text-[16px]' >  Loading... </div>}
                {/* <canvas ref={testRef}></canvas> */}
                <div ref={posterRef} className='flex flex-col items-center'>
                    <img onLoad={handlePosterLoad} style={{ display: poster ? 'block' : 'none' }} src={poster} alt='poster' className={`w-full h-auto transition-300-ease ${loading ? 'opacity-0' : 'opacity-100'}`} />
                    {posterInfo.qrInfo.base64 && (
                        <div className='absolute w-[41px] h-[41px] xs:w-[50px] xs:h-[50px] sm:w-[64px] sm:h-[64px] md:w-[67px] md:h-[67px] lg:w-[80px] lg:h-[80px] right-[10px] top-[9px] md:top-[15px] md:right-[15px] rounded-md'>
                            <img onLoad={handlePosterLoad} style={{ display: posterInfo?.qrInfo?.base64 ? 'block' : 'none' }} className='w-full h-full' src={posterInfo.qrInfo.base64} />
                        </div>
                    )}
                    <div ref={animationRef} className='w-[226px] h-[226px] xs:w-[275px] xs:h-[275px] sm:w-[330px] sm:h-[330px] md:w-[361px] md:h-[361px] lg:w-[413px] lg:h-[413px] top-[77px] xs:top-[94px] sm:top-[114px] md:top-[124px] lg:top-[140px] rounded overflow-hidden absolute-x-center  transition-300-ease'>
                        {!twitterImg && posterInfo.url_arr.length && (
                            ['geometry_image', 'material_image', 'preview', 'preview_image'].includes(posterInfo.url_arr[currentIndex]?.type) || posterInfo.url_arr.length === 1
                                ? <img onLoad={handlePosterLoad} alt='poster' style={{ display: posterInfo?.url_arr[currentIndex]?.base64 ? 'block' : 'none' }} src={posterInfo.url_arr[currentIndex].base64} className={`w-full h-full absolute-center rounded transition-300-ease`} />
                                : <video className={`w-full h-full rounded transition-300-ease`} style={{ display: posterInfo?.url_arr[currentIndex]?.url ? 'block' : 'none' }} src={posterInfo.url_arr[currentIndex].url} muted={true} loop={true} autoPlay={true} />
                        )}
                        {twitterImg && <img alt='preposter' src={taskDetail.image_url} className={`block w-full h-full absolute-center rounded transition-300-ease`} />}
                        {posterInfo.url_arr?.length > 1 &&
                            <div id='remove-me' className='z-10 w-[48px] h-[20px] xs:w-[56px] xs:h-[24px] sm:w-[60px] sm:h-[28px] md:w-[72px] md:h-[32px] py-[2px] px-[5px] flex justify-between items-center bg-[rgba(255,255,255,0.2)] rounded-lg sm:rounded-[10px] backdrop-blur-sm absolute-x-center bottom-4'>
                                <div className='group/left h-full w-auto aspect-square flex-center cursor-pointer' onClick={handleSub}>
                                    <div className='w-2/5 h-2/5  -rotate-45 border-[3px] group-hover/left:border-[#eee] transition-300-ease  border-[rgba(200,200,200,0.3)] !border-r-transparent !border-b-transparent rounded-sm'></div>
                                </div>
                                <div className='h-[60%] w-[2px] bg-[rgba(200,200,200,0.3)]'></div>
                                <div className='group/right h-full w-auto aspect-square flex-center cursor-pointer' onClick={handleAdd}>
                                    <div className='w-2/5 h-2/5 -rotate-45 border-[3px] group-hover/right:border-[#eee] transition-300-ease border-[rgba(200,200,200,0.3)] !border-l-transparent !border-t-transparent rounded-sm'></div>
                                </div>
                            </div>
                        }
                    </div>

                    {posterInfo.previewInfo.base64 && <div className='absolute w-[42px] h-[42px] xs:w-[50px] xs:h-[50px] sm:w-[65px] sm:h-[65px] md:w-[67px] md:h-[67px] lg:w-[80px] lg:h-[80px] bg-white left-[10px] bottom-[50px] xs:bottom-[45px] sm:bottom-[50px] md:bottom-[78px] lg:bottom-[80px] md:left-[20px] lg:left-[18px] rounded-md'>
                        <img onLoad={handlePosterLoad} style={{ display: posterInfo?.previewInfo?.base64 ? 'block' : 'none' }} className='w-full h-full' src={posterInfo.previewInfo.base64} />
                    </div>}
                    {posterInfo.prompt && <div className='absolute h-[42px] w-[180px] xs:w-[220px] xs:h-[50px] sm:w-[268px] sm:h-[64px] md:w-[287px] md:h-[67px] lg:w-[329px] lg:h-[80px] bg-[#f8f8f8] right-[10px] bottom-[50px] xs:bottom-[45px] sm:bottom-[50px] md:right-[15px] lg:right-[18px] md:bottom-[78px] lg:bottom-[80px] text-left rounded-md overflow-hidden'>
                        <div className='text-[#5d5d5d] text-xs sm:text-sm pl-2 font-bold flex-1'>Generation prompt</div>
                        <div className='text-[#999] text-xxs sm:text-xs pl-2 flex-[2.5] [-webkit-line-clamp:2;] lg:[-webkit-line-clamp:3;] [-webkit-box-orient:vertical;] text-ellipsis overflow-hidden [display:-webkit-box;]'>{posterInfo.prompt}</div>
                    </div>}
                </div>

                <div className='flex w-full justify-around px-2'>
                    <button
                        className='w-[85%] text-[white] rounded-[20px] h-[30px] xs:h-[25px] sm:h-[30px] md:h-[35px] lg:h-[40px] border-[1px] border-solid border-[#4a00e0] bg-[#4a00e0] px-[16px] py-[0] text-[18px] cursor-pointer text-center flex items-center leading-[40px] [transition:color_0.3s_ease,_border-color_0.3s_ease] hover:bg-white hover:text-[rgba(74,0,224,1)] hover:border-[rgba(74,0,224,1)]'
                        onClick={shareToTwitter}>
                        <TfiTwitterAlt fontSize='20px' className='absolute ml-[35px] xs:ml-[55px] sm:ml-[85px] md:ml-[95px] lg:ml-[105px]'/>
                        <span className='ml-[70px] xs:ml-[90px] sm:ml-[120px] md:ml-[130px] lg:ml-[140px]'>
                            {twitterLoading ? 'Loading...' : 'Twitter'}
                        </span>
                    </button>
                    <button onClick={handlerDownloadPoster} className='flex justify-center items-center aspect-square h-[30px] xs:h-[25px] sm:h-[30px] md:h-[35px] lg:h-[40px] border border-[#DBDBDB] text-[#A3A3A3] bg-white rounded-[20px] relative transition-300-ease hover:bg-[white] hover:border-[rgba(74,0,224,1)] hover:text-[rgba(74,0,224,1)]'>
                    {download ?
                        <>
                            <span className='loading-text-animation text-screen-sm'>&#9679;</span>
                            <span className='loading-text-animation animation-delay-1 text-screen-sm'>&#9679;</span>
                            <span className='loading-text-animation animation-delay-1 text-screen-sm'>&#9679;</span>
                        </> :
                        <IoMdDownload fontSize='20px' />}
                </button>
                </div>
            </div>
        </>

    )
}

export default ShareRender;
