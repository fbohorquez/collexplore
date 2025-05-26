import React, {useContext} from "react";
import { Box, Typography } from "@mui/material";
import { AppContextDetail } from "./../../services/context_detail";
import Config from "./../../services/config";

import FormBuilder from "./../FormBuilder";

import { useTranslation } from "react-i18next";

function ConfigEditorDetail() {
  const { selectedItem } = useContext(AppContextDetail);

  const { t } = useTranslation();

  const def = Config.getDef(selectedItem);

	return (
		<Box className="config-editor-detail">
			<Typography variant="h5" component="div" style={{marginBottom:'12px'}}>
				{t("config-" + selectedItem)}
			</Typography>
			<FormBuilder definition={def} />
		</Box>
	);
}

export default ConfigEditorDetail;







