import {useEffect, useState} from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import arrowBack from '../../assets/storage_back.png'
import stripeLogo from '../../assets/stripe.svg';
import style from './checkoutform.module.css';
import { useNavigate } from 'react-router'
import { checkMobile } from '../../utils/format'
import {useSetRecoilState} from "recoil";
import {clickHideAtom} from "../../store";

const CheckoutForm = ({ quantity, payment }) => {
    const isMobile = checkMobile()
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const nav = useNavigate()
    const hideSwitchBar = useSetRecoilState(clickHideAtom);

    useEffect(() => {
        hideSwitchBar(true)
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }
        setIsLoading(true);
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: new URL("/payment", window.location.href).href,
            },
        });

        if (error) {
            setErrorMessage(error.message);
        }
        setIsLoading(false)
    };

    const mobileStyle = {
        width: '100%',
        flexDirection: 'column'
    }

    const mobilePaymentBoxStyle = {
        marginLeft: 0
    }

    return (
        <div className={style["checkout-form"]} style={isMobile ? mobileStyle : null}>
            <div className={style["checkout-form__arrow"]}>
                <img src={arrowBack} alt="arrowBack" onClick={() => {
                    hideSwitchBar(false)
                    nav('/')
                }} />
            </div>
            <div className={style["checkout-form__details"]}>
                <h2 className={style["checkout-form__details-title"]}>Order Summary</h2>
                <div className={style["checkout-form__details-line"]}>
                    <p className={style["checkout-form__details-text"]}>Quantity</p>
                    <p className={style["checkout-form__details-value"]}>{quantity / 10} Credits</p>
                </div>
                <div className={style["checkout-form__details-line"]}>
                    <p className={style["checkout-form__details-text"]}>Price</p>
                    <p className={style["checkout-form__details-value"]}>$1.5</p>
                </div>
                <hr />
                <div className={style["checkout-form__details-line"]}>
                    <p className={style["checkout-form__details-text"]}>Payment Due</p>
                    <h2 className={style["checkout-form__details-total"]}>${payment}</h2>
                </div>
            </div>


            <div className={style["checkout-form__payment"]} style={isMobile ? mobilePaymentBoxStyle : null}>
                <form onSubmit={handleSubmit}>
                    <PaymentElement className={style["checkout-form__payment-element"]} />
                    <button
                        type="submit"
                        disabled={!stripe}
                        className={style["checkout-form__submit-button"]}>
                        {isLoading ? <div className="spinner">
                            {new Array(10).fill(0).map((_, index) => {
                                return <div className={style["spinner-div"]} key={index}></div>
                            })}
                        </div> : "Pay"}
                    </button>
                    {errorMessage && <div className={style["checkout-form__error-message"]}>{errorMessage}</div>}
                    <div className={style["checkout-form__powered-by"]}>
                        <span>Powered by</span>
                        <img src={stripeLogo} alt="Stripe Logo" className={style["checkout-form__stripe-logo"]} />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutForm;
