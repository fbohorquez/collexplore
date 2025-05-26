import React, { useState, useEffect, useMemo } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Box, Typography, Tooltip, IconButton, Button, Chip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Mode";
import db from "../../services/db";
import { selectPopup, changeRow, updateEntityCacheInItems, entityToString } from "../../services/helper";

import { VariableSizeList } from "react-window";
import { useTheme, styled } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

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


function Entity({
	options = [],
	value = [],
	onChange,
	field,
	definition = null,
	setAfterRenderLabel = () => { },
}) {

	const { t } = useTranslation();

	const [autocomplete, setAutocomplete] = useState(options);
	const [open, setOpen] = useState(false);

	const checkFilters = (item) => {
		const compareFilters = (value1, value2) => {
			if (value1 instanceof Array && value2 instanceof Array) {
				for (let i = 0; i < value1.length; i++) {
					if (value2.indexOf(value1[i]) !== -1) {
						return true;
					}
				}
			} else if (!(value1 instanceof Array) && value2 instanceof Array) {
				if (value2.indexOf(value1) !== -1) {
					return true;
				}
			} else if (value1 instanceof Array && !(value2 instanceof Array)) {
				if (value1.indexOf(value2) !== -1) {
					return true;
				}
			} else if (value1 === value2) {
				return true;
			}
			return false;
		};

		let data_all_conditions = true;
		for (let key in field.fields) {
			if (key === "updatedAt") {
				continue;
			}
			if (
				!item.fields ||
				!compareFilters(item.fields[key], field.fields[key])
			) {
				data_all_conditions = false;
				break;
			}
		}
		return data_all_conditions;
	};

	const handleDelete = (event, option) => {
		event.stopPropagation();
		event.preventDefault();
		if (values instanceof Array) {
			const newValues = values.filter((value) => value !== option.id);
			setValues(newValues);
			onChange(newValues);
		} else {
			if (values === option.id) {
				setValues(null);
				onChange(null);
			}
		}

		db.entity
			.where("[type+name]")
			.between([field.entity, Dexie.minKey], [field.entity, Dexie.maxKey])
			.toArray()
			.then((data) => {
				if (field.fields && Object.keys(field.fields).length > 0) {
					let data_new = [];
					for (let i = 0; i < data.length; i++) {
						if (checkFilters(data[i])) {
							data_new.push(data[i]);
						}
					}
					data = data_new;
				}
				const index = data.findIndex((element) => element.id === option.id);
				if (index !== -1) {
					db.entity.delete(data[index].id);
				}
				data = data.filter((element) => element.id !== option.id);
				setAutocomplete(data);
			});
	};

	const handleEdit = (event, item) => {
		event.stopPropagation();
		event.preventDefault();
		let itemCopy = { ...item };
		selectPopup({
			title: "",
			content: () => (
				<Detail
					className="popup-edit-entity"
					component="entity"
					type="entity-types"
					forceSelected={item}
					ondemand={true}
					autoName={field.integrated}
				/>
			),
			btns: [
				{
					label: t("save"),
					action: () => {
						if (item.id) {
							if (!item.name || field.integrated) {
								item.name = entityToString(item, true);
							}
							db.entity.update(item.id, item);
							let newAutocomplete = [...autocomplete];
							const index = newAutocomplete.findIndex(
								(element) => element.id === item.id
							);
							newAutocomplete[index] = item;
							setAutocomplete(newAutocomplete);
							updateEntityCacheInItems(field.id, item);
						} else {
							db.entity.add(item).then((id) => {
								item.id = id;
							});
							setAutocomplete([...autocomplete, item]);
						}
						onChange(values);
						selectPopup(null);
					},
				},
				{
					label: t("cancel"),
					action: () => {
						let index = autocomplete.findIndex(
							(element) => element.id === item.id
						);
						let newAutocomplete = [...autocomplete];
						newAutocomplete[index] = itemCopy;
						setAutocomplete(newAutocomplete);
						selectPopup(null);
					},
					variant: "outlined",
				},
			],
		});
	};

	const handleAdd = (event) => {
		event.stopPropagation();
		event.preventDefault();
		let most_new = {};
		const setNew = (newNew) => {
			most_new = newNew;
		};
		selectPopup({
			title: "",
			content: () => (
				<Detail
					className="popup-add-entity"
					component="entity"
					type="entity-types"
					forceSelected={`type_${field.entity}`}
					addFields={{ fields: field.fields || {} }}
					noRenderRow={true}
					ondemand={true}
					setNew={setNew}
					autoName={field.integrated}
				/>
			),
			btns: [
				{
					label: t("save"),
					action: () => {
						let strEntity = entityToString(most_new, true);
						if (most_new.name === "" && !field.integrated) {
							return;
						} else {
							if (!most_new.name || field.integrated) {
								most_new.name = strEntity;
							}
						}
						db.entity.add(most_new).then((id) => {
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
							selectPopup(null);
						});
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
		setTimeout(() => {
			document.querySelector(".popup .form-builder [tabindex]").focus();
		}, 200);
	};

	const handleClick = (event, item, field) => {
		if (field.integrated) {
			return;
		}
		if (field.multiple) {
			setValues((currentValues) => {
				if (currentValues.indexOf(item.id) === -1) {
					return [...currentValues, item.id];
				} else {
					return currentValues.filter((value) => value !== item.id);
				}
			});
			if (values.indexOf(item.id) === -1) {
				onChange([...values, item.id]);
			} else {
				onChange(values.filter((value) => value !== item.id));
			}
		} else {
			setValues(item.id);
			onChange(item.id);
		}
		if (autoCompleteRef.current.querySelector('button[title="Close"]')) {
			autoCompleteRef.current.querySelector('button[title="Close"]').click();
		}
	};

	useEffect(() => {
		// Load entity data from the database for the autocomplete and set the initial value
		db.entity
			.where("[type+name]")
			.between([field.entity, Dexie.minKey], [field.entity, Dexie.maxKey])
			.toArray()
			.then((data) => {
				if (field.fields && Object.keys(field.fields).length > 0) {
					let data_new = [];
					for (let i = 0; i < data.length; i++) {
						if (checkFilters(data[i])) {
							data_new.push(data[i]);
						}
					}
					if (field.integrated) {
						let data_integrated = [];
						data_new.forEach((element) => {
							if (Array.isArray(value)) {
								if (value.indexOf(element.id) !== -1) {
									data_integrated.push(element);
								}
							}
						});
						setAutocomplete(data_integrated);
					} else {
						setAutocomplete(data_new);
					}
				} else {
					if (field.integrated) {
						let data_integrated = [];
						data.forEach((element) => {
							if (Array.isArray(value)) {
								if (value.indexOf(element.id) !== -1) {
									data_integrated.push(element);
								}
							}
						});
						setAutocomplete(data_integrated);
					} else {
						setAutocomplete(data);
					}
				}
			})
			.catch((error) => {
				console.error(error);
				setAutocomplete([]);
			});
	}, [field, value]);

	useEffect(() => {
		if (field.multiple) {
			setValues([...value]);
		} else {
			setValues(value);
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
	
	const addNewButton = useMemo(() => {
		if(!field.onlyRead) {
			return (
				<Tooltip title={`${t('new')}`}>
					<Button
						className="input-entity-add-new add-new"
						variant="outlined"
						onClick={handleAdd}
						tabIndex={-1}
					>
						<AddCircleOutlineIcon
							style={{
								width: '1.3rem',
								color: '#7d7c7c',
								transform: 'translateY(-2px)'
							}}
						/>
					</Button>
				</Tooltip>
			);
		}else {
			return null;
		}
	}, [field.onlyRead]);

	useEffect(() => {
		if(!field.onlyRead) {
			setAfterRenderLabel((prev) => {
				if (prev !== addNewButton) {
					return addNewButton;
				}
				return prev;
			});
		}
	}, [value]);

	const [values, setValues] = useState(newValue);
	const [inputValue, setInputValue] = useState("");

	

	

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
					classNames += "autocomplete-entity-selected ";
				}
			} else {
				if (values === item.id) {
					classNames += "autocomplete-entity-selected ";
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
				{!field.onlyRead && (
					<IconButton style={{ marginLeft: "auto" }} size="small">
						<Tooltip title={t("edit-entity")}>
							<EditIcon
								fontSize="small"
								onClick={(event) => handleEdit(event, item)}
							/>
						</Tooltip>
					</IconButton>
				)}
				{!field.onlyRead && (
					<IconButton size="small">
						<Tooltip title={t("delete-entity")}>
							<DeleteIcon
								fontSize="small"
								onClick={(event) => handleDelete(event, item)}
							/>
						</Tooltip>
					</IconButton>
				)}
			</li>
		);
	};

	const autoCompleteRef = React.useRef(null);

	const handleKeyDown = (event) => {
		if (field.integrated && event.key === "Enter") {
			event.preventDefault();
			// Llamar a la función para crear nueva entidad
			handleAdd(event);
		}
	};

	//autoCompleteRef click
	useEffect(() => {
		const handleClick = (event, item, field) => {
			if (autocomplete.length === 0) {
				event.stopPropagation();
				handleAdd(event);
			}
		};

		const currentRef = autoCompleteRef.current;

		if (currentRef) {
			currentRef.addEventListener("click", handleClick);
		}

		return () => {
			if (currentRef) {
				currentRef.removeEventListener("click", handleClick);
			}
		};
	}, [autoCompleteRef, autocomplete]);

	return (
		<Box>
			{/* {!field.onlyRead && (
				<Button
					className="input-entity-add-new add-new"
					variant="outlined"
					onClick={handleAdd}
					tabIndex={-1}
				>
					{t("new")}
				</Button>
			)} */}
			<Autocomplete
				onKeyDown={handleKeyDown}
				multiple={field.multiple || false}
				freeSolo={false}
				options={autocomplete.map((option) => option.id) || []}
				value={values}
				onChange={(event, newValue) => {
					setValues(newValue);
					onChange(newValue);
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
								if (field.integrated) {
									return;
								}
								event.preventDefault();
								event.stopPropagation();
							}
							if (event.key === "Enter") {
								let index = document
									.querySelector(
										".MuiAutocomplete-listbox li.autocomplete-entity-hover"
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
									let most_new = { name: value, type: field.entity };
									most_new.fields = field.fields || {};
									db.entity.add(most_new).then((id) => {
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
							} else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
								if (
									autoCompleteRef.current.querySelector('button[title="Open"]')
								) {
									autoCompleteRef.current
										.querySelector('button[title="Open"]')
										.click();
								}

								let index = document
									.querySelector(
										".MuiAutocomplete-listbox li.autocomplete-entity-hover"
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
										element.classList.remove("autocomplete-entity-hover");
									});
								document
									.querySelectorAll(
										".MuiAutocomplete-listbox li[index='" + index + "']"
									)
									.forEach((element) => {
										element.classList.add("autocomplete-entity-hover");
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
				open={autocomplete.length > 0 && open}
				onOpen={() => {
					if (autocomplete.length > 0) {
						setOpen(true);
					}
				}}
				onClose={() => {
					setOpen(false);
				}}
				renderTags={(tagValue, getTagProps) =>
					tagValue.map((option, index) => (
						<Chip
							label={
								autocomplete.find((item) => item.id === option)?.name || ""
							}
							{...getTagProps({ index })}
							onDelete={() => {
								const updatedValues = values.filter(
									(value) => value !== option
								);
								setValues(updatedValues);
								onChange(updatedValues);
							}}
						/>
					))
				}
			/>
		</Box>
	);
}






export default Entity;