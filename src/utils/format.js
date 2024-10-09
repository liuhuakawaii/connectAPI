

// import { rodinHistory } from './net';
// import { fetchSettings } from '../components/Board/RodinGenerateBoard/utils';
// import { RODIN_GEOMETRY_REDO_COUNT, RODIN_MATERIAL_REDO_COUNT } from './map';

/**
 * Get the browser name and version from the user agent string
 * @return {object} - Object containing the browser name and version
 */
export const getBrowserInfo = () => {
    const { userAgent } = navigator;

    const browserRegexList = [
        { name: 'Edge', regex: /(Edg|EdgiOS|EdgA)\/(\d+)/ },
        { name: 'Opera', regex: /(OPR|OPiOS)\/(\d+)/ },
        { name: 'Firefox', regex: /(Firefox|FxiOS)\/(\d+)/ },
        { name: 'Safari', regex: /(Version)\/(\d+)/ },
        { name: 'Chrome', regex: /(Chrome|CriOS)\/(\d+)/ },
    ];

    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    for (const { name, regex } of browserRegexList) {
        if (regex.test(userAgent)) {
            browserName = name;
            browserVersion = userAgent.match(regex)[2];
            break;
        }
    }

    return {
        name: browserName,
        version: browserVersion,
    };
};
/**
 * Perform precise addition or subtraction of decimals
 * @param {number} num1
 * @param {number} num2
 * @param {string} operation - The operator, can be "+" or "-"
 * @return {number} - The calculated result
 */
export const addAndSubtract = (num1, num2, operation) => {
    const decimalPlaces = Math.max(
        num1.toString().split('.')[1]?.length ?? 0,
        num2.toString().split('.')[1]?.length ?? 0,
    );
    const multiplier = 10 ** decimalPlaces;
    const result = operation === '+'
        ? (num1 * multiplier + num2 * multiplier) / multiplier
        : (num1 * multiplier - num2 * multiplier) / multiplier;

    return result;
};

// check empty
export const isNotEmpty = (value) => {
    if (typeof value === 'object' && value !== null) {
        // object
        if (Array.isArray(value)) {
            // array obj
            return value.length !== 0;
        }
        // other obj
        return Object.keys(value).length !== 0;
    }
    // others
    return !(
        value === null
        || value === undefined
        || value === ''
        || (typeof value === 'number' && value === 0)
        || (typeof value === 'string' && value.trim() === '')
    );
};

/**
 * Perform deep cloning of an object or array
 * @param {object|array} obj - The object or array to be cloned
 * @return {object|array} - The cloned object or array
 */
export const deepClone = (obj) => {
    if (typeof obj !== 'object' || obj == null) return obj;
    let result;
    if (obj instanceof Array) {
        result = [];
    } else {
        result = {};
    }
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, "key")) {
            result[key] = deepClone(obj[key]);
        }
    }
    return result;
};

export class IDBClass {
    constructor(databaseName, objectStore, version) {
        this.databaseName = databaseName;
        this.objectStore = objectStore;
        this.version = version;
        // 先调用一下生成仓库对象
        this.openDatabase();
    }

    // open IndexedDB get db
    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.databaseName, this.version);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.objectStore)) {
                    db.createObjectStore(this.objectStore, { autoIncrement: true });
                }
            };
            request.onsuccess = (event) => {
                const db = event.target.result;
                resolve(db);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // savaData
    async savaData(data) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction([this.objectStore], 'readwrite')
                .objectStore(this.objectStore)
                .add(data);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // deleteData
    async deleteData(id) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction([this.objectStore], 'readwrite')
                .objectStore(this.objectStore)
                .delete(id);
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // readData
    async readData(id) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction([this.objectStore], 'readonly')
                .objectStore(this.objectStore)
                .get(id);

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // getAll
    async getAll() {
        const db = await this.openDatabase();
        return new Promise((resolve) => {
            const getAllRequest = db.transaction([this.objectStore])
                .objectStore(this.objectStore)
                .getAll();
            getAllRequest.onsuccess = function (event) {
                const allData = event.target.result;
                resolve(allData);
            };
            getAllRequest.onerror = function () {
                console.error('Failed to fetch data');
            };
        });
    }

    // clear
    async clearData() {
        const db = await this.openDatabase();
        return new Promise(() => {
            const deleteRequest = db.transaction([this.objectStore], 'readwrite')
                .objectStore(this.objectStore)
                .clear();
            deleteRequest.onsuccess = function () {
                console.log('Delete Success');
            };
            deleteRequest.onerror = function () {
                console.log('Unable to delete item');
            };
        });
    }

    async close() {
        const db = await this.openDatabase();
        db.close();
    }
}

