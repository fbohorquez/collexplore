import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Box, IconButton, Menu, Tooltip } from "@mui/material";
import { AppContext } from "../../services/context";
import { setSelectedItemId, fadeVirtuoso } from "../../services/helper";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";



export default function BackButton({
  onClick = null,
  ref=null
}) {

  const { t } = useTranslation();

  const {
		selectComponent,
		// setListSelected,
		// setFilterItems,
		setSearchFuzzyValue,
		// setSearchAdvancedValue,
    itemListConfig,
    setItemListConfig,
    resetListGrid,
	} = useContext(AppContext);

  const handleClick = (event) => {
    if (onClick){
      onClick();
    }
    else {
      resetListGrid();
    }
    
  };

  return (
    <Box style={{ cursor: "pointer" }} className="back-button" ref={ref}>
      <Tooltip title={t("back")} arrow>
      <IconButton onClick={handleClick}>
        <ArrowBackIosIcon />
      </IconButton>
      </Tooltip>
    </Box>
  );











}