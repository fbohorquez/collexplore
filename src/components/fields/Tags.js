import React, { useState, useEffect, useRef } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import db from "../../services/db";

import { useTranslation } from "react-i18next";

function Tags({
	options = [],
	value = [],
	onChange,
	field,
	multiple = true,
	changeInKeyPress = false,
}) {
	const [autocomplete, setAutocomplete] = useState(options);
	
	useEffect(() => {
		if (field.force) {
			setAutocomplete(options);
		}
	}, [options]);

	useEffect(() => {
		let iD = field.id;
		if (typeof iD === "string" && iD.includes("_")) {
			iD = iD.split("_")[1];
		}

		db.autocompleteTags
			.where("field")
			.equals(iD)
			.toArray()
			.then((data) => {
				const filteredData = data.filter((element) => element && element.label);
				filteredData.sort((a, b) => a.label.localeCompare(b.label));
				if (!field.force) {
					setAutocomplete(filteredData);
				}
			});
		if (multiple) {
			setValues([...value]);
		} else {
			setValues(value);
		}
	}, [field]);

	useEffect(() => {
		if (multiple) {
			setValues([...value]);
		} else {
			setValues(value);
		}
	}, [value]);

	const [values, setValues] = useState([...value]);
	const [inputValue, setInputValue] = useState("");

	const { t } = useTranslation();

	const inputRef = useRef(null); // Referencia al input

	const handleDelete = (event, option) => {
		event.stopPropagation();
		event.preventDefault();
		let newValues;
		if (multiple) {
			newValues = values.filter((value) => value !== option);
		} else {
			if (values === option) {
				newValues = "";
			} else {
				newValues = values;
			}
		}
		setValues(newValues);
		onChange(newValues);
		db.autocompleteTags
			.where("field")
			.equals(field.id)
			.toArray()
			.then((data) => {
				const index = data.findIndex(
					(element) => element && element.label === option
				);
				if (index !== -1) {
					db.autocompleteTags.delete(data[index].id);
				}
				const filteredData = data.filter(
					(element) => element && element.label !== option
				);
				filteredData.sort((a, b) => a.label.localeCompare(b.label));
				if (!field.force) {
					setAutocomplete(filteredData);
				}
			});
	};

	const handleBlur = () => {
		if (inputValue && (!field.rel || (field.rel && inputValue.id))) {
			const newValues = multiple
				? [...values, field.rel ? inputValue.id : inputValue]
				: field.rel
				? inputValue.id
				: inputValue;
			setValues(newValues);
			onChange(newValues);
			db.autocompleteTags
				.where("field")
				.equals(field.id)
				.toArray()
				.then((data) => {
					if (multiple) {
						for (let value of newValues) {
							const label = field.rel
								? autocomplete.find((o) => o.id === value)?.label
								: value;
							if (
								value &&
								!data.some((element) => element && element.label === label)
							) {
								db.autocompleteTags.add({
									field: field.id,
									label: label,
								});
								data.push({ field: field.id, label: label });
							}
						}
					} else {
						const label = field.rel
							? autocomplete.find((o) => o.id === newValues)?.label
							: newValues;
						if (
							newValues &&
							!data.some((element) => element && element.label === label)
						) {
							db.autocompleteTags.add({
								field: field.id,
								label: label,
							});
							data.push({ field: field.id, label: label });
						}
					}
					const filteredData = data.filter(
						(element) => element && element.label
					);
					filteredData.sort((a, b) => a.label.localeCompare(b.label));
					if (!field.force) {
						setAutocomplete(filteredData);
					}
				});
			setInputValue("");
		}
	};

	const handleOptionClick = (event, option) => {
		event.stopPropagation();
		event.preventDefault();
		let newValues;
		if (multiple) {
			if (!values.includes(option)) {
				newValues = [...values, option];
			} else {
				newValues = values;
			}
		} else {
			newValues = option;
		}
		setValues(newValues);
		onChange(newValues);
		// Enfocar el input después de seleccionar
		inputRef.current.value = "";
		setInputValue("");
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	const [skipEnter, setSkipEnter] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "Enter") {
				if (!skipEnter) {
					document.querySelector(".btn-popup-0")?.click();
				}
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [skipEnter]);

	// Mapeo de valores para Autocomplete
	const mappedValues = field.rel
		? multiple
			? values
					.map((id) => autocomplete.find((option) => option.id === id))
					.filter((option) => option !== undefined)
			: autocomplete.find((option) => option.id === values) || null
		: values;

	return (
		<Box>
			<Autocomplete
				multiple={multiple}
				freeSolo
				options={
					field.rel ? autocomplete : autocomplete.map((option) => option.label)
				}
				getOptionLabel={(option) => (field.rel ? option.label : option)}
				isOptionEqualToValue={(option, value) =>
					field.rel ? option.id === value.id : option === value
				}
				value={mappedValues}
				onChange={(event, newValue, ...args) => {
					setSkipEnter(true);
					setTimeout(() => {
						setSkipEnter(false);
					}, 500);

					let newIDs;
					if (field.rel) {
						if (multiple) {
							newIDs = newValue.map((option) => option.id);
						} else {
							newIDs = newValue ? newValue.id : "";
						}
					} else {
						newIDs = newValue;
					}

					setValues(newIDs);
					onChange(newIDs);

					db.autocompleteTags
						.where("field")
						.equals(field.id)
						.toArray()
						.then((data) => {
							if (field.rel) {
								if (multiple) {
									for (let i = 0; i < newIDs.length; i++) {
										const id = newIDs[i];
										const label = autocomplete.find((o) => o.id === id)?.label;
										if (
											id &&
											label &&
											!data.some(
												(element) => element && element.label === label
											)
										) {
											db.autocompleteTags.add({
												field: field.id,
												label: label,
											});
											data.push({ field: field.id, label: label });
										}
									}
								} else {
									const label = autocomplete.find(
										(o) => o.id === newIDs
									)?.label;
									if (
										newIDs &&
										label &&
										!data.some((element) => element && element.label === label)
									) {
										db.autocompleteTags.add({
											field: field.id,
											label: label,
										});
										data.push({ field: field.id, label: label });
									}
								}
							} else {
								if (multiple) {
									for (let value of newIDs) {
										if (
											value &&
											!data.some(
												(element) => element && element.label === value
											)
										) {
											db.autocompleteTags.add({
												field: field.id,
												label: value,
											});
											data.push({ field: field.id, label: value });
										}
									}
								} else {
									if (
										newIDs &&
										!data.some((element) => element && element.label === newIDs)
									) {
										db.autocompleteTags.add({
											field: field.id,
											label: newIDs,
										});
										data.push({ field: field.id, label: newIDs });
									}
								}
							}

							const filteredData = data.filter(
								(element) => element && element.label
							);
							filteredData.sort((a, b) => a.label.localeCompare(b.label));
							if (!field.force) {
								setAutocomplete(filteredData);
							}
						});
					// Enfocar el input después de seleccionar
					if (inputRef.current) {
						inputRef.current.focus();
					}
				}}
				renderOption={(props, option, { selected }) => (
					<li
						{...props}
						className={`input-tags-item input-tags-item-${
							option.id && selected ? "selected" : "unselected"
						}`}
					>
						<span
							style={{ flexGrow: 1 }}
							onClick={(event) =>
								handleOptionClick(event, field.rel ? option.id : option)
							}
						>
							{field.rel ? option.label : option}
						</span>
						{!field.force && (
							<IconButton
								onClick={(event) =>
									handleDelete(event, field.rel ? option.id : option)
								}
								size="small"
								tabIndex={-1}
							>
								<Tooltip title={t("delete-suggestion")}>
									<DeleteIcon fontSize="small" />
								</Tooltip>
							</IconButton>
						)}
					</li>
				)}
				inputValue={inputValue}
				onBlur={handleBlur}
				onInputChange={(event, newInputValue) => {
					setInputValue(newInputValue);
				}}
				renderTags={(tagValue, getTagProps) =>
					tagValue.map((option, index) => (
						<Box
							key={index}
							{...getTagProps({ index })}
							sx={{
								display: "flex",
								alignItems: "center",
								padding: "2px",
								borderRadius: "4px",
								backgroundColor: "#e0e0e0",
								margin: "2px",
							}}
						>
							<Typography variant="body2">
								{field.rel ? option.label : option}
							</Typography>
							{!field.force && (
								<IconButton
									onClick={(event) =>
										handleDelete(event, field.rel ? option.id : option)
									}
									size="small"
									sx={{ marginLeft: "4px" }}
								>
									<img src="/clear.svg" alt="clear" className="clear-icon" />
								</IconButton>
							)}
						</Box>
					))
				}
				renderInput={(params) => (
					<TextField
						{...params}
						placeholder={t("add-tags")}
						inputRef={inputRef} // Asignamos la referencia al input
					/>
				)}
			/>
		</Box>
	);
}

export default Tags;