export const checkMobile = () => {
    let isSmallScreen = window.innerWidth <= 800;
    let userAgentMatch = navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    );
    return isSmallScreen && userAgentMatch;
}

export const checkIsIOS = () => {
    const u = navigator.userAgent;
    return !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
}

export const compressImg = (imgFiles) => new Promise((resolve, reject) => {
    const fileData = [];
    let compressedCount = 0;
    const maxSize = 2 * 1024 * 1024

    imgFiles.forEach((imgFile) => {
        const reader = new FileReader();
        reader.onload = async function (event) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = event.target.result;
            img.onload = function () {
                if (imgFile.size <= maxSize) {
                    fileData.push({ fileName: imgFile.name, data: reader.result, file: imgFile });
                    compressedCount++;
                } else {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxThreshold = 2048;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    if (Math.max(img.width, img.height) > maxThreshold) {
                        const aspectRatio = img.width / img.height;
                        if (img.width > img.height) {
                            canvas.width = maxThreshold;
                            canvas.height = maxThreshold / aspectRatio;
                        } else {
                            canvas.height = maxThreshold;
                            canvas.width = maxThreshold * aspectRatio;
                        }
                    }
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(
                        (blob) => {
                            const file = new File([blob], imgFile.name, { type: blob.type });
                            fileData.push({ fileName: imgFile.name, data: reader.result, file });
                            compressedCount++;
                            if (compressedCount === imgFiles.length) {
                                resolve({ fileData });
                            }
                        },
                        'image/jpeg',
                        0.8,
                    );
                }
                if (compressedCount === imgFiles.length) {
                    resolve({ fileData });
                }

            };
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsDataURL(imgFile);
    });
});


export const isMac = () => window.navigator.platform.toUpperCase().indexOf('MAC') >= 0;



export const rodinUploadCompressImg = (imgFiles, arr) => new Promise((resolve, reject) => {
    const fileData = [];
    let compressedCount = 0;

    if (!imgFiles || imgFiles.length === 0) {
        reject(new Error('No image files provided'));
        return;
    }

    imgFiles.forEach((imgFile, index) => {
        if (!imgFile) {
            compressedCount++;
            if (compressedCount === imgFiles.length) {
                resolve({ fileData });
            }
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const canvasSize = 500;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const reader = new FileReader();

        reader.onload = function (event) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = event.target.result;
            img.onload = function () {
                if (arr[index] && !arr[index].isHasAlpha) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                const overlayScale = Math.min(canvasSize / img.width, canvasSize / img.height);
                const overlayX = (canvasSize - img.width * overlayScale) / 2;
                const overlayY = (canvasSize - img.height * overlayScale) / 2;
                ctx.drawImage(img, overlayX, overlayY, img.width * overlayScale, img.height * overlayScale);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const file = new File([blob], imgFile.name, { type: blob.type });
                            fileData.push({ fileName: imgFile.name, data: reader.result, file });
                        } else {
                            console.error('Failed to create blob for', imgFile.name);
                        }
                        compressedCount++;
                        if (compressedCount === imgFiles.length) {
                            resolve({ fileData });
                        }
                    },
                    imgFile.type || 'image/png'
                );
            };

            img.onerror = function () {
                console.error('Failed to load image', imgFile.name);
                compressedCount++;
                if (compressedCount === imgFiles.length) {
                    resolve({ fileData });
                }
            };
        };

        reader.onerror = function (error) {
            console.error('FileReader error for', imgFile.name, error);
            compressedCount++;
            if (compressedCount === imgFiles.length) {
                resolve({ fileData });
            }
        };

        reader.readAsDataURL(imgFile);
    });
});

