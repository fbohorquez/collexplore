import React, { useState, useEffect, useCallback } from "react";


import {
	Switch,
	Select,
	MenuItem,
	FormControlLabel,
	FormControl,
	Typography,
	Grid,
	Box,
	TextField,
	Button,
	Tooltip,
	IconButton,
} from "@mui/material";

import ImageIcon from '@mui/icons-material/Image';
import FormBuilder from "./FormBuilder";

import DeleteIcon from "@mui/icons-material/Delete";

import Sortable from "./fields/Sortable";
import Tags from "./fields/Tags";
import Entity from "./fields/Entity";
import Country from "./fields/Country";
import StarRating from "./fields/StarRating";
import ImageGallery from "./fields/ImageGallery";
import List from "./fields/List";
import ListItems from "./fields/ListItems";
import KeyValueList from "./fields/KeyValueList";
import Lending from "./fields/Lending";
import LinkField from "./fields/LinkField";
import JSONKeys from "./fields/JSONKeys";
import GoogleImages from "./fields/GoogleImages";
import SearXNGImages from "./fields/SearXNGImages";
import Code from "./fields/Code";
import Scraping from "./fields/Scraping";
import SortList from "./fields/SortList";
import GPTField from "./fields/GPTField";
import SelectField from "./fields/SelectField";
import ColorPicker from "./fields/ColorPicker";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { useTranslation } from "react-i18next";

import { AppContextDetail } from "../services/context_detail";
import { AppContext } from "../services/context";

import Config from "../services/config";
import { cropLargestObject } from "../services/helper";

import HelpIcon from "@mui/icons-material/Help";

const TextFieldAutoFocus = ({ value, onChange, placeholder, field, ...props }) => {
	const { selectedItem } = React.useContext(AppContextDetail);
	const { disableAutoFocus, setDisableAutoFocus } = React.useContext(AppContext);
	const inputRef = React.useRef(null);
	React.useEffect(() => {
		if (disableAutoFocus) {
			setDisableAutoFocus(false);
			return;
		}
		if (props.autoFocus) {
			const activeElement = document.activeElement;
			const isAnotherInputFocused =
				activeElement &&
				(activeElement.tagName === "INPUT" ||
					activeElement.tagName === "TEXTAREA" ||
					activeElement.isContentEditable);

			if (!isAnotherInputFocused) {
				setTimeout(() => {
					inputRef &&
						inputRef.current &&
						inputRef.current.querySelector("input").focus();
				}, 100);
			}
		}
	}, [selectedItem]);
	return (
		<TextField
			className="textfield-auto-focus"
			ref={inputRef}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			variant="standard"
			fullWidth
			autoFocus={props.autoFocus}
			onFocus={props.onFocus}
			autoComplete="off"
			inputRef={inputRef}
			tabIndex={field.tabIndex || -1}
			{...props}
			inputProps={{
				autoCorrect: "off",
				autoComplete: "off",
				spellCheck: "false",
			}}
		/>
	);
};

