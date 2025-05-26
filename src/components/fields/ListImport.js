import Box from "@mui/material/Box";

import { useTranslation } from "react-i18next";

import { Button, TextField } from "@mui/material";

export default function ListImport({
  field,
  value = [],
  onChange,
  definition = null,
}) {

  const { t } = useTranslation();
  return (
		<Box>
				<input type="file" accept=".csv" />
		</Box>
	);

}