export const cropImage = (imageUrl, cropWidth, cropHeight, ORDER = 0) => {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const loadImage = () => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            // const noCacheUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'nocache=' + new Date().getTime();
            img.src = imageUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = cropWidth;
                canvas.height = cropHeight;
                ctx.drawImage(img, ORDER * 360, 0, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
                const croppedImageUrl = canvas.toDataURL();
                resolve(croppedImageUrl);
            };

            img.onerror = () => {
                const error = new Error('Image load error after ' + (attempts + 1) + ' attempt(s): ' + img.src);
                console.error(error);

                attempts++;
                if (attempts < 3) {
                    console.log(`Image load failed, retrying... (${attempts})`);
                    loadImage();
                } else {
                    reject(error);
                }
            };
        };

        loadImage();
    });
};


export const fetchAndConvertToFiles = async (meshInputImages, materialInputImages) => {
    const combinedImages = { ...meshInputImages, ...materialInputImages };

    const filePromises = Object.entries(combinedImages).map(async ([fileName, url]) => {
        const blob = await fetchObjectToLocalBlob(url);
        return new File([blob], fileName, { type: blob?.type });
    });

    const files = await Promise.all(filePromises);
    let fileDict = []
    files.forEach((file) => {
        fileDict = [...fileDict, { fileName: file.name, data: URL.createObjectURL(file), file: file }]
    })
    return fileDict;
};

export const resetGenPipeline = (uuid, setGenPipeline) => {
    setGenPipeline(currentGenPipeline => {
        return Object.keys(currentGenPipeline).reduce((newGenPipeline, key) => {
            if (key === "taskInfo") {
                newGenPipeline[key] = {
                    status: true,
                    data: uuid,
                    timestamp: null
                };
            } else {
                newGenPipeline[key] = {
                    status: false,
                    data: null,
                    timestamp: null
                };
            }
            return newGenPipeline;
        }, {});
    });
};

export const isSafariBrowser = () => {
    const userAgent = window?.navigator?.userAgent?.toLowerCase();
    return /safari/.test(userAgent) && !/chrome/.test(userAgent);
};

export const isHasAlpha = async (file) => {
    const readBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                const processedBlob = new Blob([event.target.result], { type: 'image/png' });
                const processedFile = new File([processedBlob], file.name, { type: 'image/png' });
                resolve({
                    fileName: file.name,
                    data: dataUrl, // 这里是DataURL
                    file: processedFile
                });
            };
            reader.onerror = () => {
                reject(reader.error);
            };
            reader.readAsArrayBuffer(file);
        });
    }
    const readDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;
                combineImagesToFile(dataUrl).then((combineData) => {
                    resolve({ combineData, dataUrl });
                })

            };
            reader.onerror = () => {
                reject(reader.error);
            };
            reader.readAsDataURL(file);
        });
    }

    try {
        const bufferData = await readBuffer(file);
        const { combineData, dataUrl } = await readDataURL(file)
        return {
            combineData: combineData,
            isHasAlpha: true,
            data: bufferData,
            dataUrl: dataUrl
        }

    } catch (error) {
        console.error('Error while reading file:', error);
        return false
    }
}



