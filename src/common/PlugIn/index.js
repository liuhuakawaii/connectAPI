
import style from './plugin.module.css'
import blenderIcon from './assets/blender.png'
import cocosIcon from './assets/Cocos.png'
import unrealIcon from './assets/unreal.png'
import unityIcon from './assets/Unity.png'
import daz3dIcon from './assets/Daz3D.png'
import iCloneIcon from './assets/iClone.png'
import mayaIcon from './assets/Maya.png'
import omniverseIcon from './assets/Omniverse.png'
import pluginIcon from './assets/plugin.png'
import { XscrollEasy } from '../../components/widgets/XscrollEasy'
import { useTips } from '../GlobalTips'
import { useTranslation } from "react-i18next";


const PluginList = [
  {
    name: 'Daz3D',
    icon: daz3dIcon,
    link: 'https://deemos.gumroad.com/l/ChatAvatarImportTool-Daz3D?_gl=1*1k7clfj*_ga*NzIzNjczNzk0LjE3MDM0ODIwODk.*_ga_6LJN6D94N6*MTcyMDk0ODc0Ni42NC4xLjE3MjA5NDg4NzEuMC4wLjA'
  },
  {
    name: 'Unity',
    icon: unityIcon,
    link: "https://deemos.gumroad.com/l/ChatAvatarImportTool-Unity"
  },
  {
    name: 'Blender',
    icon: blenderIcon,
    link: "https://deemos.gumroad.com/l/ChatAvatarImportTool"
  },
  {
    name: 'Maya',
    icon: mayaIcon,
    link: "https://deemos.gumroad.com/l/ChatAvatarImportTool-Maya"
  },
  {
    name: 'Cocos',
    icon: cocosIcon,
    link: "https://store.cocos.com/app/detail/5565",
    filter: true
  },
  {
    name: 'Unreal',
    icon: unrealIcon,
    link: "https://www.unrealengine.com/marketplace/en-US/product/chatavatar-plugin",
    filter: true
  },
  {
    name: 'Omniverse',
    icon: omniverseIcon,
    link: 'https://www.youtube.com/watch?v=EDJHX4hMMWA&ab_channel=DeemosTech'
  },
  {
    name: 'iClone',
    icon: iCloneIcon,
    link: null
  },
  {
    name: 'Blender',
    icon: blenderIcon,
    link: "https://deemos.gumroad.com/l/ChatAvatarImportTool",
  },
]

const HoverPluginList = ({ type }) => {
  const tip = useTips()
  const { t } = useTranslation();

  const handlerNavigate = (link) => {
    if (link) {
      window.open(link, '_blank')
    } else {
      tip({
        type: "primary",
        content: t('TIP_PRIMARY_PLUGIN_UNDER_DEV')
      })
    }
  }

  return (
    <div className={`${style.hoverListWrapper} ${type === 'header' ? style.header : style.footer}`}>
      <ul className={style.hoverList}>
        {PluginList.slice(0, PluginList.length - 1).map((item, index) => {
          return (
            <li onClick={handlerNavigate.bind(null, item.link)} className={`${style.hoverpluginItem} ${item.link ? style.active : style.unactive}`} key={index}>
              <a href={item.link} target="_blank" rel="noreferrer">
                <img className={style.ItemIcon} src={item.icon} alt="ItemIcon" />
              </a>
              {item.name}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const Plugin = ({ type }) => {
  const tip = useTips()
  const { t } = useTranslation();

  const handlerNavigate = (link) => {
    if (link) {
      window.open(link, '_blank')
    } else {
      tip({
        type: "primary",
        content: t('TIP_PRIMARY_PLUGIN_UNDER_DEV')
      })
    }
  }

  const componentMap = {
    "header": (
      <div className={style.pluginWrapper}>
        <div className={style.initialIcon}>
          <img className={style.pluginIcon} src={pluginIcon} alt="pluginIcon" />
        </div>
        <div className={`${style.swrapper} ${style.header}`}>
          <ul className={`${style.pluginList} ${style.header}`}>
            {
              PluginList.map((item, index) => {
                return (
                  <li className={`${style.pluginItem} ${style.header}`} key={index}>
                    <img className={style.ItemIcon} src={item.icon} alt="ItemIcon" />
                  </li>

                )
              })
            }
          </ul>
          <span className={style.pluginWrapperName}>Plug-in</span>
        </div>
        <HoverPluginList type="header" />
      </div>
    ),
    "footer": (
      <div className={`${style.pluginWrapper} ${style.footer}`}>
        <div className={`${style.swrapper} ${style.footer}`}>
          <ul className={`${style.pluginList} ${style.footer}`}>
            {
              PluginList.map((item, index) => {
                return (
                  <li className={`${style.pluginItem} ${style.footer}`} key={index}>
                    <img className={style.ItemIcon} src={item.icon} alt="ItemIcon" />
                  </li>

                )
              })
            }
          </ul>
          <span className={style.pluginWrapperName}>Plug-in</span>
        </div>
        <HoverPluginList type="footer" />
      </div>
    ),
    "pack": (
      <div className={style.packPluginWrapper}>
        <XscrollEasy>
          <div className={style.packPluginScroll}>
            <div className={style.pluginImgBox}>
              <img className={`${style.pluginImg} ${style.filterImg}`} src={pluginIcon} alt="pluginIcon" />
            </div>
            {PluginList.slice(0, PluginList.length - 1).map((item, index) => {
              return (
                <img onClick={handlerNavigate.bind(null, item.link)} className={`${style.pluginImg} ${item.filter ? style.filter : ''} ${item.link ? style.active : style.unactive}`} src={item.icon} alt={item.name} key={index} />
              )
            })}
          </div>
        </XscrollEasy>
      </div>
    )
  }
  return (
    componentMap[type]
  )
}

export { Plugin }
export {
  PluginList
}