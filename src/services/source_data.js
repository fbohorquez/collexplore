import React, { useContext, useState, useMemo, useRef, useEffect } from "react";

import {clearCacheEntity} from "./helper";

import { Box, Button, Tooltip, Select, MenuItem } from "@mui/material";

import { XMLParser } from "fast-xml-parser";

import db from "./db";

import {
	selectPopup,
	replaceKeysInValues,
	getOrAddEntity,
	changeRow,
	cropLargestObject,
} from "./helper";

import i18n from "./i18n";

import countries from "../locales/countries";

const { equivalenceTable: equivalenceCountry } = countries;
const importField = async (id_field, value, typeDefinition, transform_func) => {
	let field = typeDefinition.fields.find((field) => field.id === id_field);
	if (!field) {
		return value;
	}

	if (field.type === "image") {
		try {
			if (value instanceof File) {
				return value;
			} else if (typeof value === "string" && value.startsWith("http")) {
				if (transform_func) {
					const func = eval(`(${transform_func})`);
					value = func(value);
				}
				return new Promise(async (resolve, reject) => {
					let imgTag = new Image();
					imgTag.src = value;
					imgTag.addEventListener("load", async () => {
						const response = await fetch(value, {
							method: "GET",
							headers: {
								"User-Agent": navigator.userAgent,
							},
						});
						let blob = await response.blob();
						if (field.type === "image" && field.autoCrop) {
							blob = await cropLargestObject(blob);
						}
						resolve(blob);
						imgTag.remove();
					});
					imgTag.addEventListener("error", () => {
						reject();
						imgTag.remove();
					});
					imgTag.style.position = "absolute";
					imgTag.style.top = "-10000px";
					imgTag.style.left = "-10000px";
					document.body.appendChild(imgTag);
				});
			} else {
				return new Blob([value], { type: "image/jpeg" });
			}
		} catch (error) {
			console.error("Error processing image field", error);
			return null;
		}
	} else if (field.type === "entity") {
		if (field.multiple) {
			if (!(value instanceof Array)) {
				if (typeof value === "string") {
					value = value.split(",");
				} else {
					value = [""];
				}
			}
			value = value.filter((v) => v !== "");
			let entities = [];
			let entityCache = {};
			const names = Array.isArray(value) ? value : value.split(",");
			for (let name of names) {
				if (typeof name === "object" && name.name) {
					name = name.name;
				}
				if (!entityCache[name]) {
					entityCache[name] = await getOrAddEntity(name, field, false);
				}
				if (entityCache[name].id && entityCache[name].id.id) {
					entityCache[name] = entityCache[name].id;
				}
				if (entityCache[name] && entityCache[name].item) {
					if (
						JSON.stringify(entityCache[name].item.fields) !==
						JSON.stringify(field.fields)
					) {
						for (let key in entityCache[name].item.fields) {
							if (field.fields && field.fields[key]) {
								if (entityCache[name].item.fields[key] instanceof Array) {
									entityCache[name].item.fields[key] = [
										...entityCache[name].item.fields[key],
										...field.fields[key],
									];
								} else {
									entityCache[name].item.fields[key] = field.fields[key];
								}
							}
						}
						db.entity.update(entityCache[name].item.id, entityCache[name].item);
					}
				}
				entities.push(entityCache[name].id);
			}
			return entities;
		} else {
			if (!value) {
				return "";
			}
			const { id: entityId } = await getOrAddEntity(value, field, false);
			return entityId;
		}
	} else if (field.type === "country") {
		if (field.multiple) {
			if (!(value instanceof Array)) {
				value = value.split(",");
			}
			value = value.map((country) => {
				return equivalenceCountry(country) || country.toLowerCase();
			});
			return value;
		} else {
			return equivalenceCountry(value) || value.toLowerCase();
		}
	} else {
		return value;
	}
};

