import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../services/context";
import { IconButton, Menu, MenuItem } from '@mui/material';
import ListIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIcon from '@mui/icons-material/DragIndicator';
import { selectPopup } from "../../services/helper";
import FormBuilder from "../FormBuilder";
import Box from '@mui/material/Box';
import db from "../../services/db";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function MenuLists() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState(null);
  const [lists, setLists] = useState([]);
  const { t, i18n } = useTranslation();

  const { setItemListConfig, itemListConfig, selectComponent } = useContext(AppContext);

	const sendEventListChange = (list, deleteList = false) => {
		let event = new CustomEvent("menuListChange", {
			detail: {
				list: list,
				deleteList: deleteList,
			},
		});
		window.dispatchEvent(event);
	};

	useEffect(() => {
		const handleListChange = (event) => {
			let list = event.detail.list;
			let deleteList = event.detail.deleteList;
			setLists((prev) => {
				if (deleteList) {
					return prev.filter((element) => element.id !== list.id);
				} else {
					let newAutocomplete = [...prev];
					const index = newAutocomplete.findIndex(
						(element) => element.id === list.id
					);
					if (index === -1) {
						newAutocomplete.push(list);
					} else {
						newAutocomplete[index] = list;
					}
					return newAutocomplete;
				}
			});
		};

		window.addEventListener("listFieldChange", handleListChange);
		return () => {
			window.removeEventListener("listFieldChange", handleListChange);
		};
	}, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    db.lists.orderBy("order").toArray().then((data) => {
			data = data.filter((item) => !item.internal);
      setLists(data);
    });
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (data.id) {
      newEditList(t("edit-list"));
    } else {
      newEditList(t("new-list"));
    }
  }, [data]);

  const newEditList = function (title) {
    const fieldFormDefinitionInit = {
      ondemand: false,
      reference: true,
      def: [
        {
          id: "name",
          label: t("name"),
          type: "text",
          required: true,
          selectOnFocus: true,
          autoFocus: true,
        },
      ],
    };
    selectPopup({
			title: title,
			content: () => (
				<FormBuilder definition={fieldFormDefinitionInit} reference={data} />
			),
			btns: [
				{
					label: t("save"),
					action: () => {
						if (!data.id) {
							data.order = lists.length;
							db.lists.add(data).then((id) => {
								data.id = id;
								setLists([...lists, data]);
								sendEventListChange(data);
								selectPopup(null);
							});
						} else {
							db.lists.update(data.id, data).then(() => {
								setLists(
									lists.map((item) => {
										if (item.id === data.id) {
											return data;
										}
										return item;
									})
								);
								sendEventListChange(data);
								selectPopup(null);
							});
						}
					},
				},
				{
					label: t("cancel"),
					action: () => {
						selectPopup(null);
					},
					variant: "outlined",
				},
			],
		});
  };

	const onDragEnd = (result) => {
		if (!result.destination) {
			return;
		}

		const reorderedLists = Array.from(lists);
		const [removed] = reorderedLists.splice(result.source.index, 1);
		reorderedLists.splice(result.destination.index, 0, removed);

		setLists(reorderedLists);

		reorderedLists.forEach((list, index) => {
			db.lists.update(list.id, { order: index });
		});
	};

  return (
		<Box style={{ margin: "auto", display: "flex", flexDirection: "row-reverse", position:"relative"}} onMouseLeave={handleClose}>
			<IconButton
				aria-controls="simple-menu"
				aria-haspopup="true"
				onClick={handleClick}
				style={{ height: "100%" }}
				onMouseEnter={(event) => setAnchorEl(event.currentTarget)}
			>
				<ListIcon />
				
			</IconButton>
			<Menu
				id="simple-menu"
				anchorEl={anchorEl}
				keepMounted
				open={Boolean(anchorEl)}
				onClose={handleClose}
				onMouseLeave={handleClose}
				disablePortal // Desactiva el portal para que se renderice en el flujo del DOM
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}} 
				MenuListProps={{
					onMouseLeave: handleClose,
				}}
			>
				<MenuItem
					style={{
						borderBottom: lists.length ? "1px solid #e0e0e0" : "none",
					}}
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						setData({
							name: "",
							items: [],
						});
					}}
				>
					<AddIcon />
					{t("new-list")}
				</MenuItem>
				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId="list">
						{(provided) => (
							<div {...provided.droppableProps} ref={provided.innerRef}>
								{lists.map((list, index) => (
									<Draggable
										key={list.id}
										draggableId={list.id.toString()}
										index={index}
									>
										{(provided) => (
											<div
												ref={provided.innerRef}
												{...provided.draggableProps}
												{...provided.dragHandleProps}
											>
												<MenuItem>
													<Box
														style={{
															display: "flex",
															justifyContent: "space-between",
															minWidth: "380px",
														}}
													>
														<DragIcon style={{ cursor: "grab" }} />
														<Box
															style={{ cursor: "pointer", width: "100%" }}
															onClick={() => {
																setTimeout(() => {
																	setItemListConfig({
																		...itemListConfig,
																		listSelected: list,
																	});
																	// selectComponent("items");
																	// let event = new CustomEvent("changeListSelected", {
																	// 	detail: list,
																	// });
																	// window.dispatchEvent(event);
																}, 500);
																handleClose();
															}}
														>
															{list.name}
														</Box>
														<Box style={{ display: "flex", marginTop: "2px" }}>
															<Tooltip title={t("edit-list")}>
																<EditIcon
																	onClick={(e) => {
																		e.stopPropagation();
																		e.preventDefault();
																		db.lists.get(list.id).then((data) => {
																			setData(data);
																		});
																	}}
																/>
															</Tooltip>
															<Tooltip title={t("delete-list")}>
																<DeleteIcon
																	onClick={(e) => {
																		e.stopPropagation();
																		e.preventDefault();
																		selectPopup({
																			title: t("delete-list"),
																			content: () => (
																				<Box>
																					<p>{t("delete-list-confirm")}</p>
																				</Box>
																			),
																			btns: [
																				{
																					label: t("yes"),
																					action: () => {
																						selectPopup(null);
																						db.lists
																							.delete(list.id)
																							.then(() => {
																								setLists(
																									lists.filter(
																										(item) =>
																											item.id !== list.id
																									)
																								);
																								sendEventListChange(list, true);
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
															</Tooltip>
														</Box>
													</Box>
												</MenuItem>
											</div>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
				</DragDropContext>
				<MenuItem
					style={{
						borderTop: "1px solid #e0e0e0",
					}}
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
						selectComponent("lists");
					}}
				>
					<ListIcon style={{ marginRight: "2px", marginLeft: "-2px" }} />
					{t("list-list")}
				</MenuItem>
			</Menu>
		</Box>
	);
}





















export default MenuLists;