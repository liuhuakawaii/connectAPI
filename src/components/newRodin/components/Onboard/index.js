import React, { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
// import { useTips } from '../../../../common/GlobalTips';
import Confetti from 'react-confetti';
import '../../../../index.css'
import { useTranslation } from "react-i18next";

export const Onboard = ({ setShowOnboard }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [clicked, setClicked] = useState([]);
    const [showContent, setShowContent] = useState(false);
    const [titleStyle, setTitleStyle] = useState({});
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiOpacity, setConfettiOpacity] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});
    // const [shakeIndices, setShakeIndices] = useState([]);
    const [shakeIndices,] = useState([]);
    const { t } = useTranslation();

    const pages = [
        {
            title: `🎉 ${t("ONBOARD_TITLE_1")}`,
            content: `${t("ONBOARD_CONTENT_1_1")}  \n` + "\n" + t("ONBOARD_CONTENT_1_2")
        },
        {
            title: `🔮 ${t("ONBOARD_TITLE_2")}`,
            content: `${t("ONBOARD_CONTENT_2_1")}\n` +
                "\n" +
                t("ONBOARD_CONTENT_2_2")
        },
        {
            title: `🔍 ${t("ONBOARD_TITLE_3")}`,
            content: `${t("ONBOARD_CONTENT_3_1")}  \n` +
                "\n" +
                `${t("ONBOARD_CONTENT_3_2")} \n` +
                "\n" +
                t("ONBOARD_CONTENT_3_3")
        },
        {
            title: `🤖 ${t("ONBOARD_TITLE_4")}`,
            content: `${t("ONBOARD_CONTENT_4_1")} \n` +
                "\n" +
                `${t("ONBOARD_CONTENT_4_2")}\n` +
                "\n" +
                t("ONBOARD_CONTENT_4_3")
        },
        {
            title: `🏃 ${t("ONBOARD_TITLE_5")}`,
            content: `${t("ONBOARD_CONTENT_5_1")}\n` +
                `${t("ONBOARD_CONTENT_5_2")}\n` +
                "\n" +
                t("ONBOARD_CONTENT_5_3")
        },
        {
            title: `${t("ONBOARD_TITLE_6")}?`,
            content: t('ONBOARD_CONTENT_6_1')
        }
    ];
    const productRefs = useRef([]);

    useEffect(() => {
        productRefs.current = pages.map((_, i) => productRefs.current[i] ?? React.createRef());
    }, [pages.length]);

    useEffect(() => {
        if (currentPage === 0) {
            setShowContent(false);
            setTitleStyle({ transform: 'translateY(200%)', transition: 'none' });
            setShowConfetti(true);
            setConfettiOpacity(1);

            setTimeout(() => {
                setTitleStyle({ transform: 'translateY(0%)', transition: 'transform 1100ms ease-in-out' });
            }, 1000);

            setTimeout(() => {
                setShowContent(true);
            }, 2000);

            setTimeout(() => {
                setConfettiOpacity(0);
            }, 2500);

            setTimeout(() => {
                setShowConfetti(false);
            }, 4000);
        }

        if (currentPage === pages.length - 1) {
            setTimeout(() => {
                setIsVisible(false);
            }, 2000);

            setTimeout(() => {
                localStorage.setItem('doneRodinOnboard', true);
                setShowOnboard(false);
            }, 3000)
        }

        if (productRefs.current[currentPage].current !== null) {
            setTimeout(() => {
                const rect = productRefs.current[currentPage].current.getBoundingClientRect();
                setDropdownStyle({
                    left: `${rect.left}px`,
                    top: `${rect.bottom + window.scrollY}px`,
                    zIndex: 10000,
                    width: '140px',
                    padding: '5px 10px 5px 10px'
                });
            }, 500);
        }
    }, [currentPage]);

    useEffect(() => {
        if (clicked[currentPage] && clicked[currentPage].every(Boolean)) {
            setTimeout(() => {
                handleNextClick()
            }, 500)
        }
    }, [clicked]);


    useEffect(() => {
        const newClicked = pages.map(page =>
            (page.content.match(/(~(.*?)~)/g) || []).map(() => false)
        );
        setClicked(newClicked);
    }, []);

    const handleDropdownClick = (url) => {
        window.open(url, '_blank');
        setShowDropdown(false);
    };

    const handlePageChange = (index) => {
        setCurrentPage(index);
        setTranslateX(-index * 16.666);
    }

    const handleDotClick = (index) => {
        // if (clicked[currentPage].every(Boolean) && clicked[index].every(Boolean)) {
        //     handlePageChange(index);
        // }
        handlePageChange(index);
    };

    const handlePrevClick = () => {
        if (currentPage > 0) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNextClick = () => {
        if (currentPage < pages.length - 1) {
            // const allClicked = clicked[currentPage].every(Boolean);
            // if (!allClicked) {
            //
            //     const newShakeIndices = clicked[currentPage].map((clicked, index) => !clicked ? index : null).filter(index => index !== null);
            //     setShakeIndices(newShakeIndices);
            //
            //     setTimeout(() => {
            //         setShakeIndices([]);
            //     }, 1000);
            //
            //     tip({
            //         type: "primary",
            //         content: t('TIP_PRIMARY_NEWRODIN_CLICK_HIGHLIGHT')
            //     });
            // } else {
            handlePageChange(currentPage + 1);
            // }
        }
    };



    const handleClickableText = (pageIndex, index) => {
        const newClicked = [...clicked];
        newClicked[pageIndex][index] = !newClicked[pageIndex][index];
        setClicked(newClicked);
    };

    const parseContent = (content, pageIndex) => {
        let parts = [];
        let clickableTexts = [];
        let lastIndex = 0;
        const combinedRegex = /(\*\*(.*?)\*\*)|(~(.*?)~)|(excellent products|better options)/g;
        let match;

        while ((match = combinedRegex.exec(content)) !== null) {
            parts.push(content.substring(lastIndex, match.index));

            if (match[1]) {
                parts.push(<u key={`${pageIndex}-${parts.length}`}>{match[2]}</u>);
            } else if (match[3]) {
                const textIndex = clickableTexts.length;
                const clickedState = clicked[pageIndex] && clicked[pageIndex][textIndex];
                const shouldShake = shakeIndices.includes(textIndex);
                parts.push(
                    <span key={`${pageIndex}-${textIndex}`}
                        className={`relative inline-flex items-center ${!clickedState ? 'px-2' : ''} h-7 rounded-3xl cursor-pointer transition-bg transition-text duration-300 ease-in-out ${shouldShake ? 'shake-animation' : ''}`}
                        onClick={() => handleClickableText(pageIndex, textIndex)}>
                        {!clickedState &&
                            <span className="absolute inset-0 bg-gradient-to-b from-violet-600 to-violet-500 rounded-3xl"></span>}
                        <span className={`relative text-lg font-normal ${!clickedState ? 'text-white' : 'font-["Arial"]'}`}>
                            {match[4]}
                        </span>
                    </span>
                );
                clickableTexts.push(match[4])
            } else if (match[5]) {
                parts.push(
                    <>
                        <span ref={productRefs.current[pageIndex]}
                            key={`${pageIndex}-${parts.length}`}
                            className="underline cursor-pointer"
                            onMouseEnter={() => setShowDropdown(true)}
                            onMouseLeave={() => setShowDropdown(false)}>
                            {match[5]}
                        </span>
                    </>
                );
            }
            lastIndex = combinedRegex.lastIndex;
        }

        parts.push(content.substring(lastIndex));

        return parts.map((part, index) => (
            typeof part === 'string' ?
                part.split('\n').map((line, lineIndex) => (
                    <Fragment key={`${pageIndex}-${index}-${lineIndex}`}>
                        {line}
                        {lineIndex !== part.split('\n').length - 1 && <br />}
                    </Fragment>
                )) : part
        ));
    };


    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: 5000 }}>
            {showConfetti && <Confetti style={{ opacity: confettiOpacity, transition: 'opacity 1000ms ease-in-out' }} />}
            {showDropdown && (
                <div className="absolute shadow-lg p-2 bg-white/10 backdrop-blur-md " style={dropdownStyle}
                    onMouseEnter={() => setShowDropdown(true)}
                    onMouseLeave={() => setShowDropdown(false)}
                >
                    <ul>
                        <li className="cursor-pointer p-1 hover:bg-gray-200/10"
                            style={{ padding: '5px 10px 5px 10px' }}
                            onClick={() => handleDropdownClick('https://www.meshy.ai/')}>Meshy
                        </li>
                        <li className="cursor-pointer p-1 hover:bg-gray-200/10"
                            style={{ padding: '5px 10px 5px 10px' }}
                            onClick={() => handleDropdownClick('https://www.sudo.ai/')}>SudoAI
                        </li>
                        <li className="cursor-pointer p-1 hover:bg-gray-200/10"
                            style={{ padding: '5px 10px 5px 10px' }}
                            onClick={() => handleDropdownClick('https://3d.csm.ai/')}>CSM
                        </li>
                        <li className="cursor-pointer p-1 hover:bg-gray-200/10"
                            style={{ padding: '5px 10px 5px 10px' }}
                            onClick={() => handleDropdownClick('https://www.tripo3d.ai/app')}>Tripo
                        </li>
                        <li className="cursor-pointer p-1 hover:bg-gray-200/10"
                            style={{ padding: '5px 10px 5px 10px' }}
                            onClick={() => handleDropdownClick('https://lumalabs.ai/genie?view=create')}>Genie
                        </li>
                    </ul>
                </div>
            )}
            <div className="relative w-full max-w-3xl min-h-96 min-w-96 p-6 bg-gradient-to-b rounded-2xl shadow-lg overflow-hidden"
                style={{
                    height: '50vh',
                    width: '60vw',
                    aspectRatio: '1.3',
                    background: 'linear-gradient(180deg, #24252D 0%, #1A1A1E 100%)'
                }}>
                <div className="absolute top-0 left-0 h-full" style={{
                    width: `${100 * pages.length}%`,
                    transform: `translateX(${translateX}%)`,
                    transition: 'transform 500ms ease-in-out'
                }}>
                    {pages.map((page, index) => (
                        <div key={index} className="w-full h-full flex-none" style={{
                            float: 'left',
                            width: `${100 / pages.length}%`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            <React.Fragment>
                                <h1 className="text-3xl font-bold text-neutral-200" style={titleStyle}>
                                    {page.title}
                                </h1>
                                {index !== pages.length - 1 && (
                                    <p className={`m-10 mt-8 text-lg text-neutral-400 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                                        {parseContent(page.content, index)}
                                    </p>
                                )}
                            </React.Fragment>
                        </div>

                    ))}
                </div>

                {currentPage < pages.length - 1 && currentPage > 0 && (
                    <button className="absolute left-8 bottom-8 -translate-y-1/2 text-zinc-700 hover:text-blue-500 z-50"
                        onClick={handlePrevClick}>
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                )}
                {currentPage < pages.length - 1 && (
                    <button
                        className="absolute right-8 bottom-8 -translate-y-1/2 text-zinc-700 hover:text-blue-500 z-50"
                        onClick={handleNextClick}>
                        <ArrowRightIcon className="h-6 w-6" />
                    </button>
                )}
                {currentPage < pages.length - 1 && (
                    <div className="absolute bottom-6 left-0 right-0 p-6 flex justify-center gap-2">
                        {pages.map((_, index) => (
                            <div key={index}
                                className={`w-2.5 h-2.5 rounded-full cursor-pointer ${index === currentPage ? 'bg-blue-600' : 'bg-zinc-700'}`}
                                onClick={() => handleDotClick(index)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

}