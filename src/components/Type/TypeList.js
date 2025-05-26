import React, { useContext, useState, useEffect } from "react";
import { Box, List, ListItem, ListItemText, Typography } from "@mui/material";
import { AppContext } from "../../services/context";
import db from "../../services/db";

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import Title from "../layout/Title";
import TitleButtons from "../layout/TitleButtons";

import { useTranslation } from "react-i18next";

import DeleteIcon from "@mui/icons-material/Delete";

import {
	selectDetail,	
	getSelectedItemId,
	selectPopup,
} from "../../services/helper";


function TypeListItem({
	item,
	component,
	setUpdateComponent,
	selectDetail,
	selectComponent,
	optionBefore = {},
	optionAfter	= {},
	dragdrop=false,
	
}) {
	const [itemData, setItemData] = useState(item);

	useEffect(() => {
		setItemData(item);
	}, [item]);

	useEffect(() => {
		const handleChangeRow = (event) => {
			const { row: newRow } = event.detail;
			if (parseInt(newRow.id) !== parseInt(itemData.id)) {
				return;
			}
			db[component].get(newRow.id).then((data) => {
				setItemData(data);
			});
		};

		window.addEventListener("changeRow", handleChangeRow);

		return () => {
			window.removeEventListener("changeRow", handleChangeRow);
		};
	}, []);

	const { t } = useTranslation();

	const processOptions = (options) => {
		return (
			options &&
			Object.keys(options).map((key, index) => {
				let classes = "type-list-item-option ";
				if (options[key] && options[key].html) {
					classes += "active";
					return (
						<Box
							key={index}
							className={classes}
							style={{ textAlign: "center" }}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								if(options[key].action){
									options[key].action(itemData);
								}
							}}
						>
							{options[key].html}
						</Box>
					);
				}else {
					if (itemData[key]) {
						classes += "active";
					}
					return (
						<Box
							key={index}
							className={classes}
							style={{ textAlign: "center" }}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								db[component]
									.update(itemData.id, {
										[key]: !itemData[key],
									})
									.then(() => {
										setUpdateComponent((old) => !old);
									});
							}}
						>
							{options[key]}
						</Box>
					);
				}
			})
		);
	};


	return (
		<ListItem button onClick={() => selectDetail(component, itemData)}>
			{dragdrop && (
					<DragIndicatorIcon style={{ cursor: "grab", marginRight: "10px" }} />
			)}
			<ListItemText primary={t(itemData.name)} />
			{processOptions(optionBefore)}
			{itemData.deleteBtn !== undefined &&
			itemData.deleteBtn === false ? null : (
				<Box className="type-list-delete-btn">
					<DeleteIcon
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							selectPopup({
								title: t("delete-" + component),
								content: () => (
									<Typography>
										{t("delete-" + component + "-confirm")}
									</Typography>
								),
								btns: [
									{
										label: t("yes"),
										action: () => {
											selectPopup(null);
											if (
												parseInt(getSelectedItemId()) === parseInt(itemData.id)
											) {
												selectComponent(component);
											}
											db[component].delete(itemData.id).then(() => {
												setUpdateComponent((old) => !old);
											});
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
					/>
				</Box>
			)}
			{processOptions(optionAfter)}
		</ListItem>
	);
}


function TypeList({
	// props
	component,
	optionBefore = {},
	optionAfter = {},
	dragdrop = false,
	female = false,
	set_title = null,
	filterFunction = null,
	back_action = null,
}) {
	const [items, setItems] = useState([]);


	const { t } = useTranslation();

	const { updateComponent, setUpdateComponent, selectComponent } =
		useContext(AppContext);

	const defaultDataSet = () => {
		db[component].toArray().then((data) => {
			if (filterFunction) {
				data = data.filter(filterFunction);
			}
			setItems(data);
		});
	};

	useEffect(() => {
		window.addEventListener("refresh-list-data", defaultDataSet);
		return () => {
			window.removeEventListener("refresh-list-data", defaultDataSet);
		};
	});

	useEffect(() => {
		if (dragdrop) {
			db[component]
				// .orderBy("order")
				.toArray()
				.then((data) => {
					data.sort((a, b) => (a.order || 0) - (b.order || 0));
					data.forEach((item, index) => {
						if (item.tabs) {
							item.tabs.forEach((tab) => {
								if (tab.groups) {
									tab.groups.forEach((group) => {
										if (group.layout) {
											group.layout.forEach((layout) => {
												if (layout.x === null) {
													layout.x = 0;
												
												}
												if (layout.y === null) {
													layout.y = 0;
												}
											});
										}
									});
								}
							});
						}
					});

					if (filterFunction) {
						data = data.filter(filterFunction);
					}
					setItems(data);
				});
		} else {
			defaultDataSet();
		}
	}, [updateComponent]);

	const btns = [
		{
			label: female ? t("new/a") : t("new"),
			action: () => {
				selectDetail(component, "add");
			},
			key: "alt_n",
		},
	];

	const onDragEnd = (result) => {
		if (!result.destination) return;

		const newItems = Array.from(items);
		const [reorderedItem] = newItems.splice(result.source.index, 1);
		newItems.splice(result.destination.index, 0, reorderedItem);
		if (filterFunction) {
			newItems = newItems.filter(filterFunction);
		}
		setItems(newItems);

		const updateOrder = newItems.map((item, index) => {
			return db[component].update(item.id, { order: index });
		});
	};
	return (
		<Box className="type-list">
			<Title
				title={set_title || t("item-" + component)}
				after={<TitleButtons btns={btns} />}
				back={true}
				back_action={back_action || (() => selectComponent("items"))}
			/>
			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable droppableId="droppable-list">
					{(provided) => (
						<List ref={provided.innerRef} {...provided.droppableProps}>
							{items.map((item, index) => (
								<Draggable
									key={item.id}
									draggableId={item.id.toString()}
									index={index}
									isDragDisabled={!dragdrop}
								>
									{(provided) => (
										<div
											className="type-list-item"
											ref={provided.innerRef}
											{...provided.draggableProps}
											{...provided.dragHandleProps}
										>
											<TypeListItem
												item={item}
												component={component}
												setUpdateComponent={setUpdateComponent}
												selectDetail={selectDetail}
												selectComponent={selectComponent}
												optionBefore={optionBefore}
												optionAfter={optionAfter}
												dragdrop={dragdrop}
											/>
										</div>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</List>
					)}
				</Droppable>
			</DragDropContext>
		</Box>
	);
}

export default TypeList;



























































