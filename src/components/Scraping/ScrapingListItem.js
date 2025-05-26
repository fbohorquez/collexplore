// Dentro de ScrapingList.js
import React, { memo, useContext, useEffect } from "react";
import { ListItem, ListItemText, Tooltip, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import db from "./../../services/db";
import { ProcessContext  } from "./../../services/context_scraping";
import { useTranslation } from "react-i18next";

const ProcessListItem = memo(({ process, onSelect }) => {

  const { t } = useTranslation();

  const { deleteProcess, getProcessStatus } = useContext(ProcessContext);

  const handleDelete = async (event) => {
    event.stopPropagation();
    await db.scraping.delete(process.id);
    deleteProcess(process.id);
  }
  
  useEffect(() => {
    if (process.processStatus === "running") {
			setTimeout(async () => {
				getProcessStatus(process.processId);
			}, 1000);
		}
  }, []);


	return (
		<ListItem button onClick={() => onSelect(process)}>
			<ListItemText primary={process.name} />
			<ListItemText primary={t(process.type)} />
      <ListItemText primary={process.processId || " - "} />
			<ListItemText primary={process.processStatus || "stopped"} />
			<IconButton size="small">
				<Tooltip title={t("delete-scraping")}>
					<DeleteIcon fontSize="small" onClick={handleDelete} />
				</Tooltip>
			</IconButton>
		</ListItem>
	);
});

export default ProcessListItem;










