import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import { selectDetail } from "./../../services/helper";
import { useTranslation } from "react-i18next";
import db from "./../../services/db";
import TitleButtons from "../layout/TitleButtons";
import TypesTabs from "../layout/TypesTabs";
import ProcessListItem from "./ScrapingListItem";
import { ProcessContext } from "./../../services/context_scraping";
import { AppContext } from "./../../services/context";

import Title from "./../layout/Title";

import VisibilityIcon from "@mui/icons-material/Visibility";

function ScrapingList() {
	const { t } = useTranslation();

  const { processes } = useContext(ProcessContext);
	
	const { selectComponent, itemListConfig } = useContext(AppContext);

	// useEffect(() => {
	// 	const fetchProcesses = async () => {
	// 		const allProcesses = await db.scraping.toArray();
	// 		setProcesses(allProcesses);
	// 	};
	// 	fetchProcesses();
	// }, []);

  const btns = [
		{
			label: t("scraping-object"),
			action: () => selectComponent("scrapping-object"),
			key: "alt_o",
		},
		{
			label: t("new"),
			action: () => {
				selectDetail("scraping", "new_".concat(Date.now()));
			},
			key: "alt_n",
		},
	];

	return (
		<Box className={"scraping-list-container"}>
			<Title
				title={t("scraping-list")}
				after={
					<Box style={{ display: "flex" }} className={"list-title-actions"}>
						<TitleButtons btns={btns} />
					</Box>
				}
				back={true}
				back_action={() => selectComponent("items")}
			/>
			<TypesTabs />
			<List
				sx={{
					width: "calc(100% - 1px)",
					height: "calc(100vh - 52px)",
					overflow: "auto",
					bgcolor: "background.paper",
					borderRadius: "0px",
				}}
			>
				{processes
					.filter(
						(process) =>
							!process.types ||
							process.types.length === 0 ||
							process.types.includes(parseInt(itemListConfig.typeSelected))
					)
					.map((process) => (
						<ProcessListItem
							process={process}
							onSelect={() => selectDetail("scraping", process)}
						/>
					))}
			</List>
		</Box>
	);
}

export default ScrapingList;




































