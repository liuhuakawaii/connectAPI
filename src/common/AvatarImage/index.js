import React, {useCallback, useEffect, useState} from 'react';
const defaultAvatarURL = '/assets/defaultAvatar.png';
const assistantAvatar = '/assets/avatar.png';
// import { getAvatar, setAvatar } from './indexedDBHelper';

const AvatarImage = React.memo(({ width, height, url, assitant = false }) => {
  const [avatarURL, setAvatarURL] = useState(defaultAvatarURL);

  // const imageUrlToBase64 = async (imageUrl) => {
  //   return new Promise((resolve, reject) => {
  //     let image = new Image();
  //     image.crossOrigin = "anonymous";
  //     image.src = imageUrl;
  //     image.onload = () => {
  //       const canvas = document.createElement("canvas");
  //       canvas.width = image.width;
  //       canvas.height = image.height;
  //       let context = canvas.getContext('2d');
  //       context.drawImage(image, 0, 0, image.width, image.height);
  //       let dataURL = canvas.toDataURL("image/jpeg");
  //       resolve(dataURL);
  //     };
  //     image.onerror = (error) => reject(error);
  //   });
  // };

  const handleAvatarError = useCallback(async () => {
    setAvatarURL(assitant ? assistantAvatar : defaultAvatarURL);
  }, [url, assitant]);

  useEffect(() => {
      setAvatarURL(assitant ? assistantAvatar : url === "FILE_NOT_FOUND" ? defaultAvatarURL : url)
  }, [url]);

  return (
    <img
      style={{
        width: width,
        height: height,
      }}
      src={avatarURL}
      onError={handleAvatarError}
      alt="avatar"
    />
  );
});




AvatarImage.displayName = 'AvatarImage';
export { AvatarImage };