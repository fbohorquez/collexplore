import React, { useState, useContext } from "react";

import { useTranslation } from "react-i18next";

import { AppContext } from "../../services/context";
import db from "../../services/db";

import { selectPopup, updatePopup, getEntityType } from "../../services/helper";

import { IconButton, Box, Tabs, Tab, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";


export default function GroupEditionPanel({ 
  // groupEditionItems,
  // setGroupEditionItems,
}) {
	const { t } = useTranslation();

  const {
      itemListConfig,
      setItemListConfig,
    } = useContext(AppContext);

	return (
		<Box
			style={{
				margin: "auto",
			}}
			className="group-edition-panel"
		>
			{itemListConfig.groupEditionItems.map((item, index) => (
				<Box key={index}>
					<Typography>{item.name}</Typography>
					<IconButton
						onClick={() => {
							// setGroupEditionItems(
							// 	groupEditionItems.filter((_, i) => i !== index)
							// );
              setItemListConfig({
                ...itemListConfig,
                groupEditionItems: itemListConfig.groupEditionItems.filter((_, i) => i !== index),
              });
						}}
					>
						<DeleteIcon />
					</IconButton>
				</Box>
			))}
		</Box>
	);
}


