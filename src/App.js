
import { useRoutes } from 'react-router-dom';
import PCRouter from "./router/pcrouter.js";
import { ModalProvider } from './common/CommonModal/index.js';




const App = () => {


    return (
        <>
            <ModalProvider>
                {useRoutes(PCRouter)}
            </ModalProvider>

        </>

    )
}

export default App;