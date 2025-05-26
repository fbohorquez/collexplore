import React, {
	useEffect,
	useReducer,
	useRef,
	useState,
	useContext,
	useMemo,
	useCallback,
} from "react";
import { Box, Paper, Typography, Tooltip, Menu, MenuItem } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SortByAlphaIcon from "@mui/icons-material/SortByAlpha";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import HorizontalSplitIcon from "@mui/icons-material/HorizontalSplit";
import { VirtuosoGrid, Virtuoso } from "react-virtuoso";
import { useTranslation } from "react-i18next";
import db from "../../services/db";
import ImageWithBlobSupport from "./ImageWithBlobSupport";
import Config from "../../services/config";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import CategoryIcon from "@mui/icons-material/Category";
import { ListSearchEvent } from "./List/ListSearchEvent";
import { ListGroupHeader } from "./List/ListGroupHeader";
import FormBuilder from "./../FormBuilder";

import { AppContext } from "../../services/context";
import { ImgCacheContext } from "../../services/context_img_cache";
import StatusBar from "../layout/StatusBar";
import TypesTabs from "../layout/TypesTabs";


import {
	fadeVirtuoso,
	getEntityType,
	isDetailVisible,
	getSelectedItemId,
	valueToString,
	valueToStringPromise,
	openStatusBar,
	refreshCacheItemsType,
	useGlobalEvent,
	useGlobalEventTakeLatest,
	clearCacheEntity,
	selectPopup,
	printStyleColors,
	optimizeImageToWebP,
} from "../../services/helper";
import flags from "../../locales/flags";
import countriesAll from "../../locales/countries";

const rowReducer = (state, action) => {
	switch (action.type) {
		case "UPDATE_ROW":
			if (state.item){
				state = state.item;
			}
			if ((action.payload && (action.payload.id === state.id || state.id === action.payload.idChange) )) {
				if (state.id === action.payload.idChange) {
					state.id = action.payload.id;
				}
				return { ...state, ...action.payload };
			}
			return state;
		default:
			return state;
	}
};

const RowHeader = React.memo(({ item, listConfig, setListConfig, colsN }) => {
	return (
		<Paper
			className={`list-table-row-placeholder list-table-row-placeholder-${item.position}`}
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				textAlign: "center",
				padding: "0",
				whiteSpace: "nowrap",
				width: "100%",
				gap: "40px",
			}}
		>
			<ListGroupHeader
				item={item}
				listConfig={listConfig}
				setListConfig={setListConfig}
				colsN={colsN}
			/>
		</Paper>
	);
});

const RowContent = React.memo(
	({
		row,
		listColumnsDef,
		onDeleteItem,
		onAddCollectionItem,
		index,
		component,
		imgField,
		onClick,
		itemRefs,
		setSelectedIndex,
		imgCacheRefs,
		groupEditionItems,
		listConfig,
		setListConfig,
		colsN,
	}) => {
		const { itemListConfig, setItemListConfig } = useContext(AppContext);

		let typeSelected = itemListConfig.typeSelected;
		let typesByID = itemListConfig.typesByID;

		let [item, dispatch] = useReducer(rowReducer, row);
		const { t } = useTranslation();
		const { getCache } = useContext(ImgCacheContext);

		const handleChangeRow = useCallback(
			(event) => {
				if (row.type !== "item") {
					return;
				}
				const { row: newRow } = event.detail;
				if (newRow.document === "lists-items") {
					if (typeof newRow.id === "string" && newRow.id.includes("lists-")) {
						newRow.id = parseInt(newRow.id.replace("lists-", ""));
					}
				}
				if (
					newRow.idChange &&
					newRow.id &&
					typeof newRow.id === "string" &&
					newRow.id.includes("lists-tmp-")
				) {
					const id = newRow.id;
					newRow.id = newRow.idChange;
					newRow.idChange = id;
					newRow.document = "items";
				}
				newRow.document = newRow.document || component;
				if (db && db[newRow.document] && newRow.id) {
					db[newRow.document].get(newRow.id).then((data) => {
						if (newRow.isSearch) {
							data.isSearch = true;
						}
						if (newRow.document === "lists-items") {
							data.id = "lists-" + data.id;
						}
						if (newRow.idChange) {
							data.idChange = newRow.idChange;
						}
						dispatch({ type: "UPDATE_ROW", payload: data });
					});
				}
			},
			[row.type, component]
		);


		const doFetchData = useCallback(async () => {
			let newRow = { ...row };
			if (newRow.document === "lists-items") {
				if (typeof newRow.id === "string" && newRow.id.includes("lists-")) {
					newRow.id = parseInt(newRow.id.replace("lists-", ""));
				}
			}
			newRow.document = newRow.document || component;
			if (!newRow.document || !newRow.id) {
				return;
			}
			const data =
				db[newRow.document] && newRow.id
					? await db[newRow.document].get(newRow.id)
					: newRow;
			if (newRow.document === "lists-items") {
				data.id = "lists-" + data.id;
			}
			dispatch({ type: "UPDATE_ROW", payload: data });
		}, [row, component]);

		const getBlobs = useCallback((obj, name) => {
			let blobs = [];

			if (obj instanceof Blob) {
				blobs.push({
					blob: obj,
					label: name,
				});
			} else if (
				(typeof obj === "object" && obj !== null) ||
				Array.isArray(obj)
			) {
				for (let key in obj) {
					let keyb = getBlobs(obj[key], obj.name || name);
					blobs = blobs.concat(keyb);
				}
			}
			return blobs;
		}, []);

		useEffect(() => {
			doFetchData();
		}, [doFetchData]);

		useEffect(() => {
			window.addEventListener("changeRow", handleChangeRow);
			return () => {
				window.removeEventListener("changeRow", handleChangeRow);
			};
		}, [handleChangeRow,]);

		if (item.deleted) {
			return null;
		}
		if (item.type === "group") {
			let title = item.groupKey;
			if (
				item.groupBy &&
				Object.keys(item.groupBy) &&
				Object.keys(item.groupBy)[item.depth]
			) {
				title = valueToString(
					item.groupKey,
					Object.keys(item.groupBy)[item.depth],
					typeSelected,
					true
				);
			}
			return (
				<Paper
					className={`list-table-row list-table-row-group list-table-row-group-depth-${item.depth}`}
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
						padding: "0",
						whiteSpace: "nowrap",
						width:
							"calc(" +
							100 *
								(colsN) +
							"% - 20px)",
						gap: "40px",
					}}
				>
					<Typography
						variant="h6"
						dangerouslySetInnerHTML={{ __html: title }}
					></Typography>
				</Paper>
			);
		} else if (item.type === "header") {
			return (
				<RowHeader
					item={item}
					listConfig={listConfig}
					setListConfig={setListConfig}
					colsN={colsN}
				/>
			);
		} else if (item.type === "headerPlaceholder") {
			return (
				<Paper
					className={`list-table-row-placeholder list-table-row-placeholder-header list-table-row-placeholder-${item.position} ${item.classes}`}
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
						padding: "0",
						whiteSpace: "nowrap",
						width: "100%",
						gap: "40px",
					}}
				></Paper>
			);
		} else if (item.type === "groupPlaceholder") {
			return (
				<Paper
					className={`list-table-row-placeholder list-table-row-placeholder-group list-table-row-placeholder-${item.position} ${item.classes}`}
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
						padding: "0",
						whiteSpace: "nowrap",
						width: "100%",
						gap: "40px",
					}}
				></Paper>
			);
		} else if (item.type === "itemPlaceholder") {
			return (
				<Paper
					className={`list-table-row-placeholder list-table-row-placeholder-item list-table-row-placeholder-${item.position} ${item.classes}`}
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
						padding: "0",
						whiteSpace: "nowrap",
						width: "100%",
						gap: "40px",
					}}
				></Paper>
			);
		} else {
			if (item.type === "item" && item.item) {
				dispatch({ type: "UPDATE_ROW", payload: item.item });
				return null;
			}
		}
		let imgCache = getCache(item.id, imgCacheRefs);
		return (
			<Paper
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					textAlign: "center",
					padding: "0",
					whiteSpace: "nowrap",
					gap: "40px",
					backgroundColor: "transparent",
					width: "max-content",
				}}
				className={`list-grid-item-envolve list-table-row-envolve list-table-row-envolve-${
					item.id
				} ${
					groupEditionItems.find((i) => i.id === item.id) ? "group-edition" : ""
				} 

				${row.classes || ""}
				`}
				ref={(el) =>
					(itemRefs.current[index] = {
						ref: el,
						item: item,
						index: index,
					})
				}
				draggable="false"
			>
				{imgField !== "" && item && item.fields && item.fields[imgField] ? (
					<Box
						style={{
							height: "100%",
							position: "relative",
							cursor: "pointer",
							boxSizing: "content-box",
							overflow: "hidden",
							display: "flex",
							justifyContent: "center",
						}}
						className={`list-grid-item list-table-row list-table-row-${
							item.id
						} ${
							// itemListConfig.selectedItem && parseInt(itemListConfig.selectedItem.id) === parseInt(item.id)
							parseInt(getSelectedItemId()) === parseInt(item.id)
								? "selected"
								: ""
						}`}
						onClick={() => {
							onClick(item);
							setItemListConfig((old) => {
								return {
									...old,
									selectedItem: item,
								};
							});
							setSelectedIndex(index);
						}}
					>
						<div className="list-table-icons">
							{item &&
								item.cache &&
								getBlobs(item.cache).map((blobDef, index) => {
									if (!blobDef.blob.type) {
										blobDef.blob = new Blob([blobDef.blob], {
											type: "image/svg+xml",
										});
									}
									return (
										<Tooltip title={blobDef.label}>
											<img
												key={index}
												src={URL.createObjectURL(blobDef.blob)}
												alt={item.name}
												style={{
													objectFit: "cover",
													marginRight: "5px",
												}}
											/>
											{}
										</Tooltip>
									);
								})}
						</div>
						{}
						<ImageWithBlobSupport
							blob={
								imgCache
									? imgCache
									: item.fields[imgField] && item.fields[imgField].slice && item.fields[imgField].slice(
											0,
											item.fields[imgField].size,
											item.fields[imgField].type
									  )
							}
							alt={item.name}
							style={{
								width: "auto",
								height: "100%",
								objectFit: "cover",
							}}
							draggable="false"
						/>
						{(() => {
							return (
								(typeof item.id === "string" && item.id.includes("lists-") && (
									<Tooltip title={t("save-in-collection")}>
										<LibraryAddIcon
											style={{
												position: "absolute",
												top: "5px",
												right: "5px",
												cursor: "pointer",
												boxSizing: "content-box",
												padding: "2px",
												zIndex: 10,
											}}
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												onAddCollectionItem(item);
											}}
										/>
									</Tooltip>
								)) ||
								null
							);
						})()}
						<Box className="preview-items">
							{item.preview &&
								window.ModeExplorer &&
								Object.keys(item.preview).length > 0 &&
								Object.keys(item.preview).map((key) => {
									if (!item.preview[key]) {
										return null;
									}
									return (
										<Box className="preview-item">
											<Tooltip title={key}>
												<Typography
													dangerouslySetInnerHTML={{
														__html: item.preview[key],
													}}
												/>
											</Tooltip>
										</Box>
									);
								})}
						</Box>
						<Tooltip title={t("delete-item")}>
							<DeleteIcon
								style={{
									position: "absolute",
									bottom: "5px",
									right: "5px",
									cursor: "pointer",
									boxSizing: "content-box",
									padding: "2px",
									zIndex: 10,
								}}
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									onDeleteItem(item);
								}}
							/>
						</Tooltip>
					</Box>
				) : (
					item &&
					item.fields && (
						<Box
							style={{
								width: "100%",
								position: "relative",
								cursor: "pointer",
							}}
							onClick={() => {
								onClick(item);
							}}
						>
							<Box
								className="list-table-controls"
								sx={{
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-around",
									height: "100%",
								}}
							>
								{listColumnsDef
									.filter((column) => {
										return column.field === "name";
									})
									.map((column) => (
										<Box style={{ textWrap: "balance" }}>
											<RowContentColumn
												key={column.id}
												column={column}
												item={item}
												typeSelected={typeSelected}
												typesByID={typesByID}
											/>
										</Box>
									))}
								<DeleteIcon
									style={{
										position: "absolute",
										bottom: "5px",
										right: "5px",
										cursor: "pointer",
										boxSizing: "content-box",
										padding: "2px",
									}}
									onClick={(e) => {
										e.stopPropagation();
										e.preventDefault();
										onDeleteItem(item);
									}}
								/>
							</Box>
						</Box>
					)
				)}
			</Paper>
		);
	}
);