const completeFromScrapingSource = async (
	sourceScraping,
	typeDefinition,
	data,
	setData,
	startProcess,
	component,
	isListGenerator
) => {
	try {
		if (!sourceScraping.definition) {
			throw new Error("Definition is empty");
		}
		if (!JSON.parse(sourceScraping.definition)) {
			throw new Error("Definition is not valid JSON");
		}
		let definition = JSON.parse(sourceScraping.definition);
		let items = [];
		let filtersInput = [{}];
		if (
			(
				sourceScraping.type === "scraping-for-item" ||
				sourceScraping.type === "scraping-for-item-from-list" ||
				sourceScraping.type === "scraping-to-list"
			) &&
			data.name
		) {
			items = [{ name: data.name }];
		}

		const handleSetData = async (scraping_result) => {
			if (!scraping_result) {
				return;
			}
			if (!isListGenerator) {
				const fields = typeDefinition.sources.find(
					(source) => source.source === sourceScraping.id
				);
				const dataCopy = { ...data };
				if (scraping_result && scraping_result.item && scraping_result.item[0]) {
					scraping_result = scraping_result.item[0];
				}
				for (let field of fields.fields) {
					if (field.selector) {
						let value = scraping_result[field.selector];
						if (field.id === "name") {
							dataCopy.name = value;
						} else {
							dataCopy.fields[field.id] = await importField(
								field.id,
								value,
								typeDefinition,
								field.transform
							);
							if (field.transform && field.type != "image") {
								const func = eval(`(${field.transform})`);
								dataCopy.fields[field.id] = func(dataCopy.fields[field.id]);
							}
							if (field.type === "entity") {
								let key = field.id;
								value = dataCopy.fields[key];
								if (field.multiple && value instanceof Array) {
									if (!dataCopy.cache) {
										dataCopy.cache = {};
									}
									dataCopy.cache[key] = [];
									for (let i = 0; i < value.length; i++) {
										let entity = await db.entity.get(value[i]);
										if (entity) {
											if (!dataCopy.cache) {
												dataCopy.cache = {};
											}
											if (!dataCopy.cache[key]) {
												dataCopy.cache[key] = [];
											}
											dataCopy.cache[key].push(entity);
										}
									}
								} else {
									if (!dataCopy.cache) {
										dataCopy.cache = {};
									}
									dataCopy.cache[key] = null;
									let entity = await db.entity.get(value);
									if (entity) {
										dataCopy.cache[key] = clearCacheEntity(entity);
									}
								}
							}
						}
					}
				}
				setData(dataCopy);
				if (dataCopy.id) {
					if (component) {
						db[component].update(dataCopy.id, dataCopy).then(() => {
							changeRow(dataCopy);
						});
					}
				} else {
					changeRow(dataCopy);
				}
				let eventSave = new CustomEvent("saveDetail", {
					detail: {
						id: dataCopy.id,
						item: dataCopy,
						type: component,
					},
				});
				window.dispatchEvent(eventSave);
			} else {
				if(scraping_result.result && Array.isArray(scraping_result.result)){
					let items = [];
					for (let result of scraping_result.result) {
						if (!result || !result.name) {
							continue;
						}
						let { name:resultName, img:resultImg, source:sourceUrl, ...props} = result;
						
						let imgFieldIndex = typeDefinition.fields.findIndex((field) => field.type === "image" && field.main);
						if (imgFieldIndex !== -1) {
							let imgFieldId = typeDefinition.fields[imgFieldIndex].id;
							const dataCopy = {
								type: typeDefinition.id,
								fields: {},
								cache: {},
								name: resultName,
								in_collection: false,
								sourceId: sourceScraping.id,
								sourceUrl: sourceUrl,
							};
							dataCopy.fields[imgFieldId] = await importField(imgFieldId, resultImg, typeDefinition).then((value) => {
								return value;
							}).catch((error) => {
								console.error("Error processing image field", error);
							});
							Object.keys(props).forEach(async (key) => {
								if (key.startsWith("preview_")) {
									if (!dataCopy.preview) {
										dataCopy.preview = {};
									}
									dataCopy.preview[key.replace("preview_", "")] = props[key];
								}
								else {
									let field = typeDefinition.fields.find((field) => field.label === key);
									if (field) {
										// dataCopy.fields[field.id] = props[key];
										dataCopy.fields[field.id] = await importField(field.id, props[key], typeDefinition);
									}
								}
							});

							items.push(dataCopy);
						}
						
					}
					setData(items);
				}
				
			}
		};

		const handleProcessMessage = (message, uniqueId) => {
			const { event, data: msg } = message;
			switch (event) {
				case "processStarted":
					break;
				case "processCompleted":
					handleSetData(msg.results.results[0]);
					break;
				case "processError":
					console.log("Error en el proceso", msg.error);
					break;
				case "stepReport":
					// handleSetData(msg.context.results[0].item[0]);
					break;
				default:
					console.log("Evento desconocido:", event);
			}
		};

		let processSubscribers = startProcess(
			definition,
			items,
			filtersInput,
			data.omit,
			"scraping_item_" + data.name + "_" + sourceScraping.id,
			(message) => {
				handleProcessMessage(message, "scraping_item_" + data.name + "_" + sourceScraping.id);
			}
		);
	} catch (error) {
		console.error(error);
	}
};

