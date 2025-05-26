import React, { useState, useEffect } from "react";

import { normalizeString } from "../../services/helper";
import db from "../../services/db";

import { Box, Typography } from "@mui/material";

import { useTranslation } from "react-i18next";

const GoogleImages = ({ field, definition }) => {
	const [images, setImages] = useState([]);
  const [query, setQuery] = useState("");

  const { t } = useTranslation();

	const api_key = field.api_key;
	const cx = field.cx;

  const handleError = (event, image) => {
		event.target.src = image.image.thumbnailLink;
	};

	useEffect(() => {
		const fetchImages = async () => {
			let query = "";
			if (definition.root && definition.root.fields) {
				let type = await db.types.get(definition.root.type);
				let type_name = type.name;
				query = definition.root.name + " " + type_name;
				if (field.add_search_data) {
					let subquery = "";
					Object.keys(field.add_search_data).forEach((key) => {
						if (normalizeString(field.type_name) == normalizeString(key)) {
							subquery += " " + field.add_search_data[key];
							for (let type_field of type.fields) {
								const field_name = type_field.label;
								let field_value = definition.root.fields[type_field.id];
								if (type_field.type === "entity") {
									field_value = definition.root.cache[type_field.id];
									if (!(field_value instanceof Array)) {
										field_value = [field_value];
									}
									field_value = field_value
										.map((value) => value?.name)
										.join(" ");
								}
								subquery = subquery.replace(`{${field_name}}`, field_value);
							}
						}
					});
					query += " " + subquery;
				}
			}

			setQuery(query);

			const response = await fetch(
				`https://www.googleapis.com/customsearch/v1?key=${api_key}&cx=${cx}&q=${query}&searchType=image`
			);
			const data = await response.json();
			setImages(data.items);
      if(scrollRef && scrollRef.current){
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
		};

		fetchImages();
	}, [definition.root,api_key, cx]); // Añadido api_key y cx como dependencias

	// Estilos para el grid de imágenes
	const gridStyle = {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", // Ajusta el tamaño mínimo de las columnas aquí
		gap: "10px", // Espacio entre imágenes
		padding: "10px", // Padding del contenedor
	};

  const scrollRef = React.useRef(null);

	return (
    <Box>
      <Typography variant="p">{t('search-keywords')}: {query}</Typography>
      <div style={gridStyle}
      ref={scrollRef}>
        {images.map((image, index) => (
          <img
            key={index}
            src={image.link /* image.image.thumbnailLink*/}
            alt={image.title}
            style={{ width: "100%", height: "auto" }}
            onError={(event) => handleError(event, image)}
          />
        ))}
      </div>
    </Box>
	);
};

export default GoogleImages;












