import { PermissionContext } from './context';

const PermissionProvider = ({ permissions, children }) => {
    const isAllowedTo = (permission) => permissions.includes(permission);

    return (
        <PermissionContext.Provider value={{ isAllowedTo }}>
            {children}
        </PermissionContext.Provider>
    );
};

export default PermissionProvider;