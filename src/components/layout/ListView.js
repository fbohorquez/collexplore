import React, { useState, useEffect, useReducer } from "react";
import { Box, Tooltip, Menu, MenuItem, Button } from "@mui/material";
import { Virtuoso } from "react-virtuoso";

import EditIcon from "@mui/icons-material/Mode";
import CollectionAddIcon from "@mui/icons-material/PlaylistAdd";
import CollectionAddedIcon from "@mui/icons-material/PlaylistAddCheck";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";

import db from "../../services/db";

import flags from "../../locales/flags";

import {
	selectDetail,
	refreshCacheItemsType,
	changeRow,
} from "../../services/helper";
import { saveInCollection, handleAddCollection } from "../../services/list_helper";

import { useTranslation } from "react-i18next";

const rowReducer = (state, action) => {
	switch (action.type) {
		case "UPDATE_ROW":
			if (
				action.payload &&
				state.id &&
				action.payload.id &&
				action.payload.id === state.id
			) {
				return { ...state, ...action.payload };
			}
			else if (
				action.payload &&
				state.index &&
				action.payload.index &&
				action.payload.index === state.index
			) {
				return { ...state, ...action.payload };
			}
			return state;
		default:
			return state;
	}
};

const RowContent = React.memo(({ item, index, list, types, onUpdateRow }) => {
	const { t } = useTranslation();
	item.index = index;
	const [row, dispatch] = useReducer(rowReducer, item);

	const [anchorEl, setAnchorEl] = useState(null);
	const openMenu = Boolean(anchorEl);

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	useEffect(() => {
		const fetchData = async () => {
			if (item.in_collection) {
				const data = await db.items.get(item.id);
				dispatch({ type: "UPDATE_ROW", payload: data });
			} else {
				dispatch({ type: "UPDATE_ROW", payload: item });
			}
		};
		fetchData();

		const handleChangeRow = (event) => {
			const { row: newRow } = event.detail;
			if (newRow.in_collection || newRow.id) {
				db.items.get(newRow.id).then((data) => {
					data = { ...data, ...newRow };
					dispatch({ type: "UPDATE_ROW", payload: data });
					if (index === data.index) {
						onUpdateRow(index, data);
					}
				});
			} else {
				dispatch({ type: "UPDATE_ROW", payload: newRow });
				if (index === newRow.index) {
					onUpdateRow(index, newRow);
				}
			}
		};

		const handleDeleteRow = (event) => {
			const { row } = event.detail;
			row.deleted = true;
			dispatch({ type: "UPDATE_ROW", payload: row });
			onUpdateRow(index, row);
		};

		window.addEventListener("changeRow", handleChangeRow);
		window.addEventListener("deleteRow", handleDeleteRow);

		return () => {
			window.removeEventListener("changeRow", handleChangeRow);
			window.removeEventListener("deleteRow", handleDeleteRow);
		};
	}, [item.id]);

	if (row.deleted) return null;

	const renderFields = () => {
		let type = row.type_in_line;
		let renderFields = [];
		if (type && type.fields) {
			for (let i = 0; i < type.fields.length; i++) {
				if (
					["text", "entity", "country", "number", "date"].includes(
						type.fields[i].type
					)
				) {
					let field = { label: type.fields[i].label };
					if (type.fields[i].type === "entity") {
						if (!row.cache[type.fields[i].id]) continue;
						field.value = row.cache[type.fields[i].id]
							.map((v) => v.name)
							.join(", ");
					} else if (type.fields[i].type === "country") {
						if (!row.fields[type.fields[i].id]) continue;
						field.value = row.fields[type.fields[i].id]
							.map((v) => `<img class="flag" src="${flags[v]}"/>`)
							.join(" ");
					} else {
						if (!row.fields[type.fields[i].id]) continue;
						field.value = row.fields[type.fields[i].id];
					}
					renderFields.push(field);
				}
			}
		}
		return renderFields;
	};


	return (
		<Box className="list-item">
			{row.type_in_line?.fields.some((f) => f.type === "image" && f.main) &&
				row.fields[
					row.type_in_line.fields.find((f) => f.type === "image" && f.main).id
				] && (
					<div className="list-item-image-container">
						<img
							className="list-item-image"
							src={URL.createObjectURL(
								row.fields[
									row.type_in_line.fields.find(
										(f) => f.type === "image" && f.main
									).id
								]
							)}
							alt={row.fields.name}
						/>
					</div>
				)}
			<Box className="list-item-content">
				<Box className="list-item-name">{row.name}</Box>
				<Box className="list-item-fields">
					{renderFields().map((field) => (
						<Box key={field.label} className="list-item-field">
							<Box className="list-item-field-label">{field.label}</Box>
							<Box
								className="list-item-field-value"
								dangerouslySetInnerHTML={{ __html: field.value }}
							/>
						</Box>
					))}
				</Box>
			</Box>
			<Box className="list-item-type">{row.type_in_line?.name}</Box>
			<Box className="list-item-actions">
				<Tooltip title={t("edit")}>
					<EditIcon
						className="list-item-action"
						onClick={() => {
							if (!row.in_collection && !row.id) {
								row.saveOverride = function () {
									let clear_item = { ...this };
									const originalItem = { ...this };
									delete clear_item.saveOverride;
									delete clear_item.in_collection;
									delete clear_item.type_in_line;

									let clear_list = { ...list };
									delete clear_list.class_name;
									clear_list.fields.items[index - 1] = clear_item;

									db.lists.update(clear_list.id, clear_list).then(() => {
										changeRow(originalItem);
									});
								};
							}
							selectDetail("items", row);
						}}
					/>
				</Tooltip>
				{row.in_collection || row.id ? (
					<Tooltip title={t("in-collection")}>
						<CollectionAddedIcon
							style={{ marginLeft: "10px", width: "18px", height: "18px" }}
						/>
					</Tooltip>
				) : (
					<Tooltip title={t("add-to-collection")}>
						<CollectionAddIcon
							style={{
								marginLeft: "10px",
								width: "18px",
								height: "18px",
								backgroundColor: "#1d3e5b",
								color: "#fff",
								borderRadius: "50%",
								padding: "0 2px",
							}}
							onClick={(e) => {
								saveInCollection(
									e,
									(id) => {
										let clear_list = { ...list };
										delete clear_list.class_name;
										clear_list.fields.items[index - 1] = id;
										db.lists.update(clear_list.id, clear_list).then(() => {
											db.items.get(id).then((data) => {
												data.type_in_line = types.find(
													(t) => t.id === data.type
												);
												data.in_collection = true;
												changeRow(data);
											});
										});
									},
									null, //handleMenuClick,
									row,
									null, //setOptions,
									null, //options,
									null //setItemUndefinedSaveCollection
								);
							}}
						/>
					</Tooltip>
				)}
				<Menu
					id="simple-menu"
					anchorEl={anchorEl}
					keepMounted
					open={Boolean(anchorEl)}
					onClose={handleMenuClose}
				>
					{types.map((type, index) => (
						<MenuItem key={index} onClick={() => handleAddCollection(type)}>
							{type.name}
						</MenuItem>
					))}
				</Menu>
			</Box>
		</Box>
	);
});


