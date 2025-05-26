import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import {
	Box,
	Menu,
	MenuItem,
	Typography,
	Tooltip,
	IconButton,
	Button,
	Select,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EditIcon from "@mui/icons-material/Mode";
import db from "../../services/db";
import { itemToString } from "../../services/helper";
import { calculateProbabilitySameArticle } from "../../services/helper";
import { selectPopup, GenerateItemCacheEntity } from "../../services/helper";
import {
	saveInCollection,
	handleAddCollection,
} from "../../services/list_helper";

import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import CollectionAddIcon from "@mui/icons-material/PlaylistAdd";
import CollectionAddedIcon from "@mui/icons-material/PlaylistAddCheck";
import DeleteFromList from "@mui/icons-material/DeleteSweep";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import ReportIcon from "@mui/icons-material/Report";

import { VariableSizeList } from "react-window";
import { useTheme, styled } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import InputAdornment from "@mui/material/InputAdornment";

import FormBuilder from "./../FormBuilder";

import Dexie from "dexie";

import Detail from "./../layout/Detail";

import { useTranslation } from "react-i18next";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";


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

function ListItemsItem({
	options = [],
	value = [],
	onChange,
	setOptions=()=>{},
	field,
  items = [],
  index=0,
	listItems,
	definition = null,
}) {

	const [anchorEl, setAnchorEl] = useState(null);
	const openMenu = Boolean(anchorEl);
	const [typeValue, setTypeValue] = useState("empty");

	const [types, setTypes] = useState([]);

	useEffect(() => {
		db.types.toArray().then((data) => {
			setTypes(data);
		});
	}, []);


	useEffect(() => {
		setValues(value);
	}, [value]);

	useEffect(() => {
    let input_value = value || "";
    if (typeof value === 'number') {
      input_value = options.find((element) => element.id === value);
      if (input_value){
        input_value = input_value.name;
      }else {
        input_value = '';
      }
			setTypeValue("relation");
    }
		else if (value && typeof value === 'object') {
			input_value = itemToString(value);
			setTypeValue("onfly");
		}else if (value && value !== "" && typeof value === 'string') {
			setTypeValue("text");
		}
		else {
			setTypeValue("empty");
		}
    setInputValue(input_value);

	}, [value, options, items]);

  useEffect(() => {
    let value = items[index].value || "";
    setValues(value);
  }, [items]);

	const handleMenuClick = (event, target) => {
		target = target || event.currentTarget;
		setAnchorEl(target);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleMenuItemClick = (type) => {
		if (!itemUndefinedSaveCollection){
			handleAdd(type);
		}else {
			handleAddCollection(type, field, onChange, setOptions, options, setItemUndefinedSaveCollection, itemUndefinedSaveCollection);
		}
		handleMenuClose();
	};


	const [values, setValues] = useState(value);
	const [inputValue, setInputValue] = useState("");

	const { t } = useTranslation();


	const handleAdd = (type) => {
		let most_new = {};
		const setNew = (newNew) => {
			most_new = newNew;
		};
		selectPopup({
			title: "",
			content: () => (
				<Detail
					className="popup-add-item"
					component="items"
					type="types"
					forceSelected={`type_${type}`}
					addFields={{ fields: field.fields || {} }}
					noRenderRow={true}
					ondemand={true}
					setNew={setNew}
				/>
			),
			btns: [
				{
					label: t("save"),
					action: async () => {	
						most_new = await GenerateItemCacheEntity(most_new);
						onChange(most_new, values);
						setValues(most_new);
						setTypeValue("onfly");
						selectPopup(null);
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


	const [itemUndefinedSaveCollection, setItemUndefinedSaveCollection] = useState(null);


	const handleEdit = () => {
		const item = values;
		let most_new = {};
		const setNew = (newNew) => {
			most_new = newNew;
		};
		selectPopup({
			title: "",
			content: () => (
				<Detail
					className="popup-add-item"
					component="items"
					type="types"
					forceSelected={item}
					addFields={{ fields: field.fields || {} }}
					noRenderRow={true}
					ondemand={true}
					setNew={setNew}
				/>
			),
			btns: [
				{
					label: t("save"),
					action: async () => {
						most_new = await GenerateItemCacheEntity(most_new);
						onChange(most_new, "");
						setValues(most_new);
						selectPopup(null);
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

	const handleClick = (event, item, field) => {
		onChange(item.id, values);
		setValues(item.id);
    handleClose();
    goToNextInput();
		let exist = false;
		for(let i of items){
			if (i.value === item.id && i.index !== index){
				exist = true;
				break;
			}
		}
		setExistItem(exist);
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
				className={`input-tags-item input-list-item-autocomplete ${getValueClass()}`}
				onClick={(event) => {
					handleClick(event, item, field);
				}}
			>
				{item.name}
			</li>
		);
	};

	const autoCompleteRef = React.useRef(null);

  const [open, setOpen] = useState(false);

	const handleOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

  const goToNextInput = (select_all) => {
    setTimeout(() => {
      document.querySelector('tr[data-index="' + (index + 1)+ '"] .input-list-item-autocomplete input')?.focus();
			if (select_all) {
				document.querySelector('tr[data-index="' + (index + 1)+ '"] .input-list-item-autocomplete input')?.select();
			}
    }, 50);
  }

	const goToPrevInput = (select_all) => {
		setTimeout(() => {
			document.querySelector(
				'tr[data-index="' + (index - 1) + '"] .input-list-item-autocomplete input'
			)?.focus();
			if (select_all) {
				document.querySelector(
					'tr[data-index="' + (index - 1) + '"] .input-list-item-autocomplete input'
				)?.select();
			}
		}, 50);
	}

	let valueTypeItem = "item";
	if (typeof value === "object" && value && value.list_item_type) {
		valueTypeItem = value.list_item_type;
	}

	const [typeItem, setTypeItem] = useState(valueTypeItem);

	const textrich_modules = {
		clipboard: {
			matchVisual: false,
		},
	};

	let gallery_value = {
		value: [],
		list_item_type: "gallery",
		height: 350,
	};
	if (value && value.list_item_type === "gallery") {
		gallery_value = value;
	}

	const [existItem, setExistItem] = useState(false);

	return (
		<Box>
			<Box className="input-list-item-type" style={{ position: "absolute", top: 10, left: 0, display: "flex", alignItems: "center", gap: 18 }}>
				<Select
					value={typeItem}
					onChange={(event) => {
						setTypeItem(event.target.value);
						if (
							event.target.value === "textrich" ||
							event.target.value === "gallery"
						) {
							if (!value) {
								onChange({ value: "", list_item_type: event.target.value });
							}
						}
					}}
				>
					<MenuItem value="item">{t("item")}</MenuItem>
					<MenuItem value="textrich">{t("textrich")}</MenuItem>
					<MenuItem value="gallery">{t("gallery")}</MenuItem>
				</Select>
				<Tooltip title={t("delete-from-list")} className="del-list-btn">
					<DeleteFromList
						onClick={() => {
							onChange(null, values);
							setValues("");
						}}
					/>
				</Tooltip>
			</Box>
			{typeItem === "item" && (
				<Box className="input-list-item">
					{typeValue === "empty" && (
						<Tooltip title={t("add-new-to-this-list-explanation")}>
							<Button
								className="input-entity-add-new add-new"
								variant="outlined"
								onClick={(event) => {
									setItemUndefinedSaveCollection(null);
									handleMenuClick(event);
								}}
								tabIndex={-1}
							>
								{t("add-new-to-this-list")}
							</Button>
						</Tooltip>
					)}
					{typeValue === "onfly" && (
						<Button
							className="input-entity-add-new add-new"
							variant="outlined"
							tabIndex={-1}
							onClick={handleEdit}
						>
							{t("edit-item-in-this-list")}
						</Button>
					)}

					{typeValue !== "relation" && inputValue !== "" && (
						<Tooltip
							title={t("add-to-collection")}
							className="incollection-btn out"
						>
							<CollectionAddIcon
								onClick={(e) => {
									saveInCollection(
										e,
										onChange,
										handleMenuClick,
										values,
										setOptions,
										options,
										setItemUndefinedSaveCollection
									);
								}}
							/>
						</Tooltip>
					)}
					{typeValue === "relation" && (
						<Tooltip title={t("in-collection")} className="incollection-btn in">
							<CollectionAddedIcon />
						</Tooltip>
					)}

					<Menu
						id="simple-menu"
						anchorEl={anchorEl}
						keepMounted
						open={openMenu}
						onClose={handleMenuClose}
					>
						{types.map((type, index) => (
							<MenuItem
								key={index}
								onClick={() => {
									handleMenuItemClick(type.id);
								}}
							>
								{type.name}
							</MenuItem>
						))}
					</Menu>
					<Autocomplete
						multiple={false}
						freeSolo={true}
						open={open}
						onOpen={handleOpen}
						onClose={handleClose}
						options={options.map((option) => option.id) || []}
						value={values}
						onChange={(event, newValue) => {
							// setValues(newValue || "");
							onChange(newValue || "", values);
							setValues(newValue || "");
							for(let item of items){
								if (item.value === newValue && item.index !== index){
									setExistItem(true);
									break;
								}
								setExistItem(false);
							}
							
						}}
						getOptionLabel={(option) => {
							let item = options.find((element) => element.id === option);
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
								className="input-list-item-autocomplete"
								ref={autoCompleteRef}
								{...params}
								placeholder={t("add-tags")}
								onKeyDown={(event) => {
									if (
										["Enter", "Escape", "ArrowDown", "ArrowUp", "Tab"].indexOf(
											event.key
										) !== -1
									) {
										event.preventDefault();
										event.stopPropagation();
									}
									if (event.key === "Escape") {
										event.target.blur();
									}
									if (event.key === "Tab") {
										if (event.shiftKey) {
											if (
												!document.querySelector(
													'tr[data-index="' +
														(index - 1) +
														'"] .input-list-item-autocomplete input'
												)
											) {
												listItems.scrollToIndex(index - 1);
											}
											goToPrevInput(true);
										} else {
											if (
												!document.querySelector(
													'tr[data-index="' +
														(index + 1) +
														'"] .input-list-item-autocomplete input'
												)
											) {
												listItems.scrollToIndex(index + 1);
											}
											goToNextInput(true);
										}
									}

									if (typeValue === "onfly" || typeValue === "relation") {
										event.preventDefault();
										event.stopPropagation();
										return;
									}

									if (event.key === "Enter") {
										let index_sel = document
											.querySelector(
												".MuiAutocomplete-listbox li.autocomplete-entity-hover"
											)
											?.getAttribute("index");
										if (index_sel !== undefined && !isNaN(index_sel)) {
											let item_id = document
												.querySelector(
													".MuiAutocomplete-listbox li[index='" +
														index_sel +
														"']"
												)
												?.getAttribute("data-id");
											item_id = parseInt(item_id);
											if (item_id) {
												let item = options.find(
													(element) => element.id === item_id
												);
												if (item) {
													handleClick(event, item, field);
												}
											}
										}
										goToNextInput();
									} else if (
										event.key === "ArrowDown" ||
										event.key === "ArrowUp"
									) {
										handleOpen();
										setTimeout(() => {
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
												if (index < options.length - 1) {
													index++;
												}
											} else if (event.key === "ArrowUp") {
												if (index === undefined || isNaN(index)) {
													let last = document.querySelector(
														".MuiAutocomplete-listbox li:last-child"
													);
													index = parseInt(last.getAttribute("index")) - 4;
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
										}, 50);
									}
								}}
								onChange={(event) => {
									onChange(event.target.value, values);
									let exist = false;
									for(let item of items){
										if (item.value === event.target.value && item.index !== index){
											exist = true;
											break;
										}
									}
									setExistItem(exist);
								}}
								InputProps={{
									...params.InputProps,
									startAdornment: (
										<React.Fragment>
											{params.InputProps.endAdornment}
											<InputAdornment position="start">
												{typeValue === "onfly" && (
													<Tooltip title={t("icon-list-onfly")}>
														<EditNoteIcon />
													</Tooltip>
												)}
												{typeValue === "text" && (
													<Tooltip title={t("icon-list-text")}>
														<FormatItalicIcon />
													</Tooltip>
												)}
												{typeValue === "relation" && (
													<Tooltip title={t("icon-list-relation")}>
														<CollectionsBookmarkIcon />
													</Tooltip>
												)}
											</InputAdornment>
										</React.Fragment>
									),
								}}
							/>
						)}
						ListboxComponent={ListboxComponent}
						renderOption={(props, option, state) => [
							props,
							options.find((element) => element.id === option),
							state.index,
						]}
					/>
					{existItem && 
						<Typography 
							variant="caption" 
							color="info" 
							style={{ display: "flex", alignItems: "center", marginTop: 5, position: "absolute", bottom: 30 }}
						>
							<ReportIcon />
							<Box style={{ lineHeight: 2, marginLeft: 2 }}>
								{t("item-exist-in-list")}
							</Box>
						</Typography>
					}
				</Box>
			)}

			{typeItem === "textrich" && (
				<Box className="input-list-textrich">
					<ReactQuill
						value={
							value && value.list_item_type === "textrich" ? value.value : ""
						}
						onKeyDown={(e) => {
							e.stopPropagation();
						}}
						onKeyUp={(e) => {
							e.stopPropagation();
						}}
						onKeyPress={(e) => {
							e.stopPropagation();
						}}
						onChange={(content) => {
							let new_value = {
								value: content,
								list_item_type: "textrich",
							};
							onChange(new_value, values);
							setValues(new_value);
						}}
						placeholder={field.placeholder}
						modules={textrich_modules}
					/>
				</Box>
			)}

			{typeItem === "gallery" && (
				<FormBuilder
					definition={{
						ondemand: false,
						reference: true,
						def: [
							{
								id: "value",
								label: t("gallery"),
								type: "image-gallery",
								labelPosition: "none",
								required: true,
								autoFocus: true,
								onChange: (id, value, reference, old_value) => {
									onChange({ value: value, list_item_type: "gallery", height: gallery_value.height });
									setValues({ value: value, list_item_type: "gallery", height: gallery_value.height });
								},
							},
							{
								id: "height",
								label: t("height-px"),
								type: "number",
								labelPosition: "top",
								required: false,
								default:350,
								autoFocus: false,
								onChange: (id, value, reference, old_value) => {
									onChange({ value: gallery_value.value, list_item_type: "gallery", height: value });
									setValues({ value: gallery_value.value, list_item_type: "gallery", height: value });
								}
							}
						],
					}}
					reference={gallery_value}
					onSaved={(field, value) => {
						alert("change");
					}}
				/>
			)}
		</Box>
	);
}














export default ListItemsItem;