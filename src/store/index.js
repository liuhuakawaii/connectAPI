import * as header from "./headerStore";
import * as gallery from "./galleryStore";
import * as Board from "./boardStore";
import * as welcome from "./welcomeStore";
import * as widget from "./widgetStore";
import * as app from "./appStore";
import * as rodin from "./rodin";

/* app */
export const { modalObjAtom } = app;
export const { userPermissionAtom } = app;
export const { currentNavAtom } = app;
export const { isFeedbackModalOpenAtom } = app;
export const { showStorageWrapperAtom } = app;
export const { tipsAtom } = app;
export const { groupInfoAtom } = app;
export const { qrCodeUrlAtom } = app;
export const { genMeInfoAtom } = app;
export const { showSubscribeAtom } = app;
export const { showSubscribeTimesAtom } = app;
export const { showThreeModelAtom } = app;
export const { chatWsInfoAtom } = app;
export const { chatHistoryArrAtom } = app;
export const { groupWalletAtom } = app;
export const { walletAtom } = app;
export const { showGenerateAreaAtom } = app;
export const { generatePrivateAtom } = app;
export const { generateLicenseAtom } = app;
export const { reGenerateInfoAtom } = app;
export const { checkboxStatesAtom } = app;
export const { subscriptionsInfoAtom } = app;
export const { subscriptionsPreInfoAtom } = app;
export const { currentColorIndexAtom } = app;
export const { currentStyleIndexAtom } = app;
export const { currencyAtom } = app;
export const { showFocusWrapperAtom } = app;
export const { checkbackAtom } = app;
export const { currentCameraIndexAtom } = app;
export const { loadRenderImgAtom } = app;
export const { showImgLoadAtom } = app;
export const { colorArrAtom } = app;
export const { showImgUrlsArrAtom } = app;
export const { repointerArrAtom } = app;
export const { isSmallScreenAtom } = app;
export const { packToMineAtom } = app;
export const { currentLengthAtom } = app;
export const { rodinRenderAtom } = app;

export const { processedPrompt } = app;
export const { showReferralAtom } = app;
export const { showApiDashboardAtom } = app;
export const { balanceAtom } = app;
/* headerStore */
export const { logInfoAtom } = header;
export const { showLoginAtom } = header;
export const { initialLoginStageAtom } = header;
export const { showHistoryAtom } = header;
export const { openPaymentInfoAtom } = header;

export const { rodinUploadedImages } = header;

/* galleryStore */
export const { cardsAtom } = gallery;
export const { cardsTypeAtom } = gallery;
export const { cardsTypeConst } = gallery;
export const { searchKeyWordAtom } = gallery;
export const { rodinCardsTypeAtom } = gallery;
export const { isImgto3dAtom } = gallery;
export const { showCardsConAtom } = gallery;
export const { bodyOpacityTransitionAtom } = gallery;
export const { isEditorOpenAtom } = gallery;
export const { panoramaCardsTypeAtom } = gallery;
export const { packingStateAtom } = gallery;
export const { progressCheckingQueueAtom } = gallery;
export const { progressStateQueueAtom } = gallery;
export const { showUploadModalAtom } = gallery;
export const { showGoActBrand } = gallery;
/* boardStore */
export const { taskInitAtom } = Board;
export const { lastGenerateUUIDAtom } = Board;
export const { setGenerateAtom } = Board;
export const { taskDetailAtom } = Board;
export const { chatHistoryAtom } = Board;
export const { chatGuessAtom } = Board;
export const { promptAtom } = Board;
export const { stopChatAtom } = Board;
export const { meshProfileAtom } = Board;
export const { assistantChatStatusAtom } = Board;
export const { guessChatStatusAtom } = Board;
export const { chatTextAtom } = Board;
export const { chatLangAtom } = Board;
export const { needStartWsAtom } = Board;
export const { chatImageURLAtom } = Board;
export const { posterGenerateAtom } = Board;
export const { showSharePopupAtom } = Board;
export const { showProgressAtom } = Board;
export const { showDownloadAtom } = Board;
export const { downloadProgressAtom } = Board;
export const { publishColorInfoAtom } = Board;
export const { isOpenImg3dGenerateAtom } = Board;
export const { viewSelectionDataAtom } = Board;
export const { showPayCardAtom } = Board;
export const { currentPreviewIndexAtom } = Board;
export const { cameraParamsAtom } = Board;
export const { showThreePalaceGridAtom } = Board;
export const { showRegenerateAtom } = Board;
export const { showPanoramaBordAtom } = Board;
export const { clickHideAtom } = Board;
export const { cardsProgressStateAtom } = Board;
export const { canStartWsAtom } = Board;
export const { prohibitAtom } = Board;
export const { regenePrivateSetAtom } = Board;
export const { isPurchasedAtom } = Board;
export const { packInfoAtom } = Board;
export const { lastGenerateInfoAtom } = Board;
export const { stylizedStrAtom } = Board;
export const { recommendCardsAtom } = Board;
export const { descriptionAtom } = Board;
export const { promptKeyWordsAtom } = Board;

/* welcomeStore */
export const { fileListAtom } = welcome;
export const { hashAtom } = welcome;
export const { urlListAtom } = welcome;
export const { fileMapAtom } = welcome;
export const { cardLoadingAtom } = welcome;
export const { croppedImageAtom } = welcome;
export const { currentDBAtom } = welcome;
export const { taskUUidAtom } = welcome;

/* widgetStore */
export const { showWalletAtom } = widget;
export const { walletInfoAtom } = widget;
export const { iframeAtom } = widget;
export const { textGenerateAtom } = widget;
export const { openRecommendPreviewAtom } = widget;
export const { haveSearchTabAtom } = widget;

// rodin
export const { rodinInitWeightAtom } = rodin;
export const { rodinModalLoadingAtom } = rodin;
export const { rodinGenPipeline } = rodin;
export const { renderPreviewImgAtom } = rodin;
export const { isRodinGeneratingAtom } = rodin;
export const { rodinHistoryStatus } = rodin;
export const { optionOpenAtom } = rodin;
export const { optionModeCloseAtom } = rodin
export const { optionModeRestAtom } = rodin
export const { textureCacheAtom } = rodin;
export const { faceCheckListAtom } = rodin
export const { defalutFaceEnhanceAtom } = rodin
export const { allowFaceEnhanceAtom } = rodin
export const { omniInitAtom } = rodin
