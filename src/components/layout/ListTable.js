import React from "react";

import {
	Box,
	Tooltip,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	List,
	ListItem,
	ListItemText,
	Checkbox,
} from "@mui/material";

import { TableVirtuoso } from 'react-virtuoso';

import DeleteIcon from "@mui/icons-material/Delete";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import CategoryIcon from "@mui/icons-material/Category";

import flags from "../../locales/flags";
import countriesAll from "../../locales/countries";

import FormBuilder from "./../FormBuilder";

import { useTranslation } from "react-i18next";

import { useEffect, useContext } from "react";
import db from "../../services/db";

import { AppContext } from "../../services/context";

import { ListSearchEvent } from "./List/ListSearchEvent";

import {
	selectPopup,
	getSelectedItemId,
	getEntityType,
	openStatusBar,
} from "../../services/helper";

const rowReducer = (state, action) => {
	switch (action.type) {
		case "UPDATE_ROW":
			if (action.payload && action.payload.id === state.id) {
				return { ...state, ...action.payload };
			}
			return state;
		default:
			return state;
	}
};

const RowContent = React.memo(({ row, listColumnsDef, typeSelected, 
	onDeleteItem, 
	beforeDeleteItem,
	onAddCollectionItem,
	index, typesByID, component }) => {

	const { t } = useTranslation();
	const [item, dispatch] = React.useReducer(rowReducer, row);

	
	useEffect(() => {
		

		const fetchData = async () => {
			let newRow = { ...row };
			if (newRow.document === "lists-items") {
				if (typeof newRow.id === "string" && newRow.id.includes("lists-")) {
					newRow.id = parseInt(newRow.id.replace("lists-", ""));
				}
			}
			newRow.document = newRow.document || component;
			const data = await db[newRow.document].get(newRow.id);
			if (newRow.document === "lists-items" && data && data.id) {
				data.id = "lists-" + data.id;
			}
			dispatch({ type: "UPDATE_ROW", payload: data });
		};
		fetchData();

		const handleChangeRow = (event) => {
			const { row: newRow } = event.detail;
			if (newRow.document === "lists-items") {
				if (typeof newRow.id === "string" && newRow.id.includes("lists-")) {
					newRow.id = parseInt(newRow.id.replace("lists-", ""));
				}
			}
			newRow.document = newRow.document || component;
			db[newRow.document].get(newRow.id).then((data) => {
				if (newRow.document === "lists-items") {
					data.id = "lists-" + data.id;
				}
				dispatch({ type: "UPDATE_ROW", payload: data });
			});
		};

		const handleDeleteRow = (event) => {
			const { row } = event.detail;
			row.deleted = true;
			dispatch({ type: "UPDATE_ROW", payload: row });
		};

		window.addEventListener("changeRow", handleChangeRow);
		window.addEventListener("deleteRow", handleDeleteRow);

		return () => {
			window.removeEventListener("changeRow", handleChangeRow);
			window.removeEventListener("deleteRow", handleDeleteRow);
		};
	}, []);


	return (
		<React.Fragment>
			{listColumnsDef.map &&
				listColumnsDef.map((column) => {
					let field_type = "text";
					if (
						typeSelected &&
						typesByID[typeSelected] &&
						typesByID[typeSelected].fields
					) {
						const field = typesByID[item.type].fields.find(
							(field) => field.id === column.field
						);
						field_type = field ? field.type : "text";
					}
					let class_list_item = item.document === "lists-items" ? "list-item" : "";
					return (
						<TableCell
							key={`${column.field}_${item.id}`}
							align={column.numeric ? "right" : "left"}
							className={`list-table-cell list-table-cell-${
								column.field
							} list-table-cell-${field_type} ${
								row.deleted || item.deleted ? "deleted" : ""
							}
							${
								class_list_item
							}
							`}
							
						>
							<RowContentColumn
								row={item}
								column={column}
								item={item}
								listColumnsDef={listColumnsDef}
								typeSelected={typeSelected}
								onDeleteItem={onDeleteItem}
								typesByID={typesByID}
								index={index}
							/>
						</TableCell>
					);
				})}
			<TableCell
				key={`controls_${item.id}`}
				align="right"
				className={`list-table-cell list-table-cell-controls ${
					row.deleted || item.deleted ? "deleted" : ""
				}`}
			>
				<Box className="list-table-controls">
					{beforeDeleteItem && beforeDeleteItem(item)}
					{(typeof item.id === "string" && item.id.includes("lists-") && (
						<Tooltip title={t("save-in-collection")}>
							<LibraryAddIcon
								onClick={(e) => {
									e.stopPropagation();
									e.preventDefault();
									onAddCollectionItem(item);
								}}
							/>
						</Tooltip>
					)) ||
						null}
					<Tooltip title={t("delete")}>
						<DeleteIcon
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								onDeleteItem(item);
							}}
						/>
					</Tooltip>
				</Box>
			</TableCell>
		</React.Fragment>
	);
});

