import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Box, Typography, Tooltip, IconButton, Button } from "@mui/material";
import countriesAll from "../../locales/countries";
import flags from "../../locales/flags";
import {changeRow} from "../../services/helper";
import CloseIcon from "@mui/icons-material/Close";
import db from "../../services/db";
//MuiChip-deleteIcon
// import ClearIcon from "../../assets/clear.svg";

import { FixedSizeList } from "react-window";
import { useTheme, styled } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useTranslation } from "react-i18next";

function useResetCache(data, itemData) {
	const ref = React.useRef(null);
	React.useEffect(() => {
		if (ref.current != null) {
			ref.current.resetAfterIndex(1, true);
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

function Country({ value = [], onChange, field, definition }) {
	const { t, i18n } = useTranslation();
	const countries = countriesAll[i18n.language];

	const [autocomplete, setAutocomplete] = useState(countries);

	useEffect(() => {
		setAutocomplete(countries);
	}, [field]);

	useEffect(() => {
		if (field.multiple) {
			setValues([...value]);
		} else {
			setValues(value);
		}
	}, [value]);

	let newValue = null;
	if (field.multiple) {
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
	const [inputValue, setInputValue] = useState("");

	const handleClick = (event, item, field) => {
		if (field.multiple) {
			setValues((currentValues) => {
				if (currentValues.indexOf(item) === -1) {
					return [...currentValues, item];
				} else {
					return currentValues.filter((value) => value !== item);
				}
			});
			if (values.indexOf(item) === -1) {
				onChange([...values, item]);
				if (definition && definition.root){
					definition.root.fields[field.id] = [...values, item];
				}
			} else {
				onChange(values.filter((value) => value !== item));
				if (definition && definition.root){
					definition.root.fields[field.id] = values.filter((value) => value !== item);
				}
			}
		} else {
			setValues(item);
			onChange(item);
			if (definition && definition.root){
				definition.root.fields[field.id] = item;
			}
		}
		if (definition && definition.root) {
			setTimeout(() => {
				changeRow(definition.root);
			}, 100);
		}
		if (autoCompleteRef.current.querySelector('button[title="Close"]')) {
			autoCompleteRef.current.querySelector('button[title="Close"]').click();
		}
	};

	const ListboxComponent = React.forwardRef(function ListboxComponent(
		props,
		ref
	) {
		const { children, ...other } = props;

		const itemData = children;

		const itemCount = itemData.length;

		return (
			<div ref={ref}>
				<OuterElementContext.Provider value={other}>
					<FixedSizeList
						itemData={itemData}
						height={itemCount < 8 ? 32 * itemCount : 180}
						width="100%"
						innerElementType="ul"
						itemSize={32}
						outerElementType={OuterElementType}
						itemCount={itemCount}
					>
						{RenderRow}
					</FixedSizeList>
				</OuterElementContext.Provider>
			</div>
		);
	});

	const RenderRow = (props) => {
		const { data, index } = props;
		let item = data[index][1];

		const flag = flags[item];
		const iso = item;
		item = autocomplete[item];

		const getValueClass = () => {
			if (values instanceof Array) {
				if (values.indexOf(iso) !== -1) {
					return "autocomplete-entity-selected";
				}
			} else {
				if (values === iso) {
					return "autocomplete-entity-selected";
				}
			}
			return "";
		};
		return (
			<li
				{...props}
				data-id={iso}
				className={`input-tags-item coutry ${getValueClass()}`}
				onClick={(event) => {
					handleClick(event, iso, field);
				}}
			>
				<img src={flag} alt={iso} style={{ width: "20px", height: "20px" }} />
				{item}
			</li>
		);
	};

	const autoCompleteRef = React.useRef(null);

	return (
		<Box>
			<Autocomplete
				multiple={field.multiple || false}
				freeSolo={false}
				options={Object.keys(countries)}
				value={values}
				onChange={(event, newValue) => {
					setValues(newValue);
					onChange(newValue);
					if (definition && definition.root) changeRow(definition.root);
				}}
				getOptionLabel={(option) => {
					return countries[option];
				}}
				inputValue={inputValue}
				onInputChange={(event, newInputValue) => {
					setInputValue(newInputValue);
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						ref={autoCompleteRef}
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
										".MuiAutocomplete-listbox li.autocomplete-entity-hover"
									)
									?.getAttribute("index");
								if (index !== undefined && !isNaN(index)) {
									let item_iso = document
										.querySelector(
											".MuiAutocomplete-listbox li[index='" + index + "']"
										)
										?.getAttribute("data-id");
									if (item_iso) {
											handleClick(event, item_iso, field);
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
									if (index < Object.keys(countries).length - 1) {
										index++;
									}
								} else if (event.key === "ArrowUp") {
									if (index === undefined || isNaN(index)) {
										index = Object.keys(countries).length;
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
				renderOption={(props, option, state) => [props, option, state.index]}
				renderTags={(tagValue, getTagProps) => {
					return tagValue.map((option, index) => (
						<Box
							component="div" // Utiliza un div en lugar de li para los contenedores de etiquetas
							sx={{
								display: "flex",
								alignItems: "center",
								gap: "10px",
								border: "1px solid #ccc",
								padding: "5px",
							}}
							key={option}
							{...getTagProps({ index })}
						>
							<img
								src={flags[option]}
								alt={option}
								style={{ width: "20px", height: "20px" }}
							/>
							<Typography variant="body2">{countries[option]}</Typography>
							<IconButton
								size="small"
								tabIndex={-1}
								onClick={(event) => {
									event.stopPropagation();
									event.preventDefault();
									setValues(values.filter((value) => value !== option));
									onChange(values.filter((value) => value !== option));
								}}
								sx={{ padding: "1px" }}
							>
								
								<img src="/clear.svg" alt="clear" className="clear-icon" />
								
							</IconButton>
						</Box>
					));
				}}
			/>
		</Box>
	);
}




























export default Country;