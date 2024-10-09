import styled from 'styled-components';
import { useTranslation } from "react-i18next";

const Page = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: white;
    color: black;
    font-size: 20px;
`;

const ErrorHeader = styled.header`
    font-size: 1.5em;
    margin-bottom: 2rem;
`;

const ErrorMessage = styled.main`
    font-size: 0.6em;
    margin-bottom: 1rem;
`;
const Button = styled.button`
    font-size: 0.6em;
    padding: 0.5em 1em;
    color: white;
    background-color: black;
    border: none;
    border-radius: 0.3em;
    cursor: pointer;
		margin-top: 2rem;
`;

function ErrorPage({errorCode, errorMessage}) {
    const { t } = useTranslation();
    if (errorCode === 404) {
        errorMessage = t('ERROR_CODE_MESS_1')
    } else if (!errorMessage) {
        errorMessage = t('ERROR_CODE_MESS_2')
    }

    const handleClick = () => {
        // Navigate to the home page
        window.location.href = '/';
    };

    return (
        <Page>
            <ErrorHeader>Oops</ErrorHeader>
            <ErrorMessage>
                {errorMessage}
            </ErrorMessage>
            <ErrorMessage>
                {t('ERROR_PAGE_INFO')}
            </ErrorMessage>
            <Button onClick={handleClick}>Back to Hyperhuman</Button>
        </Page>
    );
}

export {ErrorPage};
