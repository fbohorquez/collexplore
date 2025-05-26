import TypeList from "../Type/TypeList";

import React, { useContext, useEffect } from "react";
import { AppContext } from "../../services/context";

import { selectDetail } from "../../services/helper";

import Tooltip from "@mui/material/Tooltip";

import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import EntityIcon from "@mui/icons-material/ChromeReaderMode";
import ApiIcon from "@mui/icons-material/Api";

import { useTranslation } from "react-i18next";

import db from "../../services/db";


export default function ItemTypeList() {
	const { t } = useTranslation();

	const {
		itemListConfig,
		setItemListConfig,
		selectComponent,
	} = useContext(AppContext);

	const [optionMap] = React.useState({
		active: (
			<Tooltip title={t("item-active")}>
				<RemoveRedEyeIcon />
			</Tooltip>
		),
		link_metas: {
			html: (
				<Tooltip title={t("entity-types")}>
					<EntityIcon />
				</Tooltip>
			),
			action: (item) => {
				selectComponent("entity-types");
				setItemListConfig({
					...itemListConfig,
					typeSelected: item.id,
				});
				
			},
		},
		link_sources: {
			html: (
				<Tooltip title={t("sources")}>
					<ApiIcon />
				</Tooltip>
			),
			action: (item) => {
				selectComponent("sources");
				setItemListConfig({
					...itemListConfig,
					typeSelected: item.id,
				});
				
			},
		},
	});

	return (
		<TypeList
			
			component="types"
			dragdrop={true}
			optionBefore={optionMap}
		/>
	);














}