const DynamicField = ({
	field,
	value,
	onChange,
	labelPosition,
	definition = null,
	reference = null,
	validate = (data, notGlobal) => {
		return true;
	},
	onChangeForm = (field, value) => {},
	pasteRef = null,
}) => {
	const { t } = useTranslation();
	const [subformTextValidate, setSubformTextValidate] = useState({});

	let refInputCrop = React.createRef();
	

	labelPosition = labelPosition || field.labelPosition || "top";

	const handleChange = async (e, obj, forceTarget) => {
		let newValue = e;
		if (e instanceof Event || (e && e.target)) {
			newValue =
				forceTarget || (field.type === "checkbox"
					? e.target.checked
					: e.target.value);
			if (e.target.files && e.target.files.length > 0) {
				const file = e.target.files[0];
				let fileBlob = new Blob([file], { type: file.type });
				//Prevent if key Alt is pressed
				if (field.type === "image" && field.autoCrop && refInputCrop.current && !refInputCrop.current.checked) {
					fileBlob = await cropLargestObject(fileBlob);
				}
				newValue = fileBlob;
			}
		}
		onChange(field.id, newValue);
	};

	const handleFocus = (event) => {
		if (field.selectOnFocus) {
			setTimeout(() => {
				event.target.select();
			}, 100);
		}
	};

	const renderInput = () => {
		switch (field.type) {
			case "hidden":
				return <input type="hidden" value={value} onChange={handleChange} />;
			case "text":
				if (field.autoFocus) {
					return (
						<TextFieldAutoFocus
							value={value}
							onChange={handleChange}
							placeholder={field.placeholder}
							autoFocus={field.autoFocus}
							onFocus={handleFocus}
							onKeyDown={field.onKeyDown}
							autoComplete="off"
							definition={definition}
							reference={reference}
							field={field}
						/>
					);
				}
				return (
					<TextField
						value={value}
						onChange={handleChange}
						placeholder={field.placeholder}
						variant="standard"
						fullWidth
						autoFocus={field.autoFocus}
						onFocus={handleFocus}
						onKeyDown={field.onKeyDown}
						autoComplete="off"
						inputProps={{
							autoCorrect: "off",
							autoComplete: "off",
							spellCheck: "false",
						}}
					/>
				);
			case "textarea":
				return (
					<TextField
						value={value}
						onChange={handleChange}
						placeholder={field.placeholder}
						variant="standard"
						fullWidth
						autoFocus={field.autoFocus}
						onFocus={handleFocus}
						multiline
						rows={4}
						onKeyDown={(e) => e.stopPropagation()}
						autoComplete="off"
						inputProps={{
							autoCorrect: "off",
							autoComplete: "off",
							spellCheck: "false",
						}}
					/>
				);
			case "textrich":
				const modules = {
					clipboard: {
						matchVisual: false,
					},
				};
				return (
					<ReactQuill
						value={value}
						onKeyDown={(e) => e.stopPropagation()}
						onChange={(content) => {
							onChange(field.id, content);
						}}
						placeholder={field.placeholder}
						modules={modules}
					/>
				);
			case "number":
				return (
					<TextField
						type="number"
						value={value}
						onChange={handleChange}
						placeholder={field.placeholder}
						variant="standard"
						fullWidth
						autoFocus={field.autoFocus}
						onFocus={handleFocus}
						autoComplete="off"
						inputProps={{
							autoCorrect: "off",
							autoComplete: "off",
							spellCheck: "false",
						}}
					/>
				);
			case "date":
				return (
					<TextField
						type="date"
						value={value}
						onChange={handleChange}
						placeholder={field.placeholder}
						variant="standard"
						fullWidth
						autoFocus={field.autoFocus}
						onFocus={handleFocus}
						autoComplete="off"
						inputProps={{
							autoCorrect: "off",
							autoComplete: "off",
							spellCheck: "false",
						}}
					/>
				);
			case "email":
				return (
					<TextField
						type="email"
						value={value}
						onChange={handleChange}
						placeholder={field.placeholder}
						variant="standard"
						fullWidth
						autoFocus={field.autoFocus}
						onFocus={handleFocus}
						autoComplete="off"
						inputProps={{
							autoCorrect: "off",
						}}
					/>
				);
			case "password":
				return (
					<TextField
						type="password"
						value={value}
						onChange={handleChange}
						placeholder={field.placeholder}
						variant="standard"
						fullWidth
						autoFocus={field.autoFocus}
						onFocus={handleFocus}
						autoComplete="off"
						inputProps={{
							autoCorrect: "off",
							autoComplete: "off",
							spellCheck: "false",
						}}
					/>
				);
			case "range":
				return (
					<input type={field.type} value={value} onChange={handleChange} min={field.min} max={field.max} />
				);
			case "checkbox":
				return (
					<Box>
						<FormControlLabel
							control={
								<Switch
									checked={
										value === true ||
										value === "true" ||
										value === 1 ||
										value === "1"
									}
									onChange={handleChange}
									name={field.id}
								/>
							}
							label={field.labelPosition === "none" ? field.label : ""}
						/>
						{field.subform &&
							(function () {
								field.subform = { ...definition, ...field.subform };
								const id = "subform-" + field.id;
								return (
									<Box
										id={id}
										style={{
											display:
												value === true ||
												value === "true" ||
												value === 1 ||
												value === "1"
													? "block"
													: "none",
										}}
									>
										<FormBuilder
											definition={field.subform}
											reference={reference}
											className="subform"
											onChange={onChangeForm}
										/>
									</Box>
								);
							})()}
					</Box>
				);
			case "color":
				return (
					<ColorPicker
						field={field}
						value={value}
						handleChange={handleChange}
						definition={definition}
						reference={reference}
						onChangeForm={onChangeForm}
					/>
				);
			case "sortable-select":
				return (
					<Sortable
						value={value || field.default || []}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						options={field.options}
						field={field}
					/>
				);
			case "tags":
				return (
					<Tags
						value={value || field.default || []}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						options={field.options}
						field={field}
					/>
				);
			case "entity":
				return (
					<Entity
						value={value || field.default || []}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						options={field.options}
						field={field}
						definition={definition}
						setAfterRenderLabel={setAfterRenderLabel}
					/>
				);
			case "list":
				return (
					<List
						value={value || field.default || []}
						definition={definition}
						field={field}
						onChange={(values, old_values) => {
							onChange(field.id, values, old_values);
						}}
					/>
				);
			case "list-items":
				return (
					<ListItems
						value={value || field.default || []}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						options={field.options}
						field={field}
						definition={definition}
					/>
				);
			case "key-value":
				return (
					<KeyValueList
						value={value || field.default || []}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						options={field.options}
						field={field}
						definition={definition}
					/>
				);
			case "JSONKeys":
				return (
					<JSONKeys
						value={value || field.default || []}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						json={field.json}
						field={field}
					/>
				);
			case "button":
				return (
					<Button
						onClick={() => {
							if (field.onClick) {
								field.onClick();
							}
						}}
						variant="contained"
						color="primary"
						className={field.className}
					>
						{field.label}
					</Button>
				);
			case "select":
				return (
					<SelectField
						field={field}
						value={value}
						handleChange={handleChange}
						definition={definition}
						reference={reference}
						onChangeForm={onChangeForm}
					/>
				);
			case "image":
				field.accept = field.accept || ".png, .jpg, .jpeg, .gif, .svg";
				let url = null;
				if (value instanceof Blob) {
					url = URL.createObjectURL(value);
				}

				return (
					<Box>
						<div
							className="image-field"
							onClick={() => document.getElementById(field.id).click()}
						>
							{(url && (
								<span style={{ display: "flex", alignItems: "center" }}>
									<img
										src={url}
										alt={field.label}
										style={{ maxHeight: "40px" }}
										draggable="false"
									/>
									<IconButton
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											onChange(field.id, null);
										}}
										style={{ display: "inline-block" }}
									>
										<DeleteIcon />
									</IconButton>
								</span>
							)) || (
								<ImageIcon
									style={{ fontSize: "40px", width: "100%", height: "100%" }}
								/>
							)}
							<input
								id={field.id}
								type="file"
								ref={pasteRef}
								onChange={handleChange}
								accept={field.accept}
								style={{ display: "none" }}
							/>
						</div>
						{field.autoCrop && (
							<label>
								<input type="checkbox" ref={refInputCrop} />
								{t("prevent_auto_crop")}
							</label>
						)}
					</Box>
				);
			case "file":
				field.accept = field.accept || "*";
				return (
					<input
						id={field.id}
						type="file"
						onChange={handleChange}
						accept={field.accept}
						style={{ marginTop: "10px" }}
					/>
				);
			case "file-multiple":
				field.accept = field.accept || "*";
				return (
					<Box onClick={() => document.getElementById(field.id).click()}>
						{value && value.length > 0 && value[0].name}
						<input
							id={field.id}
							type="file"
							onChange={handleChange}
							accept={field.accept}
							style={{ display: "none" }}
							multiple
						/>
					</Box>
				);
			case "country":
				return (
					<Country
						value={value}
						onChange={handleChange}
						field={field}
						definition={definition}
					/>
				);
			case "relation":
				break;
			case "composition":
				let subform = field.subform || field.def || null;
				let subform_definition = { ...definition };
				subform_definition.def = subform;
				subform_definition.subform = true;
				if (subform) {
					let memory = {};
					const addComposition = () => {
						let [valid, msgs] = validate(
							memory,
							null,
							subform_definition.def,
							true,
							true
						);
						if (!valid) {
							setSubformTextValidate(msgs);
							return;
						}
						if (!value) {
							value = [];
						}
						value.push(memory);
						onChange(field.id, value);
						setSubformTextValidate({});
						memory = {};
					};

					const removeComposition = (index) => {
						value.splice(index, 1);
						onChange(field.id, value);
					};

					return (
						<Box className="composition">
							<Box
								className="composition-item-btns"
								style={{ marginBottom: "12px" }}
							>
								<FormBuilder
									definition={{ ...subform_definition, reference: true }}
									reference={memory}
									forceSave={true}
									initTextValidate={subformTextValidate}
								/>
								<Button
									onClick={addComposition}
									variant="contained"
									color="primary"
									style={{ marginTop: "10px" }}
								>
									{t("add")}
								</Button>
							</Box>
							{value &&
								value instanceof Array &&
								value.map((v, i) => {
									return (
										<Box key={i} className="composition-item">
											<FormBuilder
												definition={subform_definition}
												reference={v}
												className="composition-item"
											/>
											<Button
												onClick={() => removeComposition(i)}
												variant="contained"
												color="primary"
												style={{ marginTop: "10px" }}
											>
												{t("delete")}
											</Button>
										</Box>
									);
								})}
						</Box>
					);
				}
				break;
			case "stars":
				return (
					<StarRating
						value={value}
						max={field.max || 10}
						onChange={(values) => {
							onChange(field.id, values);
						}}
					/>
				);
			case "color":
				return <input type="color" value={value} onChange={handleChange} />;
			case "image-gallery":
				return (
					<ImageGallery
						value={value}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						galleryType={field.galleryType || "slider"}
					/>
				);
			case "google-images":
				return <GoogleImages field={field} definition={definition} />;
			case "searxng-images":
				return <SearXNGImages field={field} definition={definition} />;
			case "lending":
				return (
					<Lending
						value={value}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						field={field}
					/>
				);
			case "code":
				return (
					<Code
						value={value}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						field={field}
					/>
				);
			case "scraping":
				return (
					<Scraping
						value={value}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						field={field}
						definition={definition}
					/>
				);
			case "sort-list":
				return (
					<SortList
						value={value}
						onChange={(values) => {
							onChange(field.id, values);
						}}
						field={field}
						definition={definition}
					/>
				);
			case "link":
				return (
					<LinkField
						value={value}
						onChange={onChange}
						placeholder={field.placeholder}
						field={field}
						definition={definition}
						reference={reference}
					></LinkField>
				);

				default:
				return null;
		}
	};

	const [afterRenderLabel, setAfterRenderLabel] = useState("");

	
	const [activeGPT, setActiveGPT] = useState(false);
	const renderLabel = useCallback(() => {
		return (
			<div className="dynamic-field-label">
				<Tooltip title={t(field.label || "")}>
					<Typography variant="subtitle1" component="label">
						{t(field.label)}
					</Typography>
				</Tooltip>
				{afterRenderLabel}
				{activeGPT && (
					<GPTField
						value={value}
						onChange={onChange}
						field={field}
						definition={definition}
					/>
				)}
			</div>
		);
	}, [field.label, t, afterRenderLabel, activeGPT]);


	useEffect(() => {
		const isActivated = async () => {
			if (field.is_gpt_field && await Config.get("module_gpt") && definition && definition.root) {
				setActiveGPT(true);
			}
		}
		isActivated();
	}, [field.is_gpt_field]);

	const className = "dynamic-field " + field.type;

	return (
		<FormControl
			fullWidth
			variant="standard"
			component="div"
			className={field.className}
		>
			{labelPosition === "top" && (typeof field.show_label === "undefined" || field.show_label) && renderLabel()}
			<Grid
				container
				alignItems="center"
				spacing={1}
				style={{ alignItems: "flex-start", flexWrap: "nowrap" }}
			>
				{labelPosition === "left" && (typeof field.show_label === "undefined" || field.show_label) && <Grid item>{renderLabel()}</Grid>}
				<Grid item flexGrow={1} className={className}>
					{renderInput()}
					
				</Grid>
				{labelPosition === "right" && (typeof field.show_label === "undefined" || field.show_label) && <Grid item>{renderLabel()}</Grid>}
				{field.help && (
					<Grid item>
						<Tooltip title={t(field.help)}>
							<HelpIcon style={{ cursor: "help" }} />
						</Tooltip>
					</Grid>
				)}
			</Grid>
			{labelPosition === "bottom" && (typeof field.show_label === "undefined" || field.show_label) && renderLabel()}
		</FormControl>
	);
};

























































































export default DynamicField;