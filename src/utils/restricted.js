import { useContext } from 'react';
import { PermissionContext } from './context';

const Restricted = ({ to, children }) => {
    const { isAllowedTo } = useContext(PermissionContext);
    return isAllowedTo(to) ? <>{children}</> : null;
};

export default Restricted;