const SelectSourceComponent = ({
	sources,
	typeDefinition,
	data,
	setData,
	startProcess,
	component,
	sources_type,
}) => {
	const selectRef = useRef(null);
	const [selectedValue, setSelectedValue] = React.useState(0); // Estado para manejar el valor seleccionado

	// Función para manejar el cambio de selección
	const handleSelectChange = (value) => {
		if (value && String(value).startsWith("scraping_")) {
			completeFromScrapingSource(
				sources.find((source) => source.id === value),
				typeDefinition,
				data,
				setData,
				startProcess,
				component
			);
			selectPopup(null);
		} else {
			let source = sources.find((source) => source.id === value);

			if (!source) {
				return;
			}
			completeFromSource(
				source,
				sources_type[sources.indexOf(source)],
				data,
				setData,
				typeDefinition,
				component
			);
			selectPopup(null);
		}
	};

	// Manejador de onChange
	const handleChange = (event) => {
		const value = event.target.value;
		setSelectedValue(value); // Actualiza el estado
		handleSelectChange(value);
	};

	// Manejador de onKeyDown
	const handleKeyDown = (event) => {
		if (event.key === "Enter") {
			event.preventDefault(); // Previene el comportamiento por defecto
			event.stopPropagation(); // Previene la propagación del evento
			handleSelectChange(selectedValue); // Ejecuta la lógica de selección
		}
	};

	return (
		<Box>
			<Select
				ref={selectRef}
				autoFocus
				value={selectedValue}
				placeholder={i18n.t("select-source")}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
			>
				<MenuItem value={0} style={{ color: "gray" }}>
					{i18n.t("sources-data")}
				</MenuItem>
				{sources.map((source, index) => (
					<MenuItem key={index} value={source.id}>
						{source.name}
					</MenuItem>
				))}
			</Select>
		</Box>
	);
};

export const completeFromSources = (
	sources,
	sources_type,
	data,
	setData,
	typeDefinition,
	component,
	startProcess,
	isListGenerator
) => {
	if (sources.length > 1) {
		selectPopup({
			title: i18n.t("select-source"),
			content: () => (
				<SelectSourceComponent
					{...{
						sources,
						sources_type,
						data,
						setData,
						typeDefinition,
						component,
						startProcess,
					}}
				/>
			),
			btns: [
				{
					label: i18n.t("cancel"),
					action: () => {
						selectPopup(null);
					},
				},
			],
		});
	} else if (sources.length === 1) {
		if (sources[0].id && String(sources[0].id).startsWith("scraping_")) {
			completeFromScrapingSource(
				sources[0],
				typeDefinition,
				data,
				setData,
				startProcess,
				component,
				isListGenerator
			);
		} else {
			completeFromSource(
				sources[0],
				sources_type[0],
				data,
				setData,
				typeDefinition,
				component
			);
		}
	}
};

