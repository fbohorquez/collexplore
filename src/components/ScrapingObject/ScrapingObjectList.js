import React, { useState, useEffect, useContext } from "react";
import {
	Box,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Button,
	Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import db from "../../services/db";
import { AppContext } from "../../services/context";

import { selectPopup, selectDetail, getTypesByID } from "../../services/helper";

import FormBuilder from "../FormBuilder";

import Title from "../layout/Title";
import TitleButtons from "../layout/TitleButtons";

// Import or define typesByID
// import typesByID from "../../services/typesByID"; // Adjust the import path as needed

function ScrapingObjectList() {
	const { t } = useTranslation();

	const [scrapingObjects, setScrapingObjects] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			const data = (await db.scrapingObjects.toArray()).sort((a, b) => {
				if (a.name < b.name) return -1;
				if (a.name > b.name) return 1;
				return 0;
			});
			setScrapingObjects(data);
		};

		fetchData();
	}, []);

	const handleDelete = (id) => {
		selectPopup({
			title: t("delete-scraping-object"),
			content: () => (
				<Box>
					<p>{t("delete-scraping-confirm")}</p>
				</Box>
			),
			btns: [
				{
					label: t("yes"),
					action: () => {
						selectPopup(null);
						db.scrapingObjects.delete(id).then(() => {
              setScrapingObjects(scrapingObjects.filter((item) => item.id !== id));
            });
					},
				},
				{
					label: t("no"),
					action: () => selectPopup(null),
					variant: "outlined",
				},
			],
		});
	};

	const { selectComponent, setListSelected } = useContext(AppContext);


	return (
		<Box className={"list-list-container"}>
			<Title
				title={t("scraping-objects")}
				back={true}
				back_action={() => selectComponent("scraping")}
			/>
			<List
				sx={{
					width: "calc(100% - 1px)",
					height: "calc(100vh - 52px)",
					overflow: "auto",
					bgcolor: "background.paper",
					borderRadius: "0px",
					margin: "0px",
					padding: "0px",
				}}
			>
				{scrapingObjects.map((list) => (
					<ListItem
						key={list.id}
						className="list-list-item"
						onClick={(e) => {
							selectDetail("scraping-object", list);
						}}
					>
						<ListItemText primary={list.name} className="list-name" />
						<ListItemText
							className="list-actions"
							style={{ minWidth: "60px", maxWidth: "60px", display: "flex" }}
							primaryTypographyProps={{ style: { display: "flex" } }}
						>
							<Tooltip title={t("delete-list")}>
								<Button
									style={{ minWidth: "auto", padding: "0px" }}
									onClick={(e) => {
										e.stopPropagation();
										e.preventDefault();
										handleDelete(list.id);
									}}
								>
									<DeleteIcon />
								</Button>
							</Tooltip>
						</ListItemText>
					</ListItem>
				))}
			</List>
		</Box>
	);
}

export default ScrapingObjectList;




