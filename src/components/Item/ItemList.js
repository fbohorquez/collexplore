import React, { useContext, useState, useEffect, useMemo } from "react";
import {
	Box,
	Typography,
	IconButton,
	Tooltip,
	List,
	ListItem,
	ListItemText,
	Menu,
	MenuItem,
} from "@mui/material";
import { AppContext } from "../../services/context";
import { ProcessContext } from "../../services/context_scraping";

import FormBuilder from "../FormBuilder";

import {
	selectDetail,
	getSelectedItemId,
	selectPopup,
	deleteRow,
	listItemRefToInline,
	getInitItemListConfig,
	addCollectionItem,
	mergeToCollectionItem,
	searchItemsByProbalility,
	fadeVirtuoso,
	useGlobalEvent,
} from "../../services/helper";

import { completeFromSources } from "../../services/source_data";

import Title from "../layout/Title";
import TitleButtons from "../layout/TitleButtons";
import ListControls from "../layout/ListControls";
import GroupEditionPanel from "../layout/GroupEditionPanel";
import ListTable from "../layout/ListTable";
import ListGrid from "../layout/ListGrid";
import SearchBar from "../layout/SearchBar";
import MenuLists from "../layout/MenuLists";
import SearchAdvanced from "../layout/SearchAdvanced";
import StatusBar from "../layout/StatusBar";
import ChromeReaderModeIcon from "@mui/icons-material/ChromeReaderMode";
import AddBoxIcon from "@mui/icons-material/AddBox";
import ExploreIcon from "@mui/icons-material/Explore";
import ApiIcon from "@mui/icons-material/Api";

import { useTranslation } from "react-i18next";

import db from "../../services/db";
import Config from "../../services/config";

