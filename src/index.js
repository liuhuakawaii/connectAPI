import { useEffect, } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RecoilRoot, useRecoilState } from 'recoil';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { bodyOpacityTransitionAtom } from './store';
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));

function Outter() {
    const [bodyOpacityTransition, setBodyOpacityTransition] = useRecoilState(bodyOpacityTransitionAtom,);


    useEffect(() => {
        if (bodyOpacityTransition) {
            document.body.style.opacity = 0;
            setTimeout(() => {
                setBodyOpacityTransition(false);
            }, 500);
        } else {
            document.body.style.opacity = 1;
        }
    }, [bodyOpacityTransition]);


    return (
        <Router >
            <App />
        </Router>
    );
}

root.render(
    <RecoilRoot>
        <Outter />
    </RecoilRoot>
);