export const combineImagesToFile = async (overlayImageUrl) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const canvasSize = 500; // 设置合成图的大小为500x500
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        // 填充白色背景
        ctx.fillStyle = '#FFFFFF'; // 白色
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 加载透明的PNG图片
        const overlayImage = new Image();
        overlayImage.crossOrigin = 'Anonymous';
        overlayImage.src = overlayImageUrl;
        overlayImage.onload = () => {
            // 保持overlayImage的原始比例居中显示
            const overlayScale = Math.min(canvasSize / overlayImage.width, canvasSize / overlayImage.height);
            const overlayX = (canvasSize - overlayImage.width * overlayScale) / 2;
            const overlayY = (canvasSize - overlayImage.height * overlayScale) / 2;
            ctx.drawImage(overlayImage, overlayX, overlayY, overlayImage.width * overlayScale, overlayImage.height * overlayScale);

            const url = canvas.toDataURL('image/png', 1.0);
            resolve(url);
        };
        overlayImage.onerror = reject;

        // // 加载底图
        // const baseImage = new Image();
        // baseImage.crossOrigin = 'Anonymous';
        // baseImage.src = baseImageUrl;
        // baseImage.onload = () => {
        //     // 计算绘制底图时的缩放比例
        //     const scale = Math.max(canvas.width / baseImage.width, canvas.height / baseImage.height);
        //     const x = (canvas.width / 2) - (baseImage.width / 2) * scale;
        //     const y = (canvas.height / 2) - (baseImage.height / 2) * scale;
        //     ctx.drawImage(baseImage, x, y, baseImage.width * scale, baseImage.height * scale);

        //     // 加载透明的PNG图片
        //     const overlayImage = new Image();
        //     overlayImage.crossOrigin = 'Anonymous';
        //     overlayImage.src = overlayImageUrl;
        //     overlayImage.onload = () => {
        //         // 保持overlayImage的原始比例居中显示
        //         const overlayScale = Math.min(canvasSize / overlayImage.width, canvasSize / overlayImage.height);
        //         const overlayX = (canvasSize - overlayImage.width * overlayScale) / 2;
        //         const overlayY = (canvasSize - overlayImage.height * overlayScale) / 2;
        //         ctx.drawImage(overlayImage, overlayX, overlayY, overlayImage.width * overlayScale, overlayImage.height * overlayScale);

        //         const url = canvas.toDataURL('image/png', 1.0);
        //         resolve(url);
        //     };
        //     overlayImage.onerror = reject;
        // };
        // baseImage.onerror = reject;
    });
};

export async function url2Base64(imageUrl) {
    if (typeof imageUrl !== 'string') {
        throw new TypeError("Expected imageUrl to be a string");
    }

    const blob = await fetchObjectToLocalBlob(imageUrl);
    if (!(blob instanceof Blob)) {
        throw new TypeError("Expected fetchObjectToLocalBlob to return a Blob");
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export const isHasAlpha2 = async (file) => {
    const readBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }
    const isHasAlphaWebP = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function (event) {
                const buffer = new Uint8Array(event.target.result);
                for (let i = 0; i < buffer.length; i++) {
                    // Looking for VP8 or VP8L signature
                    if (buffer[i] === 0x56 && buffer[i + 1] === 0x50 && (buffer[i + 2] === 0x38 || buffer[i + 2] === 0x38 && buffer[i + 3] == 0x4C)) { // VP8 or VP8L
                        // If the 5th bit is 1, the image contain an alpha channel
                        if ((buffer[i + 5] & 0x10) === 0x10) {
                            resolve({
                                isHasAlpha: true,
                                file: file.name
                            });
                        } else {
                            resolve({
                                isHasAlpha: false,
                                file: file.name
                            });
                        }
                    }
                }
                resolve({
                    isHasAlpha: false,
                    file: file.name
                });
            };
            reader.onerror = (error) => {
                console.error('Error occurred in FileReader: ', error);
                resolve({
                    isHasAlpha: false,
                    file: file.name
                });
            };
            reader.readAsArrayBuffer(file);
        });
    };

    try {
        if (file.type === 'image/webp') {
            return isHasAlphaWebP(file);
        }
        if (["image/jpeg", "image/jpg"].includes(file.type)) {
            return {
                isHasAlpha: false,
                file: file.name
            }
        }
        const bufferData = await readBuffer(file);
        const uint8Array = new Uint8Array(bufferData);
        let type = '';
        uint8Array.slice(12, 16).forEach((num) => {
            type += String.fromCharCode(num);
        });

        if (type === 'IHDR' && (uint8Array[25] === 6 || uint8Array[25] === 4)) {
            return {
                isHasAlpha: true,
                file: file.name
            }
        } else {
            return {
                isHasAlpha: false,
                file: file.name
            }
        }

    } catch (error) {
        console.error('Error while reading file:', error);
        return false
    }
}

