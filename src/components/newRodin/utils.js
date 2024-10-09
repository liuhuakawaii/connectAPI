let fakeProgressTimer = null

const fakeProgressBar = (setGeneratePercentage, secs = 5) => {
    new Promise((resolve) => {
        setGeneratePercentage(0);
        const interval = secs * 1000 / 200;
        fakeProgressTimer = setInterval(() => {
            setGeneratePercentage(prevPercentage => {
                const fluctuation = Math.random() * 8
                const nextPercentage = prevPercentage + Math.floor(fluctuation);
                if (nextPercentage >= 100) {
                    clearInterval(fakeProgressTimer);
                    resolve();
                    return 100;
                }
                return nextPercentage;
            });
        }, interval);
    });
};

const startFakeProgressBar = (setGeneratePercentage, secs) => {
    if (fakeProgressTimer) {
        clearInterval(fakeProgressTimer);
    }
    fakeProgressBar(setGeneratePercentage, secs);
};

export {startFakeProgressBar}