const RowContentColumn = ({ column, item, typeSelected, typesByID }) => {
	const { i18n } = useTranslation();

	function getValue() {
		let value = column.main ? item[column.field] : item.fields[column.field];
		if (typeof value === "object" && Object.keys(value).length === 1 && value.updatedAt) {
			value = null;
		}

		if (
			typeSelected &&
			typesByID[typeSelected] &&
			typesByID[typeSelected].fields
		) {
			const field = typesByID[typeSelected].fields.find(
				(field) => field.id === column.field
			);

			if (field && field.type === "country" && flags && value) {
				if (field.multiple) {
					return value.map((item) => {
						return (
							<Tooltip title={countriesAll[i18n.language][item]}>
								<img
									src={flags[item]}
									alt={item}
									style={{ width: "20px", height: "20px", marginRight: "5px" }}
								/>
							</Tooltip>
						);
					});
				} else {
					return (
						<Tooltip title={countriesAll[i18n.language][value]}>
							<img
								src={flags[value]}
								alt={value}
								style={{ width: "20px", height: "20px" }}
							/>
						</Tooltip>
					);
				}
			} else if (field && field.type === "entity") {
				if (item.cache && item.cache[column.field]) {
					let type = getEntityType(field.entity);
					if (type && type.fields) {
						if (field.multiple) {
							let images = [];
							for (let i = 0; i < type.fields.length; i++) {
								let id_field = type.fields[i].id;
								if (type.fields[i].type === "image" && type.fields[i].main) {
									for (let j = 0; j < item.cache[column.field].length; j++) {
										if (item.cache[column.field][j].fields[id_field]) {
											let img_value =
												item.cache[column.field][j].fields[id_field];
											let name = item.cache[column.field][j].name;
											images.push(
												img_value instanceof Blob ? (
													<Tooltip title={name}>
														<img
															src={URL.createObjectURL(img_value)}
															alt={name}
															style={{ width: "24px", height: "24px" }}
														/>
													</Tooltip>
												) : (
													name +
														(j < item.cache[column.field].length - 1
															? " • "
															: "")
												)
											);
										} else {
											let name = item.cache[column.field][j].name;
											name = name
												.split(" ")
												.map(
													(item) =>
														item.charAt(0).toUpperCase() +
														item.charAt(1) +
														item.charAt(2)
												)
												.join("");
											images.push(
												<Tooltip
													title={item.cache[column.field][j].name}
													className="entity-name-as-picture"
												>
													{name}
												</Tooltip>
											);
										}
									}
									break;
								}
							}
							if (images.length === 0) {
								for (let i = 0; i < item.cache[column.field].length; i++) {
									images.push(
										item.cache[column.field][i].name +
											(i < item.cache[column.field].length - 1 ? " • " : "")
									);
								}
							}
							return images;
						} else {
							return item.cache[column.field].name;
						}
					}
				}
			}
		}

		return value instanceof Blob ? (
			<img src={URL.createObjectURL(value)} alt={column.label} />
		) : (
			value
		);
	}

	const value = React.useMemo(() => {
		return getValue();
	}, [item, column]);
	return value;
};

