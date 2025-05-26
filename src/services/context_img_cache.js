import React, {
	createContext,
	useEffect,
	useState,
	useRef,
	useMemo,
} from "react";
import db from "./db";

export const ImgCacheContext = createContext();

export const ImgCacheProvider = ({ children }) => {

	const isIOS = useMemo(() => {
		return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	}, []);

	const defineCache = (items, imageFieldId, imgRefs) => {
		const itemsIds = new Set(
			items.map((item) => (item.item ? item.item.id : item.id))
		);

		imgRefs.current.forEach((imgDef, itemId) => {
      const url = imgDef.img.src;
      const img = imgDef.img;
			if (!itemsIds.has(itemId)) {
				URL.revokeObjectURL(url);
				imgRefs.current.delete(itemId);
				if (img) {
					document.body.removeChild(img);
					imgRefs.current.delete(itemId);
				}
			}
		});

		for (let item of items) {
			if (item.item) {
				item = item.item;
			}
			const itemId = item.id;
			if (!item.fields) {
				continue;
			}
			const imageField = item.fields[imageFieldId];

			if (!(imageField instanceof Blob)) {
				continue;
			}

			let existingUrl = imgRefs.current.get(itemId);
			const imgRef = imgRefs.current.get(itemId);

			if (existingUrl && imgRef && imgRef.imageField === imageField) {
				continue;
			}

			if (existingUrl) {
        existingUrl = imgRef.img.src;
        const img = imgRef.img;
				URL.revokeObjectURL(existingUrl);
				if (img) {
					document.body.removeChild(img);
				}
        imgRefs.current.delete(itemId);
			}
			if (isIOS) {
				const reader = new FileReader();
				reader.onloadend = function () {
					const img = document.createElement("img");
					img.src = reader.result;
					img.style.display = "none";
					document.body.appendChild(img);
					imgRefs.current.set(itemId, { img, imageField });
				};
				reader.onerror = function (error) {
					console.error("Error al leer el Blob:", error);
				};
				reader.readAsDataURL(imageField);
				continue;
			}else {
				const imageURL = URL.createObjectURL(imageField);
				const img = document.createElement("img");
				img.src = imageURL;
				img.style.display = "none";
				document.body.appendChild(img);

				imgRefs.current.set(itemId, { img, imageField });
			}
		}
	};


	const getCache = (itemId, cache) => {
    if (!cache.current) {
      return null;
    }
    let item = cache.current.get(itemId);
    if (!item) {
      return null;
    }
    return item.img.src;
  };

	return (
		<ImgCacheContext.Provider value={{ getCache, defineCache }}>
			{children}
		</ImgCacheContext.Provider>
	);
};




















