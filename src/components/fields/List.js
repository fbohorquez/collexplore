import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../../services/context";
import { Chip } from "@mui/material";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Box, Typography, Tooltip, IconButton, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Mode";
import db from "../../services/db";
import FormBuilder from "../FormBuilder";
import { selectPopup, changeRow } from "../../services/helper";

import { VariableSizeList } from "react-window";
import { useTheme, styled } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Dexie from "dexie";

import Detail from "./../layout/Detail";

import { useTranslation } from "react-i18next";

function useResetCache(data) {
	const ref = React.useRef(null);
	React.useEffect(() => {
		if (ref.current != null) {
			ref.current.resetAfterIndex(0, true);
		}
	}, [data]);
	return ref;
}



const LISTBOX_PADDING = 0; // px

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef((props, ref) => {
	const outerProps = React.useContext(OuterElementContext);
	return <div ref={ref} {...props} {...outerProps} />;
});


function List({ options = [], value = [], onChange, field, definition=null }) {
	const [autocomplete, setAutocomplete] = useState(options);
	const [data, setData] = useState(null);
	const { setListSelected } = useContext(AppContext);

	const sendEventListChange = (list, deleteList = false) => {
		let event = new CustomEvent("listFieldChange", {
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
			setAutocomplete((prev) => {
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
			setValues((currentValues) => {
				if (currentValues instanceof Array) {
					if (deleteList) {
						return currentValues.filter((value) => value !== list.id);
					}
				} else {
					if (deleteList) {
						return [];
					}
				}
				return currentValues;
			});
		};

		window.addEventListener("menuListChange", handleListChange);
		return () => {
			window.removeEventListener("menuListChange", handleListChange);
		};
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
							data.order = autocomplete.length;
							db.lists.add(data).then((id) => {
								data.id = id;
								let newAutocomplete = [...autocomplete];
								const index = newAutocomplete.findIndex(
									(element) => element.name > data.name
								);
								if (index === -1) {
									newAutocomplete.push(data);
								} else {
									newAutocomplete.splice(index, 0, data);
								}
								newAutocomplete.sort((a, b) =>
									a.name.toLowerCase().localeCompare(b.name.toLowerCase())
								);
								setAutocomplete(newAutocomplete);
								if (field.multiple) {
									setValues([...values, data.id]);
									onChange([...values, data.id], values);
								} else {
									setValues(data.id);
									onChange(data.id);
								}
								if (!data.internal) {
									sendEventListChange(data);
								}
								selectPopup(null);
							});

						} else {
							db.lists.update(data.id, data).then(() => {
								if (!data.internal) {
									sendEventListChange(data);
								}
								setAutocomplete(
									autocomplete.map((item) => {
										if (item.id === data.id) {
											return data;
										}
										return item;
									}).sort((a, b) =>
										a.name.toLowerCase().localeCompare(b.name.toLowerCase())
									)
								);
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

  field.multiple = true;

	useEffect(() => { // Load lists data from the database for the autocomplete and set the initial value
		db.lists
			.toArray()
			.then((data) => {
				data.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
				
				if (field.fields && Object.keys(field.fields).length > 0) {
					let data_new = [];
					for (let i = 0; i < data.length; i++) {
							data_new.push(data[i]);
					}
					setAutocomplete(data_new);
				} else {
					setAutocomplete(data);
				}
			})
			.catch((error) => {
				console.error(error);
				setAutocomplete([]);
			});
	}, [field]);

	useEffect(() => {
		const fecthLists = async (root) => {
			try {
				let id = root.id;
				if ((id + "").indexOf("lists-") === 0) {
					id = parseInt(id.replace("lists-", ""));
				}
				const item = await db[root.document].get(id);
				if (item && item.fields && item.fields.lists) {
					setValues(item.fields.lists);
				}else {
					if (field.multiple) {
						setValues([...value]);
					} else {
						setValues(value);
					}		
				}
			} catch (error) {
				console.error(error);
			}	
		};


		if (definition && definition.root && definition.root.id && definition.root.document) {
			fecthLists(definition.root);
		}else {
			if (field.multiple) {
				setValues([...value]);
			} else {
				setValues(value);
			}
		}
	}, [value]);

	let newValue = null;
	if (field.multiple) {
		if (!(value instanceof Array)) {
			value = [value];
		}
		newValue = [...value];
	} else {
		if (value instanceof Array && value.length > 0) {
			value = value[0];
		} else if (value instanceof Array && value.length === 0) {
			value = null;
		}
		newValue = value;
	}

	const [values, setValues] = useState(newValue);
	const [internalValues, setInternalValues] = useState([]);
	const [notInternalValues, setNotInternalValues] = useState([]);
	const [inputValue, setInputValue] = useState("");

	const { t } = useTranslation();

	const handleEdit = (event, item) => {
		event.stopPropagation();
		event.preventDefault();
		db.lists.get(item.id).then((data) => {
			setData(data);
			setAutocomplete((currentAutocomplete) => {
				const index = currentAutocomplete.findIndex(
					(element) => element.id === item.id
				);
				if (index !== -1) {
					currentAutocomplete[index] = data;
				}
				return currentAutocomplete;
			});
		});
	};

	const handleAdd = (event, internal=false) => {
		event.stopPropagation();
		event.preventDefault();
		setData({
			name: "",
			items: [],
			internal: internal,
		});
		return;
	};

	const handleClick = async (event, item, field) => {
		if (field.multiple) {
			setValues((currentValues) => {
				if (currentValues.indexOf(item.id) === -1) {
					return [...currentValues, item.id];
				}
				else {
					return currentValues.filter((value) => value !== item.id);
				}
			});
			if(values.indexOf(item.id) === -1) {
				let definitionRoots = [definition.root];
				if (definition.root.fields && Array.isArray(definition.root.fields)) {
					definitionRoots = definition.root.fields;
				}
				for (let i = 0; i < definitionRoots.length; i++) {
					let definitionRoot = definitionRoots[i];
					if (
						(definitionRoot &&
						definitionRoot.id &&
						typeof definitionRoot.id === "string" &&
						definitionRoot.id.includes("lists-tmp-")) || !definitionRoot.id
					) {
						let itemCP = { ...definitionRoot };
						delete itemCP.id;
						itemCP.document = "lists-items";
						let id = await db["lists-items"].add(itemCP);
						let value = item.id;
						let list =  await db.lists.get(value);
						if (list.items) {
							list.items.push("lists-" + id);
						} else {
							list.items = ["lists-" + id];
						}
						await db.lists.update(value, list);
					}
				}
				onChange([...values, item.id], values);
			}else {
				onChange(values.filter((value) => value !== item.id), values);
			}
		} else {
			setValues(item.id);
			onChange(item.id);
		}
		if (autoCompleteRef.current.querySelector('button[title="Close"]')) {
			autoCompleteRef.current.querySelector('button[title="Close"]').click();
		}
		if (autoCompleteRefInternal.current.querySelector('button[title="Close"]')) {
			autoCompleteRefInternal.current.querySelector('button[title="Close"]').click();
		}
	};

	const handleTagClick = (event, item) => {
		event.stopPropagation();
		event.preventDefault();
		setListSelected(item);
	};

	const ListboxComponent = React.forwardRef(function ListboxComponent(
		props,
		ref
	) {
		const { children, ...other } = props;

		const itemData = children;

		const theme = useTheme();
		const smUp = useMediaQuery(theme.breakpoints.up("sm"), {
			noSsr: true,
		});
		const itemCount = itemData.length;
		const itemSize = smUp ? 36 : 48;

		const getChildSize = (child) => {
			if (child.hasOwnProperty("group")) {
				return 48;
			}

			return itemSize;
		};

		const getHeight = () => {
			if (itemCount > 8) {
				return 8 * itemSize;
			}
			return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
		};

		const gridRef = useResetCache(itemCount);

		return (
			<div ref={ref}>
				<OuterElementContext.Provider value={other}>
					<VariableSizeList
						itemData={itemData}
						height={getHeight() + 2 * LISTBOX_PADDING}
						width="100%"
						ref={gridRef}
						outerElementType={OuterElementType}
						innerElementType="ul"
						itemSize={(index) => getChildSize(itemData[index])}
						overscanCount={5}
						itemCount={itemCount}
					>
						{RenderRow}
					</VariableSizeList>
				</OuterElementContext.Provider>
			</div>
		);
	});

	const RenderRow = (props) => {
		const { data, index } = props;
		let item = data[index][1];

		const getValueClass = () => {
			let classNames = "";
			if (values instanceof Array) {
				if (values.indexOf(item.id) !== -1) {
					classNames += "autocomplete-lists-selected ";
				}
			} else {
				if (values === item.id) {
					classNames += "autocomplete-lists-selected ";
				}
			}
			return classNames;
		};

		return (
			<li
				{...props}
				data-id={item.id}
				className={`input-tags-item ${getValueClass()}`}
				onClick={(event) => {
					handleClick(event, item, field);
				}}
			>
				{item.name}
				<IconButton style={{ marginLeft: "auto" }} size="small">
					<Tooltip title={t("edit-list")}>
						<EditIcon
							fontSize="small"
							onClick={(event) => handleEdit(event, item)}
						/>
					</Tooltip>
				</IconButton>
				<IconButton size="small">
					<Tooltip title={t("delete-list")}>
						<DeleteIcon
							fontSize="small"
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
												db.lists.delete(item.id).then(() => {
													setAutocomplete(autocomplete.filter((auto) => auto.id !== item.id));
													setValues((currentValues) => {
														if (currentValues instanceof Array) {
															return currentValues.filter((value) => value !== item.id);
														}
														return [];
													});
													sendEventListChange(item, true);
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
				</IconButton>
			</li>
		);
	}

	const autoCompleteRef = React.useRef(null);
	const autoCompleteRefInternal = React.useRef(null);


	return (
		<Box>
			<Box>
				<Typography variant="subtitle1">{t("main-lists")}</Typography>
				<Button
					className="input-list-add-new add-new"
					variant="outlined"
					onClick={(event) => handleAdd(event, false)}
					tabIndex={-1}
					style={{ transform: "translateY(32px)" }}
				>
					{t("new/a")}
				</Button>
				<Autocomplete
					multiple={true}
					freeSolo={false}
					renderTags={(value, getTagProps) =>
						value.map((option, index) => {
							const item = autocomplete.find(
								(element) => element.id === option
							);
							return (
								<Chip
									label={item ? item.name : ""}
									{...getTagProps({ index })}
									onClick={(event) => handleTagClick(event, item)}
								/>
							);
						})
					}
					options={
						autocomplete
							.filter((element) => !element.internal)
							.map((option) => option.id) || []
					}
					value={
						(values &&
							values.filter((value) =>
								autocomplete.find(
									(element) => element.id === value && !element.internal
								)
							)) ||
						[]
					}
					onChange={(event, newValue) => {
						const old_value = values;
						setNotInternalValues(newValue);
						const new_value = [...newValue, ...internalValues];
						setValues(new_value);
						onChange(new_value, old_value);
					}}
					getOptionLabel={(option) => {
						let item = autocomplete.find((element) => element.id === option);
						if (item) {
							return item.name;
						}
						return "";
					}}
					inputValue={inputValue}
					onInputChange={(event, newInputValue) => {
						setInputValue(newInputValue);
					}}
					renderInput={(params) => (
						<TextField
							ref={autoCompleteRef}
							{...params}
							placeholder={t("add-tags")}
							onKeyDown={(event) => {
								if (
									["Enter", "Escape", "ArrowDown", "ArrowUp"].indexOf(
										event.key
									) !== -1
								) {
									event.preventDefault();
									event.stopPropagation();
								}
								if (event.key === "Enter") {
									let index = document
										.querySelector(
											".MuiAutocomplete-listbox li.autocomplete-lists-hover"
										)
										?.getAttribute("index");
									if (index !== undefined && !isNaN(index)) {
										let item_id = document
											.querySelector(
												".MuiAutocomplete-listbox li[index='" + index + "']"
											)
											?.getAttribute("data-id");
										item_id = parseInt(item_id);
										if (item_id) {
											let item = autocomplete.find(
												(element) => element.id === item_id
											);
											if (item) {
												handleClick(event, item, field);
											}
										}
										if (
											autoCompleteRef.current.querySelector(
												'button[title="Close"]'
											)
										) {
											autoCompleteRef.current
												.querySelector('button[title="Close"]')
												.click();
										}
									} else {
										let value = inputValue.trim();
										if (value === "") {
											return;
										}
										let most_new = { name: value, type: 1 }; //Menu <--- TODO
										most_new.fields = field.fields || {};
										db.lists.add(most_new).then((id) => {
											most_new.id = id;
											let newAutocomplete = [...autocomplete];
											const index = newAutocomplete.findIndex(
												(element) => element.name > most_new.name
											);
											if (index === -1) {
												newAutocomplete.push(most_new);
											} else {
												newAutocomplete.splice(index, 0, most_new);
											}
											setAutocomplete(newAutocomplete);
											if (field.multiple) {
												setValues([...values, id]);
												onChange([...values, id]);
											} else {
												setValues(id);
												onChange(id);
											}
										});
									}
								} else if (event.key === "Escape") {
									event.target.blur();
								} else if (
									event.key === "ArrowDown" ||
									event.key === "ArrowUp"
								) {
									if (
										autoCompleteRef.current.querySelector(
											'button[title="Open"]'
										)
									) {
										autoCompleteRef.current
											.querySelector('button[title="Open"]')
											.click();
									}

									let index = document
										.querySelector(
											".MuiAutocomplete-listbox li.autocomplete-lists-hover"
										)
										?.getAttribute("index");
									index = parseInt(index);
									if (event.key === "ArrowDown") {
										if (index === undefined || isNaN(index)) {
											index = -1;
										}
										if (index < autocomplete.length - 1) {
											index++;
										}
									} else if (event.key === "ArrowUp") {
										if (index === undefined || isNaN(index)) {
											index = autocomplete.length;
										}
										if (index > 0) {
											index--;
										}
									}
									document
										.querySelectorAll(".MuiAutocomplete-listbox li")
										.forEach((element) => {
											element.classList.remove("autocomplete-lists-hover");
										});
									document
										.querySelectorAll(
											".MuiAutocomplete-listbox li[index='" + index + "']"
										)
										.forEach((element) => {
											element.classList.add("autocomplete-lists-hover");
										});
									let element = document.querySelector(
										".MuiAutocomplete-listbox li[index='" + index + "']"
									);
									if (element) {
										element.scrollIntoView({ block: "nearest" });
									}
								}
							}}
						/>
					)}
					ListboxComponent={ListboxComponent}
					renderOption={(props, option, state) => [
						props,
						autocomplete.find((element) => element.id === option),
						state.index,
					]}
				/>
			</Box>
			<Box style={{ marginTop: "32px", position: "relative" }}>
				<Typography variant="subtitle1">{t("internal-lists")}</Typography>
				<Button
					className="input-list-add-new add-new internal"
					variant="outlined"
					onClick={(event) => handleAdd(event, true)}
					tabIndex={-1}
					style={{ transform: "translateY(0px)" }}
				>
					{t("new/a")}
				</Button>
				<Autocomplete
					renderTags={(value, getTagProps) =>
						value.map((option, index) => {
							const item = autocomplete.find(
								(element) => element.id === option
							);
							return (
								<Chip
									label={item ? item.name : ""}
									{...getTagProps({ index })}
									onClick={(event) => handleTagClick(event, item)}
								/>
							);
						})
					}
					multiple={true}
					freeSolo={false}
					options={
						autocomplete
							.filter((element) => element.internal)
							.map((option) => option.id) || []
					}
					value={
						(values &&
							values.filter((value) =>
								autocomplete.find(
									(element) => element.id === value && element.internal
								)
							)) ||
						[]
					}
					onChange={(event, newValue) => {
						const old_value = values;
						setInternalValues(newValue);
						const new_value = [...newValue, ...notInternalValues];
						setValues(new_value);
						onChange(new_value, old_value);
					}}
					getOptionLabel={(option) => {
						let item = autocomplete.find((element) => element.id === option);
						if (item) {
							return item.name;
						}
						return "";
					}}
					inputValue={inputValue}
					onInputChange={(event, newInputValue) => {
						setInputValue(newInputValue);
					}}
					renderInput={(params) => (
						<TextField
							ref={autoCompleteRefInternal}
							{...params}
							placeholder={t("add-tags")}
							onKeyDown={(event) => {
								if (
									["Enter", "Escape", "ArrowDown", "ArrowUp"].indexOf(
										event.key
									) !== -1
								) {
									event.preventDefault();
									event.stopPropagation();
								}
								if (event.key === "Enter") {
									let index = document
										.querySelector(
											".MuiAutocomplete-listbox li.autocomplete-lists-hover"
										)
										?.getAttribute("index");
									if (index !== undefined && !isNaN(index)) {
										let item_id = document
											.querySelector(
												".MuiAutocomplete-listbox li[index='" + index + "']"
											)
											?.getAttribute("data-id");
										item_id = parseInt(item_id);
										if (item_id) {
											let item = autocomplete.find(
												(element) => element.id === item_id
											);
											if (item) {
												handleClick(event, item, field);
											}
										}
										if (
											autoCompleteRefInternal.current.querySelector(
												'button[title="Close"]'
											)
										) {
											autoCompleteRefInternal.current
												.querySelector('button[title="Close"]')
												.click();
										}
									} else {
										let value = inputValue.trim();
										if (value === "") {
											return;
										}
										let most_new = { name: value, type: 1 }; //Menu <--- TODO
										most_new.fields = field.fields || {};
										db.lists.add(most_new).then((id) => {
											most_new.id = id;
											let newAutocomplete = [...autocomplete];
											const index = newAutocomplete.findIndex(
												(element) => element.name > most_new.name
											);
											if (index === -1) {
												newAutocomplete.push(most_new);
											} else {
												newAutocomplete.splice(index, 0, most_new);
											}
											setAutocomplete(newAutocomplete);
											if (field.multiple) {
												setValues([...values, id]);
												onChange([...values, id]);
											} else {
												setValues(id);
												onChange(id);
											}
										});
									}
								} else if (event.key === "Escape") {
									event.target.blur();
								} else if (
									event.key === "ArrowDown" ||
									event.key === "ArrowUp"
								) {
									if (
										autoCompleteRefInternal.current.querySelector(
											'button[title="Open"]'
										)
									) {
										autoCompleteRefInternal.current
											.querySelector('button[title="Open"]')
											.click();
									}

									let index = document
										.querySelector(
											".MuiAutocomplete-listbox li.autocomplete-lists-hover"
										)
										?.getAttribute("index");
									index = parseInt(index);
									if (event.key === "ArrowDown") {
										if (index === undefined || isNaN(index)) {
											index = -1;
										}
										if (index < autocomplete.length - 1) {
											index++;
										}
									} else if (event.key === "ArrowUp") {
										if (index === undefined || isNaN(index)) {
											index = autocomplete.length;
										}
										if (index > 0) {
											index--;
										}
									}
									document
										.querySelectorAll(".MuiAutocomplete-listbox li")
										.forEach((element) => {
											element.classList.remove("autocomplete-lists-hover");
										});
									document
										.querySelectorAll(
											".MuiAutocomplete-listbox li[index='" + index + "']"
										)
										.forEach((element) => {
											element.classList.add("autocomplete-lists-hover");
										});
									let element = document.querySelector(
										".MuiAutocomplete-listbox li[index='" + index + "']"
									);
									if (element) {
										element.scrollIntoView({ block: "nearest" });
									}
								}
							}}
						/>
					)}
					ListboxComponent={ListboxComponent}
					renderOption={(props, option, state) => [
						props,
						autocomplete.find((element) => element.id === option),
						state.index,
					]}
				/>
			</Box>
		</Box>
	);
}















































export default List;