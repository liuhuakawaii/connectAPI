
import { atom } from 'recoil';

export const rodinInitWeightAtom = atom({
  key: 'rodinInitWeightAtom',
  default: 1,
});

export const rodinModalLoadingAtom = atom({
  key: 'rodinModalLoadingAtom',
  default: false
})


export const rodinGenPipeline = atom({
  key: 'rodinGenPipeline',
  default: {
    taskInfo: {
      status: false,
      data: null, // UUID
      restore: {
        status: false,
        data: null,
      },
      timestamp: null
    },
    hold: {
      status: false,
      data: null,
      timestamp: null
    },
    geoPreviewLoading: {
      status: false,
      data: null,
      timestamp: null
    },
    geoPreviewLoaded: {
      status: false,
      data: null,
      timestamp: null
    },
    geoConfirmed: {
      status: false,
      data: null,
      timestamp: null
    },
    geoLoading: {
      status: false,
      data: null,
      timestamp: null
    },
    mtlLoading: {
      status: false,
      data: null,
      timestamp: null
    },
    mtlLoaded: {
      status: false,
      data: null,
      timestamp: null
    },
    mtlConfirmed: {
      status: false,
      data: null,
      timestamp: null
    },
    Packing: {
      status: false,
      data: null,
      timestamp: null
    },
    Done: {
      status: false,
      data: null,
      timestamp: null
    }
  },
});

export const rodinHistoryStatus = atom({
  key: 'rodinHistoryStatus',
  default: {
    showHistoryList: false,
    historyList: [],
    selectedHistory: false,
    refImage: false,
    previewHistory: false,
    originalState: false,
  }
});

export const optionOpenAtom = atom({
  key: 'optionOpenAtom',
  default: false
})

export const optionModeCloseAtom = atom({
  key: 'optionModeCloseAtom',
  default: false
})

export const optionModeRestAtom = atom({
  key: 'optionModeRestAtom',
  default: false
})

export const renderPreviewImgAtom = atom({
  key: 'renderPreviewImgAtom',
  default: false
})

export const isRodinGeneratingAtom = atom({
  key: 'isRodinGeneratingAtom',
  default: false
})

export const controllerInfoAtom = atom({
  key: 'controllerInfoAtom',
  default: {}
})

export const textureCacheAtom = atom({
  key: 'textureCacheAtom',
  default: {}
})

export const faceCheckListAtom = atom({
  key: 'faceCheckListAtom',
  default: []
})

export const defalutFaceEnhanceAtom = atom({
  key: 'defalutFaceEnhanceAtom',
  default: []
})

export const allowFaceEnhanceAtom = atom({
  key: 'allowFaceEnhanceAtom',
  default: []
})

export const omniInitAtom  = atom({
  key: 'omniInitAtom',
  default: false
})