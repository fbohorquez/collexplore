import React, { useContext } from "react";
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import { selectDetail } from "./../../services/helper";
import { useTranslation } from "react-i18next";

import Title from "./../layout/Title";

import VisibilityIcon from "@mui/icons-material/Visibility";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";

import { AppContext } from "../../services/context";

function ConfigEditorList() {
	const { t } = useTranslation();

	const { selectComponent } = useContext(AppContext);


	return (
		<Box>
			<Title title={t("config-editor")} back={true} back_action={() => selectComponent("items")} />
			<List
				sx={{
					width: "calc(100% - 1px)",
					borderRadius: "0px",
					padding: "0px",
				}}
			>
				<ListItem button onClick={() => selectDetail("config-editor", "view")} className="type-list-item">
					<ListItemIcon style={{ minWidth: "38px" }}>
						<VisibilityIcon />
					</ListItemIcon>
					<ListItemText primary={t("config-view")} />
				</ListItem>
				<ListItem button onClick={() => selectDetail("config-editor", "data")} className="type-list-item">
					<ListItemIcon style={{ minWidth: "38px" }}>
						<TextSnippetIcon />
					</ListItemIcon>
					<ListItemText primary={t("config-data")} />
				</ListItem>
			</List>
		</Box>
	);
}

export default ConfigEditorList;





















