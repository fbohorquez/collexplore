import React, { useContext } from "react";
import { Box, Tooltip } from "@mui/material";

import CategoryIcon from "@mui/icons-material/Category";

import { AppContext } from "../../services/context";

import { useTranslation } from "react-i18next";

export default function TypesTabs({ 
  onClick= null,
}) {
	
	const { t, i18n } = useTranslation();

  const { selectComponent, itemListConfig, setItemListConfig } = useContext(AppContext);

	if (!onClick) {
		onClick = (e, type) => {
			if (!e.target || !e.target.classList.contains("selected")) {
				e.stopPropagation();
				e.preventDefault();
				setTimeout(() => {
					setItemListConfig({
						...itemListConfig,
						typeSelected: type,
					});
					document.querySelector("body").dataset.type = type;
					document.querySelector("body").click();
				}, 10);
			}
		};
	}

	return (
		<Box
			className="list-table-tabs-container list"
			sx={{
				display:
					itemListConfig.typesByID && Object.keys(itemListConfig.typesByID).length > 1 ? "flex" : "none",
			}}
			onClick={(e) => {
				e.stopPropagation();
				document
					.querySelector(".list-table-tabs-container")
					.classList.toggle("open");
			}}
		>
			{itemListConfig.typesByID &&
				Object.keys(itemListConfig.typesByID).length > 1 &&
				Object.keys(itemListConfig.typesByID)
					.sort((a, b) => {
						return itemListConfig.typesByID[a].order - itemListConfig.typesByID[b].order;
					})
					.map((type) => {
						let typeSelectedNumber = parseInt(itemListConfig.typeSelected);
						let typeNumber = parseInt(type);
						return (
							<button
								key={type}
								className={`list-table-tabs ${
									typeSelectedNumber === typeNumber ? "selected" : ""
								}`}
								onClick={(e) => {
                  onClick(e, type);
								}}
							>
								{t(itemListConfig.typesByID[type].name)}
							</button>
						);
					})}
			<button
				key="config"
				className={`list-table-tabs`}
				onClick={() => {
					selectComponent("types");
				}}
			>
				<Tooltip title={t("item-types")}>
					<CategoryIcon style={{ fontSize: "20px", marginTop: "-2px" }} />
				</Tooltip>
			</button>
		</Box>
	);







}