const RowContentColumn = ({
	column,
	item,
	typeSelected,
	typesByID,
}) => {
	

	const { i18n } = useTranslation();

	function getValue () {
		
		let value = column.main 
			? item[column.field]
			: item.fields[column.field];
		
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
							<img src={flags[value]} alt={value} style={{width: '20px', height: '20px'}} />
						</Tooltip>
					);
				}
			}
			else if (field && field.type === "checkbox") {
				
				return value ? <CheckIcon/> : <CloseIcon/>;
			}
			else if (field && field.type === "entity") {
				
				if (item.cache && item.cache[column.field]) {
					let type = getEntityType(field.entity);
					if(type && type.fields) {
						
						if(field.multiple) {
							let images = [];
							for (let i = 0; i < type.fields.length; i++) {
								let id_field = type.fields[i].id;
								if(type.fields[i].type === "image" && type.fields[i].main) {
									for (let j = 0; j < item.cache[column.field].length; j++) {
										if(item.cache[column.field][j].fields[id_field]) {
											let img_value = item.cache[column.field][j].fields[id_field];
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
														(j < item.cache[column.field].length - 1 ? " • " : "")
												)
											);
										}else {
											let name = item.cache[column.field][j].name;
											name = name.split(" ").map((item) => item.charAt(0).toUpperCase() + item.charAt(1) + item.charAt(2)).join("");
											images.push(
												(
													<Tooltip title={item.cache[column.field][j].name} className="entity-name-as-picture">
														{name}
													</Tooltip>
												)	
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
						}
						else {
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
	};

	const [value, setValue] = React.useState(
		getValue()
	);

	React.useEffect(() => {
		setValue(getValue());
	}, [item]);

	return value;
};

let global_list_index = null;

export default function ListTable({
	items,
	iD,
	onClick = () => {},
	onDeleteItem = null,
	staticColumnsBefore = [],
	staticColumnsAfter = [],
	typesByID = {},
	component = "items",
	typeSelected = null,
	setTypeSelected = () => {},
	columnsSortControl = true,
	filterItems = null,
	searchAdvancedValue = null,
	beforeDeleteItem = null,
	hasHeader = true,
	onAddCollectionItem = null,
}) {
	const { t } = useTranslation();

	// const [typesByID, setTypesByID] = React.useState({});
	const [listColumnsDef, setListColumnsDef] = React.useState({});
	const [anchorEl, setAnchorEl] = React.useState(null);
	const open = Boolean(anchorEl);

	const { selectComponent } = useContext(AppContext);

	const virtuosoRef = React.useRef(null);

	const [sortedItems, setSortedItems] = React.useState([]);
	const [worker, setWorker] = React.useState(null);

	const itemRefs = React.useRef([]);
	useEffect(() => {
		itemRefs.current = items.map(
			(_, i) => itemRefs.current[i] || React.createRef()
		);
	}, [items]);

	// const { typeSelected, setTypeSelected } = useContext(AppContext);

	React.useEffect(() => {
		const handleKeyDown = (e) => {
			function checkVisibility(node, container) {
				if (!node) {
					virtuosoRef.current.scrollToIndex({
						index: global_list_index,
						behavior: "auto",
					});
					return { visible: true };
				}
				const nodeRect = node.getBoundingClientRect();

				const containerRect = container.getBoundingClientRect();

				if (nodeRect.bottom > containerRect.bottom) {
					return { visible: false, position: "below" };
				} else if (nodeRect.top < containerRect.top) {
					return { visible: false, position: "above" };
				}
				return { visible: true };
			}
			function scrollToItem(index, position, container) {
				const node = itemRefs.current[index].current;
				const firstVisibleItem = Math.floor(
					container.scrollTop / node.offsetHeight
				);
				const firstVisibleIndex = Math.max(0, firstVisibleItem);
				if (position === "below") {
					virtuosoRef.current.scrollToIndex({
						index: firstVisibleIndex + 1,
						behavior: "auto",
					});
				} else if (position === "above") {
					virtuosoRef.current.scrollToIndex({
						index: firstVisibleIndex - 1,
						behavior: "auto",
					});
				}
			}
			if (document.querySelector('[role="dialog"]')) {
				return;
			}
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				if (e.key === "ArrowDown") {
					global_list_index = Math.min(
						global_list_index + 1,
						sortedItems.length - 1
					);
				} else if (e.key === "ArrowUp") {
					global_list_index = Math.max(global_list_index - 1, 0);
				}
				const node = itemRefs.current[global_list_index].current;
				const container = document.querySelector(
					'[data-testid="virtuoso-scroller"]'
				);
				const isVisible = checkVisibility(node, container);
				if (!isVisible.visible) {
					scrollToItem(global_list_index, isVisible.position, container);
				}
				onClick(sortedItems[global_list_index]);
			}
			//supr
			if (e.key === "Delete" && onDeleteItem) {
				onDeleteItem(sortedItems[global_list_index]);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [sortedItems.length]);

	useEffect(() => {
		// Inicializar el Web Worker
		const sortWorker = new Worker("sortWorker.js");
		setWorker(sortWorker);
		setSortedItems([]);

		return () => {
			sortWorker.terminate();
		};
	}, [items]);

	useEffect(() => {
		if (worker) {
			worker.onmessage = (e) => {
				setSortedItems(e.data);
				if (typesByID[typeSelected || 1]){
					openStatusBar(
						"<strong>" + e.data.length + "</strong> " + typesByID[typeSelected || 1].name
					);
				}
			};

			if (listColumnsDef && listColumnsDef.length > 0) {
				let colum_sort = listColumnsDef.find((item) => item.sort);
				if (!colum_sort) {
					colum_sort = {
						field: "name",
						sort: "asc",
						main: true,
					};
				}
				if (colum_sort || searchAdvancedValue) {
					worker.postMessage({
						items,
						fieldName: colum_sort.field,
						dir: colum_sort.sort,
						main: colum_sort.main,
						filterItems: filterItems,
						searchAdvancedValue: searchAdvancedValue,
					});
				} else {
					setSortedItems(items);
				}
			}
		}
	}, [items, worker, listColumnsDef]);

	useEffect(() => {
		if (typeSelected) {
			db.listColumns
				.where("key")
				.equals(iD + "-" + typeSelected)
				.toArray()
				.then((data) => {
					let columns = [];
					if (staticColumnsBefore.length > 0) {
						for (let i = 0; i < staticColumnsBefore.length; i++) {
							const column = {
								key: iD + "-" + typeSelected,
								field: staticColumnsBefore[i],
								label: t(staticColumnsBefore[i]),
								sort: false,
								main: true,
							};
							columns.push(column);
							if (!data.some((item) => item.field === staticColumnsBefore[i])) {
								column.id = db.listColumns.add(column);
							} else {
								column.id = data[0].id;
								column.sort = data[0].sort;
							}
						}
					}
					for (let i = 0; i < data.length; i++) {
						if (!data[i].main) {
							columns.push(data[i]);
						}
					}
					setListColumnsDef(columns);
				});
		}
	}, [items, typeSelected]);

	useEffect(() => {
		const handleScrollTableEnd = (event) => {
			let elementId = event.detail.elementId;
			let index = items.length - 1;
			for (let i = 0; i < sortedItems.length; i++) {
				if (sortedItems[i].id === elementId) {
					index = i;
					break;
				}
			}

			if (virtuosoRef.current) {
				virtuosoRef.current.scrollToIndex({
					index: index,
					behavior: "auto",
				});
			}
		};

		window.addEventListener("scrollTableEnd", handleScrollTableEnd);

		return () => {
			window.removeEventListener("scrollTableEnd", handleScrollTableEnd);
		};
	}, [sortedItems]);

	const VirtuosoTableComponents = {
		Scroller: React.forwardRef((props, ref) => {
			let newProps = { ...props };
			newProps.style = {
				...newProps.style,
				boxShadow: "none",
				borderRadius: "0px",
			};

			return <TableContainer component={Paper} {...newProps} ref={ref} />;
		}),
		Table: (props) => (
			<Table
				{...props}
				sx={{ borderCollapse: "separate", tableLayout: "fixed" }}
			/>
		),
		TableHead,
		TableRow: ({ item: _item, ...props }) => {
			const index = props["data-item-index"];
			const onRowClick = React.useCallback((e) => {
				e.stopPropagation();
				e.preventDefault();
				onClick(_item);
				global_list_index = index;
			}, []);
			return (
				<TableRow
					ref={itemRefs.current[index]}
					onClick={onRowClick}
					className={`list-table-row list-table-row-${_item.id} ${
						parseInt(getSelectedItemId()) === parseInt(_item.id)
							? "selected"
							: ""
					}`}
					{...props}
				/>
			);
		},
		TableBody: React.forwardRef((props, ref) => (
			<TableBody {...props} ref={ref} />
		)),
	};

	const fixedHeaderContent = () => {
		return (
			<TableRow>
				{listColumnsDef &&
					listColumnsDef.map &&
					listColumnsDef.map((column) => (
						<TableCell
							key={column.field}
							variant="head"
							align={column.numeric || false ? "right" : "left"}
							sx={{
								backgroundColor: "background.paper",
							}}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								const prevSort = column.sort;
								const listColumnsDefNew = listColumnsDef.map((item) => {
									item.sort = false;
									if (item.field === column.field) {
										if (!prevSort || prevSort === "desc") {
											column.sort = item.sort = "asc";
										} else {
											column.sort = item.sort = "desc";
										}
									}
									db.listColumns.update(item.id, { sort: item.sort });
									return item;
								});

								setListColumnsDef(listColumnsDefNew);
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
						</TableCell>
					))}
				<TableCell
					key="controls"
					variant="head"
					align="right"
					style={{ width: 120 }}
					sx={{
						backgroundColor: "background.paper",
					}}
				>
					{columnsSortControl && (
						<div>
							{typesByID[typeSelected] &&
								typesByID[typeSelected].fields &&
								typesByID[typeSelected].fields.length > 0 && (
									<Tooltip title={t("columns")}>
										<Button
											id="basic-button"
											aria-controls={open ? "basic-menu" : undefined}
											aria-haspopup="true"
											aria-expanded={open ? "true" : undefined}
											onClick={() => {
												selectPopup({
													title: t("columns"),
													content: () => {
														let options = [];
														if (
															typeSelected &&
															typesByID[typeSelected] &&
															typesByID[typeSelected].fields
														) {
															options = typesByID[typeSelected].fields.map(
																(field) => {
																	return {
																		value: field.id,
																		label: field.label,
																	};
																}
															);
														}
														const form = {
															ondemand: false,
															def: [
																{
																	id: "columns",
																	label: t("columns"),
																	labelPosition: "none",
																	type: "sortable-select",
																	options: options,
																	default: listColumnsDef.map(
																		(item) => item.field
																	),
																},
															],
														};

														return (
															<FormBuilder
																definition={form}
																onChange={(field, value) => {
																	db.listColumns
																		.where("key")
																		.equals(iD + "-" + typeSelected)
																		.toArray()
																		.then((data) => {
																			db.listColumns
																				.where("key")
																				.equals(iD + "-" + typeSelected)
																				.delete()
																				.then(() => {
																					const mains = listColumnsDef.filter(
																						(item) => item.main
																					);
																					for (
																						let i = 0;
																						i < mains.length;
																						i++
																					) {
																						db.listColumns.add(mains[i]);
																					}
																					if (value && value.length > 0) {
																						for (
																							let i = 0;
																							i < value.length;
																							i++
																						) {
																							const found = data.find(
																								(item) =>
																									item.field === value[i]
																							);
																							if (!found) {
																								db.listColumns.add({
																									key: iD + "-" + typeSelected,
																									field: value[i],
																									label: options.find(
																										(item) =>
																											item.value === value[i]
																									).label,
																									sort: false,
																								});
																							} else {
																								db.listColumns.add({
																									key: iD + "-" + typeSelected,
																									field: value[i],
																									label: options.find(
																										(item) =>
																											item.value === value[i]
																									).label,
																									sort: found.sort,
																								});
																							}
																						}
																					}
																					db.listColumns
																						.where("key")
																						.equals(iD + "-" + typeSelected)
																						.toArray()
																						.then((data) => {
																							let columns = [];
																							for (
																								let i = 0;
																								i < data.length;
																								i++
																							) {
																								columns.push(data[i]);
																							}
																							setListColumnsDef(columns);
																						});
																				});
																		});
																}}
															/>
														);
													},
													btns: [
														{
															label: t("ok"),
															action: () => {
																selectPopup(null);
															},
														},
													],
												});
											}}
											style={{
												paddingLeft: "4px",
												paddingRight: "5px",
												display: "inline-flex",
											}}
										>
											<ViewWeekIcon style={{ cursor: "pointer" }} />
										</Button>
									</Tooltip>
								)}
						</div>
					)}
				</TableCell>
			</TableRow>
		);
	};

	return (
		<Paper className="list-table-container">
			<ListSearchEvent 
				virtuosoRef={virtuosoRef}
				sortedItems={sortedItems}
				onClick={onClick}
			/>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
				}}
			>
				<Box></Box>
				<Box
					className="list-table-tabs-container table"
					sx={{
						display:
							typesByID && Object.keys(typesByID).length > 1 ? "flex" : "none",
					}}
				>
					{typesByID &&
						Object.keys(typesByID).length > 1 &&
						Object.keys(typesByID)
							.sort((a, b) => {
								return typesByID[a].order - typesByID[b].order;
							})
							.map((type) => {
								let typeSelectedNumber = parseInt(typeSelected);
								let typeNumber = parseInt(type);
								return (
									<button
										className={`list-table-tabs ${
											typeSelectedNumber === typeNumber ? "selected" : ""
										}`}
										onClick={() => {
											return setTypeSelected(type);
										}}
									>
										{t(typesByID[type].name)}
									</button>
								);
							})}
						<button
							key="config"
							className={`list-table-tabs`}
							onClick={() => selectComponent("types")}
						>
							<Tooltip title={t("item-types")}>
								<CategoryIcon style={{ fontSize: "20px", marginTop: "-2px" }} />
							</Tooltip>
						</button>
				</Box>
				<Box></Box>
			</Box>
			<TableVirtuoso
				ref={virtuosoRef}
				overscan={100}
				className="list-table-table"
				data={sortedItems}
				components={VirtuosoTableComponents}
				fixedHeaderContent={hasHeader && fixedHeaderContent}
				itemContent={(index, item) => {
					return (
						<RowContent
							key={item.id}
							index={index}
							row={item}
							beforeDeleteItem={beforeDeleteItem}
							listColumnsDef={listColumnsDef}
							typeSelected={typeSelected}
							onDeleteItem={onDeleteItem}
							typesByID={typesByID}
							component={component}
							onAddCollectionItem={onAddCollectionItem}
						/>
					);
				}}
			/>
		</Paper>
	);
















}