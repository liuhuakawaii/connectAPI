import React from 'react';
import { createRoot } from 'react-dom/client';
import { Turnstile } from "@marsidev/react-turnstile";

const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10500,
    background: 'white',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    width: 'auto',
    textAlign: 'center'
};

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10400
};

const closeButtonStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontSize: '16px'
};

const TurnstileModal = ({ onClose, onSuccess, onError }) => {
    return (
        <>
            <div style={overlayStyle} onClick={onClose} />
            <div style={modalStyle}>
                <button style={closeButtonStyle} onClick={onClose}>&times;</button>
                <Turnstile
                    siteKey="0x4AAAAAAAhbdFXzdFzkoDOV"
                    onSuccess={onSuccess}
                    onError={onError}
                    options={{
                        theme: 'light',
                    }}
                />
            </div>
        </>
    );
};


export function createTurnstileVerification() {
    let root = null;
    let div = null;

    const triggerVerification = () => {
        div = document.createElement('div');
        document.body.appendChild(div);
        root = createRoot(div);

        return new Promise((resolve, reject) => {
            const handleSuccess = (token) => {
                root.unmount();
                document.body.removeChild(div);
                resolve(token);
            };

            const handleError = (error) => {
                root.unmount();
                document.body.removeChild(div);
                reject(error);
            };

            const handleClose = () => {
                root.unmount();
                document.body.removeChild(div);
                reject(new Error("Verification Closed"));
            };

            root.render(
                <TurnstileModal
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                    onError={handleError}
                />
            );
        });
    };

    return triggerVerification;
}