const retryAsync = async (fn, maxRetries = 5) => {
    let retryDelay = 500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) {
                console.error(`Attempt ${attempt} failed:`, error);
                throw error;
            } else {
                console.error(`Attempt ${attempt} failed, retrying in ${retryDelay}ms...`, error);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay = Math.min(retryDelay * 2, 5000);
            }
        }
    }
}

export const fetchObjectToLocalBlob = async (objUrl) => {
    return retryAsync(async () => {
        const response = await fetch(objUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.blob();
    }).catch(error => {
        throw Error(error)
        // Sentry.captureException(error);
    });
}



export const isNumber = (value) => {
    return typeof value === 'number' && !isNaN(value);
}

export const pos2Base64 = (array) => {
    const packBits = (array) => {
        const packed = new Uint8Array(Math.ceil(array.length / 8));
        for (let i = 0; i < array.length; i++) {
            if (array[i]) {
                packed[Math.floor(i / 8)] |= 1 << (i % 8);
            }
        }
        return packed;
    }
    const arrayToBase64 = (array) => {
        // Convert the packed array to a binary string
        const binaryString = String.fromCharCode.apply(null, array);
        // Encode the binary string to base64
        return btoa(binaryString);
    }

    return arrayToBase64(packBits(array))
}

export const base64ToPos = (base64) => {
    const base64ToOriginalArray = (base64String) => {
        const binaryString = atob(base64String);  // Base64 解码
        const byteArray = new Uint8Array(Array.from(binaryString).map(char => char.charCodeAt(0)));  // 字符串转换为 Uint8Array
        const originalArray = [];

        byteArray.forEach(byte => {
            for (let i = 0; i < 8; i++) {
                const bit = (byte >> i) & 1;
                originalArray.push(bit);
            }
        });

        return originalArray.slice(0)
    }

    const originalArray = base64ToOriginalArray(base64);
    const voxels = []
    const min = -1
    const max = 1
    const voxelSize = (max - min) / 16;
    originalArray.forEach((val, index) => {
        if (val === 1) {
            let i = Math.floor(index / (16 * 16));
            let j = Math.floor((index - i * 16 * 16) / 16);
            let k = index % 16;
            let pos = {
                x: (i + 0.5) * voxelSize - 1,
                y: (j + 0.5) * voxelSize - 1,
                z: (k + 0.5) * voxelSize - 1,
            };
            voxels.push({ position: pos });
        }
    })

    return { voxels, originalArray }
}
export async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = () => {
            reject(new Error("Failed to convert file to Base64."));
        };
        reader.readAsDataURL(file);
    });
}

const ignoreMessages = [
    /INVALID_GITHUB_OAUTH_CALLBACK/i,
    /RATE_LIMITED/i,
    /DUPLICATE_EMAIL/i,
    /300031/i,
    /300030/i,
    /400060/i,
    /Verification unsuccessful/i,
    /Captcha Verification Failed/i,
    /Network Error/i,
    /WRONG_PASSWORD/i,
    /Resource download error./i,
    /undefined/i,
    /Failed to fetch/i,
    /Request aborted/i,
    /A component suspended while responding to synchronous input/i
];

export function shouldIgnoreEvent(message) {
    if (!message) {
        return false;
    }

    for (const regex of ignoreMessages) {
        if (regex.test(message)) {
            return true;
        }
    }

    return false;
}
