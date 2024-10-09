import { useEffect, useRef, useState } from 'react';
import { fetchPaymentStatusStripe, paymentValidationAlipay } from '../../utils/net';
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./checkoutform";
import { loadStripe } from "@stripe/stripe-js";
import { BeatLoader } from "react-spinners";
import * as Sentry from "@sentry/react";

function PaymentHandler() {
    const [urlParams, setUrlParams] = useState(null);
    const [error, setError] = useState(null);
    const options = useRef();
    const stripePromise = loadStripe(process.env.NODE_ENV === 'production' ? 'pk_live_51OVTgmEX0ZvbLD9qjDCMWuVFfCIygkdBhVj171DX8qFhQJJwS4IQmpSjoYT5i36mY2B7dE4ZemtXDVBLiesdiYBw00iFj5Hm2t' : 'pk_test_51OVTgmEX0ZvbLD9q3t4pkVqL5Fu6gJRDRaUsOG5ciVTBb5FNY9Ye8rLw4OPjYAM3Wndx0Uh1c4ZAstTBq1uuFbS900e4S1rnuH');
    const [showStripe, setShowStripe] = useState(false)
    const tokenAmount = useRef();
    const paymentAmount = useRef();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setError(null);
        if (params.toString()) {
            setUrlParams(Object.fromEntries(params));
        }
    }, []);

    useEffect(() => {
        // console.log(urlParams)
        if (urlParams) {
            handlePayment();
        }

    }, [urlParams]);

    const handlePayment = async () => {
        try {
            if (urlParams.stripe_secret) {
                options.current = {
                    clientSecret: urlParams.stripe_secret,
                    appearance: {/*...*/ },
                };
                tokenAmount.current = urlParams.token_amount
                paymentAmount.current = urlParams.payment_amount
                setShowStripe(true)
            } else if (urlParams.payment_intent) {
                let status = await fetchPaymentStatusStripe(urlParams.payment_intent);

                let retryCount = 0;

                while (retryCount < 10) {
                    if (status.data.error === 'NOT_YET_VERIFIED') {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        status = await fetchPaymentStatusStripe(urlParams.payment_intent);

                        retryCount++;
                    } else {
                        break;
                    }
                }

                if (retryCount === 10) {
                    setError("Payment can't be verified, please check your balance manually.");
                } else if (status.data.error) {
                    throw new Error(status.data.error);
                } else {
                    window.location.href = '/';
                }
            } else {
                if (urlParams.status === 'success') {
                    if (urlParams.source === 'alipay') {
                        _czc.push(['_trackEvent', 'Callback', 'Alipay', 'TopUp']);
                        const { data } = await paymentValidationAlipay(urlParams);
                        if (data.error) {
                            throw new Error(data.error);
                        } else {
                            window.location.href = '/';
                        }
                    }
                } else {
                    throw new Error('Payment Failed');
                }
            }
        } catch (e) {
            Sentry.captureException(e)
            setError(e.message);
        }
    };

    const pageStyle = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'white',
        color: 'black',
        fontSize: '20px',
        zIndex: 100
    };

    const errorStyle = {
        fontSize: '20px',
    };

    const errorStyleDetail = {
        fontSize: '10px',
    };


    return (
        <>
            {showStripe ? (
                <div style={pageStyle}>
                    <Elements stripe={stripePromise} options={options.current}>
                        <CheckoutForm payment={paymentAmount.current} quantity={tokenAmount.current} />
                    </Elements>
                </div>
            ) : (
                <div style={pageStyle}>
                    {error ? (
                        <>
                            <div style={errorStyle}>Oops...</div>
                            <br />
                            <div style={errorStyleDetail}>{error}</div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                            <BeatLoader color="#000" loading={true} size={15} />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default PaymentHandler;
