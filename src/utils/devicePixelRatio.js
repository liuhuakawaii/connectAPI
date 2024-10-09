class DevicePixelRatio {
  constructor() {
    //this.flag = false;
  }
  _getSystem() {
    var agent = navigator?.userAgent?.toLowerCase();
    if (agent.indexOf("windows") >= 0) {
      return true;
    }
  }
  //监听方法兼容写法
  _addHandler(element, type, handler) {
    if (element.addEventListener) {
      element.addEventListener(type, handler, false);
    } else if (element.attachEvent) {
      element.attachEvent("on" + type, handler);
    } else {
      element["on" + type] = handler;
    }
  }
  //校正浏览器缩放比例
  _correct() {
    // let t = this;
    //页面devicePixelRatio（设备像素比例）变化后，计算页面body标签zoom修改其大小，来抵消devicePixelRatio带来的变化。
    document.getElementsByTagName('body')[0].style.zoom = 1 / window.devicePixelRatio;
  }
  //监听页面缩放
  _watch() {
    let t = this;
    t._addHandler(window, 'resize', function () { //注意这个方法是解决全局有两个window.resize
      t._correct()
    })
  }
  //初始化页面比例
  init() {
    let t = this;
    if (t._getSystem()) {
      t._correct();
      t._watch();
    }
  }
}
export default DevicePixelRatio;
