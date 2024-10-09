import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserInfo, queryGroupInfo, getSubscriptionStatus, getEndpoint } from './net';
import { taskDetailAtom, userPermissionAtom, subscriptionsInfoAtom, balanceAtom, subscriptionsPreInfoAtom } from '../store';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import * as Sentry from "@sentry/react";
import { io } from 'socket.io-client';

// Debounce
export const useDebounce = (callback, delay) => {
    const timeoutRef = useRef();
    const lastCallRef = useRef(0);

    useEffect(() => () => {
        clearTimeout(timeoutRef.current);
    }, []);

    const debouncedCallback = (...args) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallRef.current;

        if (timeSinceLastCall >= delay) {
            callback(...args);
            lastCallRef.current = now;
        } else {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                callback(...args);
                lastCallRef.current = Date.now();
            }, delay - timeSinceLastCall);
        }
    };

    return debouncedCallback;
};


// Throttle
export const useThrottle = (callback, delay = 300) => {
    const timeoutRef = useRef();
    const isWaitingRef = useRef(false);

    useEffect(() => () => {
        clearTimeout(timeoutRef.current);
    }, []);

    const throttledCallback = (...args) => {
        if (!isWaitingRef.current) {
            callback(...args);
            isWaitingRef.current = true;

            timeoutRef.current = setTimeout(() => {
                isWaitingRef.current = false;
            }, delay);
        }
    };

    return throttledCallback;
};

//RefreshInfo
export const useRefreshInfo = () => {
    const taskDetail = useRecoilValue(taskDetailAtom)
    const userPermission = useRecoilValue(userPermissionAtom)
    const setBalance = useSetRecoilState(balanceAtom);
    const setSubscriptionsInfo = useSetRecoilState(subscriptionsInfoAtom)
    const setSubscriptionsPreInfo = useSetRecoilState(subscriptionsPreInfoAtom)

    const [userData, setUserData] = useState(null);
    const [groupData, setGroupData] = useState(null);

    const refreshInfo = async (type) => {
        try {
            const eventMap = {
                'group': async () => {
                    const groupInfoData = (await queryGroupInfo(localStorage.getItem('group_uuid'))).data
                    if (groupInfoData.error) throw new Error(groupInfoData.error);
                    setBalance(pre => {
                        return {
                            ...pre,
                            groupBalance: groupInfoData.balance
                        }
                    })
                    setGroupData(groupInfoData)
                },
                'user': async () => {
                    const userData = (await getUserInfo({})).data;
                    if (userData.error) throw new Error(userData.error);
                    setBalance(pre => {
                        return {
                            ...pre,
                            selfBalance: userData.meta.balance
                        }
                    })
                    let subscriptionData = {}
                    subscriptionData = await getSubscriptionStatus()
                    if (subscriptionData?.data?.previous_subscriptions?.length) {
                        let PreItem = subscriptionData.data.previous_subscriptions
                        setSubscriptionsPreInfo(PreItem)
                    }
                    if (subscriptionData?.data?.active_subscriptions?.length) {
                        let subsArr = subscriptionData.data.active_subscriptions

                        setSubscriptionsPreInfo
                        const lastActiveItem = subsArr.reverse().find(item => item.active);
                        if (lastActiveItem) {
                            setSubscriptionsInfo(lastActiveItem)
                        }
                    }
                    setUserData(userData);
                },
                "all": async () => {
                    if (userPermission.chatavatar_tab_group) {
                        const groupInfoData = (await queryGroupInfo(localStorage.getItem('group_uuid'))).data
                        if (groupInfoData.error) throw new Error(groupInfoData.error);
                        setBalance(pre => {
                            return {
                                ...pre,
                                groupBalance: groupInfoData.balance
                            }
                        })
                        setGroupData(groupInfoData)
                    }
                    const userData = (await getUserInfo({})).data;
                    if (userData.error) throw new Error(userData.error);
                    setBalance(pre => {
                        return {
                            ...pre,
                            selfBalance: userData.meta.balance
                        }
                    })
                    setUserData(userData);
                }
            }
            if (eventMap[type]) {
                eventMap[type]();
            } else {
                if (taskDetail.group) {
                    eventMap['group']()
                } else {
                    eventMap['user']()
                }
            }

        } catch (e) {
            Sentry.captureException(e)
            console.error(e);
        }
    };
    return { refreshInfo, userData, groupData }
}
export const useLocalStorage = (name) => {
    const getLocalStorage = () => {
        let local = localStorage.getItem(name)
        if (typeof local == 'object' && local != null) {
            local = JSON.parse(local)
        }
        return local ? local : null
    }

    const setLocalStorage = (item) => {
        localStorage.setItem(name, JSON.stringify(item))
    }

    const removeLocalStorage = () => {
        return localStorage.removeItem(name)
    }

    return [getLocalStorage, setLocalStorage, removeLocalStorage]
}

