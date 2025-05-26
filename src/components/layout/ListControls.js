import React from "react";
import {
	Box,
	IconButton,
	Button,
	Menu,
	MenuItem,
	Tooltip,
	Typography,
} from "@mui/material";

import TableChartIcon from "@mui/icons-material/TableChart";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import ImageIcon from "@mui/icons-material/Image";
import WindowIcon from '@mui/icons-material/Window';

import { useTranslation } from "react-i18next";

import { useContext, useState } from "react";
import { AppContext } from "../../services/context";


function ListControls({types=["table", "images"], setStateList, stateList}) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const {isMobile} = useContext(AppContext);

  const handleFloatingMenuClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
		setAnchorEl(event.currentTarget);
	};

  const handleClose = () => {
		setAnchorEl(null);
	};

  return (
		<Box className="list-controls">
			{stateList === "table" ? (
				<Tooltip title={t("see-as-images")}>
					<IconButton color="primary" onClick={() => setStateList("images")}>
						<ImageIcon style={{ color: "#888" }} />
					</IconButton>
				</Tooltip>
			) : (
				<Tooltip title={t("see-as-table")}>
					<IconButton color="primary" onClick={() => setStateList("table")}>
						<TableChartIcon style={{ color: "#888" }} />
					</IconButton>
				</Tooltip>
			)}
		</Box>
	);
}



























export default ListControls;