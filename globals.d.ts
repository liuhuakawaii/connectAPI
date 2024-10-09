declare module '*.css';
declare module '*.svg';

interface Window {
  _env_: {
    REACT_APP_SERVICE_MESHEDITOR_ENTRY: string;
    REACT_APP_SERVICE_OMNICRAFT_ENTRY: string;
    REACT_APP_ROLE: string;
  };
}