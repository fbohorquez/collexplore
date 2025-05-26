import React, { useContext } from "react";
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import { selectDetail } from "../../../services/helper";
import { useTranslation } from "react-i18next";

import Title from "../../layout/Title";

import ImportIcon from "@mui/icons-material/Publish";
import ExportIcon from "@mui/icons-material/FileDownload";

import { AppContext } from "../../../services/context";


function ImportExportList() {
	const { t } = useTranslation();

	const { selectComponent } = useContext(AppContext);

	return (
		<span
			style={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "flex-start",
				width: "560px",
			}}
		>
			<ListItemText
				primary={
					<button onClick={() => selectDetail("import-export", "import")}>
						{/* <ListItemIcon style={{ minWidth: "38px" }}>
								<ImportIcon />
							</ListItemIcon> */}
						<ListItemText primary={t("import-data")} />
					</button>
				}
			></ListItemText>
			<ListItemText
				primary={
					<button onClick={() => selectDetail("import-export", "export")}>
						{/* <ListItemIcon style={{ minWidth: "38px" }}>
								<ExportIcon />
							</ListItemIcon> */}
						<ListItemText primary={t("export-data")} />
					</button>
				}
			></ListItemText>
		</span>
	);
	// 	<Box>
	// 		<Title title={t("import-export")} back={true} back_action={() => selectComponent("items") } />
	// 		<List
	// 			sx={{
	// 				width: "calc(100% - 1px)",
	// 				borderRadius: "0px",
	// 				padding: "0px",
	// 			}}
	// 		>
	// 			<ListItem button onClick={() => selectDetail("import-export", "import")} className="type-list-item">
	// 				<ListItemIcon style={{ minWidth: "38px" }}>
	// 					<ImportIcon />
	// 				</ListItemIcon>
	// 				<ListItemText primary={t("import-data")} />
	// 			</ListItem>
	// 			<ListItem button onClick={() => selectDetail("import-export", "export")} className="type-list-item">
	// 				<ListItemIcon style={{ minWidth: "38px" }}>
	// 					<ExportIcon />
	// 				</ListItemIcon>
	// 				<ListItemText primary={t("export-data")} />
	// 			</ListItem>
	// 		</List>
	// 	</Box>
	// );
}

export default ImportExportList;




