export const useWebSocket = (initialPath) => {
    const socketRef = useRef(null);
    const [status, setSocketStatus] = useState('disconnected');
    const BASE_URL = getEndpoint()
    const deFaultpath = BASE_URL + initialPath;
    const maxReconnectAttempts = 5;
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const keyInfo = useRef(null)

    const connect = useCallback((subscription, uuid) => {
        if (reconnectAttempts < maxReconnectAttempts) {
            console.log('初始状态 connect reconnectAttempts', reconnectAttempts);
            initSocket(subscription, uuid);
            socketRef.current?.connect();
            setReconnectAttempts((attempts) => attempts + 1);
        }
    }, [reconnectAttempts]);

    const initSocket = useCallback((subscription, uuid) => {
        keyInfo.current = {
            subscription,
            uuid
        }
        if (socketRef.current) {
            console.log('断开之前的链接');
            disconnect();
        }
        socketRef.current = io(deFaultpath, {
            query: {
                subscription,
            },
            transports: ['websocket']
        });

        socketRef.current.on('connect', () => {
            setSocketStatus('connected');
            if (uuid) {
                socketRef.current.emit('query', uuid);
            }
            console.log('Connected to WebSocket');
        });

        socketRef.current.on('disconnect', () => {
            // 触发重连逻辑
            console.log('Disconnected from WebSocket');
            setSocketStatus('disconnected');
        });

        socketRef.current.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }, []);

    const query = useCallback((uuid) => {
        socketRef.current.emit('query', uuid);
    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.off();
            socketRef.current.disconnect();
        }
    }, []);

    const onMessage = useCallback((event, callback, onFailed) => {
        if (socketRef.current) {
            socketRef.current.on(event, (data, res) => {
                console.log('onMessage ID', data);
                console.log('onMessage jobStatus', res?.jobStatus);
                setReconnectAttempts(prevReconnectAttempts => {
                    if (res?.jobStatus === 'Failed') {  //Failed  Running
                        console.log('Failed - current reconnect attempts', prevReconnectAttempts);
                        if (prevReconnectAttempts >= maxReconnectAttempts) {
                            disconnect()
                            console.log('正在尝试重连', keyInfo.current);
                            setReconnectAttempts(0);
                            connect(keyInfo.current.subscription, keyInfo.current.uuid);
                            onFailed && onFailed();
                            return 0;
                        }
                        return prevReconnectAttempts + 1;
                    }
                    return prevReconnectAttempts;
                });
                return callback(data, res);
            });
        }
    }, []);

    return { status, connect, query, setSocketStatus, disconnect, onMessage, setReconnectAttempts };
};


export const useDebounceVal = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export const useThrottleVal = (value, limit) => {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        const handler = setTimeout(function () {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, limit - (Date.now() - lastRan.current));

        return () => {
            clearTimeout(handler);
        };
    }, [value, limit]);

    return throttledValue;
}

export const useRequest = (callback, { deps = [], manual = false } = {

}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const request = useCallback(
        async (...args) => {
            setLoading(true);
            setError(null);
            try {
                const data = await callback(...args);
                setData(data);
            } catch (e) {
                setError(e);
            } finally {
                setLoading(false);
            }
        },
        [callback]
    );

    useEffect(() => {
        if (!manual) {
            request();
        }
    }, [request, ...deps]);

    return { loading, error, request, data };
};

export const isPrerenderUserAgent = () => {
    return navigator.userAgent.includes('Hyper3D Prerender');
};

export const useDebounceEffect = (effect, deps, delay = 300) => {
    const latestEffect = useRef(effect);
    const latestDeps = useRef(deps);
    const timeoutRef = useRef(null);

    useEffect(() => {
        latestEffect.current = effect;
        latestDeps.current = deps;
    });

    useEffect(() => {
        const callEffect = () => {
            latestEffect.current();
        };

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(callEffect, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [...deps, delay]);
};