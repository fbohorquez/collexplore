import React, {useContext} from "react";
import { Box, Typography } from "@mui/material";
import { AppContextDetail } from "../../../services/context_detail";

import ImportDetail from "./ImportDetail";
import ExportDetail from "./ExportDetail";

import Config from "../../../services/config";

import FormBuilder from "../../FormBuilder";

import { useTranslation } from "react-i18next";

function ImportExportDetail() {
	const { selectedItem } = useContext(AppContextDetail);

	const { t } = useTranslation();

	const def = {

	}

	return (
		<Box>
			<Typography variant="h5" component="div" style={{ marginBottom: "12px" }}>
				{t(selectedItem + "-data")}
			</Typography>
			{
				selectedItem === "import" ? <ImportDetail /> : <ExportDetail />
			}
		</Box>
	);
}

export default ImportExportDetail;










