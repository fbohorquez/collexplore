import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import { TableVirtuoso } from "react-virtuoso";
import { useTranslation } from "react-i18next";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search"; 

import { Box, TextField } from "@mui/material";

import db from "../../services/db";
import { itemToString, getSelectedItemId } from "../../services/helper";

import ListItemsItem from "./ListItemsItem";

export default function ListItems({
	options = [],
	value = [],
	onChange,
	field,
	definition = null,
}) {
	const { t } = useTranslation();

	let list_length = value.length + 1;

	const getInitialItems = () => {
		return Array.from({ length: list_length }, (_, index) => ({
			id: `item-${index}`,
			index: index,
			value: value[index] || null,
			search: true,
		}));
	};

	const [items, setItems] = React.useState(getInitialItems());

	React.useEffect(() => {
		const itemsNew = getInitialItems();
		const has_new = itemsNew.length > items.length;
		setItems(itemsNew);
		if (has_new) {
			let index = itemsNew.findIndex((item) => item.value === null);
			if (index === -1) {
				index = itemsNew.length;
			}
			const originalIndex = index;
			if (index > 0) {
				index = Math.max(0, index - 3);
			}
			setTimeout(() => {
				virtuosoRef.current.scrollToIndex(index);
				if (items.length == 1 && items[0].value === null) {	
					setTimeout(() => {
						document
							.querySelector('tr[data-index="' + originalIndex + '"] input')
							?.focus();
					}, 50);
				}
			}, 10);
		}
	}, [value]);

	const [itemsCollection, setItemsCollection] = React.useState([]);

	const getItemsCollection = async () => {
		const items = (await db.items.toArray()).map((item) => {
			return { ...item, ...{ name: itemToString(item) } };
		});
		return items;
	}

	React.useEffect(() => {
		getItemsCollection().then((items) => {
			setItemsCollection(items);
		});
	}
	, []);

	const virtuosoRef = React.useRef(null);


	const onDragEnd = (result) => {
		const { source, destination } = result;
		if (!destination) {
			return;
		}
		if (source.index !== destination.index) {
			const newItems = Array.from(items);
			const [removed] = newItems.splice(source.index, 1);
			newItems.splice(destination.index, 0, removed);
			setItems(newItems);
			onChange(newItems.map((item) => item.value).filter((item) => item !== null));
		}
	};

	const [indexSearch, setIndexSearch] = React.useState("");
	const [allIndexSearch, setAllIndexSearch] = React.useState([]);

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<Box className="search-box">
				<TextField
					className="search"
					placeholder={t("search-in-list")}
					onChange={async (event) => {
						const search_txt = event.target.value.toLowerCase();
						const preparedItems = await Promise.all(items.map(async (item) => {
							if (item.value === null) {
								return null;
							}
							let value = item.value;
							if (typeof item.value === "number") {
								const itemObj = await db.items.get(item.value);
								if (itemObj && itemObj.name) {
									value = itemToString(itemObj);
								}
								else {
									value = "";
								}
							} else if (typeof item.value === "object") {
								value = itemToString(item.value);
							}
							return { ...item, searchValue: value?.toLowerCase() };
						}));

						// const index = preparedItems.findIndex(item => {
						// 	if (!item || !item.searchValue) return false;
						// 	return item.searchValue.includes(search_txt);
						// });

						const allIndex = preparedItems.map((item, index) => {
							if (!item || !item.searchValue) return -1;
							return item.searchValue.includes(search_txt) ? index : -1;
						});

						const index = allIndex.find((index) => index !== -1);


						if (index !== -1) {
							virtuosoRef.current.scrollToIndex(index);
							setIndexSearch(index);
							setAllIndexSearch(allIndex);
						}else {
							setIndexSearch("");
							setAllIndexSearch([]);
						}
					}}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							// document
							// 	.querySelector('tr[data-index="' + indexSearch + '"] input')
							// 	?.focus();
							// document
							// 	.querySelector('tr[data-index="' + indexSearch + '"] input')
							// 	?.select();
							if (allIndexSearch.length > 0) {
								const init_index = indexSearch;
								let index = allIndexSearch.find((index) => index > init_index && index !== -1);
								if (index === -1 || index === undefined) {
									index = allIndexSearch.find((index) => index !== -1);
								}
								if (index !== -1) {
									virtuosoRef.current.scrollToIndex(index);
									setIndexSearch(index);
								}
							}
						}
					}}
				/>
			</Box>
			<Droppable droppableId="droppable">
				{(provided) => (
					<div
						{...provided.droppableProps}
						ref={provided.innerRef}
						style={{ height: 400 }}
					>
						<TableVirtuoso
							data={items}
							ref={virtuosoRef}
							tabIndex={-1}
							initialTopMostItemIndex={items.findIndex(
								(item) => item.value === null
							)}
							totalCount={list_length}
							itemContent={(index, item) => (
								<Draggable
									key={item.id}
									draggableId={item.id}
									index={index}
									tabIndex={-1}
								>
									{(provided) => (
										<div
											ref={provided.innerRef}
											{...provided.draggableProps}
											{...provided.dragHandleProps}
											tabIndex={-1}
										>
											<td style={{ width: 50, verticalAlign: "middle" }}>
												<DragIndicatorIcon style={{ marginRight: 4 }} />
											</td>
											<td
												style={{
													width: "100%",
													position: "relative",
													padding: "60px 10px 60px 0px",
												}}
												key={item.id}
												className="list-item"
												onClick={(event) => {
													if (event.target.tagName === "TD") {
														const input = document.querySelector(
															'tr[data-index="' + index + '"] input'
														);
														if (input === document.activeElement) {
															input.blur();
														}
													}
												}}
											>
												<ListItemsItem
													options={itemsCollection}
													setOptions={setItemsCollection}
													value={item.value}
													items={items}
													index={index}
													listItems={virtuosoRef.current}
													onChange={(value, old_value) => {
														let newItems = Array.from(items);
														newItems[index].value = value;
														// setItems(newItems);
														onChange(
															newItems
																.map((item) => item.value)
																.filter((item) => item !== null)
														);
														if (value && !isNaN(parseInt(value))) {
															db.items.get(parseInt(value)).then((item) => {
																if (item) {
																	if (!item.fields) {
																		item.fields = {};
																	}
																	if (!item.fields.lists) {
																		item.fields.lists = [];
																	}
																	item.fields.lists.push(parseInt(getSelectedItemId()));
																	db.items.update(item.id, item);
																}
															});
														}
														if (old_value && !isNaN(parseInt(old_value))) {
															db.items.get(parseInt(old_value)).then((item) => {
																if (item) {
																	if (item.fields && item.fields.lists) {
																		item.fields.lists.splice(
																			item.fields.lists.indexOf(parseInt(getSelectedItemId())),
																			1
																		);
																		db.items.update(item.id, item);
																	}
																}
															});
														} 
													}}
													field={field}
													definition={definition}
												/>
											</td>
											<td>{item.description}</td>
										</div>
									)}
								</Draggable>
							)}
						/>
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
}


















