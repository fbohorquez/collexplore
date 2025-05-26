import React, { useState, useEffect, useRef } from "react";
import { normalizeString } from "../../services/helper";
import db from "../../services/db";

import { Box, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

const SearXNGImages = ({ field, definition }) => {
	const [images, setImages] = useState([]);
	const [query, setQuery] = useState("");
	const [pageno, setPageno] = useState(1);

	const instance = field.instance;

	const { t } = useTranslation();

	const handleError = (event, image) => {
		event.target.src = image.thumbnail_src; // Asegúrate de que thumbnailLink es correcto según la respuesta de SearXNG
	};

	const scrollRef = useRef(null);

	useEffect(() => {
		setPageno(1);
	}, [definition.root]);


	useEffect(() => {
		const fetchImages = async () => {
			let query = "";
			if (definition.root && definition.root.fields) {
				let type = await db.types.get(definition.root.type);
				let type_name = type.name;
				query = '"' + definition.root.name + '"';	
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
							subquery = subquery.replace(`{type}`, type_name);
						}
					});
					query += " " + subquery;
				}
			}
			query = query.trim();
			setQuery(query);

			const url = `${instance}/search?q=${encodeURIComponent(
				query
			)}&categories=images&format=json&pageno=${pageno}`;
			const response = await fetch(url);
			const data = await response.json();
			setImages(data.results);

			if (scrollRef.current && pageno === 1) {
				scrollRef.current.scrollIntoView({ behavior: "smooth" });
			}
		};

		fetchImages();
	}, [field,pageno]);

	// Estilos para el grid de imágenes
	const gridStyle = {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
		gap: "10px",
		padding: "10px",
	};

	return (
		<Box>
			<Typography variant="p">
				{t("search-keywords")}: {query} - {t("page")}: {pageno}
			</Typography>
			<div style={gridStyle} ref={scrollRef}>
				{images.map((image, index) => (
					<img
						key={index}
						src={image.img_src}
						alt={image.title}
						style={{ width: "100%", height: "auto" }}
						onError={(event) => handleError(event, image)}
					/>
				))}
			</div>
			<Button
				onClick={() => {
					if (pageno === 1) {
						return;
					}
					setPageno(pageno - 1);
					scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
				}}
			>
				{t("back")}
			</Button>
			<Button
				onClick={() => {
					setPageno(pageno + 1);
					scrollRef?.current?.scrollIntoView({ behavior: "smooth" });
				}}
			>
				{t("next")}
			</Button>
		</Box>
	);
};

export default SearXNGImages;















