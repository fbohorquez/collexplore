import React, { useState, useEffect, useMemo, useRef } from "react";

function blobToBase64(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.onerror = (error) => reject(error);
		reader.readAsDataURL(blob);
	});
}

const ImageWithBlobSupport = ({ blob, alt, ...props }) => {
	const [src, setSrc] = useState("");
	const isIOS = useMemo(() => {
		return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	}, []);
	const isMountedRef = useRef(true);
	const imgRef = useRef(null);

	useEffect(() => {
		isMountedRef.current = true;
		

		let objectUrl;

		if (typeof blob === "string") {
			setSrc(blob);
		} else if (blob instanceof Blob) {

			// blobToBase64(blob).then((base64) => {
			// 	if (isMountedRef.current) {
			// 		setSrc(base64);
			// 	}
			// });

			if (isIOS) {
				const reader = new FileReader();
				reader.onloadend = function () {
					if (isMountedRef.current) {
						// console.log("Data URL:", reader.result);
						setSrc(reader.result);
					}
				};
				reader.onerror = function (error) {
					console.error("Error al leer el Blob:", error);
				};
				reader.readAsDataURL(blob);
			} else {
				objectUrl = URL.createObjectURL(blob);
				setSrc(objectUrl);
			}
			if (imgRef.current) {
				imgRef.current.onload = () => {
					if (imgRef.current){ 
						imgRef.current.classList.add("loaded");
					}
				}
			}
		} else {
			setSrc("");
		}

		return () => {
			isMountedRef.current = false;
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
		};
	}, [blob, isIOS]);

	return <img 
	ref={imgRef}
	src={src} alt={alt} {...props} />;
};

export default ImageWithBlobSupport;