const ListView = ({items, list}) => {
	refreshCacheItemsType();
	if (list) {
		list.class_name = 'list-header';
		if (items.length === 0 || items[0].class_name !== 'list-header') {
			items.unshift(list);
		}
	}

	const { t } = useTranslation();

	const [types, setTypes] = useState([]);
	const [updatedItems, setUpdatedItems] = useState(items);
	
	useEffect(() => {
		setUpdatedItems(items);
	}, [items]);

	useEffect(() => {
		db.types.toArray().then((data) => {
			setTypes(data);
		});
	}, []);

	const handleUpdateRow = React.useCallback((index, updatedRow) => {
		setUpdatedItems((prevItems) =>
			prevItems.map((item, i) => (i === index ? updatedRow : item))
		);
	}, []);

	

	return (
		<Box className="list-view">
			<Virtuoso
				style={{ height: "calc(100vh - 68px)", width: "100%" }}
				data={updatedItems}
				itemContent={(index, item) => {
					if (index === 0 && item.class_name === "list-header") {
						return (
							<Box className="list-header">
								{item &&
									item.fields &&
									item.fields.image &&
									item.fields.image !== "" && (
										<img
											className="list-image"
											src={URL.createObjectURL(item.fields.image)}
											alt={item.fields.name}
										/>
									)}
								{item &&
									item.fields &&
									item.fields.description &&
									item.fields.description !== "" && (
										<Box
											className="list-description"
											dangerouslySetInnerHTML={{
												__html: item.fields.description,
											}}
										/>
									)}
							</Box>
						);
					}
					if (item.list_item_type === "textrich") {
						return (
							<Box
								key={item.id}
								style={{ padding: "10px", borderBottom: "1px solid #ccc", borderTop: "1px solid #ccc" }}
								className="list-item-container"
								dangerouslySetInnerHTML={{ __html: item.value }}
							/>
						);
					}
					if (item.list_item_type === "gallery") {
						let gallery_pos = 0;
						return (
							<Box
								key={item.id}
								style={{
									position: "relative",
									padding: "0",
									borderBottom: "1px solid #ccc",
									borderTop: "1px solid #ccc",
									overflowX: "hidden",
									width: "100%",
									backgroundColor: "black",
								}}
								className="list-item-container"
							>
								<Box
									id={`gallery-${index}`}
									className="gallery-item"
									style={{
										display: "flex",
										flexWrap: "nowrap",
										width: "100%",
										height: item.height ? item.height + "px" : "320px",
										backgroundColor: "black",
									}}
								>
									{item.value.map((image, index) => (
										<img
											key={index}
											src={URL.createObjectURL(image)}
											alt={item.name}
											style={{
												minWidth: "100%",
												height: "auto",
												objectFit: "contain",
												backgroundColor: "white",
											}}
										/>
									))}
								</Box>
								{item.value.length > 1 && (
									<Button
										style={{ position: "absolute", top: "50%", left: "10px" }}
										onClick={() => {
											gallery_pos = gallery_pos + 100;
											if (gallery_pos > 0) {
												gallery_pos = (item.value.length - 1) * -100;
											}
											document.getElementById(
												`gallery-${index}`
											).style.transform = `translateX(${gallery_pos}%)`;
										}}
									>
										<NavigateBeforeIcon />
									</Button>
								)}
								{item.value.length > 1 && (
									<Button
										style={{ position: "absolute", top: "50%", right: "10px" }}
										onClick={() => {
											gallery_pos = gallery_pos - 100;
											const max_pos = (item.value.length - 1) * -100;
											if (gallery_pos < max_pos) {
												gallery_pos = 0;
											}
											document.getElementById(
												`gallery-${index}`
											).style.transform = `translateX(${gallery_pos}%)`;
										}}
									>
										<NavigateNextIcon />
									</Button>
								)}
							</Box>
						);
					}
					if (item.type_in_line) {
						return (
							<RowContent
								item={item}
								index={index}
								list={list}
								types={types}
								onUpdateRow={handleUpdateRow}
							/>
						);
					}
					return (
						<div
							key={item.id}
							style={{ padding: "10px", borderBottom: "1px solid #ccc" }}
							className="list-item-container"
						>
							{item.name}
						</div>
					);
				}}
			/>
		</Box>
	);
};

export default ListView;
































































