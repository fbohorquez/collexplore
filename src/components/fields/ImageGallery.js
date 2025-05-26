import React, { useState, useRef } from "react";
import { Box, IconButton, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

import { useTranslation } from "react-i18next";

const ImageGallery = ({ value = [], onChange }) => {
	const [images, setImages] = useState(value);
	if (!(value instanceof Array)) {
		value = [];
	}
  const [blobImages, setBlobImages] = useState(value.map((image) => URL.createObjectURL(image)));
	const [currentIndex, setCurrentIndex] = useState(0);
	const sliderRef = useRef(null);

  const { t } = useTranslation();

	const handleDelete = (index) => {
		const newImages = images.filter((_, i) => i !== index);
		setImages(newImages);
		onChange(newImages);
		if (currentIndex >= newImages.length) {
			setCurrentIndex(newImages.length - 1);
		}
	};

	const handleAddImage = (event) => {
		const newImages = [
			...images,
			...Array.from(event.target.files)
		];
		setImages(newImages);
		onChange(newImages);
	};

	const nextSlide = () => {
		setCurrentIndex((currentIndex + 1) % blobImages.length);
	};

	const prevSlide = () => {
		setCurrentIndex((currentIndex - 1 + blobImages.length) % blobImages.length);
	};

  const showImageFull = (index) => {
    document.body.appendChild(document.createElement("div")).outerHTML = `
      <div class="image-full" onclick="this.remove()">
        <img data-index="${index}" src="${blobImages[index]}" alt="image-full" onclick="this.parentElement.remove()" style="background-color: white; max-width: 100%; max-height: 100%; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); cursor: pointer;" />
      </div>
    `;
  }

  React.useEffect(() => {
    setImages(value);
  }, [value]);

  React.useEffect(() => {
    setBlobImages(images.map((image) => URL.createObjectURL(image)));
  }, [images]);


	return (
		<Box className="slider-container" style={{ marginTop: 10 }}>
			<Box
				className="slider"
				ref={sliderRef}
				style={{
					transform: `translateX(-${currentIndex * 100}%)`,
				}}
			>
				{blobImages.map((image, index) => (
					<Box
						key={index}
						className="slide"
						onClick={() => showImageFull(index)}
					>
						<img src={image} alt={`image-${index}`} className="slide-image" />
						<IconButton
							onClick={(e) => {
								e.stopPropagation();
								handleDelete(index);
							}}
							style={{ position: "absolute", top: 10, right: 10, color: "red" }}
						>
							<DeleteIcon />
						</IconButton>
					</Box>
				))}
			</Box>
			<Button
				variant="contained"
				color="primary"
				onClick={prevSlide}
				disabled={blobImages.length <= 1}
				style={{ marginTop: 10 }}
			>
				{t("prev")}
			</Button>
			<Button
				variant="contained"
				color="primary"
				onClick={nextSlide}
				disabled={blobImages.length <= 1}
				style={{ marginTop: 10, marginLeft: 10 }}
			>
				{t("next")}
			</Button>
			<input
				accept="image/*"
				id="add-image"
				type="file"
				multiple
				style={{ display: "none" }}
				onChange={handleAddImage}
			/>
			<label htmlFor="add-image">
				<Button
					variant="contained"
					color="primary"
					component="span"
					startIcon={<AddPhotoAlternateIcon />}
					style={{ marginTop: 10, marginLeft: 10 }}
				>
					{t("add-images")}
				</Button>
			</label>
		</Box>
	);
};

export default ImageGallery;












