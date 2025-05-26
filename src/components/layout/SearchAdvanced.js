import React, { useState, useContext } from "react";

import { useTranslation } from 'react-i18next';

import { AppContext } from "../../services/context";
import db from "../../services/db";

import {
	selectPopup,
	updatePopup,
	getEntityType
} from "../../services/helper";

import { IconButton, Box, Tabs, Tab, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";


import FormBuilder from "../FormBuilder";


function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

function CustomTabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					<Typography>{children}</Typography>
				</Box>
			)}
		</div>
	);
}

export default function SearchAdvanced({ typesByID = {} }) {
	const { t } = useTranslation();

	let { itemListConfig, setItemListConfig } =
		useContext(AppContext);

	const [searchAdvancedValueQuery, setSearchAdvancedValueQuery] = useState([]);

	useState(() => {
		if (itemListConfig.searchAdvancedValue && itemListConfig.searchAdvancedValue.query) {
			setSearchAdvancedValueQuery(itemListConfig.searchAdvancedValue.query);
		} else if (itemListConfig.searchAdvancedValue && Array.isArray(itemListConfig.searchAdvancedValue)) {
			setSearchAdvancedValueQuery(itemListConfig.searchAdvancedValue);
		} else {
			setSearchAdvancedValueQuery([]);
		}
	}, [itemListConfig.searchAdvancedValue]);

	const mapFieldToEntity = {};

	const searchValueRecursive = (item, entityTypeField, value) => {
		if (!Array.isArray(value)) {
			value = [value];
		}
		if (Array.isArray(item)) {
			for (const i in item) {
				if (searchValueRecursive(item[i], entityTypeField, value)) {
					return true;
				}
			}
		}
		else if (typeof item === "object") {
			for (const key in item) {
				if (searchValueRecursive(item[key], entityTypeField, value)) {
					return true;
				}
			}
		}
		else {
			if (value.includes(item)) {
				return true;
			}
		}
		return false;
	}

	return (
		<Box style={{ margin:"auto" }}>
			<Tooltip title={t("advanced-search")}>
				<IconButton
					type="submit"
					sx={{ p: "8px" }}
					className={
						searchAdvancedValueQuery && searchAdvancedValueQuery.length > 0
							? "search-advanced-active"
							: ""
					}
					aria-label="search"
					
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						let tabSearchValue = 0;
						if (searchAdvancedValueQuery.length === 0) {
							searchAdvancedValueQuery.push({});
						}

						let def = typesByID[itemListConfig.typeSelected].fields.filter((item) => {
							const not_allowed = ["image", "file", "image-gallery", "sort-list", "scraping", "link",];
							return !not_allowed.includes(item.type);
						});
						def.unshift({ id: "name", type: "text", label: t("name") });
						let append_def = [];
						let delete_def = [];
						let position = 0;
						def = def.map((item) => {
							item.onlyRead = true;
							if (item.type === "textarea") {
								item.type = "text";
							}
							if (item.type === "checkbox") {
								item.type = "select";
								item.options = [
									{ value: "", label: t("all") },
									{ value: "1", label: t("yes") },
									{ value: "0", label: t("no") },
								];
							}
							if (item.type === "entity" && item.integrated && item.entity) {
								let entityType = getEntityType(item.entity);
								delete_def.push(position);
								entityType.fields = entityType.fields.map((field) => {
									return { ...field, id: ((typeof item.id == "string" && item.id.includes("_"))
										? item.id : item.id + "_" + field.id) };
								});
								append_def.push ({
									position: position - 1,
									def: entityType.fields
								});
								entityType.fields.forEach((field) => {
									if (!mapFieldToEntity[item.id]) {
										mapFieldToEntity[item.id] = [];
									}

									mapFieldToEntity[item.id][field.id] = {
										entityType: entityType,
										entityTypeField: field,
									};
								});
							}
							position++;
							return item;
						});
						if (delete_def.length > 0) {
							delete_def.forEach((item) => {
								def.splice(item, 1);
							});
						}
						if (append_def.length > 0) {
							append_def.forEach((item) => {
								def.splice(item.position, 0, ...item.def);
							});
						}
						let advancedPopup = {
							title: t("advanced-search"),
							content: () => (
								<Box>
									<Tabs
										value={tabSearchValue}
										onChange={(event, newValue) => {
											tabSearchValue = newValue;
											updatePopup();
										}}
										aria-label="simple tabs example"
										variant="scrollable"
										scrollButtons="auto"
									>
										{searchAdvancedValueQuery.map((item, index) => (
											<Tab
												key={index}
												icon={
													<Box>
														<Tooltip title={t("delete")}>
															<DeleteIcon
																onClick={() => {
																	searchAdvancedValueQuery.splice(index, 1);
																	setSearchAdvancedValueQuery(searchAdvancedValueQuery);
																	selectPopup(null);
																	tabSearchValue = index - 1;
																	setTimeout(() => {
																		selectPopup(advancedPopup);
																	}, 1);
																}}
															/>
														</Tooltip>
													</Box>
												}
												iconPosition="end"
												label={t("search-options") + " " + (index + 1)}
												{...a11yProps(index)}
											/>
										))}
										<Tab
											label={t("add")}
											icon={<AddIcon />}
											iconPosition="start"
											onClick={() => {
												searchAdvancedValueQuery.push({});
												setSearchAdvancedValueQuery(searchAdvancedValueQuery);
												selectPopup(null);
												tabSearchValue = searchAdvancedValueQuery.length - 1;
												setTimeout(() => {
													selectPopup(advancedPopup);
												}, 1);
											}}
											{...a11yProps(
												searchAdvancedValueQuery ? searchAdvancedValueQuery.length : 0
											)}
										/>
									</Tabs>
									{searchAdvancedValueQuery.map((item, index) => (
										<CustomTabPanel
											value={tabSearchValue}
											index={index}
											key={index}
										>
											<FormBuilder
												definition={{
													ondemand: false,
													reference: true,
													def: def,
												}}
												reference={searchAdvancedValueQuery[index]}
												style={{ marginTop: "20px", marginBottom: "20px" }}
											/>
										</CustomTabPanel>
									))}
								</Box>
							),
							btns: [
								{
									label: t("search"),
									action: async () => {
										selectPopup(null);
										
										for(const ktab in searchAdvancedValueQuery) {
											const tab = searchAdvancedValueQuery[ktab];
											let filtersItems = {};
											for(const key in tab) {
												let value = tab[key];
												if (key.includes("_")) {
													const keys = key.split("_");
													const fieldItemID = keys[0];
													const fieldTypeID = keys[1];
													if (mapFieldToEntity[fieldItemID] && mapFieldToEntity[fieldItemID][key]) {
														let map = mapFieldToEntity[fieldItemID][key];
														let entityType = map.entityType;
														let entityTypeField = map.entityTypeField;
														if (!filtersItems[fieldItemID]) {
															filtersItems[fieldItemID] = await db.entity.where("type").equals(entityType.id).toArray();
														}
														filtersItems[fieldItemID] = filtersItems[fieldItemID].filter((item) => {
															// return item.fields[fieldTypeID] == value;
															return searchValueRecursive(item, entityTypeField, value);
														});
													
														delete tab[key];
														
													}
												}
											}
											Object.keys(filtersItems).forEach((filterKey) => {
												searchAdvancedValueQuery[ktab][filterKey + "OR"] = filtersItems[filterKey].map((item) => item.id);
											});
										}
										// setSearchAdvancedValue({
										// 	prevent: 'itemList',
										// 	query: [...searchAdvancedValueQuery]
										// });
										setItemListConfig({ ...itemListConfig, searchAdvancedValue: { prevent: 'itemList', query: [...searchAdvancedValueQuery] } });
									},
								},
								{
									label: t("clear"),
									action: () => {
										setSearchAdvancedValueQuery([]);
										// setSearchAdvancedValue({prevent: 'itemList', query:[]});
										setItemListConfig({ ...itemListConfig, searchAdvancedValue: { prevent: 'itemList', query: [] } });
										selectPopup(null);
									},
								},
								{
									label: t("cancel"),
									action: () => {
										selectPopup(null);
									},
								},
							],
						};
						selectPopup(advancedPopup);
					}}
				>
					<SearchIcon />
				</IconButton>
			</Tooltip>
		</Box>
	);






















}