export default function ListGrid({
	items,
	iD,
	onClick = () => {},
	onDeleteItem = null,
	staticColumnsBefore = [],
	staticColumnsAfter = [],
	component = "items",
	filterItems = null,
	onAddCollectionItem,
	setItems = () => {},
}) {
	const { t } = useTranslation();

	const { isMobile, itemListConfig, setItemListConfig } =
		useContext(AppContext);

	const virtuosoRef = useRef(null);
	const itemRefs = useRef([]);
	const imgCacheRefs = useRef(new Map());
	const timeOut = useRef(null);

	const [sortedItems, setSortedItems] = useState([]);

	const [worker, setWorker] = useState(null);
	const [imgField, setImgField] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [anchorMenuOrder, setAnchorMenuOrder] = useState(null);
	const [anchorMenuGroup, setAnchorMenuGroup] = useState(null);
	const [listConfig, setListConfig] = useState({
		listColumnsDef: [],
		listGroupDef: {},
		listStatsHeaderDef: [],
	});
	const init = {};
	const [sortedGroups, setSortedGroups] = useState(init);

	const isGrouped = Object.keys(listConfig.listGroupDef).length > 0;
	const openMenuOrder = Boolean(anchorMenuOrder);
	const openMenuGroup = Boolean(anchorMenuGroup);

	const handleMenuClick = (event, target, who) => {
		target = target || event.currentTarget;
		switch (who) {
			case "order":
				setAnchorMenuOrder(target);
				break;
			case "group":
				setAnchorMenuGroup(target);
				break;
			default:
				setAnchorMenuOrder(target);
		}
	};

	const handleMenuClose = (who) => {
		switch (who) {
			case "order":
				setAnchorMenuOrder(null);
				break;
			case "group":
				setAnchorMenuGroup(null);
				break;
			default:
				setAnchorMenuOrder(null);
				setAnchorMenuGroup(null);
		}
	};

	const goToItem = (id, container) => {
		if (!container || !virtuosoRef || !virtuosoRef.current) {
			return;
		}
		let index = container.findIndex((item) => {
			if (item.item) {
				item = item.item;
			}
			return item.id === id;
		});
		if (index !== -1) {
			virtuosoRef.current.scrollToIndex({
				index,
			});
		}
	};

	const handleOpenDetail = useCallback(
		(event) => {
			if (itemListConfig.colsN === itemListConfig.maxCols / 2) {
				return;
			}
			setItemListConfig({
				...itemListConfig,
				colsN: itemListConfig.maxCols / 2,
			});
			document.body.dataset.currentCols = itemListConfig.maxCols / 2;

			fadeVirtuoso();
			setTimeout(() => {
				let item = event.detail.item;
				if (isGrouped && item) {
					goToItem(item.id, sortedGroups[itemListConfig.maxCols / 2]);
				} else if (!isGrouped && item) {
					goToItem(item.id, sortedItems);
				}
			}, 300);
		},
		[sortedGroups, sortedItems, itemListConfig.colsN, itemListConfig.maxCols]
	);
	useGlobalEvent("open-detail", handleOpenDetail);

	const handleCloseDetail = useCallback(
		(event) => {
			let { scrollToTop } = event.detail || {scrollToTop: false};
			setItemListConfig({
				...itemListConfig,
				colsN: itemListConfig.maxCols,
			});
			document.body.dataset.currentCols = itemListConfig.maxCols;
			setTimeout(() => {
				if (!virtuosoRef.current) {
					return;
				}
				if (scrollToTop) {
					virtuosoRef.current.scrollToIndex({
						index: 0,
						align: "start",
					});
				}else {
					if (isGrouped && itemListConfig.selectedItem) {
						goToItem(itemListConfig.selectedItem.id, sortedGroups[itemListConfig.maxCols]);
					} else if (!isGrouped && sortedItems.length && itemListConfig && itemListConfig.selectedItem) {
						goToItem(itemListConfig.selectedItem.id, sortedItems);
					}
				}
			}, 300);
		},
		[sortedGroups, sortedItems, itemListConfig.selectedItem, itemListConfig.maxCols]
	);
	useGlobalEvent("close-detail", handleCloseDetail);

	const handleScrollTo = useCallback(
		(event) => {
			let id = event.detail.id;
			let index = event.detail.index;
			let distanceToGroup = 0;
			let indexToGroup = null;

			if (id) {
				sortedGroups[itemListConfig.colsN].forEach((group, index) => {
					if (group.type === "group") {
						distanceToGroup = 0;
						indexToGroup = index;
					}
					if (group.type === "item" && group.item.id === id) {
						if (distanceToGroup < itemListConfig.maxCols) {
							index = indexToGroup + 1;
						}
						virtuosoRef.current.scrollToIndex({
							index: index - 1,
							align: "start",
						});
					} else if (group.type === "item") {
						distanceToGroup++;
					}
				});
			} else if (index) {
				if (typeof index === "object") {
					if (index[itemListConfig.colsN]) {
						index = index[itemListConfig.colsN];
					} else {
						return;
					}
				}
				virtuosoRef.current.scrollToIndex({
					index: index,
					align: "start",
				});
			}
		},
		[sortedGroups, itemListConfig.colsN]
	);
	useGlobalEvent("scroll-to", handleScrollTo);

	function getAllGroupKeyCombinations(item, listGroupDefKeys) {
		return listGroupDefKeys.reduce((acc, field) => {
			let values = item.cache && item.cache[field] && item.cache[field].name ? item.cache[field].name.toLowerCase() : item.fields[field];
			if (!values || (Array.isArray(values) && values.length === 0)) {
				values = ["__undefined__"];
			} else if (!Array.isArray(values)) {
				values = [values];
			}

			const newCombos = [];
			for (let val of values) {
				if (acc.length === 0) {
					
					newCombos.push([val]);
				} else {
					for (const combo of acc) {
						newCombos.push([...combo, val]);
					}
				}
			}
			return newCombos;
		}, []);
	}

	function deleteEmptyGroupRecursive(
		groupHeaderIndex,
		cols,
		groupEndIndex,
		sortedGroups
	) {
		const stillHasItems = sortedGroups
			.slice(groupHeaderIndex + cols, groupEndIndex)
			.some((grp) => grp.type === "item");

		if (!stillHasItems) {
			const removeCount =
				cols + (groupEndIndex - (groupHeaderIndex + cols)) - 1;
			sortedGroups.splice(groupHeaderIndex, removeCount);
			groupHeaderIndex -= 1;
			if (groupHeaderIndex < 0) {
				return;
			}
			while (
				groupHeaderIndex >= 0 &&
				sortedGroups[groupHeaderIndex].type !== "group"
			) {
				groupHeaderIndex--;
			}
			if (groupHeaderIndex < 0) {
				groupHeaderIndex = cols;
			}
			let depth = sortedGroups[groupHeaderIndex].depth;
			groupEndIndex = sortedGroups.findIndex(
				(grp, idx) =>
					idx > groupHeaderIndex && grp.type === "group" && grp.depth <= depth
			);
			if (groupEndIndex === -1) groupEndIndex = sortedGroups.length;
			if (groupHeaderIndex !== groupEndIndex - 1) {
				deleteEmptyGroupRecursive(
					groupHeaderIndex,
					cols,
					groupEndIndex + 1,
					sortedGroups
				);
			}
		}
	}

	function findExactGroupHeaderIndex(sortedGroups, groupKeys, listGroupDef) {
		let currentDepthKeys = Array(listGroupDef.length).fill(null);

		for (let i = 0; i < sortedGroups.length; i++) {
			const g = sortedGroups[i];
			if (g.type === "group") {
				currentDepthKeys[g.depth] = g.groupKey;
				for (let d = g.depth + 1; d < listGroupDef.length; d++) {
					currentDepthKeys[d] = null;
				}

				let matches = true;
				for (let d = 0; d <= g.depth; d++) {
					if (currentDepthKeys[d].toString() !== groupKeys[d].toString()) {
						matches = false;
						break;
					}
				}
				if (matches && g.depth === groupKeys.length - 1) {
					return i;
				}
			}
		}
		return -1;
	}

	function removeItemFromGroup(
		sortedGroups,
		itemId,
		groupKeys,
		listGroupDef,
		cols
	) {
		let groupHeaderIndex = findExactGroupHeaderIndex(
			sortedGroups,
			groupKeys,
			listGroupDef
		);
		if (groupHeaderIndex === -1) {
			return;
		}

		const currentDepth = groupKeys.length - 1;
		let groupEndIndex = sortedGroups.findIndex(
			(grp, idx) => idx > groupHeaderIndex && grp.type === "group"
		);
		if (groupEndIndex === -1) groupEndIndex = sortedGroups.length;

		const itemIndex = sortedGroups.findIndex((grp, idx) => {
			return (
				idx >= groupHeaderIndex + cols &&
				idx < groupEndIndex &&
				grp.type === "item" &&
				grp.item.id === itemId
			);
		});

		if (itemIndex === -1) {
			return;
		}

		sortedGroups.splice(itemIndex, 1);

		const stillHasItems = sortedGroups
			.slice(groupHeaderIndex + cols, groupEndIndex)
			.some((grp) => grp.type === "item");
		if (!stillHasItems) {
			deleteEmptyGroupRecursive(
				groupHeaderIndex,
				cols,
				groupEndIndex,
				sortedGroups
			);
		} else {
			sortedGroups.splice(groupEndIndex - 1, 0, {
				type: "itemPlaceholder",
				depth: currentDepth,
			});
		}
	}

	function removeItemFromPath(itemsListRaw, path, itemId) {
		if (path.length === 0) {
			return itemsListRaw.filter((item) => item.id !== itemId);
		}

		const [currentGroupKey, ...restPath] = path;
		return itemsListRaw
			.map((group) => {
				if (group.groupKey === currentGroupKey && group.items) {
					const updatedGroup = {
						...group,
						items: removeItemFromPath(group.items, restPath, itemId),
					};

					if (group.uniqueCount) {
						updatedGroup.uniqueCount = new Set(
							Array.from(group.uniqueCount).filter((elem) => elem !== itemId)
						);
					}

					return updatedGroup;
				}
				return group;
			})
			.filter((group) => {
				if (group.items) {
					return group.items.length > 0;
				}
				return true;
			});
	}

	function updateItemsListRaw(
		itemsListRaw,
		updatedItem,
		beforeSave,
		listGroupDef
	) {
		/**
		 * Genera todas las combinaciones posibles de claves de grupo para un elemento,
		 * forzando "__undefined__" cuando el campo no existe o está vacío.
		 *
		 * @param {Object} item - El elemento para el cual generar combinaciones de claves de grupo.
		 * @param {Array} listGroupDefKeys - Las claves de los campos de agrupación.
		 * @returns {Array} - Array de combinaciones de claves de grupo.
		 */
		

		/**
		 * Encuentra todas las rutas de grupo donde un elemento con el ID especificado existe.
		 *
		 * @param {Array} itemsListRaw - La lista de grupos y elementos.
		 * @param {number|string} itemId - El ID del elemento a encontrar.
		 * @param {Array} currentPath - La ruta actual durante la recursión.
		 * @returns {Array} - Array de rutas de grupo donde el elemento está presente.
		 */
		function findAllItemPaths(itemsListRaw, itemId, currentPath = []) {
			let paths = [];
			for (const group of itemsListRaw) {
				if (group.items) {
					const subPaths = findAllItemPaths(group.items, itemId, [
						...currentPath,
						group.groupKey,
					]);
					paths = paths.concat(subPaths);
				} else if (group.id === itemId) {
					paths.push([...currentPath]);
				}
			}
			return paths;
		}

		/**
		 * Recursivamente actualiza el elemento en itemsListRaw (si ya existe).
		 *
		 * @param {Array} itemsListRaw - La lista de grupos y elementos.
		 * @param {Object} updatedItem - El elemento actualizado.
		 * @returns {Array} - La lista de grupos y elementos actualizada.
		 */
		function updateItemInListRaw(itemsListRaw, updatedItem) {
			return itemsListRaw.map((group) => {
				if (group.items) {
					return {
						...group,
						items: updateItemInListRaw(group.items, updatedItem),
					};
				} else if (group.id === updatedItem.id) {
					return { ...updatedItem, updated_at: new Date().toISOString() };
				}
				return group;
			});
		}

		/**
		 * Recursivamente elimina un elemento de una ruta específica en itemsListRaw
		 * y actualiza uniqueCount si existe.
		 *
		 * @param {Array} itemsListRaw - La lista de grupos y elementos.
		 * @param {Array} path - La ruta de claves de grupo desde la raíz hasta el grupo contenedor.
		 * @param {number|string} itemId - El ID del elemento a eliminar.
		 * @returns {Array} - La lista de grupos y elementos actualizada.
		 */
		

		/**
		 * Recursivamente inserta un elemento en una ruta específica en itemsListRaw
		 * y actualiza uniqueCount.
		 *
		 * @param {Array} itemsListRaw - La lista de grupos y elementos.
		 * @param {Array} path - La ruta de claves de grupo donde insertar el elemento.
		 * @param {Object} item - El elemento a insertar.
		 * @returns {Array} - La lista de grupos y elementos actualizada.
		 */
		function insertItemIntoPath(itemsListRaw, path, item) {
			if (path.length === 0) {
				return [...itemsListRaw, item];
			}

			const [currentGroupKey, ...restPath] = path;

			const groupIndex = itemsListRaw.findIndex(
				(group) => group.groupKey === currentGroupKey
			);

			if (groupIndex === -1) {
				const newGroup = {
					groupKey: currentGroupKey,
					groupBy: listGroupDef[currentGroupKey] || "year",
					uniqueCount: new Set([item.id]),
					items: [],
				};
				newGroup.items = insertItemIntoPath(newGroup.items, restPath, item);

				return [...itemsListRaw, newGroup];
			} else {
				const group = itemsListRaw[groupIndex];
				const updatedGroup = {
					...group,
					items: insertItemIntoPath(group.items, restPath, item),
				};

				const newUniqueCount = new Set(group.uniqueCount || []);
				newUniqueCount.add(item.id);
				updatedGroup.uniqueCount = newUniqueCount;

				const newItemsList = [...itemsListRaw];
				newItemsList[groupIndex] = updatedGroup;
				return newItemsList;
			}
		}


		let newItemsListRaw = updateItemInListRaw(itemsListRaw, updatedItem);

		const listGroupDefKeys = Object.keys(listGroupDef);

		const newGroupCombos = getAllGroupKeyCombinations(
			updatedItem,
			listGroupDefKeys
		);
		const oldGroupCombos = (beforeSave && beforeSave.id)
			? getAllGroupKeyCombinations(
					{ ...updatedItem, fields: { ...updatedItem.fields, ...beforeSave } },
					listGroupDefKeys
				)
			: [];

		const toRemove = oldGroupCombos.filter(
			(oldCombo) =>
				!newGroupCombos.some((newCombo) =>
					newCombo.every((key, idx) => key === oldCombo[idx])
				)
		);

		const toAdd = newGroupCombos.filter(
			(newCombo) =>
				!oldGroupCombos.some((oldCombo) =>
					oldCombo.every((key, idx) => key === newCombo[idx])
				)
		);

		toRemove.forEach((combo) => {
			newItemsListRaw = removeItemFromPath(
				newItemsListRaw,
				combo,
				updatedItem.id
			);
		});

		toAdd.forEach((combo) => {
			newItemsListRaw = insertItemIntoPath(newItemsListRaw, combo, updatedItem);
		});

		return newItemsListRaw;
	}
	
	const handleSaveDetail = useCallback(
		(event) => {
			function getAllGroupKeyCombinations(item, listGroupDef) {
				return listGroupDef.reduce((acc, field) => {
					let values =
						item.cache && item.cache[field] && item.cache[field].name
							? item.cache[field].name.toLowerCase()
							: item.fields[field];
					if (!values || (Array.isArray(values) && values.length === 0)) {
						values = ["__undefined__"];
					} else if (!Array.isArray(values)) {
						values = [values];
					}

					const newCombos = [];
					for (const val of values) {
						if (acc.length === 0) {
							newCombos.push([val]);
						} else {
							for (const combo of acc) {
								newCombos.push([...combo, val]);
							}
						}
					}
					return newCombos;
				}, []);
			}

			function insertItemInGroup(
				sortedGroups,
				item,
				groupKeys,
				listGroupDef,
				cols,
				listConfig
			) {
				let updatedItem = item;
				const listGroupDefKeys = Object.keys(listGroupDef);

				let lastDepthIndex = -1;
				for (let depth = 0; depth < groupKeys.length; depth++) {
					const partialKeys = groupKeys[depth];

					let searchIndex = lastDepthIndex + 1;
					let exist = false;
					while (
						searchIndex < sortedGroups.length &&
						(sortedGroups[searchIndex].type !== "group" ||
							(sortedGroups[searchIndex].type === "group" &&
								sortedGroups[searchIndex].depth >= depth))
					) {
						if (
							sortedGroups[searchIndex].type === "group" &&
							sortedGroups[searchIndex].depth === depth &&
							sortedGroups[searchIndex].groupKey.toString() ===
								partialKeys.toString()
						) {
							lastDepthIndex = searchIndex + cols - 1;
							exist = true;
							break;
						}
						searchIndex++;
					}
					if (!exist) {
						createGroupAtDepth(
							sortedGroups,
							lastDepthIndex,
							groupKeys,
							listGroupDef,
							depth,
							cols
						);
						break;
					}
				}

				const finalHeaderIndex = findExactGroupHeaderIndex(
					sortedGroups,
					groupKeys,
					listGroupDefKeys
				);
				if (finalHeaderIndex === -1) {
					return;
				}

				let insertIndex = finalHeaderIndex + cols;

				if (insertIndex !== -1) {
					let sortFields = listConfig.listColumnsDef.filter(
						(column) => column.sort
					);
					if (sortFields.length > 0) {
						let sortField = sortFields[0];
						let sortFieldId = sortField.field;
						let sortFieldOrder = sortField.sort;
						let sortFieldMain = sortField.main;

						let groupStartIndex = insertIndex;
						if (groupStartIndex < sortedGroups.length) {
							let updatedItemValue = !sortFieldMain
								? updatedItem.fields[sortFieldId]
								: updatedItem[sortFieldId];

							const compareWithUpdatedItemValue = (a, order) => {
								let value = !sortFieldMain
									? a.fields[sortFieldId]
									: a[sortFieldId];

								let valueFloat = parseFloat(value);
								let updatedItemValueFloat = parseFloat(updatedItemValue);
								if (!isNaN(valueFloat) && !isNaN(updatedItemValueFloat)) {
									value = valueFloat;
									updatedItemValue = updatedItemValueFloat;
								}
								if (order === "asc") {
									return value < updatedItemValue;
								} else {
									return value > updatedItemValue;
								}
							};

							let itemEnvolve = sortedGroups[groupStartIndex];
							let itemCheck = itemEnvolve.item;

							while (
								groupStartIndex < sortedGroups.length &&
								sortedGroups[groupStartIndex].type === "item" &&
								compareWithUpdatedItemValue(itemCheck, sortFieldOrder)
							) {
								groupStartIndex++;
								itemEnvolve = sortedGroups[groupStartIndex];
								itemCheck = itemEnvolve?.item;
							}
							insertIndex = groupStartIndex;
						}
					}
				}

				const newItem = {
					type: "item",
					item,
					depth: groupKeys.length - 1,
					groupBy: listGroupDefKeys,
				};
				sortedGroups.splice(insertIndex, 0, newItem);

				let endGroupIndex = sortedGroups.findIndex(
					(grp, idx) => idx > finalHeaderIndex && grp.type === "group"
				);
				if (endGroupIndex === -1) endGroupIndex = sortedGroups.length;

				let indexItemPlaceholder = sortedGroups.findIndex(
					(grp, idx) =>
						idx > finalHeaderIndex &&
						idx < endGroupIndex &&
						grp.type === "itemPlaceholder"
				);
				if (indexItemPlaceholder !== -1) {
					sortedGroups.splice(indexItemPlaceholder, 1);
				} else {
					for (let i = 0; i < cols - 1; i++) {
						sortedGroups.splice(endGroupIndex, 0, {
							type: "itemPlaceholder",
							depth: groupKeys.length - 1,
						});
					}
				}
			}

			function createGroupAtDepth(
				sortedGroups,
				lastDepthIndex,
				notExistKeys,
				listGroupDef,
				depth,
				cols
			) {
				let listGroupDefKeys = Object.keys(listGroupDef);
				let notExistKeysDepth = notExistKeys[depth];

				if (lastDepthIndex === -1) {
					lastDepthIndex = 0;
				}
				while (
					lastDepthIndex < sortedGroups.length &&
					(sortedGroups[lastDepthIndex].type !== "group" ||
						(sortedGroups[lastDepthIndex].type === "group" &&
							sortedGroups[lastDepthIndex].depth >= depth))
				) {
					if (
						sortedGroups[lastDepthIndex].type === "group" &&
						sortedGroups[lastDepthIndex].depth === depth
					) {
						let groupKey = sortedGroups[lastDepthIndex].groupKey;
						let notExistKeysDepthFloat = parseFloat(notExistKeysDepth);
						let groupKeyFloat = parseFloat(
							sortedGroups[lastDepthIndex].groupKey
						);
						if (!isNaN(notExistKeysDepthFloat) && !isNaN(groupKeyFloat)) {
							groupKey = groupKeyFloat;
							notExistKeysDepth = notExistKeysDepthFloat;
						}
						if (listGroupDef[listGroupDefKeys[depth]] === "asc") {
							if (groupKey > notExistKeysDepth) {
								break;
							}
						} else {
							if (groupKey < notExistKeysDepth) {
								break;
							}
						}
					}
					lastDepthIndex++;
				}

				for (let i = depth; i < notExistKeys.length; i++) {
					let group = {
						type: "group",
						groupKey: notExistKeys[i],
						depth: i,
						groupBy: listGroupDefKeys[i],
					};
					sortedGroups.splice(lastDepthIndex, 0, group);
					lastDepthIndex++;
					for (let j = 0; j < cols - 1; j++) {
						sortedGroups.splice(lastDepthIndex, 0, {
							type: "groupPlaceholder",
							depth: i,
						});
						lastDepthIndex++;
					}
				}
				return lastDepthIndex;
			}

			function updateItemListRaw(updatedItem, beforeSave) {
				if (itemListConfig && itemListConfig.itemsListRaw) {
					updatedItem.updated_at = new Date();
					updateItemInListRawRecursive(
						itemListConfig.itemsListRaw,
						null,
						updatedItem
					);

					itemListConfig.itemsListRaw = updateItemsListRaw(
						itemListConfig.itemsListRaw,
						updatedItem,
						beforeSave,
						listConfig.listGroupDef
					);

					setItemListConfig({
						...itemListConfig,
						itemsListRaw: [...itemListConfig.itemsListRaw],
					});
				}
			}

			function updateItemInListRawRecursive(
				itemsListRawContainer,
				key,
				updatedItem
			) {
				let value = itemsListRawContainer[key] || itemsListRawContainer;
				if (Array.isArray(value)) {
					let foundInArray = false;
					for (let i = 0; i < value.length; i++) {
						updateItemInListRawRecursive(value, i, updatedItem);
					}
				} else if (typeof value === "object") {
					if (value.items) {
						updateItemInListRawRecursive(value.items, null, updatedItem);
					} else {
						if (value.id === updatedItem.id) {
							itemsListRawContainer[key] = updatedItem;
						}
					}
				}
			}

			function searchItemInListRaw(itemsListRaw, itemId) {
				for (let group of itemsListRaw) {
					if (group.items) {
						let found = searchItemInListRaw(group.items, itemId);
						if (found) {
							return found;
						}
					} else if (group.id === itemId) {
						return group;
					}
				}
				return null;
			}

			let { id, item: updatedItem, beforeSave } = event.detail;
			if (!updatedItem) return;
			if (beforeSave && beforeSave.id) {
				if (!searchItemInListRaw(itemListConfig.itemsListRaw, beforeSave.id)) {
					delete beforeSave.id;
				}
			}

			updateItemListRaw(updatedItem, beforeSave);

			let updatedItems = updatedItem;
			if (!Array.isArray(updatedItems)) {
				updatedItems = [updatedItems];
			}

			updatedItems.forEach((anItem) => {
				if (isGrouped && beforeSave && beforeSave.id) {
					const listGroupDefKeys = Object.keys(listConfig.listGroupDef);

					const newGroupCombos = getAllGroupKeyCombinations(
						anItem,
						listGroupDefKeys
					);
					const oldCombos = getAllGroupKeyCombinations(
						{
							...anItem,
							fields: { ...anItem.fields, ...beforeSave },
							cache: beforeSave.cache,
						},
						listGroupDefKeys
					);

					function isSameCombos(combo1, combo2) {
						if (Array.isArray(combo1) && Array.isArray(combo2)) {
							if (combo1.length !== combo2.length) {
								return false;
							}
							let same = true;
							for (let i = 0; i < combo1.length; i++) {
								same &&= isSameCombos(combo1[i], combo2[i]);
							}
							return same;
						} else {
							return combo1 === combo2;
						}
					}
					if (isSameCombos(newGroupCombos, oldCombos)) {
						if (itemListConfig.automaticScrollChangeDetail) {
							setTimeout(() => {
								goToItem(
									anItem.id,
									itemListConfig.colsN === itemListConfig.maxCols / 2
										? sortedGroups[itemListConfig.maxCols / 2]
										: sortedGroups[itemListConfig.maxCols]
								);
							}, 500);
						}
						return;
					}

					setSortedGroups((prev) => {
						let newSortedGroups5 = [...prev[itemListConfig.maxCols / 2]];
						let newSortedGroups10 = [...prev[itemListConfig.maxCols]];

						const processGroups = (sortedGroups, cols) => {
							oldCombos.forEach((oldKeys) => {
								if (
									!newGroupCombos.some((newKeys) =>
										newKeys.every((key, i) => key === oldKeys[i])
									)
								) {
									removeItemFromGroup(
										sortedGroups,
										anItem.id,
										oldKeys,
										listGroupDefKeys,
										cols
									);
								}
							});

							newGroupCombos.forEach((groupKeys) => {
								if (
									!oldCombos.some((oldKeys) =>
										oldKeys.every((key, i) => key === groupKeys[i])
									)
								) {
									insertItemInGroup(
										sortedGroups,
										anItem,
										groupKeys,
										listConfig.listGroupDef,
										cols,
										listConfig
									);
								}
							});

							return sortedGroups;
						};

						newSortedGroups5 = processGroups(
							newSortedGroups5,
							itemListConfig.maxCols / 2
						);
						newSortedGroups10 = processGroups(
							newSortedGroups10,
							itemListConfig.maxCols
						);

						if (itemListConfig.automaticScrollChangeDetail) {	
							setTimeout(() => {
								goToItem(
									anItem.id,
									itemListConfig.colsN === itemListConfig.maxCols / 2
										? newSortedGroups5
										: newSortedGroups10
								);
							}, 500);
						}

						let ret = { ...prev };
						ret[itemListConfig.maxCols / 2] = newSortedGroups5;
						ret[itemListConfig.maxCols] = newSortedGroups10;
						return ret;
					});
				} else if (isGrouped) {
					if (!beforeSave) {
						beforeSave = {};
					}
					if (!beforeSave.id && updatedItem.id) {
						beforeSave.id = updatedItem.id;
					}
					const listGroupDefKeys = Object.keys(listConfig.listGroupDef);
					const newGroupCombos = getAllGroupKeyCombinations(
						anItem,
						listGroupDefKeys
					);

					setSortedGroups((prev) => {
						let newSortedGroups5 = [...prev[itemListConfig.maxCols / 2]];
						let newSortedGroups10 = [...prev[itemListConfig.maxCols]];

						const insertCombos = (sortedGroups, combos, cols) => {
							combos.forEach((combo) => {
								insertItemInGroup(
									sortedGroups,
									anItem,
									combo,
									listConfig.listGroupDef,
									cols,
									listConfig
								);
							});
							return sortedGroups;
						};

						newSortedGroups5 = insertCombos(
							newSortedGroups5,
							newGroupCombos,
							itemListConfig.maxCols / 2
						);
						newSortedGroups10 = insertCombos(
							newSortedGroups10,
							newGroupCombos,
							itemListConfig.maxCols
						);
						if (itemListConfig.automaticScrollCreateDetail) {
							setTimeout(() => {
								goToItem(
									anItem.id,
									itemListConfig.colsN === itemListConfig.maxCols / 2
										? newSortedGroups5
										: newSortedGroups10
								);
							}, 100);
						}

						let ret = { ...prev };
						ret[itemListConfig.maxCols / 2] = newSortedGroups5;
						ret[itemListConfig.maxCols] = newSortedGroups10;
						return ret;
					});
				}
			});
		},
		[
			isGrouped,
			sortedGroups,
			itemListConfig.colsN,
			sortedItems,
			listConfig,
			itemListConfig.maxCols,
			itemListConfig.automaticScrollChangeDetail,
			itemListConfig.automaticScrollCreateDetail,
		]
	);

	useGlobalEventTakeLatest("saveDetail", handleSaveDetail, 1000, itemListConfig.groupEditionItems.length);

	function findItemByIdInRawOrSorted(id, itemListConfig, sortedItems) {
		if (itemListConfig && itemListConfig.itemsListRaw) {
			const foundInRaw = findItemInRaw(itemListConfig.itemsListRaw, id);
			if (foundInRaw) {
				return foundInRaw;
			}
		}

		if (Array.isArray(sortedItems) && sortedItems.length > 0) {
			const foundInSorted = sortedItems.find((item) => item.id === id);
			if (foundInSorted) {
				return foundInSorted;
			}
		}

		return null;
	}

	/**
	 * Recorre recursivamente itemsListRaw en busca de un item con el ID indicado.
	 *
	 * @param {Array} itemsListRaw - La lista cruda, que puede contener grupos y/o items.
	 * @param {string|number} id - El ID del item que se quiere buscar.
	 * @returns {Object|null} - El item encontrado o null si no existe.
	 */
	function findItemInRaw(itemsListRaw, id) {
		for (const element of itemsListRaw) {
			if (element.items && Array.isArray(element.items)) {
				const found = findItemInRaw(element.items, id);
				if (found) {
					return found;
				}
			}
			else if (element.id === id) {
				return element;
			}
		}
		return null;
	}

	function updateItemsListRawOnDelete(
		itemsListRaw,
		itemToDelete,
		listGroupDef
	) {
		const listGroupDefKeys = Object.keys(listGroupDef);

		const combos = getAllGroupKeyCombinations(itemToDelete, listGroupDefKeys);

		let newItemsListRaw = [...itemsListRaw];
		combos.forEach((combo) => {
			newItemsListRaw = removeItemFromPath(
				newItemsListRaw,
				combo,
				itemToDelete.id
			);
		});

		return newItemsListRaw;
	}
	
	const handleDeleteDetail = useCallback(
		(event) => {
			const { id } = event.detail;
			if (!id) return;

			const itemToDelete = findItemByIdInRawOrSorted(id, itemListConfig, sortedItems);

			if (!itemToDelete) {
				return;
			}

			if (itemListConfig && itemListConfig.itemsListRaw) {
				itemListConfig.itemsListRaw = updateItemsListRawOnDelete(
					itemListConfig.itemsListRaw,
					itemToDelete,
					listConfig.listGroupDef
				);

				setItemListConfig({
					...itemListConfig,
					itemsListRaw: [...itemListConfig.itemsListRaw],
				});
			}

			if (isGrouped) {
				const listGroupDefKeys = Object.keys(listConfig.listGroupDef);
				const combos = getAllGroupKeyCombinations(
					itemToDelete,
					listGroupDefKeys
				);

				setSortedGroups((prev) => {
					let newSortedGroups5 = [...prev[itemListConfig.maxCols / 2]];
					let newSortedGroups10 = [...prev[itemListConfig.maxCols]];

					const processRemoval = (sortedGroups, combos, cols) => {
						combos.forEach((groupKeys) => {
							removeItemFromGroup(
								sortedGroups,
								id,
								groupKeys,
								listGroupDefKeys,
								cols
							);
						});
						return sortedGroups;
					};

					newSortedGroups5 = processRemoval(
						newSortedGroups5,
						combos,
						itemListConfig.maxCols / 2
					);
					newSortedGroups10 = processRemoval(
						newSortedGroups10,
						combos,
						itemListConfig.maxCols
					);

					let ret = { ...prev };
					ret[itemListConfig.maxCols / 2] = newSortedGroups5;
					ret[itemListConfig.maxCols] = newSortedGroups10;
					return ret;
				});
			} else {
			}

		},
		[isGrouped, sortedGroups, listConfig, itemListConfig.maxCols, itemListConfig]
	);

	useGlobalEvent("deleteDetail", handleDeleteDetail);
	
	useEffect(() => {
		if (items.length === 0) {
			return;
		}
		const sortWorker = new Worker("sortWorker.js");
		setWorker(sortWorker);
		setSortedItems([]);

		return () => {
			sortWorker.terminate();
		};
	}, [items, itemListConfig.listSelected, itemListConfig.typeSelected]);

	useEffect(() => {
		let timeout = fadeVirtuoso(500, true);
		return () => {
			clearTimeout(timeout);
		};
	}, [
		items,
		sortedGroups,
	]);

	useEffect(() => {
		const flattenItems = (data, depth = 0) => {
			let result = [];
			let notDefined = [];
			data.forEach((item) => {
				if (item.groupKey === "__undefined__") {
					notDefined.push({
						type: "group",
						groupKey: item.groupKey,
						depth,
						groupBy: listConfig.listGroupDef,
						ref: item,
					});
					notDefined = notDefined.concat(flattenItems(item.items, depth + 1));
					return;
				}
				if (item.groupKey !== undefined) {
					result.push({
						type: "group",
						groupKey: item.groupKey,
						depth,
						groupBy: listConfig.listGroupDef,
						ref: item,
					});
					result = result.concat(flattenItems(item.items, depth + 1));
				} else {
					result.push({
						type: "item",
						item,
						depth,
						groupBy: listConfig.listGroupDef,
						ref: item,
					});
				}
			});
			result = result.concat(notDefined);
			return result;
		};

		const createSortedGroups = (items) => {
			const groups = [];
			let currentGroup = null;

			items.forEach((item) => {
				if (item.type === "group") {
					if (currentGroup) {
						groups.push(currentGroup);
					}
					currentGroup = {
						depth: item.depth,
						groupKey: item.groupKey,
						groupBy: item.groupBy,
						typeID: itemListConfig.typeSelected,
						items: [],
					};
				} else if (item.type === "item") {
					if (currentGroup) {
						currentGroup.items.push(item.item);
					} else {
						currentGroup = {
							groupKey: "",
							groupBy: item.groupBy,
							items: [item.item],
							typeID: itemListConfig.typeSelected,
						};
					}
				}
			});

			if (currentGroup) {
				groups.push(currentGroup);
			}

			return groups;
		};

		async function transformItems(
			items,
			limitGroups,
			refReturn,
			typeSelected,
			typesByID,
			listGroupDef,
			listColumnsDef,
			listSelected,
			listStatsHeaderDef
		) {
			/**
			 * Aquí creamos las dos salidas que queremos:
			 *   result[5] => para 5 columnas
			 *   result[10] => para 10 columnas
			 */
			let result = {};
			result[itemListConfig.maxCols / 2] = [];
			result[itemListConfig.maxCols] = [];

			let currentGroupItemCount = 0;
			let insideGroup = false;
			let countGroups = 0;

			const headerData = {
				type: "header",
				depth: null,
				groups: [],
				typeSelected: typeSelected,
				listGroupDef: listGroupDef,
				typesByID: typesByID,
				listSelected: listSelected,
				listColumnsDef: listColumnsDef,
			};

			result[itemListConfig.maxCols / 2].push(headerData);
			result[itemListConfig.maxCols].push(headerData);

			for (let j = 0; j < itemListConfig.maxCols / 2 - 1; j++) {
				result[itemListConfig.maxCols / 2].push({
					type: "headerPlaceholder",
					depth: null,
				});
			}
			for (let j = 0; j < itemListConfig.maxCols - 1; j++) {
				result[itemListConfig.maxCols].push({
					type: "headerPlaceholder",
					depth: null,
				});
			}

			let init = 0;
			if (refReturn && refReturn.i) {
				init = refReturn.i;
			}

			let groups = [];

			for (let i = init; i < items.length; i++) {
				const obj = items[i];

				if (obj.type === "group") {
					if (
						obj.groupKey === "__undefined__" &&
						items[i - 1] &&
						items[i - 1].type === "group"
					) {
						continue;
					}

					if (insideGroup) {
						addItemPlaceholders(
							result[itemListConfig.maxCols / 2],
							itemListConfig.maxCols / 2,
							currentGroupItemCount
						);
						addItemPlaceholders(
							result[itemListConfig.maxCols],
							itemListConfig.maxCols,
							currentGroupItemCount
						);
					}

					if (obj.depth !== undefined && obj.depth !== null) {
						for (let k = groups.length - 1; k > Number(obj.depth); k--) {
							if (k === 0) {
								headerData.groups.push({ ...groups[k] });
							} else {
								groups[k - 1].groups.push({ ...groups[k] });
							}
						}
						groups = groups.slice(0, Number(obj.depth) + 1);

						if (Number(obj.depth) === 0 && groups[obj.depth]) {
							headerData.groups.push({ ...groups[obj.depth] });
						} else if (Number(obj.depth) && groups[obj.depth - 1]) {
							groups[obj.depth - 1].groups.push({ ...groups[obj.depth] });
						}
						groups[obj.depth] = {
							groupKey: obj.groupKey,
							depth: obj.depth,
							groups: [],
							groupBy: Object.keys(obj["groupBy"])[obj.depth],
							index: result[itemListConfig.maxCols / 2].length,
							itemsIds: new Set(),
							stats: {},
						};
						if (obj.ref) {
							obj.ref.index = {};
							obj.ref.index[itemListConfig.maxCols / 2] =
								result[itemListConfig.maxCols / 2].length;
							obj.ref.index[itemListConfig.maxCols] =
								result[itemListConfig.maxCols].length;
						}
					}

					if (limitGroups) {
						countGroups++;
						if (countGroups > limitGroups) {
							refReturn.i = i;
							refReturn.countGroups = countGroups;
							refReturn.result = result;
							return result;
						}
					}

					result[itemListConfig.maxCols / 2].push(obj);
					result[itemListConfig.maxCols].push(obj);

					for (let j = 0; j < itemListConfig.maxCols / 2 - 1; j++) {
						result[itemListConfig.maxCols / 2].push({
							type: "groupPlaceholder",
							depth: obj.depth,
						});
					}
					for (let j = 0; j < itemListConfig.maxCols - 1; j++) {
						result[itemListConfig.maxCols].push({
							type: "groupPlaceholder",
							depth: obj.depth,
						});
					}

					insideGroup = true;
					currentGroupItemCount = 0;
				} else if (obj.type === "item") {
					groups = groups.filter((group) => group);
					for (let g = 0; g < groups.length; g++) {
						if (!groups[g].itemsIds) {
							groups[g].itemsIds = new Set();
						}
						groups[g].itemsIds.add(obj.item.id);
					}

					for (let s = 0; s < listStatsHeaderDef.length; s++) {
						let stat = listStatsHeaderDef[s];
						if (stat.id) {
							let valueItem = obj.item.fields[stat.id];
							if (!Array.isArray(valueItem)) {
								valueItem = [valueItem];
							}
							for (let val of valueItem) {
								let value = await valueToStringPromise(
									val,
									stat.id,
									typeSelected,
									true
								);
								for (let g = 0; g < groups.length; g++) {
									if (!groups[g].stats[stat.id]) {
										groups[g].stats[stat.id] = {};
									}
									if (!groups[g].stats[stat.id][value]) {
										groups[g].stats[stat.id][value] = new Set();
									}
									groups[g].stats[stat.id][value].add(obj.item.id);
								}
							}
						}
					}
					if (obj.ref) {
						obj.ref.index = {};
						obj.ref.index[itemListConfig.maxCols / 2] =
							result[itemListConfig.maxCols / 2].length;
						obj.ref.index[itemListConfig.maxCols] =
							result[itemListConfig.maxCols].length;
					}
					result[itemListConfig.maxCols / 2].push(obj);
					result[itemListConfig.maxCols].push(obj);

					currentGroupItemCount++;
				}
			}

			if (groups.length) {
				for (let g = groups.length - 1; g >= 0; g--) {
					if (g === 0) {
						headerData.groups.push({ ...groups[g] });
					} else {
						groups[g - 1].groups.push({ ...groups[g] });
					}
				}
			}

			if (insideGroup) {
				addItemPlaceholders(
					result[itemListConfig.maxCols / 2],
					itemListConfig.maxCols / 2,
					currentGroupItemCount
				);
				addItemPlaceholders(
					result[itemListConfig.maxCols],
					itemListConfig.maxCols,
					currentGroupItemCount
				);
			}

			for (let j = 0; j < itemListConfig.maxCols / 2; j++) {
				result[itemListConfig.maxCols / 2].push({
					type: "itemPlaceholder",
					depth: null,
				});
			}
			for (let j = 0; j < itemListConfig.maxCols; j++) {
				result[itemListConfig.maxCols].push({
					type: "itemPlaceholder",
					depth: null,
				});
			}

			return result;
		}

		function addItemPlaceholders(
			arrayRef,
			columnsCount,
			currentGroupItemCount
		) {
			const remainder = currentGroupItemCount % columnsCount;
			if (remainder !== 0) {
				const placeholdersNeeded = columnsCount - remainder;
				for (let j = 0; j < placeholdersNeeded; j++) {
					arrayRef.push({
						type: "itemPlaceholder",
						depth: null,
					});
				}
			}
		}

		const workerInit = async () => {
			if (worker) {
				worker.onmessage = async (e) => {
					console.log("worker", e.data);
					setItemListConfig({
						...itemListConfig,
						itemsListRaw: e.data,
					});
					const items = flattenItems(e.data);

					if (isGrouped) {
						const groups = createSortedGroups(items);
						db.items
							.where({ type: Number(itemListConfig.typeSelected) })
							.toArray()
							.then((items) => {
								let count = items.length;
								let groupCount = groups?.filter(
									(item) => item.depth === 0
								)?.length;
								openStatusBar(
									"<strong>" +
										count +
										"</strong> " +
										itemListConfig.typesByID[itemListConfig.typeSelected || 1]
											.name +
										(groupCount
											? " • <strong>" + groupCount + "</strong> " + t("groups")
											: "")
								);
							});
						let refReturn = { i: 0, result: [] };
						let sortedGroups = await transformItems(
							items,
							2000000,
							refReturn,
							itemListConfig.typeSelected,
							itemListConfig.typesByID,
							listConfig.listGroupDef,
							listConfig.listColumnsDef,
							itemListConfig.listSelected,
							listConfig.listStatsHeaderDef
						);
						setSortedGroups(sortedGroups);
						if (timeOut.current) {
							clearTimeout(timeOut.current);
						}

						setTimeout(() => {
							document.querySelector("body").classList.remove("detail-close");
						}, 10);
					} else {
						setSortedItems(items);
						openStatusBar(
							"<strong>" +
								items.length +
								"</strong> " +
								itemListConfig.typesByID[itemListConfig.typeSelected || 1].name
						);
					}
				};

				if (
					(listConfig.listColumnsDef && listConfig.listColumnsDef.length > 0) ||
					(listConfig.listGroupDef &&
						Object.keys(listConfig.listGroupDef).length > 0)
				) {
					let colum_sort = listConfig.listColumnsDef.find((item) => item.sort);
					if (!colum_sort) {
						colum_sort = {
							field: "name",
							sort: "asc",
							main: true,
						};
					}
					if (colum_sort) {
						worker.postMessage({
							items,
							fieldName: colum_sort.field,
							dir: colum_sort.sort,
							main: colum_sort.main,
							filterItems: filterItems,
							searchAdvancedValue: itemListConfig.searchAdvancedValue,
							groupBy: listConfig.listGroupDef,
							typesByID: JSON.parse(JSON.stringify(itemListConfig.typesByID)),
						});
					} else {
						setSortedItems(items);
					}
				}
			}
		};

		if (
			!Array.isArray(itemListConfig.searchAdvancedValue) &&
			typeof searchAdvancedValue === "object" &&
			itemListConfig.searchAdvancedValue.query
		) {
			if (itemListConfig.searchAdvancedValue.prevent === "listGrid") {
				return;
			}
			itemListConfig.searchAdvancedValue =
				itemListConfig.searchAdvancedValue.query;
		}

		if (items.length === 0) {
			return;
		}
		if (
			worker &&
			(listConfig.listColumnsDef.length ||
				Object.keys(listConfig.listGroupDef).length)
		) {
			workerInit();
		}
	}, [
		listConfig.listGroupDef,
		listConfig.listColumnsDef,
		itemListConfig.searchAdvancedValue,
		itemListConfig.maxCols,
		itemListConfig.listSelected,
	]);

	useEffect(() => {
		if (items.length === 0) {
			return;
		}

		const fetchConfigs = async () => {
			try {
				let sortKey = `gridSort:${itemListConfig.typeSelected}`;
				let groupKey = `gridGroup:${itemListConfig.typeSelected}`;
				let resizeKey = `gridResize:${itemListConfig.typeSelected}`;
				let statsHeaderKey = `gridStatsHeader:${itemListConfig.typeSelected}`;

				if (itemListConfig.listSelected) {
					sortKey += `:${itemListConfig.listSelected.id}`;
					groupKey += `:${itemListConfig.listSelected.id}`;
					statsHeaderKey += `:${itemListConfig.listSelected.id}`;
					resizeKey = `gridResize:list:${itemListConfig.listSelected.id}`;
				}

				if (window.ModeExplorer) {
					sortKey += `:explorer`;
					groupKey += `:explorer`;
					statsHeaderKey += `:explorer`;
					resizeKey += `:explorer`;
				}

				const [
					sortData,
					groupData,
					statsHeaderData,
					resizeData,
					automaticScrollChangeDetail,
					automaticScrollCreateDetail,
				] = await Promise.all([
					Config.get(sortKey, null),
					Config.get(groupKey, null),
					Config.get(statsHeaderKey, null),
					Config.get(resizeKey, {
						"n-cols-grid": 10,
						"cols-height": 250,
						"cols-img-cover": false,
						"primary-color": {
							color: "#3a230a",
							dark: "#301900",
							darkDark: "#1c0500",
							light: "#442d14",
							lightLight: "#584128",
							contrast: "#ffffff",
						},
						"secondary-color": {
							color: "#f8f1e5",
							dark: "#eee7db",
							darkDark: "#dad3c7",
							light: "#fffbef",
							lightLight: "#ffffff",
							constrast: "#000000",
						},
						"background-image": null,
						"background-image-size": "auto",
						"grid-item-box-shadow": false,
						"overlay-opacity": 3,
					}),
					Config.get("automatic-scroll-change-detail", true),
					Config.get("automatic-scroll-create-detail", true),
				]);

				if (resizeData) {
					setResizeData(resizeData);
					setItemListConfig({
						...itemListConfig,
						maxCols: resizeData["n-cols-grid"],
						colsN: resizeData["n-cols-grid"],
						automaticScrollChangeDetail: automaticScrollChangeDetail,
						automaticScrollCreateDetail: automaticScrollCreateDetail,
					});
					document.body.dataset.maxCols = resizeData["n-cols-grid"];
					document.body.dataset.currentCols = resizeData["n-cols-grid"];
					printStyleColors(
						resizeKey,
						resizeData["primary-color"],
						resizeData["secondary-color"],
						resizeData["background-image"],
						resizeData["background-image-size"],
						resizeData["grid-item-box-shadow"],
						resizeData["overlay-opacity"]
					);

					if (document.querySelector("#style-grid-resize")) {
						document.querySelector("#style-grid-resize").remove();
					}
					const style = document.createElement("style");
					style.id = "style-grid-resize";
					style.innerHTML = `
							.virtuoso-grid-item {
								height: ${resizeData["cols-height"]}px;
							}
							.list-table-row-group {
								top: ${resizeData["cols-height"] / 2.5}px;
							}
							.list-group-header-container {
								top: ${resizeData["cols-height"] / 6}px;
							}
							ul.list-group-header-resume {
								height: ${resizeData["cols-height"] / 1}px !important;
							}
						`;
					document.head.appendChild(style);
					if (resizeData["cols-img-cover"]) {
						document.body.classList.add("img-cover");
					} else {
						document.body.classList.remove("img-cover");
					}
				}

				let updatedListColumnsDef;
				if (sortData) {
					updatedListColumnsDef = sortData;
				} else {
					if (itemListConfig.typeSelected) {
						let columns = [];

						if (staticColumnsBefore.length > 0) {
							staticColumnsBefore.forEach((field, index) => {
								columns.push({
									key: `${iD}-${itemListConfig.typeSelected}-grid-${index}`,
									field: field,
									label: t(field),
									sort: "asc",
									main: true,
								});
							});
						}

						if (
							itemListConfig.typesByID[itemListConfig.typeSelected] &&
							itemListConfig.typesByID[itemListConfig.typeSelected].fields
						) {
							itemListConfig.typesByID[
								itemListConfig.typeSelected
							].fields.forEach((field) => {
								if (
									!["image", "file", "scraping", "sorted", "link"].includes(
										field.type
									)
								) {
									columns.push({
										key: `${iD}-${itemListConfig.typeSelected}-grid-${field.id}`,
										field: field.id,
										label: field.label,
										sort: false,
										main: false,
									});
								}
							});
						}

						if (
							itemListConfig.listSelected ||
							(items.length > 0 &&
								items[0].id &&
								typeof items[0].id === "string" &&
								items[0].id.includes("lists-"))
						) {
							columns.push({
								key: "items-1-grid",
								field: "in_collection",
								label: t("i-have-it"),
								sort: "asc",
								main: true,
							});
						}

						updatedListColumnsDef = columns;
					}
				}

				let updatedListGroupDef;
				if (groupData && groupData[itemListConfig.typeSelected]) {
					updatedListGroupDef = groupData[itemListConfig.typeSelected];
				} else {
					updatedListGroupDef = {};
				}

				let updatedListStatsHeaderDef;
				if (statsHeaderData && statsHeaderData[itemListConfig.typeSelected]) {
					updatedListStatsHeaderDef =
						statsHeaderData[itemListConfig.typeSelected];
				} else {
					updatedListStatsHeaderDef = [];
				}

				setListConfig({
					...listConfig,
					listColumnsDef: updatedListColumnsDef || listConfig.listColumnsDef,
					listGroupDef: updatedListGroupDef,
					listStatsHeaderDef: updatedListStatsHeaderDef,
				});

				if (
					itemListConfig.typesByID[itemListConfig.typeSelected] &&
					itemListConfig.typesByID[itemListConfig.typeSelected].fields
				) {
					const imgField = itemListConfig.typesByID[
						itemListConfig.typeSelected
					].fields.find((field) => field.type === "image" && field.main);
					if (imgField) {
						setImgField(imgField.id);
					}
				}
			} catch (error) {
				console.error("Error al obtener las configuraciones del grid:", error);
			}
		};

		fetchConfigs();
	}, [items]);

	const gridComponents = useMemo(
		() => ({
			List: React.forwardRef(({ style, children, ...props }, ref) => (
				<div
					ref={ref}
					{...props}
					style={{
						display: "flex",
						flexWrap: "wrap",
						...style,
					}}
				>
					{children}
				</div>
			)),
			Item: React.forwardRef(({ children, ...props }, ref) => (
				<div
					ref={ref}
					{...props}
					style={{
						padding: "0.5rem",
						width:
							"calc(" +
							(100 / itemListConfig.maxCols) *
								(isDetailVisible() ? 2 : 1) *
								(isMobile ? 5 : 1) +
							"%)",
						display: "flex",
						flex: "none",
						alignContent: "stretch",
						boxSizing: "border-box",
					}}
				>
					{children}
				</div>
			)),
		}),
		[isMobile, itemListConfig.maxCols]
	);

	refreshCacheItemsType();

	const [resizeData, setResizeData] = useState({
		"n-cols-grid": 0,
		"cols-height": 0,
		"cols-img-cover": false,
	});

	const popupResize = useCallback(() => {
		function setResizeDataInConfigAndState() {
			let key = "gridResize:" + itemListConfig.typeSelected;
			if (itemListConfig.listSelected) {
				key = "gridResize:list:" + itemListConfig.listSelected.id;
			}
			if (window.ModeExplorer) {
				key += ":explorer";
			}
			Config.set(key, resizeData);
			setItemListConfig({
				...itemListConfig,
				maxCols: resizeData["n-cols-grid"],
				colsN: resizeData["n-cols-grid"],
			});
			document.body.dataset.maxCols = resizeData["n-cols-grid"];
			document.body.dataset.currentCols = resizeData["n-cols-grid"];

			setSortedGroups((prev) => {
				let newSortedGroups = { ...prev };
				if (newSortedGroups[resizeData["n-cols-grid"] / 2] === undefined) {
					newSortedGroups[resizeData["n-cols-grid"] / 2] = [];
				}
				if (newSortedGroups[resizeData["n-cols-grid"]] === undefined) {
					newSortedGroups[resizeData["n-cols-grid"]] = [];
				}
				return newSortedGroups;
			});
			let closeEvent = new CustomEvent("closeDetail", {
				detail: { id: "resize" },
			});
			window.dispatchEvent(closeEvent);

			let height = resizeData["cols-height"];
			if (document.querySelector("#style-grid-resize")) {
				document.querySelector("#style-grid-resize").remove();
			}
			let style = document.createElement("style");
			style.id = "style-grid-resize";
			style.innerHTML = `
							.virtuoso-grid-item { 
								height: ${height}px; 
							} 
							.list-table-row-group {
								top: ${height / 2.5}px;
							}
							.list-group-header-container {
								top: ${height / 6}px;
							}
							ul.list-group-header-resume {
								height: ${height / 1}px !important;
							}
						`;
			document.head.appendChild(style);

			let cover = resizeData["cols-img-cover"];
			if (cover) {
				document.body.classList.add("img-cover");
			} else {
				document.body.classList.remove("img-cover");
			}
		}
		const fieldFormDefinitionInit = {
			ondemand: false,
			reference: true,
			def: [
				{
					id: "n-cols-grid",
					label: t("n-cols-grid"),
					type: "select",
					options: [
						{ value: 2, label: "2/1" },
						{ value: 4, label: "4/2" },
						{ value: 6, label: "6/3" },
						{ value: 8, label: "8/4" },
						{ value: 10, label: "10/5" },
						{ value: 12, label: "12/6" },
						{ value: 14, label: "14/7" },
						{ value: 16, label: "16/8" },
						{ value: 18, label: "18/9" },
						{ value: 20, label: "20/10" },
					],
					default: 10,
					onChange: (id, value) => {
						setResizeDataInConfigAndState();
					},
				},
				{
					id: "cols-height",
					label: t("cols-height"),
					type: "select",
					options: [
						{ value: 180, label: "180px" },
						{ value: 200, label: "200px" },
						{ value: 230, label: "230px" },
						{ value: 250, label: "250px" },
						{ value: 270, label: "270px" },
						{ value: 300, label: "300px" },
						{ value: 350, label: "350px" },
						{ value: 400, label: "400px" },
						{ value: 450, label: "450px" },
						{ value: 500, label: "500px" },
					],
					default: 250,
					onChange: (id, value) => {
						setResizeDataInConfigAndState();
					},
				},
				{
					id: "cols-img-cover",
					label: t("cols-img-cover"),
					type: "checkbox",
					default: false,
					onChange: (id, value) => {
						setResizeDataInConfigAndState();
					},
				},
				{
					id: "primary-color",
					label: t("primary-color"),
					type: "color",
					range: 10,
					default: "#3a230a",
					complementary: 3,
					contrast: -20,
					onChange: (id, value) => {
						let resizeKey = `gridResize:${itemListConfig.typeSelected}`;
						if (itemListConfig.listSelected) {
							resizeKey = `gridResize:list:${itemListConfig.listSelected.id}`;
						}

						if (window.ModeExplorer) {
							resizeKey += `:explorer`;
						}
						printStyleColors(
							resizeKey,
							value,
							resizeData["secondary-color"],
							resizeData["background-image"],
							resizeData["background-image-size"],
							resizeData["grid-item-box-shadow"],
							resizeData["overlay-opacity"]
						);
						setResizeDataInConfigAndState();
					},
				},
				{
					id: "secondary-color",
					label: t("secondary-color"),
					type: "color",
					range: 10,
					default: "#f8f1e5",
					complementary: 3,
					contrast: -20,
					onChange: (id, value) => {
						let resizeKey = `gridResize:${itemListConfig.typeSelected}`;
						if (itemListConfig.listSelected) {
							resizeKey = `gridResize:list:${itemListConfig.listSelected.id}`;
						}

						if (window.ModeExplorer) {
							resizeKey += `:explorer`;
						}
						printStyleColors(
							resizeKey,
							resizeData["primary-color"],
							value,
							resizeData["background-image"],
							resizeData["background-image-size"],
							resizeData["grid-item-box-shadow"],
							resizeData["overlay-opacity"]
						);
						setResizeDataInConfigAndState();
					},
				},
				{
					id: "background-image",
					label: t("background-image"),
					type: "image",
					default: "",
					onChange: (id, value) => {
						function setImage(value) {
							console.log("value", value);
							let resizeKey = `gridResize:${itemListConfig.typeSelected}`;
							if (itemListConfig.listSelected) {
								resizeKey = `gridResize:list:${itemListConfig.listSelected.id}`;
							}

							if (window.ModeExplorer) {
								resizeKey += `:explorer`;
							}
							printStyleColors(
								resizeKey,
								resizeData["primary-color"],
								resizeData["secondary-color"],
								value,
								resizeData["background-image-size"],
								resizeData["grid-item-box-shadow"],
								resizeData["overlay-opacity"]
							);
							setResizeDataInConfigAndState();
						}
						optimizeImageToWebP(value)
							.then((res) => setImage(res))
							.catch((err) => {
								console.error(err);
								setImage(value);
							});
					},
				},
				{
					id: "background-image-size",
					label: t("background-image-size"),
					type: "text",
					default: "auto",
					onChange: (id, value) => {
						let resizeKey = `gridResize:${itemListConfig.typeSelected}`;
						if (itemListConfig.listSelected) {
							resizeKey = `gridResize:list:${itemListConfig.listSelected.id}`;
						}

						if (window.ModeExplorer) {
							resizeKey += `:explorer`;
						}
						printStyleColors(
							resizeKey,
							resizeData["primary-color"],
							resizeData["secondary-color"],
							resizeData["background-image"],
							value,
							resizeData["grid-item-box-shadow"],
							resizeData["overlay-opacity"]
						);
						setResizeDataInConfigAndState();
					},
				},
				{
					id: "overlay-opacity",
					label: t("overlay-opacity"),
					type: "range",
					default: 3,
					min: 0,
					max: 8,
					onChange: (id, value) => {
						let resizeKey = `gridResize:${itemListConfig.typeSelected}`;
						if (itemListConfig.listSelected) {
							resizeKey = `gridResize:list:${itemListConfig.listSelected.id}`;
						}

						if (window.ModeExplorer) {
							resizeKey += `:explorer`;
						}
						printStyleColors(
							resizeKey,
							resizeData["primary-color"],
							resizeData["secondary-color"],
							resizeData["background-image"],
							resizeData["background-image-size"],
							resizeData["grid-item-box-shadow"],
							value
						);
						setResizeDataInConfigAndState();
					},
				},
				{
					id: "grid-item-box-shadow",
					label: t("grid-item-box-shadow"),
					type: "checkbox",
					default: false,
					onChange: (id, value) => {
						let resizeKey = `gridResize:${itemListConfig.typeSelected}`;
						if (itemListConfig.listSelected) {
							resizeKey = `gridResize:list:${itemListConfig.listSelected.id}`;
						}

						if (window.ModeExplorer) {
							resizeKey += `:explorer`;
						}
						printStyleColors(
							resizeKey,
							resizeData["primary-color"],
							resizeData["secondary-color"],
							resizeData["background-image"],
							resizeData["background-image-size"],
							value,
							resizeData["overlay-opacity"]
						);
						setResizeDataInConfigAndState();
					},
				},
				
			],
		};
		selectPopup({
			title: t("redising-grid"),
			className: "popup-resize",
			content: () => (
				<FormBuilder
					definition={fieldFormDefinitionInit}
					reference={resizeData}
					className="form-builder-resize"
				/>
			),
			btns: [
				{
					label: t("close"),
					action: () => {
						selectPopup(null);
					},
					variant: "outlined",
				},
			],
		});
	}, [resizeData]);

	return (
		<Paper
			className={`list-table-container list-cols-${itemListConfig.colsN}`}
			sx={{ position: "relative" }}
		>
			<ListSearchEvent
				isGrouped={isGrouped}
				sortedItems={(isGrouped && sortedGroups[itemListConfig.colsN]) || sortedItems}
				sortedGroups={sortedGroups[itemListConfig.colsN]}
				virtuosoRef={virtuosoRef}
				onClick={onClick}
				setSelectedIndex={setSelectedIndex}
				selectedIndex={selectedIndex}
			/>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Box></Box>
				<TypesTabs
					onClick={(e, type) => {
						if (!e.target || !e.target.classList.contains("selected")) {
							e.stopPropagation();
							e.preventDefault();
							window.ModeExplorer = false;
							let resizeKey = `gridResize:${type}`;
							if (itemListConfig.listSelected) {
								resizeKey = `gridResize:list:${itemListConfig.listSelected.id}`;
							}

							if (window.ModeExplorer) {
								resizeKey += `:explorer`;
							}
							Config.get(resizeKey, {
								"n-cols-grid": 10,
								"cols-height": 250,
								"cols-img-cover": false,
								"primary-color": {
									color: "#3a230a",
									dark: "#301900",
									darkDark: "#1c0500",
									light: "#442d14",
									lightLight: "#584128",
									contrast: "#ffffff",
								},
								"secondary-color": {
									color: "#f8f1e5",
									dark: "#eee7db",
									darkDark: "#dad3c7",
									light: "#fffbef",
									lightLight: "#ffffff",
									constrast: "#000000",
								},
								"background-image": null,
								"background-image-size": "auto",
								"grid-item-box-shadow": false,
							}).then((resizeData) => {
								printStyleColors(
									resizeKey,
									resizeData["primary-color"],
									resizeData["secondary-color"],
									resizeData["background-image"],
									resizeData["background-image-size"],
									resizeData["grid-item-box-shadow"],
									resizeData["overlay-opacity"],
									1
								);
							});
								fadeVirtuoso();
								setSortedItems([]);
								let newSortedGroups = {};
								newSortedGroups[itemListConfig.maxCols / 2] = [];
								newSortedGroups[itemListConfig.maxCols] = [];
								setSortedGroups(newSortedGroups);
								// setItems([]);
								
								setItemListConfig({
									...itemListConfig,
									typeSelected: type,
								});
								document.querySelector("body").dataset.type = type;
								document.querySelector("body").click();
							// });
						}
					}}
				/>
				<Box></Box>
			</Box>
			<div className="list-header-controls">
				<div className="list-header-controls-container">
					<Box
						sx={{
							right: "80px",
							top: "20px",
							zIndex: 100,
							borderRadius: "50%",
							width: "32px",
							height: "32px",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							cursor: "pointer",
						}}
					>
						<HorizontalSplitIcon
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								handleMenuClick(e, e.currentTarget, "group");
							}}
						/>
					</Box>
					<Menu
						id="simple-menu"
						anchorEl={anchorMenuGroup}
						keepMounted
						open={openMenuGroup}
						onClose={() => {
							handleMenuClose("group");
						}}
						disableScrollLock
					>
						{listConfig.listGroupDef &&
							Object.keys(listConfig.listGroupDef).map((key) => {
								const id = key;
								if (
									!itemListConfig.typesByID ||
									!itemListConfig.typesByID[itemListConfig.typeSelected]
								) {
									return null;
								}
								if (key === "name") {
									key = "Nombre";
								} else if (key === "in_collection") {
									key = t("i-have-it");
								} else {
									const field = itemListConfig.typesByID[
										itemListConfig.typeSelected
									].fields.find((field) => field.id === key);
									if (!field) {
										return null;
									}
									if (field.label) {
										key = field.label;
									}
								}
								return (
									<MenuItem
										key={key}
										variant="head"
										align="left"
										sx={{
											backgroundColor: "background.paper",
										}}
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											const listGroupDefNew = { ...listConfig.listGroupDef };
											listGroupDefNew[id] =
												listGroupDefNew[id] === "asc" ? "desc" : "asc";
											setListConfig({
												...listConfig,
												listGroupDef: listGroupDefNew,
											});
											let key = "gridGroup:" + itemListConfig.typeSelected;
											if (itemListConfig.listSelected) {
												key =
													"gridGroup:" +
													itemListConfig.typeSelected +
													":" +
													itemListConfig.listSelected.id;
											}
											if (window.ModeExplorer) {
												key += ":explorer";
											}
											Config.get(key, null).then((data) => {
												if (!data) {
													data = {};
												}
												let newForType = {};
												newForType[itemListConfig.typeSelected] =
													listGroupDefNew;
												data = { ...data, ...newForType };
												Config.set(key, data);
											});
										}}
									>
										{listConfig.listGroupDef[id] === "asc" ? (
											<span>&#9650;</span>
										) : listConfig.listGroupDef[id] === "desc" ? (
											<span>&#9660;</span>
										) : (
											""
										)}
										{key}
										<DeleteIcon
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												const listGroupDefNew = { ...listConfig.listGroupDef };
												delete listGroupDefNew[id];
												setListConfig({
													...listConfig,
													listGroupDef: listGroupDefNew,
												});
												let key = "gridGroup:" + itemListConfig.typeSelected;
												if (itemListConfig.listSelected) {
													key =
														"gridGroup:" +
														itemListConfig.typeSelected +
														":" +
														itemListConfig.listSelected.id;
												}
												if (window.ModeExplorer) {
													key += ":explorer";
												}
												Config.get(key, null).then((data) => {
													if (!data) {
														data = {};
													}
													let newForType = {};
													newForType[itemListConfig.typeSelected] =
														listGroupDefNew;
													data = { ...data, ...newForType };
													Config.set(key, data);
												});
											}}
										/>
									</MenuItem>
								);
							})}
						{listConfig.listGroupDef &&
							Object.keys(listConfig.listGroupDef).length > 0 && (
								<hr style={{ margin: "5px 0" }} />
							)}
						{listConfig.listColumnsDef &&
							listConfig.listColumnsDef.map &&
							listConfig.listColumnsDef.map((column) => {
								let field = itemListConfig.typesByID[
									itemListConfig.typeSelected
								].fields.find((field) => field.id === column.field);
								if (
									(listConfig.listGroupDef[column.field] || !field) &&
									column.field !== "in_collection"
								) {
									return null;
								}
								if (
									column.field !== "in_collection" &&
									(column.field === "name" || field.type === "image")
								) {
									return null;
								}
								return (
									<MenuItem
										key={column.field}
										variant="head"
										align={column.numeric || false ? "right" : "left"}
										sx={{
											backgroundColor: "background.paper",
										}}
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											const listGroupDefNew = { ...listConfig.listGroupDef };
											listGroupDefNew[column.field] = "asc";
											setListConfig({
												...listConfig,
												listGroupDef: listGroupDefNew,
											});
											let key = "gridGroup:" + itemListConfig.typeSelected;
											if (itemListConfig.listSelected) {
												key =
													"gridGroup:" +
													itemListConfig.typeSelected +
													":" +
													itemListConfig.listSelected.id;
											}
											if (window.ModeExplorer) {
												key += ":explorer";
											}
											Config.get(key, null).then((data) => {
												if (!data) {
													data = {};
												}
												let newForType = {};
												newForType[itemListConfig.typeSelected] =
													listGroupDefNew;
												data = { ...data, ...newForType };
												Config.set(key, data);
											});
											fadeVirtuoso();
										}}
									>
										{column.label}
									</MenuItem>
								);
							})}
					</Menu>

					<Box
						sx={{
							right: "30px",
							top: "20px",
							zIndex: 100,
							borderRadius: "50%",
							width: "32px",
							height: "32px",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							cursor: "pointer",
						}}
					>
						<SortByAlphaIcon
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								handleMenuClick(e, e.currentTarget, "order");
							}}
						/>
					</Box>
					<Menu
						id="simple-menu"
						anchorEl={anchorMenuOrder}
						keepMounted
						open={openMenuOrder}
						onClose={() => {
							handleMenuClose("order");
						}}
						disableScrollLock
					>
						{listConfig.listColumnsDef &&
							listConfig.listColumnsDef.map &&
							listConfig.listColumnsDef.map((column) => {
								let field = itemListConfig.typesByID[
									itemListConfig.typeSelected
								].fields.find((field) => field.id === column.field);
								if (field && field.type === "image") {
									return null;
								}
								return (
									<MenuItem
										key={column.field}
										variant="head"
										align={column.numeric || false ? "right" : "left"}
										sx={{
											backgroundColor: "background.paper",
										}}
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											setSortedItems([]);
											setTimeout(() => {
												const prevSort = column.sort;
												const listColumnsDefNew = listConfig.listColumnsDef.map(
													(item) => {
														item.sort = false;
														if (item.field === column.field) {
															if (!prevSort || prevSort === "desc") {
																column.sort = item.sort = "asc";
															} else {
																column.sort = item.sort = "desc";
															}
														}
														return item;
													}
												);
												setListConfig({
													...listConfig,
													listColumnsDef: listColumnsDefNew,
												});
												let key = "gridSort:" + itemListConfig.typeSelected;
												if (itemListConfig.listSelected) {
													key =
														"gridSort:" +
														itemListConfig.typeSelected +
														":" +
														itemListConfig.listSelected.id;
												}
												if (window.ModeExplorer) {
													key += ":explorer";
												}
												Config.set(key, listColumnsDefNew);
											}, 10);
										}}
									>
										{column.sort && column.sort === "asc" ? (
											<span>&#9650;</span>
										) : column.sort && column.sort === "desc" ? (
											<span>&#9660;</span>
										) : (
											""
										)}
										{column.label}
									</MenuItem>
								);
							})}
					</Menu>

					<Box
						sx={{
							right: "10px",
							top: "20px",
							zIndex: 100,
							borderRadius: "50%",
							width: "32px",
							height: "32px",
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							cursor: "pointer",
						}}
					>
						<AspectRatioIcon onClick={popupResize} />
					</Box>
				</div>
			</div>
			{isGrouped ? (
				(sortedGroups[itemListConfig.colsN] && (
					<VirtuosoGrid
						ref={virtuosoRef}
						overscan={500}
						style={{
							height: "calc(100vh - 52px)",
							overflowX: "clip",
							marginLeft: "10px",
							opacity: 0,
						}}
						data={sortedGroups[itemListConfig.colsN]}
						components={gridComponents}
						itemContent={(index, item) => (
							<RowContent
								key={JSON.stringify(item)}
								index={index}
								colsN={itemListConfig.colsN}
								row={item}
								imgField={imgField}
								listColumnsDef={listConfig.listColumnsDef}
								onDeleteItem={onDeleteItem}
								component={component}
								onClick={(e) => {
									onClick(e);
									if (itemListConfig.colsN === itemListConfig.maxCols) {
										fadeVirtuoso();
									}
								}}
								onAddCollectionItem={onAddCollectionItem}
								itemRefs={itemRefs}
								setSelectedIndex={setSelectedIndex}
								imgCacheRefs={imgCacheRefs}
								groupEditionItems={itemListConfig.groupEditionItems}
								listConfig={listConfig}
								setListConfig={setListConfig}
							/>
						)}
					/>
				)) ||
				""
			) : (
				<VirtuosoGrid
					ref={virtuosoRef}
					style={{
						height: "calc(100vh - 52px)",
						marginLeft: "10px",
					}}
					data={sortedItems}
					components={gridComponents}
					itemContent={(index, item) => (
						<RowContent
							key={JSON.stringify(item)}
							index={index}
							colsN={itemListConfig.colsN}
							row={item}
							imgField={imgField}
							listColumnsDef={listConfig.listColumnsDef}
							onDeleteItem={onDeleteItem}
							component={component}
							onClick={onClick}
							onAddCollectionItem={onAddCollectionItem}
							itemRefs={itemRefs}
							setSelectedIndex={setSelectedIndex}
							imgCacheRefs={imgCacheRefs}
							groupEditionItems={itemListConfig.groupEditionItems}
						/>
					)}
					itemSize={250}
				/>
			)}
			<StatusBar scrollRef={virtuosoRef} />
		</Paper>
	);




























}