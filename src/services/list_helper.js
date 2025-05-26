import db from "./db";
import i18n from "./i18n";
import {
	itemToString,
	selectPopup,
	calculateProbabilitySameArticle,
	GenerateItemCacheEntity,
} from "./helper";

import { Box, Typography, TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import Detail from "../components/layout/Detail";

const saveInCollection = async (
  event, 
  onChange, 
  handleMenuClick,
  values,
  setOptions,
  options,
  setItemUndefinedSaveCollection,
) => {
	let target = event.currentTarget;
	let item = values;

	if (typeof item === "string") {
		item = {
			name: item,
			fields: {},
		};
	}
	let items = await db.items.toArray();
	let max_50 = [];
	for (let i = 0; i < items.length; i++) {
		let article_pro = calculateProbabilitySameArticle(item, items[i], 60);
		if (article_pro >= 60) {
			items[i].name += " (" + article_pro.toFixed(2) + "%)";
			items[i].pro = article_pro;
			max_50.push(items[i]);
		}
	}
	if (max_50.length === 0) {
		if (item.type) {
			delete item.id;
			delete item.type_in_line;
			delete item.in_collection;
			db.items.add(item).then((id) => {
        if (onChange) {
				  onChange(id);
        }
        if (setOptions) {
          item.name = itemToString(item);
          setOptions([...options, item]);
        }
			});
		} else {
			setItemUndefinedSaveCollection(item);
			handleMenuClick(event, target);
		}
	} else {
		max_50.sort((a, b) => {
			return b.pro - a.pro;
		});
		max_50.unshift({
			name: "-- " + i18n.t("new-item") + " --",
			id: -1,
		});
		selectPopup({
			title: "",
			content: () => (
				<Box>
					<Typography>{i18n.t("item-already-exists")}</Typography>
					<Typography style={{ marginTop: "10px" }}>
						{i18n.t("select-as-save")}
					</Typography>
					<Autocomplete
						options={max_50}
						getOptionLabel={(option) => {
							if (option.id === -1) {
								return option.name;
							} else {
								return itemToString(option);
							}
						}}
						onChange={(event, newValue) => {
							if (newValue) {
								if (newValue.id === -1) {
									selectPopup(null);
                  if (item.type) {
                    db.items.add(item).then((id) => {
											if (onChange) {
												onChange(id);
											}
											if (setOptions) {
												item.name = itemToString(item);
												setOptions([...options, item]);
											}
										});
                  } else {
                    setItemUndefinedSaveCollection(item);
                    handleMenuClick(event, target);
                  }
								} else {
									onChange(newValue.id);
									selectPopup(null);
								}
							}
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder={i18n.t("select-item")}
								variant="outlined"
							/>
						)}
					/>
				</Box>
			),
			btns: [
				{
					label: i18n.t("cancel"),
					action: () => {
						selectPopup(null);
					},
				},
			],
		});
	}
};

const handleAddCollection = (type, field, onChange, setOptions, options, setItemUndefinedSaveCollection, itemUndefinedSaveCollection) => {
	let item = itemUndefinedSaveCollection;
	item.type = type;
	selectPopup({
		title: "",
		content: () => (
			<Detail
				className="popup-add-item"
				component="items"
				type="types"
				forceSelected={item}
				addFields={{ fields: (field && field.fields) || {} }}
				noRenderRow={true}
				ondemand={true}
			/>
		),
		btns: [
			{
				label: i18n.t("save"),
				action: async () => {
					item = await GenerateItemCacheEntity(item);
					db.items.add(item).then((id) => {
						onChange(id);
						item.name = itemToString(item);
						setOptions([...options, item]);
					});
					setItemUndefinedSaveCollection(null);
					selectPopup(null);
				},
			},
			{
				label: i18n.t("cancel"),
				action: () => {
					setItemUndefinedSaveCollection(null);
					selectPopup(null);
				},
				variant: "outlined",
			},
		],
	});
};







export { saveInCollection, handleAddCollection };