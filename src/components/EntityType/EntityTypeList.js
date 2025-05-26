import TypeList from "../Type/TypeList";

import React, { useContext, useEffect } from "react";

import { AppContext } from "../../services/context";
import { useTranslation } from "react-i18next";
import db from "../../services/db";

export default function EntityTypeList() {
	

	const [title, setTitle] = React.useState("");

	const { t } = useTranslation();

	const { itemListConfig, selectComponent } = useContext(AppContext);
	
	useEffect(() => {
		db.types.get(itemListConfig.typeSelected).then((data) => {
			setTitle(t("entity-types") + " " + data.name);
		});
	}, []);

	return <TypeList set_title={title}  component="entity-types" filterFunction={(item) => {
		return (
			item.item_type === itemListConfig.typeSelected ||
			item.item_type === "general"
		);
	}} 
		back_action={() => selectComponent("types")}
	/>;











}