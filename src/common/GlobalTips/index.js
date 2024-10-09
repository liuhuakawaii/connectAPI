import React from 'react';
import { useRecoilState } from 'recoil';
import {
    IoAlertCircleOutline,
    IoCheckmarkCircleOutline,
    IoClose,
    IoInformationCircleOutline,
    IoWarningOutline,
} from 'react-icons/io5';
import style from './tips.module.css';
import { tipsAtom, } from '../../store'

const presetTexts = {
    ERROR: 'Oops, something went wrong. Please try again later.',
    INSUFFICIENT_BALANCE: 'The operation cannot be completed due to insufficient funds in your account.',
};

const typeToIconColor = {
    error: { icon: IoAlertCircleOutline, color: 'rgb(189, 77, 69)' },
    warning: { icon: IoWarningOutline, color: 'rgb(240, 173, 78)' },
    success: { icon: IoCheckmarkCircleOutline, color: 'rgb(92, 184, 92)' },
    primary: { icon: IoInformationCircleOutline, color: 'rgb(144, 111, 240)' },
};

const useTips = () => {
    const [tips, setTips] = useRecoilState(tipsAtom);

    return (newTip) => {
        newTip.id = Date.now();
        if (newTip.presetText && presetTexts[newTip.presetText]) {
            if (newTip.presetText === 'ERROR' && newTip.content) {
                newTip.content = `${presetTexts[newTip.presetText]} (${newTip.content})`;
            } else {
                newTip.content = presetTexts[newTip.presetText];
            }
        }
        if (tips.find((item) => item.content === newTip.content)) return
        newTip.timeoutId = setTimeout(() => {
            setTips((currentTips) => currentTips.filter((tip) => tip.id !== newTip.id));
        }, 5000)
        setTips([...tips, newTip]);
    };
};



const GlobalTips = React.memo(() => {
    const [tips, setTips] = useRecoilState(tipsAtom);

    const handleYes = (yes, tipId) => async () => {
        await yes();
        setTips(tips.filter((tip) => tip.id !== tipId));
    };
    const handleNo = (no, tipId) => async () => {
        await no();
        setTips(tips.filter((tip) => tip.id !== tipId));
    };

    const onMouseEnter = (tip) => {
        clearTimeout(tip.timeoutId);
    }

    const onMouseLeave = (tip) => {
        const newTips = [...tips]
        const updatedTip = Object.assign({}, tip);
        const index = newTips.findIndex((item) => tip.id === item.id)
        updatedTip.timeoutId = setTimeout(() => {
            setTips((currentTips) => currentTips.filter((cTip) => cTip.id !== tip.id));
        }, 5000)
        newTips[index] = updatedTip;
        setTips(newTips)
    }

    const handlerCloseTips = (tip) => setTips(tips.filter((t) => t.id !== tip.id))

    return (
        <div className={style.tipsCon}>
            {tips.map((tip) => (
                <div
                    className={style.tip}
                    style={{
                        backgroundColor: typeToIconColor[tip?.type ? tip?.type : 'primary']?.color,
                        top: ``
                    }}
                    key={tip.id}
                    onMouseEnter={onMouseEnter.bind(null, tip)}
                    onMouseLeave={onMouseLeave.bind(null, tip)}
                >
                    <div className={style.row1}>
                        <div className={style.contentWrapper}>
                            <div className={style.icon}>
                                {React.createElement(typeToIconColor[tip?.type ? tip?.type : 'primary']?.icon, {
                                    style: { color: 'white' },
                                })}
                            </div>
                            <div className={style.notificationMessage}>{tip.content}</div>
                        </div>
                        {tip.yes && tip.no ? null : (
                            <IoClose
                                className={style.close}
                                onClick={handlerCloseTips.bind(null, tip)}
                            />
                        )}
                    </div>
                    {tip.yes && tip.no ? (
                        <div className={style.row2}>
                            <div
                                className={`${style.btn} ${style.yes}`}
                                onPointerDown={handleYes(tip.yes, tip.id)}
                            >
                                OK
                            </div>
                            <div
                                className={`${style.btn}`}
                                onPointerDown={handleNo(tip.no, tip.id)}
                            >
                                Cancel
                            </div>
                        </div>
                    ) : null}
                </div>
            ))}
        </div>
    );
})
GlobalTips.displayName = "GlobalTips"
export { GlobalTips, useTips };
