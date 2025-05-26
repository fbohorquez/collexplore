import React, { useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Box, Typography, Tabs, Tab, Button, Tooltip, Select, MenuItem} from "@mui/material";
import { AppContext } from "../../services/context";
import { AppContextDetail } from "../../services/context_detail";
import Config from "../../services/config";
import { getBaseTypes } from "../../services/types";
import { ProcessContext } from "./../../services/context_scraping";
import PropTypes from "prop-types";
import Grid from "./../layout/Grid";
import { XMLParser } from "fast-xml-parser";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import PlayForWorkIcon from "@mui/icons-material/PlayForWork";

import {completeFromSources} from "../../services/source_data";

import ApiIcon from "@mui/icons-material/Api";

import FormBuilder from "./../FormBuilder";

import db from "../../services/db";

import {
	selectPopup,
	replaceKeysInValues,
	getOrAddEntity,
	changeRow,
	changeListSelected,
	setDetailVisible,
	addCollectionItem,
	openErrorDialog,
	queryFristFormInput,
	searchItemsByProbalility,
	cropLargestObject,
	selectDetail,
} from "../../services/helper";

import { useTranslation } from "react-i18next";

import i18n from "../../services/i18n";

import countries from "../../locales/countries";

const { equivalenceTable: equivalenceCountry } = countries;

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

CustomTabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}


	

