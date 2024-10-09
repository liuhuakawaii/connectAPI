import React, { useEffect, useState } from 'react';
import { AiOutlineCopy, AiOutlineTool, AiOutlineApi } from 'react-icons/ai';
import { handleLogout } from '../../utils/auth';
import { MdDisplaySettings } from "react-icons/md";
import { useTips } from "../../common/GlobalTips";
import { MdOutlineFeedback } from "react-icons/md";
import * as Sentry from "@sentry/react";
import { useTranslation } from "react-i18next";
import { useSetRecoilState } from 'recoil';
import { chatLangAtom, showLoginAtom } from '../../store'
import { formatDistanceToNow, parseISO } from 'date-fns';

const BACKEND_ADDR = {
    'Production': 'https://hyperhuman.deemos.com/api',
    'Development Proxy': 'https://hyperhuman-backend.dev.deemos.com/api',
    'Development Direct': 'http://10.219.33.10:3005/api',
    'Local': 'http://127.0.0.1:3005/api',
};

function DevPanel() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [pos, setPos] = useState({ x: innerWidth - 50, y: innerHeight / 2 - 80 });
    const [activeComponent, setActiveComponent] = useState(null);

    const options = [
        { icon: <AiOutlineApi />, onMouseEnter: () => setActiveComponent('EndpointSetting') },
        { icon: <AiOutlineTool />, onMouseEnter: () => setActiveComponent('Toolkit') },
        { icon: <MdOutlineFeedback />, onMouseEnter: () => setActiveComponent('Feedback') },
    ];

    useEffect(() => {
        const handleResize = () => {
            setPos({ x: innerWidth - 50, y: innerHeight / 4 });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setIsExpanded(activeComponent !== null);
    }, [activeComponent]);

    return (
        <>
            <div
                onMouseEnter={() => setActiveComponent(activeComponent)}
                onMouseLeave={() => setActiveComponent(null)}
                className="fixed right-0 top-1/3 p-2.5 bg-opacity-80 z-5000 transition-all duration-300 ease-in-out"
                style={{ border: '1px solid rgba(235, 230, 239, 0.15)', width: '3rem', height: isExpanded ? `${4 + 2.5 * options.length}rem` : '3rem', background: 'rgb(41, 35, 47)', borderRadius: isExpanded ? '0.5rem' : '100%', left: pos.x + 'px', top: pos.y + 'px' }}
            >
                <div className="flex flex-col justify-center items-center h-full">
                    <div className="text-white text-2xl" onMouseEnter={() => setActiveComponent('InfoBox')}>
                        <MdDisplaySettings />
                    </div>

                    {isExpanded && (
                        <>
                            <div className="w-full border-t border-gray-600 mt-4 opacity-50"></div>
                            <div className="absolute left-[-300px] top-0 w-[300px] h-full bg-transparent"></div>
                        </>
                    )}

                    {isExpanded && options.map((option, index) => (
                        <React.Fragment key={index}>
                            <div className="mt-4 cursor-pointer p-0 text-2xl text-white"
                                onMouseEnter={option.onMouseEnter}>
                                {option.icon}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
            {activeComponent === 'InfoBox' && (
                <InfoBox pos={pos} setActiveComponent={setActiveComponent} />
            )}
            {activeComponent === 'EndpointSetting' && (
                <EndpointSetting pos={pos} setActiveComponent={setActiveComponent} />
            )}
            {activeComponent === 'Toolkit' && (
                <Toolkit pos={pos} setActiveComponent={setActiveComponent} />
            )}
            {activeComponent === 'Feedback' && (
                <Feedback pos={pos} setActiveComponent={setActiveComponent} />
            )}
        </>
    );
}

function Feedback({ pos, setActiveComponent }) {
    const tip = useTips();
    const { t } = useTranslation();
    const sendFeedback = async () => {
        const eventId = Sentry.captureMessage("Internal Feedback");
        const feedback = { event_id: eventId };
        tip({
            type: "primary",
            content: "Event ID: " + eventId + ". " + t('TIP_PRIMARY_COPIED')
        });
        navigator.clipboard.writeText(`Event: ${eventId}`);
        Sentry.captureEvent(feedback);
    };

    return (
        <div
            onMouseEnter={() => setActiveComponent('Feedback')}
            onMouseLeave={() => setActiveComponent(null)}
            className="fixed left-0 top-1/3 p-3 bg-opacity-80 z-5000 transition-all duration-300 ease-in-out"
            style={{
                border: '1px solid rgba(235, 230, 239, 0.15)',
                width: '12rem',
                height: 'auto',
                background: 'rgb(41, 35, 47)',
                borderRadius: '0.5rem',
                left: (pos.x - 200) + 'px',
                top: pos.y + 'px'
            }}
        >
            <button onClick={sendFeedback} className="text-white bg-gray-700 hover:bg-gray-600 p-1 rounded text-sm w-full">
                Send Logs and Traces
            </button>
        </div>
    );
}

function InfoBox({ pos, setActiveComponent }) {
    const tip = useTips();
    const { t } = useTranslation();
    const commitTime = process.env.REACT_APP_COMMIT_TIMESTAMP ? formatDistanceToNow(parseISO(process.env.REACT_APP_COMMIT_TIMESTAMP), { addSuffix: true }) : 'N/A';

    const copyInfo = () => {
        navigator.clipboard.writeText(`Release Channel: ${process.env.REACT_APP_VERSION || 'local'}\nSHA: ${process.env.REACT_APP_COMMIT_SHA || 'N/A'}`);
        tip({
            type: "primary",
            content: t('TIP_PRIMARY_DEBPANEL_CLIP')
        });
    };

    return (
        <div
            onMouseEnter={() => setActiveComponent('InfoBox')}
            onMouseLeave={() => setActiveComponent(null)}
            className="fixed left-0 top-1/3 p-2.5 bg-opacity-80 z-5000 transition-all duration-300 ease-in-out"
            style={{
                border: '1px solid rgba(235, 230, 239, 0.15)',
                width: '12rem',
                height: 'auto',
                background: 'rgb(41, 35, 47)',
                borderRadius: '0.5rem',
                left: (pos.x - 200) + 'px',
                top: pos.y + 'px'
            }}
        >
            <h1 className="text-left text-white p-1">Workbench</h1>
            <h2 className="text-left text-white pl-1">Release Info</h2>
            <div className="text-white text-xs text-left p-1">
                <p>Release Channel: {process.env.REACT_APP_VERSION || 'local'}</p>
                <p>Commit
                    SHA: {process.env.REACT_APP_COMMIT_SHA ? process.env.REACT_APP_COMMIT_SHA.slice(0, 7) : 'N/A'}</p>
                <p>Branch: {process.env.REACT_APP_COMMIT_BRANCH ? process.env.REACT_APP_COMMIT_BRANCH.slice(0, 15) : 'N/A'}</p>
                <p>Triggered
                    By: {process.env.REACT_APP_COMMIT_USER ? process.env.REACT_APP_COMMIT_USER.slice(0, 15) : 'N/A'}</p>
                <p>Time: {commitTime}</p>
                {/*<p>Message: {process.env.REACT_APP_COMMIT_MESSAGE ? process.env.REACT_APP_COMMIT_MESSAGE.slice(0, 15) : 'N/A'}</p>*/}
            </div>
            <h2 className="text-left text-white pl-1">Endpoint</h2>
            <div className="text-white text-xs text-left p-1">
                <p>{localStorage.getItem("backend") || 'default'}</p>
            </div>
            <button onClick={copyInfo} className="absolute right-20 top-5 text-xs text-white">
                <AiOutlineCopy />
            </button>
        </div>
    );
}

function EndpointSetting({ pos, setActiveComponent }) {
    const [selectedBackend, setSelectedBackend] = useState(localStorage.getItem('backend') || 'Default');
    const [customBackend,setCustomBackend]=useState(localStorage.getItem('backend')==='Custom'?localStorage.getItem('backendURL'):false)
    const handleBackendChange = (backend) => {
        handleLogout();
        setSelectedBackend(backend);
        localStorage.setItem('backend', backend);
        localStorage.setItem('backendURL', BACKEND_ADDR[backend]);
        window.location.reload();
    };

    const changeInput=(e)=>{
        if(e.target.value){
            setCustomBackend(e.target.value)
        }else{
            setCustomBackend(false)
        }
    }

    const changeBackend =()=>{
        if(customBackend){
            handleLogout();
            setSelectedBackend('Custom');
            localStorage.setItem('backend', 'Custom');
            localStorage.setItem('backendURL', customBackend);
            window.location.reload();
        }
    }

    return (
        <div
            onMouseEnter={() => setActiveComponent('EndpointSetting')}
            onMouseLeave={() => setActiveComponent(null)}
            className="fixed left-0 top-1/3 p-3 pb-4 bg-opacity-80 z-5000 transition-all duration-300 ease-in-out"
            style={{
                border: '1px solid rgba(235, 230, 239, 0.15)',
                width: '12rem',
                height: 'auto',
                background: 'rgb(41, 35, 47)',
                borderRadius: '0.5rem',
                left: (pos.x - 200) + 'px',
                top: pos.y + 'px'
            }}
        >
            <p className="text-sm text-left text-gray-400 mb-2">API Endpoint</p>
            <div className="grid grid-cols-1 gap-2">
                <input value={customBackend?customBackend:''} onChange={changeInput} onBlur={changeBackend} className={`text-white p-2 rounded text-sm w-full ${selectedBackend === 'Custom' ? 'bg-gray-500' : 'bg-gray-700'}`}/>
                {Object.keys(BACKEND_ADDR).map((key) => (
                    <button
                        key={key}
                        onClick={() => handleBackendChange(key)}
                        className={`text-white p-1 rounded text-sm w-full ${selectedBackend === key ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'}`}

                    >
                        {key}
                    </button>
                ))}
            </div>
        </div>
    );
}


function Toolkit({ pos, setActiveComponent }) {
    const { i18n } = useTranslation();
    const [, setLanguage] = useState("en");
    const setChatLang = useSetRecoilState(chatLangAtom);
    const setShowLogin = useSetRecoilState(showLoginAtom);

    const clearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        caches.keys().then(names => {
            for (let name of names) caches.delete(name);
        });
        alert('Cache cleared');
    };

    const switchLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setLanguage(lang)
        if (lang === 'en') {
            setChatLang('English')
        } else if (lang === 'zh') {
            setChatLang('Chinese')
        }
    }

    const handleLogin = () => {
        setShowLogin(true)
    }

    return (
        <div
            onMouseEnter={() => setActiveComponent('Toolkit')}
            onMouseLeave={() => setActiveComponent(null)}
            className="fixed left-0 top-1/3 p-3 pb-4 bg-opacity-80 z-5000 transition-all duration-300 ease-in-out"
            style={{
                border: '1px solid rgba(235, 230, 239, 0.15)',
                width: '12rem',
                height: 'auto',
                background: 'rgb(41, 35, 47)',
                borderRadius: '0.5rem',
                left: (pos.x - 200) + 'px',
                top: pos.y + 'px'
            }}
        >
            <p className="text-sm text-left text-gray-400 mb-2">Toolkit</p>
            <button onClick={clearCache}
                className="text-white bg-gray-700 hover:bg-gray-600 p-1 rounded text-sm w-full mb-2">
                Clear Cache
            </button>
            <button onClick={handleLogin}
                className="text-white bg-gray-700 hover:bg-gray-600 p-1 rounded text-sm w-full mb-2">
                Login
            </button>
            <button onClick={handleLogout}
                className="text-white bg-gray-700 hover:bg-gray-600 p-1 rounded text-sm w-full mb-2">
                Logout
            </button>
            <p className="text-sm text-left text-gray-400 mt-2 mb-2">i18n Playground</p>
            <button onClick={switchLanguage.bind(null, 'zh')}
                className="text-white bg-gray-700 hover:bg-gray-600 p-1 rounded text-sm w-full mb-2">
                zh_CN
            </button>
            <button onClick={switchLanguage.bind(null, 'en')}
                className="text-white bg-gray-700 hover:bg-gray-600 p-1 rounded text-sm w-full">
                en_US
            </button>
        </div>
    );
}


export { DevPanel };
