import style from './modelloading.module.css'

const ModelLoading = ({ color, type = 'defalut' }) => {

  const LoadingComponents = {
    "defalut": <div className={`${style.loadingContainer} ${color ? style.white : ""}`}>
      <div className={style.loadingBox}>
        <div className={style.loading}></div>
        <div className={style.loadingText}>Deemos</div>
      </div>
    </div>,
    "rodin": <div className={`${style.loadingContainer} ${style.rodinBg} ${color ? style.white : ""}`}>
      <div className={style.loadingBox}>
        <div className={style.loading}></div>
        <div className={style.loadingText}>Deemos</div>
      </div>
    </div>
  }

  return (
    LoadingComponents[type]
  )
}

export { ModelLoading }