function Detail({
	component,
	type,
	forceSelected,
	className,
	addFields = {},
	noRenderRow = false,
	ondemand = false,
	setNew = (data) => {},
	onSaved = (data) => {},
	autoName = false,
}) {
	const refSourceBtn = React.useRef(null);

	const {
		updateProcess,
		startProcess,
		getProcessStatus,
		processes,
	} = useContext(ProcessContext);

	const {
		// groupEditionItems,
		setGroupEditionItems,
		setUpdateComponent,
		updateComponent,
		itemListConfig,
	} = useContext(AppContext);

	const [tabValue, setTabValue] = useState(0);

	const { selectedItem, setSelectedItem } = useContext(AppContextDetail);
	const { additionalData, setAdditionalData } = useContext(AppContextDetail);
	let listSelected = additionalData && additionalData.listSelected;

	if (component === "items" && additionalData && additionalData.listSelected) {
		component = (selectedItem && selectedItem.document) || "lists-items";
	}
	onSaved = useCallback(
		async (id, beforeSave, item) => {
			let iDOriginal = id;
			if (typeof id === "string" && id.includes("lists-")) {
				id = parseInt(id.replace("lists-", ""));
			}
			db[component].get(id).then(async (data) => {
				if (component === "lists-items") {
					id = "lists-" + id;
				}
				if (data.fields.lists) {
					data.fields.lists.forEach((list) => {
						db.lists.get(list).then((listData) => {
							if (!listData.items) {
								listData.items = [];
							}
							if (listData.items.indexOf(id) === -1) {
								listData.items.push(id);
								db.lists.update(list, listData);
								if (
									additionalData.listSelected &&
									additionalData.listSelected.id === list
								) {
									changeListSelected(listData);
								}
							}
						});
					});
				}
				if (document.body.dataset.list) {
					const saved_list = await db.lists.get(
						parseInt(document.body.dataset.list)
					);
					if (saved_list.items.indexOf(id) === -1) {
						changeListSelected(saved_list);
					} else {
						if (data.fields.lists.length === 0) {
							saved_list.items.splice(saved_list.items.indexOf(id), 1);
							db.lists.update(saved_list.id, saved_list);
							changeListSelected(saved_list);
							setDetailVisible(false);
						} else {
							if (data.fields.lists.indexOf(saved_list.id) === -1) {
								saved_list.items.splice(saved_list.items.indexOf(id), 1);
								db.lists.update(saved_list.id, saved_list);
								changeListSelected(saved_list);
							}
						}
					}
				}
				if (data.document === "lists-items") {
					if (data.fields.lists.length === 0) {
						selectPopup({
							title: t("delete-lists-items-unlist"),
							content: () => (
								<Typography>
									{t("delete-lists-items-unlist-confirm")}
								</Typography>
							),
							btns: [
								{
									label: t("save-in-collection"),
									action: () => {
										addCollectionItem(data, listSelected);
										selectPopup(null);
									},
								},
								{
									label: t("delete"),
									action: () => {
										selectPopup(null);
										db[component].delete(data.id);
									},
									variant: "outlined",
								},
								{
									label: t("cancel"),
									action: () => {
										db.lists.get(listSelected.id).then((listData) => {
											data.id = "lists-" + data.id;
											listData.items.push(data.id);
											db.lists.update(listSelected.id, listData).then(() => {
												changeListSelected(listData);
											});
										});
										selectPopup(null);
									},
									variant: "outlined",
								},
							],
						});
					}
				}
			});
			if (iDOriginal && iDOriginal.includes && iDOriginal.includes("lists-")) {
				selectedItem.id = iDOriginal;
			}

			let eventSave = new CustomEvent("saveDetail", {
				detail: {
					id,
					item:
						item ||
						(itemListConfig.groupEditionItems &&
						itemListConfig.groupEditionItems.length
							? itemListConfig.groupEditionItems
							: selectedItem),
					type: component,
					beforeSave: beforeSave,
				},
			});
			window.dispatchEvent(eventSave);
		},
		[selectedItem, itemListConfig.groupEditionItems]
	);

	Config.initConfigCache();

	const { t } = useTranslation();

	const generateDataInit = () => {
		let init = {
			...{
				name: "",
				type: typeSelected,
				fields: {},
			},
			...addFields,
		};
		return init;
	};

	let data_init = {};

	let typeSelected = document.body.dataset.type || 1;

	if (forceSelected) {
		if (
			forceSelected &&
			typeof forceSelected === "string" &&
			forceSelected.match(/type_/)
		) {
			typeSelected = parseInt(forceSelected.replace("type_", ""));
			data_init = generateDataInit();
		} else if (typeof forceSelected === "string") {
			data_init = generateDataInit();
			data_init.type = forceSelected;
		} else {
			data_init = forceSelected;
		}
	} else {
		if (
			selectedItem &&
			typeof selectedItem === "string" &&
			selectedItem.match(/type_/)
		) {
			typeSelected = parseInt(selectedItem.replace("type_", ""));
			data_init = generateDataInit();
		} else if (typeof selectedItem === "string") {
			data_init = generateDataInit();
			data_init.type = selectedItem;
		} else {
			data_init = selectedItem;
		}
	}

	const [data, setData] = useState(data_init);
	const [isGroupEdition, setIsGroupEdition] = useState(false);
	if (setNew) {
		setNew(data);
	}
	if (!forceSelected) {
		setSelectedItem(data_init);
	}else {
		setSelectedItem(forceSelected);
	}

	useEffect(() => {
		let data_init = {};
		if (forceSelected) {
			if (Array.isArray(forceSelected)) {
				setData({ fields: itemListConfig.groupEditionItems });
				setIsGroupEdition(true);
				return;
			}
			setIsGroupEdition(false);
			if (
				forceSelected &&
				typeof forceSelected === "string" &&
				forceSelected.match(/type_/)
			) {
				typeSelected = parseInt(forceSelected.replace("type_", ""));
				data_init = generateDataInit();
			} else if (typeof forceSelected === "string") {
				data_init = generateDataInit();
				data_init.type = forceSelected;
			} else if (new Number(forceSelected) == forceSelected) {
				db[component].get(forceSelected).then((data) => {
					setData(data);
				});
				return;
			} else {
				data_init = forceSelected;
			}
		} else {
			if (Array.isArray(selectedItem)) {
				if (
					forceSelected &&
					typeof forceSelected === "string" &&
					forceSelected.match(/type_/)
				) {
					typeSelected = parseInt(forceSelected.replace("type_", ""));
					data_init = generateDataInit();
				} else if (typeof forceSelected === "string") {
					data_init = generateDataInit();
					data_init.type = forceSelected;
				} else if (new Number(forceSelected) == forceSelected) {
					db[component].get(forceSelected).then((data) => {
						setData(data);
					});
					return;
				} else {
					data_init = forceSelected;
				}

				setData({ fields: itemListConfig.groupEditionItems });
				setIsGroupEdition(true);
				return;
			}
			setIsGroupEdition(false);
			if (
				selectedItem &&
				typeof selectedItem === "string" &&
				selectedItem.match(/type_/)
			) {
				data_init = generateDataInit();
			} else if (typeof selectedItem === "string") {
				data_init = generateDataInit();
				data_init.type = selectedItem;
			} else {
				data_init = selectedItem;
			}
		}
		if (
			component === "lists-items" &&
			additionalData &&
			additionalData.listSelected
		) {
			if (!data_init) {
				data_init = {};
			}
			if (!data_init.fields) {
				data_init.fields = {};
			}
			data_init.fields.lists = [additionalData.listSelected.id];
		}
		setData(data_init);
	}, [selectedItem, itemListConfig.groupEditionItems]);

	const nameFormDefinition = {
		ondemand: ondemand,
		reference: true,
		document: component,
		root: data,
		def: [
			{
				id: "name",
				label: t("name"),
				type: "text",
				labelPosition: "none",
				placeholder: window.ModeExplorer ? t("search-name") : t("name"),
				required: true,
				autoFocus: true,
				tabIndex: 1,
				onKeyDown: (event) => {
					if (event.key === "Enter") {
						if (refSourceBtn && refSourceBtn.current) {
							refSourceBtn.current.click();
						}
					}
				},
			},
		],
	};

	const getTypeFormDefinition = () => {
		return {
			ondemand: ondemand,
			reference: true,
			document: component,
			root: data,
			def: [
				{
					id: "type",
					label: t("type"),
					labelPosition: "none",
					type: "hidden",
					options: [],
					required: true,
					default: typeSelected,
				},
			],
		};
	};

	const [typeFormDefinition, setTypeFormDefinition] = useState(
		getTypeFormDefinition()
	);

	// let typeDefinition = getBaseTypes("items", itemListConfig.typesByID[typeSelected]);
	const [typeDefinition, setTypeDefinition] = useState(getBaseTypes(component, itemListConfig.typesByID[typeSelected]));

	useEffect(() => {
		async function typeDefinition() {
			await Config.initConfigCache();
			let typeDefinition = getBaseTypes(component, itemListConfig.typesByID[typeSelected]);
			setTypeDefinition({...typeDefinition});
		}
		typeDefinition();
	}, [typeSelected, selectedItem]);

	useEffect(() => {
		const initForms = () => {
			if (typeof type === "string") {
				db[type].toArray().then((types) => {
					for (let i = 0; i < types.length; i++) {
						types[i] = { ...types[i], ...getBaseTypes(component, types[i]) };
					}
					
					let typeFormDefinitionNew = getTypeFormDefinition();
					typeFormDefinitionNew.def[0].options = types.map((type) => {
						return { value: type.id, label: t(type.name) };
					});
					typeFormDefinitionNew.def[0].default = types[0].id;
					setTypeFormDefinition(typeFormDefinitionNew);
				});
			}
		};

		initForms();

	}, [data]);

	const saveRoot = (root) => {
		if (!root || root.name === "") {
			return;
		}
		if (root.id) {
			db[component].update(root.id, root).then(() => {
				setSelectedItem(root);
			});
		} else {
			db[component].add(root).then((id) => {
				root.id = id;
				setSelectedItem(root);
			});
		}
	};

	const definition = {
		ondemand: ondemand,
		document: component,
		reference: true,
		root: data,
	};

	const pasteRef = React.useRef(null);

	const handlePaste = (e) => {
		const items = (e.clipboardData || window.clipboardData).items;
		if (!pasteRef || !pasteRef.current) {
			return;
		}
		for (const item of items) {
			if (item.type.indexOf("image") !== -1) {
				const blob = item.getAsFile();
				const file = new File([blob], "pasted-image.png", {
					type: blob.type,
				});

				// Crear un objeto DataTransfer para asignar el archivo al campo de entrada
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				pasteRef.current.files = dataTransfer.files;

				const event = new Event("change", { bubbles: true });
				pasteRef.current.dispatchEvent(event);
			}
		}
	};

	React.useEffect(() => {
		window.addEventListener("paste", handlePaste);
		return () => {
			window.removeEventListener("paste", handlePaste);
		};
	}, []);

	useEffect(() => {
		const handleKeyDown = (event) => {
			let newTabValue = null;
			if (event.altKey) {
				if (event.key === "ArrowLeft") {
					event.preventDefault();
					setTabValue((prev) => {
						const newValue = prev - 1;
						const tabsLength = typeDefinition?.tabs?.length || 1;
						newTabValue =
							newValue >= 0 ? newValue : tabsLength - 1;
						return newValue >= 0 ? newValue : tabsLength - 1;
					});
				} else if (event.key === "ArrowRight") {
					event.preventDefault();
					setTabValue((prev) => {
						const newValue = prev + 1;
						const tabsLength = typeDefinition?.tabs?.length || 1;
						newTabValue = newValue < tabsLength ? newValue : 0;
						return newValue < tabsLength ? newValue : 0;
					});
				}
				let id = `simple-tabpanel-${newTabValue}`;
				let tab = document.getElementById(id);
				if (tab) {
					setTimeout(() => {
						queryFristFormInput(tab);
					}, 500);
				}
			}
		};

		window.addEventListener("keyup", handleKeyDown);

		return () => {
			window.removeEventListener("keyup", handleKeyDown);
		};
	}, [typeDefinition?.tabs?.length || 0, tabValue]);

	

	useEffect(() => {
		const resetForm = () => {
			setData(generateDataInit());
			setTabValue(0);
			setTimeout(() => {
				document.querySelector(".form-builder.title input").focus();
			}, 100);
		};
		if (typeof selectedItem === "string" && selectedItem.startsWith("type_")) {
			resetForm();
		}
	}, [selectedItem]);

	const [modeExplorerCountItemsSimilary, setModeExplorerCountItemsSimilary] = useState(0);
	const [modeExplorerCountListsSimilary, setModeExplorerCountListsSimilary] = useState(0);

	useEffect(() => {
		const handleRefreshModeEdition = async (e) => {
			let { root } = e.detail;
			let similary = await searchItemsByProbalility (root, 90, "items");
			setModeExplorerCountItemsSimilary(similary.length);
			similary = await searchItemsByProbalility (root, 90, "lists-items");
			setModeExplorerCountListsSimilary(similary.length);
		};

		window.addEventListener("refreshExplorer", handleRefreshModeEdition);

		return () => {
			window.removeEventListener("refreshExplorer", handleRefreshModeEdition);
		}
	}, []);

	useEffect(() => {
		setModeExplorerCountItemsSimilary(0);
		setModeExplorerCountListsSimilary(0);
	}, [selectedItem]);

	return (
		<Box
			className={`${className || ""} detail-${component} ${
				isGroupEdition ? "group-edition-detail" : ""
			}`}
		>
			{data !== null && (
				<Box>
					<Box sx={{ display: "flex" }} className={`detail-${component}-title`}>
						{window.ModeExplorer && (
							<Typography variant="h5">
								{t(`explorer-${component}-title`)}
							</Typography>
						)}
						{!window.ModeExplorer && isGroupEdition && (
							<Typography variant="h5">
								{t(`edit-group-edition-title`)}
							</Typography>
						)}
						{!window.ModeExplorer && !isGroupEdition && !data.id && (
							<Typography variant="h5">
								{t(`new-${component}-title`)}
							</Typography>
						)}

						{!window.ModeExplorer && isGroupEdition && data.id && (
							<Typography variant="h5">
								{t(`edit-${component}-title`)}{" "}
							</Typography>
						)}
						{!window.ModeExplorer && !isGroupEdition && data.id && (
							<Typography variant="h5">
								{t(`edit-${component}-title`)}{" "}
							</Typography>
						)}
						<FormBuilder
							definition={typeFormDefinition}
							reference={data}
							style={{ marginTop: "20px", marginBottom: "20px" }}
							noRenderRow={noRenderRow}
							ondemand={ondemand}
							onSaved={onSaved}
						/>
						<Typography variant="h5" style={{ marginLeft: "0px" }}>
							{data.type && typeDefinition ? t(typeDefinition.name) : ""}
						</Typography>
						{!component === "lists-items" && (
							<Typography variant="h5" style={{ marginLeft: "6px" }}>
								{t("of-list")}
							</Typography>
						)}
						{window.ModeExplorer && data.sourceUrl && (
							<Tooltip title={t("go-to-source")}>
								<a
									href={data.sourceUrl}
									target="_blank"
									rel="noreferrer"
									style={{ position: "relative" }}
								>
									<PlayForWorkIcon
										style={{
											transform: "rotate(270deg)",
											color: "black",
											width: "30px",
											height: "30px",
											position: "absolute",
											top: "-4px",
											left: "10px",
											zIndex: 999,
										}}
									/>
								</a>
							</Tooltip>
						)}
					</Box>
					{!isGroupEdition && !autoName && (
						<FormBuilder
							definition={nameFormDefinition}
							reference={data}
							style={{ marginTop: "20px", marginBottom: "20px" }}
							className="title"
							noRenderRow={noRenderRow}
							ondemand={ondemand}
							onSaved={onSaved}
						/>
					)}
					{isGroupEdition && (
						<Box className="detail-group-edition">
							<Typography
								variant="h7"
								style={{ marginTop: "20px", marginBottom: "20px" }}
							>
								{(itemListConfig.groupEditionItems &&
									itemListConfig.groupEditionItems.length &&
									t("group-edition-detail-resume").replace(
										"%s",
										itemListConfig.groupEditionItems.length
									)) ||
									t("group-edition-detail-empty")}
							</Typography>
						</Box>
					)}
					{typeDefinition?.sources && typeDefinition.sources.length > 0 && (
						<Box className="detail-sources">
							<Tooltip title={t("sources-data")}>
								<Button
									variant="contained"
									color="primary"
									ref={refSourceBtn}
									onClick={() => {
										let ids = typeDefinition?.sources?.map(
											(source) => source.source
										);
										let scraping_ids = ids
											.filter((source) =>
												String(source).startsWith("scraping_")
											)
											.map((source) =>
												parseInt(source.replace("scraping_", ""))
											);
										if (data.sourceUrl) {

										}
										ids = ids.filter(
											(source) => !String(source).startsWith("scraping_")
										);
										db["sources"]
											.where("id")
											.anyOf(ids)
											.toArray()
											.then(async (sources) => {
												if (
													sources.some((source) =>
														source.api_key && source.api_key.startsWith("//")
													)
												) {
													openErrorDialog(
														t("error-source-api-key-not-configured"),
														t("error-source-api-key-not-configured-description")
													);
													return;
												}

												if (scraping_ids.length > 0) {
													let scrapings = await db["scraping"]
														.where("id")
														.anyOf(scraping_ids)
														.toArray();
													scrapings = scrapings.map((scraping) => {
														return {
															...scraping,
															id: `scraping_${scraping.id}`,
														};
													});
													sources = [...sources, ...scrapings];
												}
												let dataToSend = { ...data };
												if (
													data.sourceUrl &&
													sources.find(
														(source) =>
															source.type === "scraping-for-item-from-list"
													)
												) {
													sources = sources.filter(
														(source) =>
															source.type === "scraping-for-item-from-list"
													);
													dataToSend.name = data.sourceUrl;
												}
												if (sources.length > 0) {
													completeFromSources(
														sources,
														typeDefinition?.sources,
														dataToSend,
														setData,
														typeDefinition,
														component,
														startProcess
													);
												}
											});
									}}
								>
									<ApiIcon />
								</Button>
							</Tooltip>
						</Box>
					)}
					<Tabs
						tabIndex={-1}
						value={tabValue}
						onChange={(event, newValue) => setTabValue(newValue)}
						aria-label="simple tabs example"
						variant="scrollable"
						scrollButtons="auto"
						style={{
							display:
								typeDefinition?.tabs && typeDefinition.tabs.length > 1
									? "flex"
									: "none",
						}}
					>
						{typeDefinition?.tabs &&
							typeDefinition.tabs
								.filter((tab) => {
									if (!tab.visible) {
										tab.visible = "all";
									}
									if (tab.visible === "collection" && window.ModeExplorer) {
										return false;
									}
									if (tab.visible === "explorer" && !window.ModeExplorer) {
										return false;
									}
									return true;
								})
								.map((tab, index) => {
									return (
										<Tab
											tabIndex={-1}
											key={tab.label
												?.replace(/ /g, "-")
												.toLowerCase()
												.replace(/[^a-zA-Z0-9-]/g, "")}
											label={t(tab.label)}
											{...a11yProps(index)}
											style={{
												display:
													(tab.visible == "collection" &&
														window.ModeExplorer) ||
													(tab.visible == "explorer" && !window.ModeExplorer)
														? "none"
														: "block",
											}}
											onClick={(event) => {
												if (event && event.target) {
													const domButton = event.target;
													const idButton = domButton.id;
													if (idButton && idButton.startsWith("simple-tab-")) {
														const index = parseInt(
															idButton.replace("simple-tab-", "")
														);
														const tab = domButton
															.closest(".MuiTabs-root")
															.parentNode.querySelector(
																"#simple-tabpanel-" + index
															);
														if (tab) {
															setTimeout(() => {
																queryFristFormInput(tab);
															}, 500);
														}
													}
												}
											}}
										/>
									);
								})}
					</Tabs>
					{typeDefinition?.tabs &&
						typeDefinition.tabs
							.filter((tab) => {
								if (!tab.visible) {
									tab.visible = "all";
								}
								if (tab.visible === "collection" && window.ModeExplorer) {
									return false;
								}
								if (tab.visible === "explorer" && !window.ModeExplorer) {
									return false;
								}
								return true;
							})
							.map((tab, tabIndex) => {
								return (
									<CustomTabPanel
										key={tab.label
											?.replace(/ /g, "-")
											.toLowerCase()
											.replace(/[^a-zA-Z0-9-]/g, "")}
										value={tabValue}
										index={tabIndex}
									>
										{tab.groups.map((group, groupIndex) => (
											<Box
												key={groupIndex}
												className={`detail-${component}-group ${
													group.className
												} ${group["group-sticky"] ? "group-sticky" : ""}`}
											>
												<Box sx={{ display: "flex" }}>
													<Typography
														variant="h7"
														style={{
															color: group.label ? "black" : "gray",
															lineHeight: "32px",
														}}
													>
														{group.label ? t(group.label) : ""}
													</Typography>
												</Box>
												<Typography variant="caption" style={{ color: "gray" }}>
													<Grid
														layout={group.layout}
														fields={typeDefinition?.fields}
														reference={data.fields}
														definition={definition}
														ondemand={ondemand}
														pasteRef={pasteRef}
														onSaved={onSaved}
													/>
												</Typography>
											</Box>
										))}
									</CustomTabPanel>
								);
							})}
				</Box>
			)}
			{window.ModeExplorer &&
				(component === "items" || component === "lists-items") && (
					<Box>
						<Button
							variant="contained"
							color="primary"
							className="save-button-explorer"
							data-key="ctrl_ENTER"
							onClick={async () => {
								let dataArray = data;
								if (Array.isArray(data.fields)) {
									dataArray = data.fields;
								} else if (!Array.isArray(dataArray)) {
									dataArray = [dataArray];
								}
								for (let i = 0; i < dataArray.length; i++) {
									let dataItem = dataArray[i];
									window.ModeExplorer = false;
									dataItem.in_collection = true;
									dataItem.document = component;
									if (dataItem.type) {
										dataItem.type = parseInt(dataItem.type);
									}

									if (
										dataItem.id &&
										typeof dataItem.id === "string" &&
										dataItem.id.includes("lists-tmp-")
									) {
										const dataCp = { ...dataItem };
										delete dataItem.id;
										db[component].add(dataItem).then((id) => {
											changeRow({ ...dataCp, idChange: id });
											selectDetail("items", { ...dataItem, id: id });
										});
										continue;
									}
									await db[component].add(dataItem);
									setUpdateComponent(!updateComponent);
									if (component.includes("lists-")) {
										dataItem.id = "lists-" + dataItem.id;
									}
									if (listSelected) {
										db.lists.get(listSelected.id).then((listData) => {
											listData.items.push(dataItem.id);
											db.lists.update(listSelected.id, listData).then(() => {
												changeListSelected(listData);
											});
										});
									}
									let eventSave = new CustomEvent("saveDetail", {
										detail: {
											id: dataItem.id,
											item: dataItem,
											type: component,
										},
									});
									window.dispatchEvent(eventSave);
									dataItem.document = component;
									setSelectedItem(dataItem);
								}
							}}
						>
							<Typography variant="button">
								{t("save-as-" + component)}
							</Typography>
						</Button>
					</Box>
				)}
			{modeExplorerCountItemsSimilary > 0 ||
			modeExplorerCountListsSimilary > 0 ? (
				<Box className="detail-mode-explorer-similary">
					<Typography variant="h7">
						<PriorityHighIcon style={{ color: "red", fontSize: "14px" }} />
						{modeExplorerCountItemsSimilary > 0
							? t("items-similary").replace(
									"%s",
									modeExplorerCountItemsSimilary
							  )
							: ""}
						{modeExplorerCountItemsSimilary > 0 &&
						modeExplorerCountListsSimilary > 0
							? " | "
							: ""}
						{modeExplorerCountListsSimilary > 0
							? t("lists-similary").replace(
									"%s",
									modeExplorerCountListsSimilary
							  )
							: ""}
					</Typography>
				</Box>
			) : (
				""
			)}
		</Box>
	);
}



















































export default Detail;