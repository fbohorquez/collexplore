import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { Grid, Button, Typography } from "@mui/material";
import DynamicField from "./DynamicField";

import { useTranslation } from "react-i18next";

import { AppContext } from "../services/context";
import { FormContext } from "../services/context_form";
import {
	changeRow,
	scrollTableEnd,
	setSelectedItemId,
	clearCacheEntity,
} from "../services/helper";

import db from "../services/db";

const FormBuilder = ({
	objectId = null,
	definition,
	reference = null,
	style = {},
	className = "",
	forceSave = false,
	initTextValidate = {},
	onChange = (field, value) => {},
	noRenderRow = false,
	onSaved = (id) => {},
	pasteRef = null,
}) => {
	className = "form-builder " + className;
	const [formData, setFormData] = useState({});
	const [isValidate, setIsValidate] = useState(null);
	const [textValidate, setTextValidate] = useState(initTextValidate);
	const [btnMessage, setBtnMessage] = useState(false);

	const { setUpdateComponent, updateComponent } = useContext(AppContext);

	const { subscribe, notify } = useContext(FormContext);

	const document = definition.document;

	const { t } = useTranslation();
	

	useEffect(() => {
		const initData = definition.def.reduce((acc, field) => {
			acc[field.id] = field.default || "";
			return acc;
		}, {});
		let documentData = {};
		setTextValidate(initTextValidate);
		setIsValidate(null);
		if (definition["reference"]) {
			if (reference) {
				for (let def_i = 0; def_i < definition.def.length; def_i++) {
					const def_value = definition.def[def_i];
					let ref = reference;
					if (definition.field && reference[definition.field]) {
						ref = reference[definition.field];
					}
					if (ref[def_value.id] === undefined) {
						documentData[def_value.id] = def_value.default || "";
					} else {
						documentData[def_value.id] = ref[def_value.id];
					}
				}
				setFormData({ ...initData, ...documentData });
			}
		} else if (definition["key/value"]) {
			db[document].toArray().then((data) => {
				for (let def_i = 0; def_i < definition.def.length; def_i++) {
					const def_value = definition.def[def_i];
					const value = data.find((d) => d.key === def_value.id);
					documentData[def_value.id] = value
						? value.value
						: def_value.default || "";
				}
				setFormData({ ...initData, ...documentData });
			});
		} else {
			if (objectId) {
				db[document].get(objectId).then((data) => {
					documentData = {
						id: data.id,
					};
					for (let def_i = 0; def_i < definition.def.length; def_i++) {
						const def_value = definition.def[def_i];
						documentData[def_value.id] = data[def_value.id];
					}
					setFormData({ ...initData, ...documentData });
				});
			} else {
				setFormData(initData);
			}
		}
	}, [objectId, definition, document, reference]);

	let timePreventMultiChange = false;

	const handleChange = (id, value, old_value) => {

		setFormData((prev) => ({ ...prev, [id]: value }));
		notify(id, value, definition.root || reference);
		const saveType = definition["reference"]
			? "reference"
			: definition["key/value"]
			? "key/value"
			: "id";
		if (!definition.ondemand) {
			if (
				saveData(
					{ [id]: value },
					saveType
				)
			) {
				let field = definition.def.find((f) => f.id === id);
				if (field.onChange) {
					field.onChange(id, value, reference, old_value);
				}
				onChange(id, value);
			}
		} else {
			if (validate({ [id]: value }, true)) {
				let field = definition.def.find((f) => f.id === id);
				if (field.onChange) {
					field.onChange(id, value, reference, old_value);
				}
				onChange(id, value);
				if (saveType === "reference") {
					const data = { [id]: value };
					Object.entries(data).forEach(([key, value]) => {
						if (definition.field) {
							if (!reference[definition.field]) {
								reference[definition.field] = {};
							}
							reference[definition.field][key] = value;
						} else {
							reference[key] = value;
						}
					});
				}
			}
		}
		clearTimeout(timePreventMultiChange);
		timePreventMultiChange = false;
	};

	const validate = (data, notGlobal, def, validateDef, returnMsgs = false) => {
		let textValidate = {};
		setTextValidate({});
		let validate = true;
		def = def || definition.def;
		if (validateDef) {
			def.forEach((field) => {
				if (field.required && !data[field.id]) {
					validate = false;
					textValidate[field.id] = [t("validate-required")];
				}
			});
		}
		Object.entries(data).forEach(([key, value]) => {
			const field = def.find((f) => f.id === key);
			if (!field) {
				return;
			}
			if (textValidate[key] === undefined) {
				textValidate[key] = [];
			}
			if (field.required && !value) {
				validate = false;
				if (textValidate[key].length === 0) {
					textValidate[key].push(t("validate-required"));
				}
			}
			if (field.type === "select") {
				field.options = field.options.filter((option) => option && option.value);
				field.allow_values = field.options.map((option) => option.value);
			}
			if (field.allow_values && !field.allow_values.includes(value)) {
				validate = false;
				textValidate[key].push(
					t("validate-allowed-values") + field.allow_values.join(", ")
				);
			}
			if (field.maxLength && value.length > field.maxLength) {
				validate = false;
				textValidate[key].push(t("validate-max-length") + field.maxLength);
			}
			if (field.minLength && value.length < field.minLength) {
				setIsValidate(false);
				validate = false;
				textValidate[key].push(t("validate-min-length") + field.minLength);
			}
		});
		if (!notGlobal) {
			setIsValidate(validate);
		}
		setTextValidate(textValidate);
		if (returnMsgs) {
			return [validate, textValidate];
		}
		return validate;
	};

	// let isSaving = false;

	const isSavingRef = useRef(false);

	const saveData = useCallback(async (data, saveType) => {
		
		while (isSavingRef.current) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		isSavingRef.current = true;
		// isSaving = true;

		try {
			let valid = true;
			if (!validate(data) || (definition.before && !definition.before(data))) {
				valid = false;
				if (!forceSave) {
					// isSaving = false;
					isSavingRef.current = false;
					return valid;
				}
			}
			
			if (saveType === "reference") {
				let beforeValues = {};
				let references = reference;
				if (!Array.isArray(references)) {
					references = [references];
				}
				
				
				references.forEach((reference) => {
					Object.entries(data).forEach(([key, value]) => {
						if (Array.isArray(reference[key])) {
							beforeValues[key] = [...reference[key]];
						}
						else if (typeof reference[key] === "object") {
							beforeValues[key] = { ...reference[key] };
						} else {
							beforeValues[key] = reference[key];
						}
						if (definition.field) {
							if (!reference[definition.field]) {
								reference[definition.field] = {};
							}
							reference[definition.field][key] = value;
						} else {
							reference[key] = value;
							if (Array.isArray(reference)) {
								reference.forEach((ref) => {
									if (Array.isArray(ref.fields[key]) && Array.isArray(value)) {
										ref.fields[key] = ref.fields[key].concat(value).filter((item, index, self) => self.indexOf(item) === index);
									} else {
										ref.fields[key] = value;
									}
								});	
								if(definition.root && Array.isArray(definition.root)){
									definition.root.forEach((ref) => {
										if (Array.isArray(ref.fields[key]) && Array.isArray(value)) {
											ref.fields[key] = ref.fields[key].concat(value).filter((item, index, self) => self.indexOf(item) === index);
										} else {
											ref.fields[key] = value;
										}
									});		
								}
							}
							else {
								reference[key] = value;
							}
						}
					});
				});

				if (definition.document) {
					
					const SaveRoot = async (root) => {
						if (root.saveOverride) {
							root.saveOverride();
							return;
						}
						if (!root.cache) {
							root.cache = {};
						}
						if (!beforeValues.cache){
							beforeValues.cache = {};
						}
						
						for (let key in data) {
							if (root.fields){
								root.fields[key] = data[key];
							}else {
								root[key] = data[key];
							}
							let value = data[key];
							let field_def = definition.def.find((f) => f.id === key);
							
							if (field_def.type === "entity") {
								if (field_def.multiple && value instanceof Array) {
									if (!window.document.body.classList.contains("group-edition")) {
										root.cache[key] = [];		
										beforeValues.cache[key] = [];
									}
									for (let i = 0; i < value.length; i++) {
										let entity = await db.entity.get(value[i]);
										if (entity) {
											if(!root.cache){
												root.cache = {};
											}
											if(!beforeValues.cache){
												beforeValues.cache = {};
											}
											if(!root.cache[key]){
												root.cache[key] = [];
											}
											if(!beforeValues.cache[key]){
												beforeValues.cache[key] = [];
											}
											let cacheEntity = clearCacheEntity(entity);
											if (root.cache[key]) {
												beforeValues.cache[key].push(root.cache[key]);
											}
											root.cache[key].push(cacheEntity);
											
										}
									}
								} else {
									if (root.cache[key]) {
										beforeValues.cache[key] = root.cache[key];
									}
									root.cache[key] = null;
									
									let entity = await db.entity.get(value);
									if (entity) {
										let cacheEntity = clearCacheEntity(entity);
										root.cache[key] = cacheEntity;
										
									}
								}
							}
						}
						if (window.ModeExplorer) {
							let event = new CustomEvent("refreshExplorer", { detail: { root } });
							window.dispatchEvent(event);
							return;
						}
						if (!root.id && !Array.isArray(root)) {
							root.updated_at = root.created_at = new Date();
							root.id = await db[definition.document].add(root);
							setUpdateComponent(!updateComponent);
							if (definition.document.includes("lists")) {
								root.id = "lists-" + root.id;
								root.document = definition.document;
							}
							setSelectedItemId(root.id);
							// if(!noRenderRow){
							// 	setTimeout(() => {
							// 		scrollTableEnd(root.id);
							// 	}, 100);
							// }
						} else {
							beforeValues.id = root.id;
							if (!Array.isArray(root)) {
								if (typeof root.id === "string" && root.id.includes("lists-")) {
									let new_root = { ...root };
									new_root.id = new Number(root.id.replace("lists-", "")) + 0;
									db[new_root.document || definition.document].update(new_root.id, new_root);
								} else {
									let new_root = { ...root, updated_at: new Date() };
									db[new_root.document || definition.document].update(root.id, new_root);
								}
							} else {
								root.forEach((r) => {
									if (typeof r.id === "string" && r.id.includes("lists-")) {
										let new_root = { ...r, updated_at: new Date() };
										new_root.id = new Number(r.id.replace("lists-", "")) + 0;
										db[new_root.document].update(new_root.id, new_root);
									} else {
										let new_root = { ...r, updated_at: new Date() };
										db[new_root.document].update(r.id, new_root);
									}
								});
							}
						}
						let iD = root.id;
						if (root && root.fields && root.fields['lists']) {
							// for (let listID of root.fields['lists']) {
							// 	let list = await db.lists.get(listID);
							// 	if (list && list.items) {
							// 		let id = root.id;
							// 		if (root.document === "lists-items" && !(root.id + "").includes("lists-")) {
							// 			id = "lists-" + root.id;
							// 		}
									
							// 		let indexList = list.items.indexOf(id);
							// 		if (indexList === -1) {
							// 			list.items.push(id);
							// 			db.lists.update(listID, list);
							// 		}
							// 	}
							// }
							if (beforeValues && beforeValues['lists']) {
								let deleteListValues = beforeValues['lists'].filter((listID) => !root.fields['lists'].includes(listID));
								for (let listID of deleteListValues) {
									let list = await db.lists.get(listID);
									if (list && list.items) {
										let id = root.id;
										if (root.document === "lists-items" && !(root.id + "").includes("lists-")) {
											id = "lists-" + root.id;
										}
										let indexList = list.items.indexOf(id);
										if (indexList !== -1) {
											list.items.splice(indexList, 1);
											db.lists.update(listID, list);
										}
									}
								}
							}else {
								beforeValues['lists'] = [];
							}
							let addListValues = root.fields['lists'].filter((listID) => !beforeValues['lists'].includes(listID));
							for (let listID of addListValues) {
								let list = await db.lists.get(listID);
								if (list && list.items) {
									let id = root.id;
									if (root.document === "lists-items" && !(root.id + "").includes("lists-")) {
										id = "lists-" + root.id;
									}
									let indexList = list.items.indexOf(id);
									if (indexList === -1) {
										list.items.push(id);
										db.lists.update(listID, list);
									}
								}
							}
						}
						if(!noRenderRow){
								// root.document = definition.document;
								changeRow(root);
						}
						//update Lists: 
						
						

						onSaved(iD, beforeValues, root);
					};
					if (Array.isArray(reference)) {
						for (let ref of reference) {
							await SaveRoot(ref);
						}
					} else {
						let root = definition.root || reference;
						await SaveRoot(root);
					}
				}else {
					onSaved(reference.id, beforeValues, reference);
				}
			} else if (saveType === "key/value") {
				Object.entries(data).forEach(async ([key, value]) => {
					db[document].put({ key, value });
				});
			} else {
				if (objectId) {
					await db[document].update(objectId, data);
				} else {
					if (document) {
						await db[document].add(data);
					}
				}
			}
			if (definition.after) {
				definition.after(data);
			}
			// if (!definition.subform) {
			// 	setUpdateComponent(!updateComponent);
			// }
			// isSaving = false;
			isSavingRef.current = false;
			return valid;
		} 
		catch (error) {
			console.error(error);
		}
		finally {
			// isSaving = false;
			isSavingRef.current = false;
		}
	}, [definition, document, reference, updateComponent, objectId, onSaved, noRenderRow]);

	const saveClickBtn = (formData, type) => {
		saveData(formData, type);
		if (definition.ondemand) {
			setBtnMessage(true);
			setTimeout(() => {
				setBtnMessage(false);
			}, 2000);
		}
	};

	const handleKeyDown = (event) => {
		if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
			event.preventDefault(); // Previene el comportamiento por defecto del evento, en este caso, enviar el formulario
		}
	};

	return (
		<div className={className} onKeyDown={handleKeyDown}>
			<Grid
				style={style}
				container
				spacing={{ xs: definition.columnGap || 2, sm: definition.rowGap || 2 }}
			>
				{definition.def.map((field, index) => {
					return (
						<Grid
							item
							xs={12 / (definition.columns || 1)}
							key={field.id}
							className="form-builder-field"
							style={{ padding: definition.formPadding, ...(field.style || {}) }}
						>
							<DynamicField
								key={field.id}
								field={field}
								tabIndex={index}
								value={formData[field.id]}
								onChange={handleChange}
								labelPosition={
									field.labelPosition || definition.labelPosition || "top"
								}
								definition={definition}
								reference={reference}
								validate={validate}
								onChangeForm={onChange}
								pasteRef={pasteRef}
							/>
							{textValidate[field.id] && textValidate[field.id].length > 0 && (
								<div style={{ color: "red", fontSize: "10px" }}>
									{textValidate[field.id].map((text, i) => (
										<div key={i}>{text}</div>
									))}
								</div>
							)}
						</Grid>
					)
				})}
			</Grid>
		</div>
	);
};


























































export default FormBuilder;