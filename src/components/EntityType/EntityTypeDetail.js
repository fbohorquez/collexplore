import React, { useContext, useEffect } from "react";

import TypeDetail from "../Type/TypeDetail";

import { AppContext } from "../../services/context";
import db from "../../services/db";
import { refreshListData } from "../../services/helper";

import { useTranslation } from "react-i18next";

export default function EntityTypeList() {

	const { typeSelected, setTypeSelected } =
		useContext(AppContext);

	const { t } = useTranslation();
	const [optionMap, setOptionMap] = React.useState([]);


	useEffect(() => {
		let options = [];
		db.types.orderBy("order").toArray().then((data) => {
			for (let i = 0; i < data.length; i++) {
				if (!data[i].active) {
					continue;
				}
				options.push({ value: data[i].id, label: data[i].name });
			}
			options.push({ value: "general", label: t("is-general") });
			setOptionMap(options);
		});
	}, []);

	return (
		<TypeDetail
			component="entity-types"
			additionalFieldsTitle={[
				{
					ondemand: false,
					reference: true,
					document: "entity-types",
					def: [
						{
							id: "item_type",
							label: t("item-type"),
							type: "select",
							labelPosition: "none",
							placeholder: t("is-general"),
							options: optionMap,
							default: typeSelected,
							onChange: (value) => {
								refreshListData();
							},
						},
					],
				},
			]}
		/>
	);
}
















