import { useRef } from 'react'
import style from './portal.module.css'
import closeIcon from '../../assets/deletWights.png'
import { createPortal } from 'react-dom'

const Portal = ({ dialogStyle, walletStyle, showDialog, setShowDialog, children }) => {
  const dialogBoxRef = useRef(null)

  const handlerClose = (e) => {
    if (dialogBoxRef.current && dialogBoxRef.current.contains(e.target)) return
    setShowDialog(false)
  }

  const handlerIconClose = () => {
    setShowDialog(false)
  }

  return (
    createPortal(<div
      className={`${style.dialogwrapper} ${showDialog ? style.show : ""}`}
      onClick={handlerClose}>
      <div ref={dialogBoxRef} className={style.dialogBox} style={dialogStyle}>
        <img
          onClick={handlerIconClose}
          className={style.closeIcon}
          style={walletStyle}
          src={closeIcon}
          alt="closeIcon" />
        {children}
      </div>
    </div>, document.body)
  )
}

export { Portal }