function ItemList() {
	const [items, setItems] = useState([]);

	const { t } = useTranslation();
	const [title, setTitle] = useState(t("my-collection"));
	const [isBack, setIsBack] = useState(false);
	const [reset, setReset] = useState(false);

	const [groupEdition, setGroupEdition] = useState(false);

	const [anchorMenuExplorersItems, setAnchorMenuExplorersItems] =
		useState(null);

	const { updateProcess, startProcess, getProcessStatus, processes } =
		useContext(ProcessContext);

	const [stateList, setStateList] = useState(null);

	const [explorerItems, setExplorerItems] = useState({});

	const {
		selectComponent,
		filterItems,
		// searchAdvancedValue,
		itemListConfig,
		setItemListConfig,
	} = useContext(AppContext);

	useEffect(() => {
		db.types.toArray().then((data) => {
			data = data.sort((a, b) => (a.order || 0) - (b.order || 0));
			let types = {};
			for (let i = 0; i < data.length; i++) {
				if (!data[i].active) {
					continue;
				}
				types[data[i].id] = data[i];
			}
			setItemListConfig({
				...itemListConfig,
				typesByID: types,
			});
			if (!itemListConfig.typeSelected) {
				if (items.length > 0) {
					setItemListConfig({
						...itemListConfig,
						typeSelected: items[0].type,
					});
				} else {
					setItemListConfig({
						...itemListConfig,
						typeSelected: 1,
					});
				}
			}
		});
	}, []);

	useEffect(() => {
		const changeListSelected = (e) => {
			setItemListConfig({
				...itemListConfig,
				listSelected: e.detail,
			});
		};

		window.addEventListener("changeListSelected", changeListSelected);
		return () => {
			window.removeEventListener("changeListSelected", changeListSelected);
		};
	}, [itemListConfig.listSelected]);

	const initItems = async () => {
		if (itemListConfig.listSelected) {
			var items = [];
			const data = await db.lists.get(itemListConfig.listSelected.id);
			for (let i = 0; i < data.items.length; i++) {
				let item = data.items[i];

				if (typeof item === "string") {
					const initial = item;
					let id_str = item.replace("lists-", "");
					if (new Number(id_str).toString() === id_str) {
						item = await db["lists-items"].get(parseInt(id_str));
						if (!item) {
							const list = itemListConfig.listSelected;
							list.items.splice(i, 1);
							db.lists.update(itemListConfig.listSelected.id, list);
							continue;
						}
						item.in_collection = false;
						item.document = "lists-items";
						item.id = initial;
					}
				} else if (typeof item === "number") {
					item = await db.items.get(item);
					if (!item) {
						const list = itemListConfig.listSelected;
						list.items.splice(i, 1);
						db.lists.update(itemListConfig.listSelected.id, list);
						continue;
					}
					item.in_collection = true;
					item.document = "items";
				} else {
					item.in_collection = false;
					item.id = false;
					item.document = "lists-items";
				}
				// item.type_in_line = itemListConfig.typesByID[item.type];
				items.push(item);
			}
			items = items.filter((item) => {
				return item.hasOwnProperty("type");
			});
			let typeFilter = itemListConfig.typeSelected;
			if (!typeFilter) {
				typeFilter = items[0].type;
				setItemListConfig({
					...itemListConfig,
					typeSelected: typeFilter,
				});
			}
			items = items.filter((item) => {
				return item.type == typeFilter;
			});
			items.forEach((item) => {
				if (!item.id) {
					item.id = new Date().getTime();
				}
			});

			setItems(items);
			setTitle(t("list") + ": " + data.name);
			setIsBack(true);
		} else if (itemListConfig.typeSelected) {
			setTitle(t("my-collection"));
			db.items
				.where("type")
				.equals(parseInt(itemListConfig.typeSelected))
				.toArray()
				.then((data) => {
					setItems(data);
					setIsBack(false);
				});
		} else {
			db.items.toArray().then((data) => {
				setItems(data);
			});
		}
	};

	async function fetchSetting() {
		const listType = await Config.get("view");
		if (listType) {
			setStateList(listType);
		}
	}

	const resetRef = React.useRef(false);

	useEffect(() => {
		if (resetRef.current !== reset) {
			itemListConfig.listSelected = null;
			resetRef.current = reset;
		}
		if (!itemListConfig.typeSelected) {
			return;
		}
		setItemListConfig({
			...itemListConfig,
			groupEditionItems: [],
		});
		setGroupEdition(false);
		const time = setTimeout(() => {
			document.querySelector(".close-detail-btn")?.click();
		}, 1);
		document.body.classList.remove("group-edition");

		initItems();
		fetchSetting();
		return () => {
			clearTimeout(time);
		};
	}, [reset, itemListConfig.typeSelected, itemListConfig.listSelected]);

	const [dataSource, setDataSource] = useState(null);

	useEffect(() => {
		if (dataSource) {
			if (!Array.isArray(dataSource) && typeof dataSource === "object") {
				window.ModeExplorer = true;
				selectDetail("items", dataSource, {
					listSelected: itemListConfig.listSelected,
				});
				selectPopup(null);
			}
		}
	}, [dataSource]);

	const btns = useMemo(() => [
		{
			label: t("new-" + (itemListConfig.listSelected ? "list-item" : "item")),
			action: () => {
				window.ModeExplorer = false;
				selectDetail("items", "type_" + itemListConfig.typeSelected, {
					listSelected: itemListConfig.listSelected,
				});
			},
			icon: <AddBoxIcon />,
			key: "alt_n",
		},
		{
			label: t("explorer"),
			action: async () => {
				let formSourceData = {};
				let sources = await db.sources.toArray();
				sources = sources.filter((source) => {
					return (
						source.is_list_generator &&
						Number(source.item_type) === Number(itemListConfig.typeSelected)
					);
				});

				let scrapings = await db.scraping.toArray();
				scrapings = scrapings.filter(
					(scraping) =>
						scraping.type === "scraping-to-list" &&
						Number(scraping.itemType) === Number(itemListConfig.typeSelected)
				);
				scrapings = scrapings.map((scraping) => {
					return {
						...scraping,
						id: `scraping_${scraping.id}`,
					};
				});
				sources = [
					{
						id: "general",
						name: itemListConfig.typesByID[itemListConfig.typeSelected].name,
					},
				]
					.concat(sources)
					.concat(scrapings);

				const newFormSourceDefinition = {
					ondemand: false,
					reference: true,
					root: formSourceData,
					def: [
						{
							id: "query",
							type: "text",
							autoFocus: true,
						},
					],
				};
				selectPopup({
					className: "explorer-popup",
					content: () => (
						<Box>
							<FormBuilder
								reference={formSourceData}
								definition={newFormSourceDefinition}
							></FormBuilder>
						</Box>
					),
					btns: [
						{
							label: t("explore"),
							action: async () => {
								const setItemsFromSource = async (
									items,
									source,
									forceRender,
									index
								) => {
									setTitle(t("explorer") + ": " + formSourceData.query);
									setIsBack(true);

									let newExplorerTab = {
										query: formSourceData.query,
										name: source.name,
										type: itemListConfig.typeSelected,
										index: forceRender ? index : index + 2000,
										items: [],
									};

									let newItems = [];
									for (let i = 0; i < items.length; i++) {
										let item = items[i];
										item.document = item.document + "-tmp";
										
										let similary = await searchItemsByProbalility(
											item,
											10,
											"items",
											true
										);
										item.id =
											"lists-tmp-" +
											(new Date().getTime() + Math.floor(Math.random() * 1000));
										if (similary.length > 0) {
											// item = similary[0];
											item.in_collection = true;

										}
										newItems.push(item);
										newExplorerTab.items.push(item);
									}
									window.ModeExplorer = true;
									document.querySelector(".close-detail-btn")?.click();
									setExplorerItems(newExplorerTab);
									if (forceRender) {
										setItems(newItems);
										selectPopup(null);
									}
								};
								if (formSourceData) {
									let typeDefinition =
										itemListConfig.typesByID[itemListConfig.typeSelected];

									if (!formSourceData || !formSourceData.query) {
										return;
									}

									let query = formSourceData.query.trim();
									let action = "general";
									if (query.startsWith("/")) {
										action = query.split(" ")[0].replace("/", "");
										query = query.replace("/" + action + " ", "");
									}

									let dataSourceCP = {
										name: query,
										fields: {},
										cache: {},
										type: itemListConfig.typeSelected,
									};

									let sources = [];
									let scrapings = [];
									sources = await db.sources.toArray();
									sources = sources.filter(
										(source) =>
											((typeof source.activator === "undefined" &&
												action.trim().toLowerCase() === "general") ||
												(typeof source.activator !== "undefined" &&
													source.activator.trim().toLowerCase() ===
														action.trim().toLowerCase())) &&
											(Number(source.item_type) ===
												Number(itemListConfig.typeSelected) ||
												!source.item_type) &&
											source.is_list_generator
									);
									sources.forEach(async (source, index) => {
										completeFromSources(
											[source],
											typeDefinition.sources,
											dataSourceCP,
											async (items) =>
												setItemsFromSource(items, source, index === 0, index),
											typeDefinition,
											null,
											startProcess,
											true
										);
									});

									scrapings = await db.scraping.toArray();
									scrapings = scrapings.filter(
										(scraping) =>
											((typeof scraping.activator === "undefined" &&
												action.trim().toLowerCase() === "general") ||
												(typeof scraping.activator !== "undefined" &&
													scraping.activator.trim().toLowerCase() ===
														action.trim().toLowerCase())) &&
											scraping.type === "scraping-to-list" &&
											(Number(scraping.itemType) ===
												Number(itemListConfig.typeSelected) ||
												!scraping.itemType)
									);

									scrapings.forEach(async (scraping, index) => {
										let scrapingCp = {
											...scraping,
											id: `scraping_${scraping.id}`,
										};
										completeFromSources(
											[scrapingCp],
											typeDefinition.sources,
											dataSourceCP,
											async (items) =>
												setItemsFromSource(
													items,
													scrapingCp,
													index === 0 && sources.length === 0,
													index
												),
											typeDefinition,
											null,
											startProcess,
											true
										);
									});

									setItemListConfig({
										...itemListConfig,
										explorersItems: [],
										explorersItemsIndex: 0,
									});
								}
							},
						},
					],
				});
			},
			icon: <ExploreIcon />,
			key: "alt_e",
		},
	]);

	const handleChangeGroupEdition = (e) => {
		setTimeout(() => {
			document.body.querySelector(".search-bar-input input").focus();
		}, 100);
		setGroupEdition(!groupEdition);
		document.body.classList.toggle("group-edition");
		e.target.closest("button").classList.toggle("active");
		setItemListConfig({
			...itemListConfig,
			groupEditionItems: [],
		});
		selectComponent("items");
		if (!groupEdition) {
			selectDetail("items", itemListConfig.groupEditionItems, {
				listSelected: itemListConfig.listSelected,
			});
		} else {
			selectDetail(null);
			window.dispatchEvent(new CustomEvent("close-detail"));
		}
	};

	const handleResetEvent = React.useCallback(() => {
		setReset((old) => !old);
	}, []);
	useGlobalEvent("resetList", handleResetEvent);

	
	// useEffect(() => {
	// 	setItems([]);
	// 	// window.ModeExplorer = false;
	// 	// setItemListConfig(getInitItemListConfig());
	// }, [reset]);

	useEffect(() => {
		let explorerItemsCP = { ...explorerItems };
		let explorersItemsCP = [...itemListConfig.explorersItems];
		explorersItemsCP.push(explorerItemsCP);
		setItemListConfig({
			...itemListConfig,
			explorersItems: explorersItemsCP,
		});
	}, [explorerItems]);

	return (
		{
			stateList,
		} && (
			<Box
				className={`item-list-colection item-list${
					itemListConfig.typeSelected ? "-colection" : ""
				}${itemListConfig.listSelected ? "-list" : "-type"}`}
			>
				<Title
					title={title}
					subtitle={
						itemListConfig.explorersItems.length > 1 &&
						window.ModeExplorer && (
							<Box>
								<Box
									className="explorers-selected"
									onClick={(e) => {
										setAnchorMenuExplorersItems(e.currentTarget);
									}}
									style={{ cursor: "pointer" }}
								>
									{itemListConfig.explorersItems &&
										itemListConfig.explorersItems[
											itemListConfig.explorersItemsIndex
										] && (
											<Typography>
												{
													itemListConfig.explorersItems[
														itemListConfig.explorersItemsIndex
													].name
												}
											</Typography>
										)}
								</Box>
								<Menu
									id="explorers-menu"
									anchorEl={anchorMenuExplorersItems}
									open={Boolean(anchorMenuExplorersItems)}
									onClose={() => {
										setAnchorMenuExplorersItems(null);
									}}
									disableScrollLock
									className="list-group-header-stats-menu"
								>
									{itemListConfig.explorersItems
										.sort((a, b) => a.index - b.index)
										.map((explorer, index) => {
											return (
												<MenuItem
													onClick={() => {
														setItemListConfig({
															...itemListConfig,
															explorersItemsIndex: index,
														});
														setItems(explorer.items);
													}}
												>
													{explorer.name}
												</MenuItem>
											);
										})}
								</Menu>
							</Box>
						)
					}
					before={
						<Box>
							<SearchBar
								typesByID={itemListConfig.typesByID}
								className={"search-bar"}
							/>
						</Box>
					}
					after={
						<span>
							<Box style={{ display: "flex" }} className={"list-title-actions"}>
								<MenuLists></MenuLists>
								<SearchAdvanced typesByID={itemListConfig.typesByID} />
								{}
								<Box className="group-edition-button">
									<Tooltip title={t("group-edition-edition")}>
										<IconButton
											onClick={handleChangeGroupEdition}
											color="primary"
											className="edition-button"
											data-key="alt_g"
										>
											<ChromeReaderModeIcon />
										</IconButton>
									</Tooltip>
								</Box>
								<TitleButtons btns={btns} />
							</Box>
						</span>
					}
					back={isBack}
					className="title"
				/>
				{}
				{stateList === "images" && (
					<Box style={{ position: "relative" }}>
						<div className="list-table-original">
							<ListGrid
								items={items}
								filterItems={filterItems}
								onClick={(item, isSearch, altKey) => {
									window.ModeExplorer = false;
									if (
										item.id &&
										typeof item.id === "string" &&
										item.id.includes("lists-tmp-")
									) {
										window.ModeExplorer = true;
									}
									let groupEdition =
										document.body.classList.contains("group-edition");
									if (groupEdition) {
										if (!isSearch || altKey) {
											let groupEditionItemsCP = [
												...itemListConfig.groupEditionItems,
											];
											let index = groupEditionItemsCP.findIndex(
												(i) => i.id === item.id
											);
											if (index !== -1) {
												groupEditionItemsCP.splice(index, 1);
											} else {
												groupEditionItemsCP.unshift(item);
											}
											setItemListConfig({
												...itemListConfig,
												groupEditionItems: groupEditionItemsCP,
											});
											selectDetail("items", groupEditionItemsCP, {
												listSelected: itemListConfig.listSelected,
											});
										}
										item.isSearch = isSearch;
										let event = new CustomEvent("changeRow", {
											detail: { row: item },
										});
										
										window.dispatchEvent(event);
										return;
									} else if (!isNaN(item.id) &&  (new Number(item.id)).toString() === item.id.toString()) {
										let component = "items";
										if (itemListConfig.listSelected) {
											component = "lists-items";
										}
										db[component].get(item.id).then((data) => {
											selectDetail("items", data, {
												listSelected: itemListConfig.listSelected,
											});
										});
									} else {
										selectDetail("items", item, {
											listSelected: itemListConfig.listSelected,
										});
									}
								}}
								staticColumnsBefore={["name"]}
								iD="items"
								setItems={setItems}
								onDeleteItem={(item) => {
									selectPopup({
										title: t("delete-item"),
										content: () => (
											<Typography>{t("delete-item-confirm")}</Typography>
										),
										btns: [
											{
												label: t("yes"),
												action: () => {
													selectPopup(null);
													fadeVirtuoso(1000);
													listItemRefToInline(item);
													let component = "items";
													if (itemListConfig.listSelected) {
														if (
															typeof item.id === "string" &&
															item.id.includes("lists-")
														) {
															component = "lists-items";
															item.id = parseInt(item.id.replace("lists-", ""));
														}
													}
													if (
														item.id &&
														typeof item.id === "string" &&
														item.id.includes("lists-tmp-")
													) {
														setItems(items.filter((i) => i.id !== item.id));
														deleteRow(item);
													} else {
														db[component].delete(item.id).then(() => {
															deleteRow(item);
														});
													}
													if (
														parseInt(getSelectedItemId()) === parseInt(item.id)
													) {
														if (
															document.querySelector(
																'.panel-detail button:has([data-testid="CloseIcon"])'
															)
														) {
															document
																.querySelector(
																	'.panel-detail button:has([data-testid="CloseIcon"])'
																)
																.click();
														}
													}
													window.dispatchEvent(
														new CustomEvent("deleteDetail", { detail: item })
													);
												},
											},
											{
												label: t("no"),
												action: () => selectPopup(null),
												variant: "outlined",
											},
										],
									});
								}}
								onAddCollectionItem={async (item) => {
									let addAs = Config.getFromCache(
										"list-to-collection",
										"check"
									);
									if (addAs === "new") {
										addCollectionItem(item, itemListConfig.listSelected);
									} else if (addAs === "check") {
										let similary = await searchItemsByProbalility(item);
										if (similary.length > 0) {
											selectPopup({
												title: t("add-item"),
												content: () => (
													<Box>
														<Typography>{t("add-item-similary")}</Typography>
														<List>
															{similary.map((simil) => (
																<ListItem>
																	<ListItemText
																		primary={simil.name}
																		onClick={() => {
																			mergeToCollectionItem(
																				item,
																				simil,
																				itemListConfig.listSelected,
																				setItemListConfig
																			);
																			selectPopup(null);
																		}}
																		style={{ cursor: "pointer" }}
																	/>
																</ListItem>
															))}
															<ListItem>
																<ListItemText
																	primary={t("add-item-new")}
																	onClick={() => {
																		addCollectionItem(
																			item,
																			itemListConfig.listSelected
																		);
																		selectPopup(null);
																	}}
																	style={{ cursor: "pointer" }}
																/>
															</ListItem>
														</List>
													</Box>
												),
												btns: [
													{
														label: t("cancel"),
														action: () => selectPopup(null),
														variant: "outlined",
													},
												],
											});
										} else {
											addCollectionItem(item, itemListConfig.listSelected);
										}
									}
								}}
							/>
						</div>
					</Box>
				)}
				{}
				{groupEdition && (
					<GroupEditionPanel
						itemListConfig={itemListConfig}
						setItemListConfig={setItemListConfig}
					/>
				)}
			</Box>
		)
	);
}

export default ItemList;