async function processReturnCallBack (resp, data, setData, source_type, typeDefinition, component){
	let new_data = { ...data };
	for (let source_type_field of source_type.fields) {
		if (resp[source_type_field.selector]) {
			let value = resp[source_type_field.selector];
			if (value instanceof Array) {
				if (
					source_type_field.filter &&
					source_type_field.filter.includes("==")
				) {
					let [filter_key, filter_value] = source_type_field.filter.split("==");
					filter_value = filter_value
						.replace(/"/g, "")
						.replace(/'/g, "")
						.trim();
					filter_key = filter_key.trim();
					value = value.filter(
						(item) =>
							item.all_value[filter_key].toLowerCase() ===
							filter_value.toLowerCase()
					);
					if (value.length) {
						if (value[0].all_value) {
							value = value.map((item) => item.value);
						}
					}
				}
				if (
					source_type_field.filter &&
					(source_type_field.filter.includes("function") ||
						source_type_field.filter.includes("=>"))
				) {
					value = value.filter((item) => {
						const func = eval(`(${source_type_field.filter})`);
						return func(item.all_value || item);
					});
					if (value.length) {
						if (value[0].all_value) {
							value = value.map((item) => item.value);
						}
					}
				} else {
					if (value.length) {
						if (value[0].all_value) {
							value = value.map((item) => item.value);
						}
					}
				}
			}
			if (source_type_field.id != "name") {
				new_data.fields[source_type_field.id] = await importField(
					source_type_field.id,
					value,
					typeDefinition,
					source_type_field.transform
				);
				if (source_type_field.transform && source_type_field.type != "image") {
					const func = eval(`(${source_type_field.transform})`);
					new_data.fields[source_type_field.id] = func(
						new_data.fields[source_type_field.id]
					);
				}
				if (source_type_field.type === "entity") {
					let key = source_type_field.id;
					value = new_data.fields[key];
					if (source_type_field.multiple && value instanceof Array) {
						if (!new_data.cache) {
							new_data.cache = {};
						}
						new_data.cache[key] = [];
						for (let i = 0; i < value.length; i++) {
							let entity = await db.entity.get(value[i]);
							if (entity) {
								if (!new_data.cache) {
									new_data.cache = {};
								}
								if (!new_data.cache[key]) {
									new_data.cache[key] = [];
								}
								new_data.cache[key].push(entity);
							}
						}
					} else {
						new_data.cache[key] = null;
						let entity = await db.entity.get(value);
						if (entity) {
							new_data.cache[key] = clearCacheEntity(entity);
						}
					}
				}
			} else {
				new_data.name = value instanceof Array ? value.join(", ") : value;
				if (source_type_field.transform) {
					const func = eval(`(${source_type_field.transform})`);
					new_data.name = func(new_data.name);
				}
			}
		}
	}
	setData(new_data);

	if (new_data.id) {
		let iDOriginal = new_data.id;
		if (typeof new_data.id === "string" && new_data.id.includes("lists-")) {
			new_data.id = parseInt(new_data.id.replace("lists-", ""));
		}
		if (component && db[component] && db[component].update) {
			db[component].update(new_data.id, new_data).then(() => {
				changeRow(new_data);
				new_data.id = iDOriginal;
				let eventSave = new CustomEvent("saveDetail", {
					detail: {
						id: new_data.id,
						item: new_data,
						type: component,
						beforeSave: data,
					},
				});
				window.dispatchEvent(eventSave);
				let eventRefreshExplorer = new CustomEvent("refreshExplorer", {
					detail: {
						root: new_data,
					},
				});
				window.dispatchEvent(eventRefreshExplorer);
			});
		}
	} else {
		if (!window.ModeExplorer) {
			let iDOriginal = new_data.id;
			changeRow(new_data);
			new_data.id = iDOriginal;
			// let eventSave = new CustomEvent("saveDetail", {
			// 	detail: {
			// 		id: new_data.id,
			// 		item: new_data,
			// 		type: component,
			// 	},
			// });
			// window.dispatchEvent(eventSave);
		} else {
			let eventRefreshExplorer = new CustomEvent("refreshExplorer", {
				detail: {
					root: new_data,
				},
			});
			window.dispatchEvent(eventRefreshExplorer);
		}
	}
};

const completeFromSource = (
	source,
	source_type,
	data,
	setData,
	typeDefinition,
	component
) => {
	
	if (source.requests && source.requests.length > 0) {
		let data_request = source.requests[0];
		if (!data_request.method) {
			data_request.method = "GET";
		}
		data_request.search = data.name;
		data_request.lang = i18n.language;
		data_request.api_key = source.api_key;
		let not_associated = [];
		source.requests.forEach((request) => {
			if (request.keys_json) {
				request.keys_json.forEach((key) => {
					let is_associated = false;
					for (let source_type_field of source_type.fields) {
						if (source_type_field.selector === key) {
							is_associated = true;
							break;
						}
					}
					if (!is_associated || key === "name") {
						not_associated.push(key);
					}
				});
			}
		});
		runRequest(
			source,
			source_type,
			data_request,
			source.requests.length - 1,
			0,
			not_associated,
			async (resp) => {
				processReturnCallBack(resp, data, setData, source_type, typeDefinition, component);
			},
			setData
		);
	}
};

function getValueByPath(obj, path, i) {
	const properties = path.replace(/\[(\d+)\]/g, ".$1").split("."); // Convertimos [x] a .x y luego dividimos en propiedades.
	properties.forEach((prop, index) => {
		if (
			prop === "items" &&
			properties[index + 1] &&
			properties[index + 1] === i.toString()
		) {
			properties[index + 1] = i; // Reemplazamos el índice por el valor de i.
		}
	});

	return properties.reduce((acc, prop) => acc && acc[prop], obj); // Navegamos por el objeto usando reduce.
}

function runRequest(
	source,
	source_type,
	concat_data,
	indexLast,
	indexCurrent,
	not_associated,
	callback,
	setData,
	selected_index
) {
	let headers = {};
	let request = source.requests[indexCurrent];
	concat_data = { ...concat_data, ...request };
	concat_data = replaceKeysInValues(concat_data);
	if (concat_data.headers) {
		concat_data.headers.split("\n").forEach((line) => {
			let [key, value] = line.split(":");
			if (!key || !value) return;
			headers[key.trim()] = value.trim();
		});
	}
	let body = {};
	if (concat_data.body) {
		try {
			body = JSON.parse(concat_data.body);
		} catch (e) {
			console.error(e);
		}
	}
	let request_options = {
		method: concat_data.method,
		headers: headers,
	};
	if (concat_data.method !== "GET") {
		request_options.body = JSON.stringify(body);
	}
	if (concat_data.url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) {
		concat_data = {
			...concat_data,
			[indexCurrent + 1 + ":img"]: concat_data.url,
		};
		if (indexCurrent === indexLast) {
      if (source.is_list_generator) {
        listGenerator(source, request, null, concat_data, setData);
      }else {
        callback(concat_data);
      }
			return;
		} else {
			runRequest(
				source,
				source_type,
				concat_data,
				indexLast,
				indexCurrent + 1,
				not_associated,
				callback,
				setData,
				selected_index
			);
			return;
		}
	}
	fetch(concat_data.url, request_options)
		.then((response) => {
			const contentType = response.headers.get("content-type");
			if (
				contentType &&
				(contentType.includes("application/xml") ||
					contentType.includes("text/xml"))
			) {
				return response.text().then((str) => {
					const parser = new XMLParser({
						ignoreAttributes: false,
						attributeNamePrefix: "@_",
					});
					return parser.parse(str);
				});
			} else {
				return response.json();
			}
		})
		.then((resp) => {
			let listValues = [];
			if (request.keys_json) {
				let values = {};
				
				const getAllValues = (value_array, keys, i_key, type_field_def) => {
					if (!value_array) {
						return [];
					}
					let resp = [];
					let filter = false;
					let filter_key = null;
					let filter_value = null;
					if (filter) {
						[filter_key, filter_value] = filter.split("==");
						filter_value = filter_value
							.replace(/"/g, "")
							.replace(/'/g, "")
							.trim();
						filter_key = filter_key.trim();
					}
					let isValue = false;
					if (!Array.isArray(value_array)) {
						value_array = [value_array];
						isValue = true;
					}
					for (let i = 0; i < value_array.length; i++) {
						let value = value_array[i];
						let all_value = value_array;
						for (let j = i_key; j < keys.length; j++) {
							if (keys[j].includes("[")) {
								let [k, index] = keys[j].split("[");
								index = index.replace("]", "");
								if (value && value[k] && Array.isArray(value[k])) {
									value = value[k][index];
								}
								else if (value && value[k] && !Array.isArray(value[k])) {
									value = value[k];
								}
								else {
									value = null;
									all_value = null;
									break;
								}
								all_value = value[k];
							} else {
								if (!filter) {
									all_value = value;
									value = value ? value[keys[j]] : "";
								} else {
									if (
										value[filter_key].toLowerCase() ===
										filter_value.toLowerCase()
									) {
										all_value = value;
										value = value[keys[j]];
									} else {
										value = null;
										all_value = null;
										break;
									}
								}
							}
						}
						if (value) {
							resp.push({
								value: value,
								all_value: all_value,
							});
						}
					}
					if (isValue) {
						resp = resp[0];
					}
					return resp;
				};
				for (let key of request.keys_json) {
					let [req_index, subkey] = key.split(":");
					key = subkey;
					let keys = key.split(".");
					let value = resp;
					if (!value) {
						continue;
					}
					for (let i = 0; i < keys.length; i++) {
						if (keys[i].includes("[")) {
							let [k, index] = keys[i].split("[");
							index = index.replace("]", "");
							if (true) {
								if (selected_index === undefined) {
									if (
										value &&
										value[k] &&
										value[k].length > 1 &&
										!request.unique
									) {
										if (!(indexCurrent === indexLast && source.is_list_generator)) {
											popupSelectIndex(
												source,
												source_type,
												concat_data,
												indexLast,
												indexCurrent,
												not_associated,
												callback,
												selected_index,
												value[k],
												keys.slice(0, i + 1),
												keys.splice(i + 1),
												setData
											);
											return;
										}
									} else if (
										(value && value[k] && value[k].length === 1) ||
										request.unique
									) {
										selected_index = 0;
										index = selected_index;
									} else {
										//ERROR NOT FOUND
										selectPopup({
											title: i18n.t("source-data-error"),
											content: i18n.t("source-data-error-not-found"),
											btns: [
												{
													label: i18n.t("ok"),
													action: () => {
														selectPopup(null);
													},
												},
											],
										});
										return;
									}
								} else {
									if (selected_index !== -1) {
										index = selected_index;
									}
								}
								if (not_associated.includes(indexCurrent + 1 + ":" + key)) {
									value = value[k][index];
								} else {
									if (source.is_list_generator && value[k] && Array.isArray(value[k])) {
										let itemsListValues = value[k];
										for (let ii = 0; ii < itemsListValues.length; ii++) {
											let value = itemsListValues[ii];
											value = getAllValues(
												value,
												keys,
												i + 1,
												source_type.fields.find(
													(field) => field.selector === req_index + ":" + key
												)
											);
											if (value && value.value) {
												value = value.value;
											}
											if (!listValues[ii]) {
												listValues[ii] = {};
											}
											listValues[ii][req_index + ":" + key] = value;
										}
									}
										value = getAllValues(
											source.is_list_generator ? value[k] : value[k][index],
											keys,
											i + 1,
											source_type.fields.find(
												(field) => field.selector === req_index + ":" + key
											)
										);
									if (!source.is_list_generator && value && value.value) {
										value = value.value;
									}
									break;
								}
							} else {
								value = getAllValues(
									value[k],
									keys,
									i + 1,
									source_type.fields.find(
										(field) => field.selector === req_index + ":" + key
									)
								);
								break;
							}
						} else {
							if (value) {
								value = value[keys[i]];
							}
						}
					}
					values[req_index + ":" + key] = value;
				}
				concat_data = { ...concat_data, ...values };
			}
			if (selected_index !== undefined && selected_index !== -1) {
				selected_index = -1;
			}
			if (indexCurrent === indexLast) {
				if (source.is_list_generator) {
					
					listGenerator(source, request, resp, concat_data, setData, listValues);
				} else {
					callback(concat_data);
				}
			} else {
				runRequest(
					source,
					source_type,
					concat_data,
					indexLast,
					indexCurrent + 1,
					not_associated,
					callback,
					setData,
					selected_index
				);
			}
		})
		.catch((error) => {
			callback(concat_data);
		});
}

function popupSelectIndex(
	source,
	source_type,
	concat_data,
	indexLast,
	indexCurrent,
	not_associated,
	callback,
	selected_index,
	values,
	keys_process,
	keys_next,
	setData
) {
	let selectedIndex = 0;

	const handleKeyDown = (event) => {
		event.stopPropagation();
		if (event.key === "ArrowUp") {
			event.preventDefault();
			selectedIndex = (selectedIndex - 1 + values.length) % values.length;
			if (document.getElementById(`button-${selectedIndex}`)) {
				document.getElementById(`button-${selectedIndex}`).focus();
			}
		} else if (event.key === "ArrowDown") {
			event.preventDefault();
			selectedIndex = (selectedIndex + 1) % values.length;
			if (document.getElementById(`button-${selectedIndex}`)) {
				document.getElementById(`button-${selectedIndex}`).focus();
			}
		} else if (event.key === "Enter") {
			if (document.getElementById(`button-${selectedIndex}`)) {
				document.getElementById(`button-${selectedIndex}`).click();
			}
		}
	};
	const addKeyListener = () => {
		document.addEventListener("keydown", handleKeyDown);
	};

	const removeKeyListener = () => {
		document.removeEventListener("keydown", handleKeyDown);
	};

	keys_process = keys_process.join(".");
	selectPopup({
		onClose: () => {
			removeKeyListener();
		},
		title: i18n.t("select-index"),
		content: () => {
			addKeyListener();
			setTimeout(() => {
				document.getElementById(`button-${selectedIndex}`)?.focus();
			}, 100);
			return (
				<Box>
					{values.map((value, index) => {
						let str = "";
						if (typeof value === "object") {
							if (source.selectors_naming) {
								let keys = source.selectors_naming.split(",");
								str = keys
									.map((key) => {
										return getValueByPath(value, key, index);
									})
									.join(" | ");
							} else {
								str = JSON.stringify(value);
							}
						} else {
							for (let i = 0; i < not_associated.length; i++) {
								let [req_index, key] = not_associated[i].split(":");
								if (key.startsWith(keys_process)) {
									key = key.replace(keys_process + ".", "");
									let subkeys = key.split(".");
									let subvalue = value;
									for (let subkey of subkeys) {
										if (subkey.includes("[")) {
											let [k, index] = subkey.split("[");
											index = index.replace("]", "");
											if (subvalue && subvalue[k]) {
												subvalue = subvalue[k][index];
											}
										} else {
											if (subvalue) {
												subvalue = subvalue[subkey];
											}
										}
									}
									str += subvalue + " | ";
								}
							}
							str = str.slice(0, -3);
						}
						return (
							<Button
								id={`button-${index}`}
								style={{ display: "block", width: "100%" }}
								key={index}
								onClick={() => {
									selectPopup(null);
									removeKeyListener();
									runRequest(
										source,
										source_type,
										concat_data,
										indexLast,
										indexCurrent,
										not_associated,
										callback,
										setData,
										index
									);
								}}
							>
								{str}
							</Button>
						);
					})}
				</Box>
			);
		},
		btns: [
			{
				label: i18n.t("cancel"),
				overrideClass: "btn-popup-cancel",
				action: () => {
					selectPopup(null);
					removeKeyListener();
				},
			},
		],
	});
}



async function listGenerator(
	source,
	request,
	response,
	concat_data,
	callback,
	listValues
) {
	let mapSource = source.sources_map;
	if (mapSource) {
		let sourceNew = await db.sources.get(mapSource);
		let type = await db.types.get(sourceNew.item_type);
		let source_type = type.sources.find(
			(source) => source.source === mapSource
		);
		let mapField = source.source_fields_map;
		if (mapField) {
			let mapFieldJson = JSON.parse(mapField);
			if (mapSource && mapFieldJson) {
				// let sourceNew = await db.sources.get(mapSource);
				// let type = await db.types.get(sourceNew.item_type);
				// let source_type = type.sources.find(
				// 	(source) => source.source === mapSource
				// );
				let not_associated = [];
				sourceNew.requests.forEach((request) => {
					if (request.keys_json) {
						request.keys_json.forEach((key) => {
							let is_associated = false;
							for (let source_type_field of source_type.fields) {
								if (source_type_field.selector === key) {
									is_associated = true;
									break;
								}
							}
							if (!is_associated || key === "name") {
								not_associated.push(key);
							}
						});
					}
				});

				if (request.keys_json) {
					request.keys_json
						.filter(
							(key) =>
								mapFieldJson.params &&
								mapFieldJson.params.findIndex((param) => param[0] === key) !==
									-1
						)
						.forEach((key) => {
							let [req_index, subkey] = key.split(":");
							key = subkey;
							let keys = key.split(".");
							let value = response;
							if (!value) {
								return;
							}
							let lastIndex = 0;
							for (let i = 0; i < keys.length; i++) {
								if (keys[i].includes("[")) {
									let [k, index] = keys[i].split("[");
									index = index.replace("]", "");
									value = value[k];
									lastIndex = i;
									break;
								} else {
									if (value) {
										value = value[keys[i]];
									}
								}
							}

							if (Array.isArray(value)) {
								let dataList = [];
								let nFiltered = 0;
								function dataToList(data) {
									dataList.push(data);
									if (dataList.length === value.length - nFiltered) {
										dataList = dataList.filter((item) => item && item.name);
										callback(dataList);
									}
								}
								value.forEach((item, index) => {
									let itemCopy = { ...item };
									request.keys_json.forEach((key) => {
										let item = itemCopy;
										let [req_index, subkey] = key.split(":");
										key = subkey;
										let keys = key.split(".");

										for (let i = lastIndex + 1; i < keys.length; i++) {
											if (keys[i].includes("[")) {
												let [k, index] = keys[i].split("[");
												index = index.replace("]", "");
												item = item[k][index];
											} else {
												if (item) {
													item = item[keys[i]];
												}
											}
										}
										concat_data[req_index + ":" + key] = item;
									});
									if (mapFieldJson.if) {
										let exit = false;
										mapFieldJson.if.forEach((condition) => {
											let [key, value] = condition;
											if (concat_data[key] !== value) {
												exit = true;
												nFiltered++;
												return;
											}
										});
										if (exit) {
											return;
										}
									}
									if (mapFieldJson.params) {
										mapFieldJson.params.forEach((param) => {
											let [from, to] = param;
											concat_data[to] = concat_data[from];
										});
									}

									runRequest(
										sourceNew,
										source_type,
										{ ...concat_data },
										sourceNew.requests.length - 1,
										mapFieldJson.request - 1,
										not_associated,
										async (resp) => {
											let itemData = {
												name: "",
												fields: {},
												created_at: new Date().toISOString(),
												in_collection: false,
												type: sourceNew.item_type,
												cache: {},
												document: null,
											};
											// return;
											processReturnCallBack(
												resp,
												itemData,
												dataToList,
												source_type,
												type,
												sourceNew.item_type
											);
										},
										callback,
										0
									);
								});
							}
						});
				}
			}
		} else if (listValues) {
			let dataList = [];
			let nFiltered = 0;
			function dataToList(data) {
				dataList.push(data);
				
				if (dataList.length === listValues.length - nFiltered) {
					dataList = dataList.filter((item) => item && item.name);
					callback(dataList);
				}
			}
			listValues.forEach((item, index) => {
				console.log(item);
				let itemData = {
					name: "",
					fields: {},
					created_at: new Date().toISOString(),
					in_collection: false,
					type: sourceNew.item_type,
					cache: {},
					document: null,
				};
				
				processReturnCallBack(
					item,
					itemData,
					dataToList,
					source_type,
					type,
					sourceNew.item_type
				);
			});
		}
	}
	
}








































