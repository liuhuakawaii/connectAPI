import { createContext, useContext, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, children }) => {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  if (!isOpen) return null;

  const handleClose = (e) => {
    if (wrapperRef.current && containerRef.current && containerRef.current.contains(e.target)) return
    onClose()
  }

  return ReactDOM.createPortal(
    <div onClick={handleClose} ref={wrapperRef} className="fixed inset-0 flex z-[9999] justify-center items-center bg-[rgba(0,0,0,0.3)]">
      <div ref={containerRef} className="bg-[rgba(255,255,255,0.8)]  backdrop-blur-md  rounded-2xl p-[20px] relative max-w-[382px]">
        {/* <button className="absolute top-3 right-3 bg-none border-none text-[20px] cursor-pointer" >X</button> */}
        {children}
      </div>
    </div>,
    document.body
  );
};

const ModalContext = createContext();

export const useModal = () => {
  return useContext(ModalContext);
};

export const ModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);

  const openModal = (modalContent) => {
    setContent(modalContent);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setContent(null);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <Modal isOpen={isOpen} onClose={closeModal}>
        {content}
      </Modal>
    </ModalContext.Provider>
  );
};

export default Modal;
