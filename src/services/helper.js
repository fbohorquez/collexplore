import db from "./db";
import Config from "./config";
import { getBaseTypes } from "./types";
import React, { useEffect, useRef } from "react";
import { CircularProgress, Typography, Box } from "@mui/material";
import stringSimilarity from "string-similarity";
import Fuse from "fuse.js";
import flags from "../locales/flags";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

let fadeVirtuosoTimeout = null;

export async function cleanEntitiesWithoutRelations() {
	let entities = await db.entity.toArray();
	console.log("Procesando entidades sin relaciones ...");
	console.log("Número de entidades: " + entities.length);
	// entities.forEach((entity) => {
	for (let i = 0; i < entities.length; i++) {
		let entity = entities[i];		
		console.log("Procesando entidad: " + entity.name + " (" + (i + 1) + " de " + entities.length + ")");
		let found = false;
		if (entity.type) {
			let items = await db.items.toArray();
			for (let j = 0; j < items.length; j++) {
				let item = items[j];
				
				let type = await db.types.get(item.type);
				if (type && type.fields) {
					for (let k = 0; k < type.fields.length; k++) {
						let field = type.fields[k];
						if (
							field.type === "entity" &&
							item.fields[field.id]
						) {
							if (Array.isArray(item.fields[field.id])) {
								if (
									item.fields[field.id].includes(entity.id)
								) {
									found = true;
									break;
								}
							} else {
								if (item.fields[field.id] === entity.id) {
									found = true;
									break;
								}
							}
						}
					}
					if (found) {
						break;
					}
				}
				
			}
		}
		if (!found) {
			console.error("Eliminando entidad sin relación: " + entity.name);
			await db.entity.delete(entity.id);
			// break;
		}
	}
} 

export function getInitItemListConfig () {
	return {
		typeSelected: 1,
		listSelected: null,
		listTypeSelected: null,
		groupEditionItems: [],
		explorersItems: [],
		explorersItemsIndex: 0,
		typesByID: {},
		searchAdvancedValue: [],
		itemsListRaw: [],
		maxCols: 10,
		colsN: 10,
		selectedItem: null,
		automaticScrollChangeDetail: true,
		automaticScrollCreateDetail: true,
	};
}

export function fadeVirtuoso (delay = 200, onlyFadeIN = false) {
	
	if (fadeVirtuosoTimeout) {
		clearTimeout(fadeVirtuosoTimeout);
	}else {
		if (!onlyFadeIN) {
			document.querySelector("[data-testid='virtuoso-scroller']") &&
				(document.querySelector(
					"[data-testid='virtuoso-scroller']"
				).style.opacity = 0);
		}
	}
	fadeVirtuosoTimeout = setTimeout(() => {
		document.querySelector('[data-testid="virtuoso-scroller"]') &&
			(document.querySelector(
				'[data-testid="virtuoso-scroller"]'
			).style.opacity = 1);
			fadeVirtuosoTimeout = null;
	}, delay);
	return fadeVirtuosoTimeout;
}

export const useGlobalEvent = (eventName, handler, dependencies = []) => {
	useEffect(() => {
		window.addEventListener(eventName, handler);
		return () => {
			window.removeEventListener(eventName, handler);
		};
	}, [eventName, handler, ...dependencies]);
};

export function useGlobalEventTakeLatest(eventName, handler, delay = 0, force) {
	const timerRef = useRef(null);
	const latestDetailRef = useRef(null);
	const firstDetailRef = useRef(null);
	useEffect(() => {
		const onEvent = (e) => {
			// Guardamos el último 'detail' que llega
			latestDetailRef.current = e.detail;

			// Si ya había un timer pendiente, lo cancelamos
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				if (
					latestDetailRef.current &&
					firstDetailRef.current &&
					firstDetailRef.current.beforeSave
				) {
					latestDetailRef.current = {
						...latestDetailRef.current,
						beforeSave: firstDetailRef.current.beforeSave,
					};
				}
			}else {
				firstDetailRef.current = e.detail;
			}

			// Programamos la ejecución final
			if (!force) {
				timerRef.current = setTimeout(() => {
					// Cuando se cumple el tiempo, llamamos a handler con el ÚLTIMO detail
					handler({ detail: latestDetailRef.current });
					timerRef.current = null;
					firstDetailRef.current = null;
				}, delay);
			}else {
				handler({ detail: latestDetailRef.current });
				timerRef.current = null;
			}
		};

		window.addEventListener(eventName, onEvent);
		return () => {
			window.removeEventListener(eventName, onEvent);
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [eventName, handler, delay]);
}

export async function getTypesByID (){
	let typesByID = {};
	await Config.initConfigCache();
	let types = await db.types.toArray();
	types.forEach((type) => {
		typesByID[type.id] = getBaseTypes("items", type);
	});
	return typesByID;
}

export async function getValuesFieldsByLabel (type_id, fields) {
	let valuesFieldsByLabel = {};
	let type = await db.types.get(type_id);
	for (let fieldId of Object.keys(fields)) {
		let fieldType = type.fields.find((field) => field.id === fieldId);
		if (!fieldType) {
			continue;
		}
		valuesFieldsByLabel[fieldType.label] = fields[fieldId];
	}
	return valuesFieldsByLabel;
}

export function clearCacheEntity (entity) {
	let clearEntity = {};
	if (entity.name) {
		clearEntity.name = entity.name;
	}
	if (entity.type) {
		clearEntity.type = entity.type;
	}
	if (entity.id){
		clearEntity.id = entity.id;
	}
	if (entity.fields) {
		Object.keys(entity.fields).forEach((key) => {
			let fieldVal = entity.fields[key];
			if (fieldVal instanceof Blob) {
				if (!clearEntity.fields) {
					clearEntity.fields = {};
				}
				clearEntity.fields[key] = fieldVal;
			}
		});
	}
	return clearEntity;
}

let preventPrintStyleColors = 0;

export async function printStyleColors (key, primaryColor, secondaryColor, backgroundImg,backgroundImgSize, boxShadow, overlayOpacity, prevent) {
	let config = null;
	if (prevent !== undefined) {
		preventPrintStyleColors = prevent;
	}else {
		if (preventPrintStyleColors) {
			preventPrintStyleColors --;
			return;
		}
	}
	let backgroundImgBase64 = null;
	if (
		primaryColor === undefined ||
		secondaryColor === undefined ||
		backgroundImg === undefined ||
		backgroundImgSize === undefined ||
		boxShadow === undefined ||	
		overlayOpacity === undefined
	) {
		config = await Config.me().get(key, {
			"n-cols-grid": 10,
			"cols-height": 250,
			"cols-img-cover": false,
			"primary-color": {
				color: "#3a230a",
				dark: "#301900",
				darkDark: "#1c0500",
				light: "#442d14",
				lightLight: "#584128",
				contrast: "#ffffff",
			},
			"secondary-color": {
				color: "#f8f1e5",
				dark: "#eee7db",
				darkDark: "#dad3c7",
				light: "#fffbef",
				lightLight: "#ffffff",
				constrast: "#000000",
			},
			"background-img": null,
			"grid-item-box-shadow": false,
			"background-img-size": "auto",
			"overlay-opacity": 3,
		});
	}
	if (primaryColor === undefined && config) {
		if (!config["primary-color"]) {
			config["primary-color"] = {
				color: "#3a230a",
				dark: "#301900",
				darkDark: "#1c0500",
				light: "#442d14",
				lightLight: "#584128",
				contrast: "#ffffff",
			};
		}
		primaryColor = config["primary-color"];
	}
	if (secondaryColor === undefined && config) {
		if (!config["secondary-color"]) {
			config["secondary-color"] = {
				color: "#f8f1e5",
				dark: "#eee7db",
				darkDark: "#dad3c7",
				light: "#fffbef",
				lightLight: "#ffffff",
				constrast: "#000000",
			};
		}
		secondaryColor = config["secondary-color"];
	}
	if (backgroundImg === undefined && config) {
		backgroundImg = config["background-img"];
	}
	if (backgroundImg) {
		backgroundImgBase64 = await readBlobAsBase64(backgroundImg);
	}
	if (boxShadow === undefined && config) {
		boxShadow = config["grid-item-box-shadow"];
	}
	if (backgroundImgSize === undefined && config) {
		backgroundImgSize = config["background-img-size"];
	}
	if (overlayOpacity === undefined && config) {
		overlayOpacity = config["overlay-opacity"];
	}
	
	if (document.querySelector("#app-colors")) {
		document.querySelector("#app-colors").remove();
	}
	let style = document.createElement("style");
	let colorURLEncoded = encodeURIComponent(primaryColor.color);
	style.id = "app-colors";
	style.innerHTML = `:root { 
		--color-primary: ${primaryColor.color}; 
		--color-primary-max-max: ${primaryColor.darkDark};
		--color-primary-max: ${primaryColor.dark};
		--color-primary-min: ${primaryColor.light};
		--color-primary-min-min: ${primaryColor.lightLight};
		--color-primary-contrast: ${primaryColor.contrast};
		--color-secondary: ${secondaryColor.color};
		--color-secondary-max: ${secondaryColor.dark};
		--color-secondary-max-max: ${secondaryColor.darkDark};
		--color-secondary-min: ${secondaryColor.light};
		--color-secondary-min-min: ${secondaryColor.lightLight};
		--color-secondary-contrast: ${secondaryColor.contrast};
		--background-img: url(${backgroundImgBase64});
	}
	.list-header-controls-container::before {
			background-image: url("data:image/svg+xml,<svg viewBox=%220 0 50 50%22 version=%221.1%22 id=%22svg1%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 xmlns=%22http://www.w3.org/2000/svg%22 xmlns:svg=%22http://www.w3.org/2000/svg%22><defs id=%22defs1%22 /><g id=%22layer1%22><path style=%22fill:${colorURLEncoded};stroke-width:0.0555556%22 d=%22m 0.35,0 h 49.5 V 49.85 C 50.08,23.12 25.56,-0.12 0.35,0 Z%22 id=%22path1%22 /><use x=%220%22 y=%220%22 xlink:href=%22%23path1%22 id=%22use1%22 /></g></svg>");
	}
	.list-header-controls-container::after {
			top: 0;
			right: -12px;
			background-image:url('data:image/svg+xml,<svg viewBox=%220 0 50 50%22 version=%221.1%22 id=%22svg1%22 xmlns:xlink=%22http://www.w3.org/1999/xlink%22 xmlns=%22http://www.w3.org/2000/svg%22 xmlns:svg=%22http://www.w3.org/2000/svg%22><defs id=%22defs1%22 /><g id=%22layer1%22><path style=%22fill:${colorURLEncoded};stroke-width:0.0555556%22 d=%22M 50,0 H 0 V 49.85 C -0.11859155,29.394648 23.967042,0.22859155 50,0 Z%22 id=%22path1%22 /><use x=%220%22 y=%220%22 xlink:href=%22%23path1%22 id=%22use1%22 /></g></svg>');
	}
	${
		backgroundImg && backgroundImgBase64
			? `.panel-content {
				background: var(--background-img);
				background-size: ${backgroundImgSize};
				position: relative;
			}	
			.panel-content:before {
					position: absolute;
					content: "";
					width: 100%;
					height: 100%;
					background: rgba(100,100,100,${overlayOpacity !== undefined ? overlayOpacity / 10 : 0.3});
			}
			`
			: ""
	}

	${
		boxShadow
			? `
			.list-group-header-item,
			.list-table-row-group-depth-0,
			.list-grid-item-envolve:has(img.loaded) {
						box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.3) !important;
			}
			.list-table-row-group:not(.list-table-row-group-depth-0) h6 {
				box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.3) !important;
			}
				`
			: ""
	}
	`;
	document.head.appendChild(style);
}

let cacheEntityTypes = {};

function getEntityType (type) {
  return cacheEntityTypes[type];
}

function clearCacheEntityType (type) {
  delete cacheEntityTypes[type];
}

function clearCacheEntityTypesAll () {
  cacheEntityTypes = {};
}

function refreshCacheEntityType () {
  db["entity-types"].toArray().then((entityTypes) => {
    entityTypes.forEach((entityType) => {
      cacheEntityTypes[entityType.id] = entityType;
    });
  }
  );
}

let cacheItemsTypes = {};

function getItemsType (type) {
  return cacheItemsTypes[type];
}

function clearCacheItemsType (type) {
  delete cacheItemsTypes[type];
}

function clearCacheItemsTypesAll () {
  cacheItemsTypes = {};
}

function refreshCacheItemsType () {
  return db["types"].toArray().then((itemsTypes) => {
    itemsTypes.forEach((itemsType) => {
      cacheItemsTypes[itemsType.id] = itemsType;
    });
  });
}

function updateEntityCacheInItems (field_id, value) {
  db.items.toArray().then((items) => {
    items.forEach((item) => {
      if (item.cache && item.cache[field_id] !== undefined) {
        if(item.cache[field_id] instanceof Array){
          let index = item.cache[field_id].findIndex((elem) => elem.id === value.id);
          if(index >= 0){
            item.cache[field_id][index] = value;
						db.items.update(item.id, { cache: item.cache }).then(() => {
							changeRow(item);
						});
          }
          
        }else {
					if (item.cache[field_id]){
						if (item.cache[field_id].id === value.id) {
							item.cache[field_id] = value;
							db.items.update(item.id, { cache: item.cache }).then(() => {
								changeRow(item);
							});
						}
					}
        }
      }
    });
  });
}

function generateIdFromText(text) {
  return (
    text
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[áàãâä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòõôö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9-]/g, '') 
      
  ) + '-' + Math.random().toString(36).substr(2, 9);
}

function generateId () {
  return Math.random().toString(36).substr(2, 9);
}

function setMenuVisible (menuVisible) {
  document.body.classList.toggle('menu-visible', menuVisible);
}


function setMaximized (maximized) {
  document.body.classList.toggle('maximized', maximized);
}

function isMaximized () {
  return document.body.classList.contains('maximized');
}

function setDetailVisible (detailVisible) {
  document.body.classList.toggle('detail-visible', detailVisible);
}

function setSelectedItemId (id) {
  document
		.querySelectorAll(".list-table-row")
		.forEach((el) => {
			el.classList.remove("selected");
		});
  document.querySelectorAll('.list-table-row-' + id).forEach((el) => {
    el.classList.add('selected');
  });
  document.body.setAttribute('data-selected-item-id', id);
}

function getSelectedItemId () {
  return document.body.getAttribute('data-selected-item-id');
}

function setCollectionLayout (layout) {
  document.body.setAttribute('data-collection-layout', layout);
}

function getCollectionLayout () {
  return document.body.getAttribute('data-collection-layout');
}

function isDetailVisible () {
  return document.body.classList.contains('detail-visible');
}

function selectDetail (menu, item, additionalData) {
  const event = new CustomEvent("selectDetail", {
		detail: { menu, item, additionalData },
	});
	const eventOpenDetail = new CustomEvent("open-detail", {
		detail: { menu, item, additionalData },
	});
	if (menu && item) {
		window.dispatchEvent(event);
		window.dispatchEvent(eventOpenDetail);
	}
}

function changeRow (row) {
  const event = new CustomEvent('changeRow', {
    detail: { row },
  });
  window.dispatchEvent(event);
}

function changeListSelected (listSelected) {
	const event = new CustomEvent("changeListSelected", {
		detail: listSelected,
	});
	window.dispatchEvent(event);
}

function updatePopup () {
  const event = new CustomEvent('updatePopup');
  window.dispatchEvent(event);
}

function refreshListHighlight () {
  const event = new CustomEvent("refresh-list-highlight");
  window.dispatchEvent(event);
}

function refreshListData () {
	const event = new CustomEvent("refresh-list-data");
	window.dispatchEvent(event);
}


function deleteRow (row) {
  const event = new CustomEvent('deleteRow', {
    detail: { row },
  });
  window.dispatchEvent(event);
}

function scrollTableEnd (elementId){
  const event = new CustomEvent('scrollTableEnd', {
    detail: { elementId },
  });
  window.dispatchEvent(event);
  
}

function selectPopup (popup) {
  const event = new CustomEvent('selectPopup', {
    detail: { popup },
  });
  window.dispatchEvent(event);
}

function readBlobAsText(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = function (event) {
			resolve(event.target.result);
		};
		reader.onerror = function (error) {
			reject(error);
		};
		reader.readAsText(blob);
	});
}

function readBlobAsBase64(blob) {
	return new Promise((resolve, reject) => {
		const lector = new FileReader();
		lector.onloadend = () => {
			resolve(lector.result);
		};
		lector.onerror = reject;
		lector.readAsDataURL(blob);
	});
}

function getColumnNamesFromCSV(blob) {
  return new Promise((resolve, reject) => {
    readBlobAsText(blob).then((csvText) => {
      const firstLine = csvText.split("\n")[0]; // Obtener la primera línea
      const columnNames = firstLine.split(","); // Dividir por el delimitador
      resolve(columnNames.map((name, index) => ({ name, index })));
    });
  });
}

async function GenerateItemCacheEntity (item){
  if (!item.cache) {
    item.cache = {};
  }
  if (item.type) {

  let type = await db["types"].get(item.type);
    if (type.fields) {
      for (const field of type.fields) {
        if (field.type === "entity") {
          if (field.multiple && item.fields[field.id] instanceof Array) {
            item.cache[field.id] = [];
            for (let i = 0; i < item.fields[field.id].length; i++) {
              let entity = await db["entity"].get(item.fields[field.id][i]);
              if (entity) {
                item.cache[field.id].push(entity);
              }
            }
          } else {
            item.cache[field.id] = null;
            if (item.fields[field.id]){
              let entity =  await db["entity"].get(item.fields[field.id]);
              if (entity) {
                item.cache[field.id] = clearCacheEntity(entity);
              }
            }
          }
        }
      }
    }
  }
  return item;

}

export function queryFristFormInput (root, focus) {
	focus = (focus !== undefined);
	root = root || document;
	let precedence = [
		"[role]:not([role='button']",
		"input, select, textarea",
		"[role='button']",
		"button",
	];

	for (const selector of precedence) {
		const element = root.querySelector(selector);
		if (element) {
			element.focus();
			return element;
		}
	}
	return null;
}

export function entityToString(entity, skipName) {
	let resp  = [ (skipName ? "" :entity.name) ];
	const type = getEntityType(entity.type);
	if (type && type.fields) {
		for (const field of type.fields) {
			if (field.type === "entity" && entity.cache && entity.cache[field.id]) {
				if (field.multiple && entity.cache[field.id] instanceof Array) {
					resp.push(entity.cache[field.id].map((elem) => elem.name).join(", "));
				} else {
					resp.push(entity.cache[field.id].name)
				}
			}
			else if (
				(
					field.type === "text" ||
					field.type === "number" ||
					field.type === "date"
				) && entity.fields[field.id]
			) {
				resp.push(entity.fields[field.id]);
			}
			else if (field.type === "country" && entity.fields[field.id]) {
				if (field.multiple && entity.fields[field.id] instanceof Array) {
					resp.push(entity.fields[field.id].join(", "));
				} else {
					resp.push(entity.fields[field.id]);
				}
			}
			else if (field.type === "select" && entity.fields[field.id]) {
				const select = field.options.find((option) => option.value === entity.fields[field.id]);
				if (select) {
					resp.push(select.label);
				}
			}
		}
	}
	resp = resp.filter((elem) => elem);
	return resp.join(" / ");
}

function itemToString(item, skipName) {
  let resp = skipName ? '' : item.name;
  const type = getItemsType(item.type);
  if (type && type.fields){
    for (const field of type.fields) {
      if (field.type === 'entity' && item.cache && item.cache[field.id]) {
        if (field.multiple && item.cache[field.id] instanceof Array) {
          resp += ' | ' + item.cache[field.id].map((elem) => elem.name).join(', ');
        }else {
          resp += ' | ' + item.cache[field.id].name;
        }
      }
      else if (
				(
          field.type === "text" ||
          field.type === "number" ||
          field.type === "date"
        ) && item.fields[field.id]
      ) {
				resp += " | " + item.fields[field.id];
			} else if (field.type === "country" && item.fields[field.id]) {
				if (
					field.multiple &&
					item.fields &&
					item.fields[field.id] instanceof Array
				) {
					resp += " | " + item.fields[field.id].join(", ");
				} else {
					resp += " | " + item.fields[field.id];
				}
			}
    }
  }
  return resp;
}

function capitalizeWords(str) {
	return str
		.split(" ") // Divide la cadena en un array de palabras
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza la primera letra de cada palabra
		.join(" "); // Vuelve a unir las palabras en una cadena
}

export function valueToStringPromise(value, fieldName, typeName, html) {
	return new Promise((resolve) => {
		let val = valueToString(value, fieldName, typeName, html, (entity) => {
			resolve(entity.name);
		});
		if (typeof val !== "undefined") {
			resolve(val);
		}
	});
}

function valueToString(value, fieldName, typeName, html, callBackAsync) {
	let resp = "";
	const t = i18n.t;
	
	if (fieldName === "in_collection") {
		
		return value === true || value === "true" || value === t('i-have-it') ? t('i-have-it') : t('i-dont-have-it');
	}

	const type = getItemsType(typeName);
	if (type && type.fields) {
		const field = type.fields.find((field) => field.id === fieldName);
		if (field) {
			if (field.type === "entity" && value) {
				if (callBackAsync) {
					db.entity.get(parseInt(value)).then((entity) => {
						callBackAsync(entity);
					});
					return;
				}
				//if is numeric, array, string or object
				if (parseInt(value)) {
					resp += value;
				}
				else if (field.multiple && value instanceof Array) {
					resp += value.map((elem) => elem.name).join(", ");
				} 
				else if (String(value)) {
					resp += capitalizeWords(value);
				}
				else {
					resp += value.name;
				}
			} else if (
				(field.type === "text" ||
					field.type === "number" ||
					field.type === "date") &&
				value
			) {
				resp += value;
			} else if (field.type === "country" && value) {
				if (field.multiple && value instanceof Array) {
					if (html) {
						resp += value.map((elem) => {
							return '<img src=' + flags[elem] + ' alt=' + elem + ' style="width: 20px; height: 20px; margin-right: 5px;"/>';
					}).join(" ");
					}else {
							resp += value.join(", ");
					}
					
				} else {
					if (html) {
						resp += '<img src=' + flags[value] + ' alt=' + value + ' style="width: 20px; height: 20px; margin-right: 5px;"/>';
					}else {
						resp += value;
					}
				}
			} 
			else if (field.type === "stars") {
				if (!value || value === "0") {
					resp += "No asignado";
				}else {
					if (html) {
						resp += value + '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-i4bv87-MuiSvgIcon-root" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="StarIcon"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>';
					}else {
						resp += value;
					}
				}
			}
			else if (field.type === "checkbox"){
				resp += field.label + ": ";
				if (value === true || value === "true" || value === "on" || value === "1" || value === 1) {
					resp += t('yes');
				}else {
					resp += t('no');
					value = false;
				}
					
			}
			else {
				resp += value;
			}
		}else {
			resp += value;
		}
	}else {
		resp += value;
	}
	if (value === "__undefined__") {
		return "No asignado";
	}
	return resp;
}


const listItemRefToInline = (item) => {
  db.lists.toArray().then((lists) => {
    lists.forEach((list) => {
      if (list.fields.items && list.fields.items instanceof Array) {
        let index;
        while ((index = list.fields.items.findIndex((elem) => elem === item.id) ) >= 0){
          let copy = {...item};
          delete copy.id;
          delete copy.deleted;
          list.fields.items[index] = copy;
          db.lists.update(list.id, { fields: list.fields });
        }
      }
    });
  });
};

function addCollectionItem (item, listSelected) {
	let id_with_prefix = item.id;
	let id_without_prefix = item.id;
	if (typeof id_with_prefix === "string" && id_with_prefix.includes("lists-")) {
		id_without_prefix = parseInt(id_with_prefix.replace("lists-", ""));
	}
	let idBefore = item.id;
	
	item.in_collection = true;
	item.document = "items";
	if (
		item.id &&
		typeof item.id === "string" &&
		item.id.includes("lists-tmp-")
	) {
		const dataCp = { ...item };
		delete item.id;
		db[item.document].add(item).then((id) => {
			changeRow({ ...dataCp, idChange: id });
			selectDetail("items", { ...item, id: id });
		});
		return;
	}
	delete item.id;
	db.items.add(item).then((id) => {
		db["lists-items"].delete(id_without_prefix);
		if (listSelected) {
			db.lists.get(listSelected.id).then((data) => {
				for (let i = 0; i < data.items.length; i++) {
					if (data.items[i] === id_with_prefix) {
						data.items[i] = id;
						break;
					}
				}
				db.lists.update(listSelected.id, data).then(() => {
					let item_event = { ...item };
					item_event.document = "items";
					changeRow(item_event);
					if (parseInt(getSelectedItemId()) === parseInt(id_without_prefix)) {
						selectDetail("items", item_event, { listSelected });
					}
				});
				db.lists.toArray().then((data) => {
					for (let i = 0; i < data.length; i++) {
						if (data[i].id === listSelected.id) {
							continue;
						}
						if (data[i].items.includes(id_without_prefix)) {
							for (let j = 0; j < data[i].items.length; j++) {
								if (data[i].items[j] === id_with_prefix) {
									data[i].items[j] = id;
									break;
								}
							}
							db.lists.update(data[i].id, data[i]);
						}
					}
				});
			});
		}
	});
}

export function mergeToCollectionItem (itemList, itemCollection, listSelected, setItemListConfig) {
	let id_with_prefix = itemList.id;
	let id_without_prefix = itemList.id;
	if (typeof id_with_prefix === "string" && id_with_prefix.includes("lists-")) {
		id_without_prefix = parseInt(id_with_prefix.replace("lists-", ""));
	}

	//Merge itemList.fields.lists to itemCollection.fields.lists
	if (itemList && itemList.fields && itemList.fields.lists) {
		if (!itemCollection.fields.lists) {
			itemCollection.fields.lists = [];
		}
		itemList.fields.lists.forEach((list) => {
			if (!itemCollection.fields.lists.includes(list)) {
				itemCollection.fields.lists.push(list);
			}
		});
	}
	db.items.update(itemCollection.id, itemCollection);
	
	//Eliminamos itemList de la tabla items de listas
	db["lists-items"].delete(id_without_prefix);
	//Eliminamos itemList de listSelected
	db.lists.get(listSelected.id).then((data) => {
		let position = data.items.findIndex((elem) => elem === id_with_prefix);
		data.items.splice(position, 1);
		//Añadimos itemCollection a listSelected en la misma posición 
		data.items.splice(position, 0, itemCollection.id);
		//Actualizamos listSelected
		db.lists.update(listSelected.id, data).then(() => {
			let item_event = { ...itemCollection };
			item_event.document = "items";
			// changeRow(item_event);
			if (setItemListConfig) {
				// setListSelected({ ...listSelected });
				setItemListConfig((old) => {
					return { ...old, listSelected: { ...listSelected } };
				});
			} 
			if (getSelectedItemId() === id_with_prefix) {
				selectDetail("items", item_event, { listSelected });
			}
		});
	});
	

	
}

export async function searchItemsByProbalility (item, cutoffScore, component, onlyNames) {
	cutoffScore = cutoffScore || 60;
	item = {...item};
	component = component || "items";
	let items = await db[component].where("type").equals(item.type).toArray();
	let resp = [];
	items.forEach((elem) => {
		let article_pro = calculateProbabilitySameArticle(item, elem, cutoffScore, onlyNames);
		if (article_pro >= cutoffScore) {
			resp.push(elem);
		}
	});
	return resp;
}


function getWordWeight(word) {
	const insignificantWords = [
		"el",
		"la",
		"los",
		"las",
		"un",
		"una",
		"unos",
		"unas",
		"the",
		"a",
		"an",
	];
	const numericPattern = /\d+/;

	if (insignificantWords.includes(word.toLowerCase())) {
		return 0.1; 
	} else if (numericPattern.test(word)) {
		return 1.5; 
	}
	return 1.0;
}

function weightedStringSimilarity(str1, str2) {
	const words1 = str1.split(/\s+/);
	const words2 = str2.split(/\s+/);
	let totalScore = 0;
	let totalWeight = 0;

	words1.forEach((word1) => {
		let maxWordScore = 0;
		let wordWeight = getWordWeight(word1);

		words2.forEach((word2) => {
			let wordScore = stringSimilarity.compareTwoStrings(word1, word2);
			if (wordScore > maxWordScore) {
				maxWordScore = wordScore;
			}
		});

		totalScore += maxWordScore * wordWeight;
		totalWeight += wordWeight;
	});

	return totalWeight > 0 ? totalScore / totalWeight : 0;
}

function calculateOrderScore(name1, name2) {
	const words1 = name1.split(/\s+/);
	const words2 = name2.split(/\s+/);
	let orderScore = 0;
	let totalWeight = 0;

	let minLength = Math.min(words1.length, words2.length);
	for (let i = 0; i < minLength; i++) {
		let weight = getWordWeight(words1[i]);
		if (words1[i] === words2[i]) {
			orderScore += weight;
		}
		totalWeight += weight;
	}

	return totalWeight > 0 ? orderScore / totalWeight : 0;
}


function compareNames(name1, name2) {
	const baseScore = weightedStringSimilarity(name1, name2);
	let orderScore = calculateOrderScore(name1, name2);
	return (baseScore * 0.7 + orderScore * 0.3) * 100;
}

function normalizeWord(word) {
	return word
		.replace(/[^\w\d]/g, "") // elimina # . etc. dejando alfanumérico
		.replace(/\(.*\)/g, "") // elimina paréntesis y su contenido
		.toLowerCase();
}

function calculateProbabilitySameArticle(article1, article2, cutoffScore, onlyNames) {
  if (typeof article1 === "string" && typeof article2 === "string") {
    if (article1 === article2) {
      return 100;
    }
  }
	if (onlyNames) {
		article1 = article1.name;
		article2 = article2.name;
	}else {
		if (typeof article1 === "object"){
			article1 = itemToString(article1);
		}
		if (typeof article2 === "object"){
			article2 = itemToString(article2);
		}
	}
	const fields1 = article1
		.toLowerCase()
		.split("|")
		.map((s) => s.trim());
	const fields2 = article2
		.toLowerCase()
		.split("|")
		.map((s) => s.trim());

	const nameScore = compareNames(normalizeWord(fields1[0]), normalizeWord(fields2[0])) * (cutoffScore / 100);
	if (nameScore < cutoffScore) return nameScore;

	const fuseOptions = {
		includeScore: true,
		minMatchCharLength: 2,
		threshold: 0.3, 
		keys: ["field"],
	};

	const additionalFields1 = fields1.slice(1).map((field) => ({ field }));
	const additionalFields2 = fields2.slice(1).map((field) => ({ field }));
	const fuse = new Fuse(additionalFields1, fuseOptions);

	let additionalScore = 0;
	additionalFields2.forEach((item) => {
		const result = fuse.search(item.field);
		if (result.length > 0) {
			additionalScore +=
				((100 - result[0].score * 100) * 0.4) / additionalFields2.length; // Distribuye 40% del peso
		}
	});

	const totalScore = nameScore + additionalScore;
	return totalScore;
}

function replaceKeysInValues(data) {
	let data_request = { ...data };
	let keys = Object.keys(data_request);
	keys.forEach((key) => {
		keys.forEach((key2) => {
			if (typeof data_request[key] === "string") {
				if (data_request[key2] && data_request[key].includes(`{${key2}}`)) {
					data_request[key] = data_request[key].replace(
						`{${key2}}`,
						data_request[key2].toString()
					);
				}
			}
		});
	});
	return data_request;
}

let entityCache = {};

async function getOrAddEntity(name, fieldType, cache) {
	if (cache === undefined) {
		cache = true;
	}
	if (!entityCache[name] && cache) {
		entityCache[name] = new Promise((resolve, reject) => {
			db.entity
				.where("name")
				.equals(name)
				.first()
				.then((entity) => {
					if (entity) {
						resolve({ id: entity.id, item: entity });
					} else {
						let newEntity = {
							name: name,
							type: fieldType.entity,
							fields: fieldType.fields || {},
						};
						db.entity
							.add(newEntity)
							.then((id) => {
								newEntity.id = id;
								resolve({ id:newEntity.id, item:newEntity });
							})
							.catch((error) => {
								reject(error);
							});
					}
				});
		});
	}else {
		let entity = await db.entity.where("name").equals(name).toArray();
		entity = entity.find((elem) => elem.type === fieldType.entity);
		if (entity) {
			entityCache[name] = { id: entity.id, item: entity };
		}else {
			let newEntity = {
				name: name,
				type: fieldType.entity,
				fields: fieldType.fields || {},
			};
			let id = await db.entity.add(newEntity);
			newEntity.id = id;
			entityCache[name] = { id: newEntity.id, item: newEntity };
		}
	}
	return entityCache[name];
}


function normalizeString(str, onlyAccents) {
	if (!str || !str.toString) {
		return "";
	}
	str = str.toString()
		.toLowerCase()
		.replace("á", "a")
		.replace("é", "e")
		.replace("í", "i")
		.replace("ó", "o")
		.replace("ú", "u");
	if(!onlyAccents){
		str = str.replace("ñ", "n")
			.replace(/[^a-zA-Z0-9]/g, " ")
			.replace(/\s+/g, " ");
	}
	return str.trim();
}

export async function sendPromptGPT (prompt) {
	let backend = await Config.get("gpt_api_backend");
	const response = await fetch(backend, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			prompt: prompt,
		}),
	});
	const data = await response.json();
	if (data.status === "success") {
		return data.response;
	}
	return null;
}

export const openStatusBar = (content) => {
	const event = new CustomEvent("openStatusBar", {
		detail: {
			content,
		},
	});
	window.dispatchEvent(event);
};

export const closeStatusBar = () => {
	const event = new Event("closeStatusBar");
	window.dispatchEvent(event);
}

export const editStatusBar = (content) => {
	const event = new CustomEvent("editStatusBar", {
		detail: {
			content,
		},
	});
	window.dispatchEvent(event);
};

export const openOkDialog = (title, text) => {
	const content = (
		<Box display="flex" alignItems="center" className="ok-dialog">
			<Typography variant="body1" sx={{ marginLeft: 2 }}>
				{text}
			</Typography>
		</Box>
	);

	const event = new Event("closeDialog");
	window.dispatchEvent(event);
	setTimeout(() => {
		const event = new CustomEvent("openDialog", {
			detail: {
				title: title,
				content: content,
				showCloseButton: true,
			},
		});
		window.dispatchEvent(event);
	}, 200);
}

export const openErrorDialog = (title, text) => {
	const content = (
		<Box display="flex" alignItems="center" className="error-dialog">
			<Typography variant="body1" sx={{ marginLeft: 2 }}>
				{text}
			</Typography>
		</Box>
	);

	const event = new Event("closeDialog");
	window.dispatchEvent(event);
	setTimeout(() => {
		const event = new CustomEvent("openDialog", {
			detail: {
				title: title,
				content: content,
				showCloseButton: true,
			},
		});
		window.dispatchEvent(event);
	}, 500);
}

export const openDialogLoad = (text) => {
	const content = (
		<Box display="flex" alignItems="center">
			<CircularProgress size={24} />
			<Typography variant="body1" sx={{ marginLeft: 2 }}>
				{text}
			</Typography>
		</Box>
	);

	const event = new CustomEvent("openDialog", {
		detail: {
			title: "Cargando",
			content: content,
			showCloseButton: false,
		},
	});
	window.dispatchEvent(event);
};

export const openDialog = (title, text, closeConf) => {
	let closeButton = true;
	let timer = 0;
	if (typeof closeConf === "boolean") {
		closeButton = closeConf;
		timer = 0;
	}
	else if (typeof closeConf === "number") {
		closeButton = false;
		timer = closeConf;
	}	

	const _openDialog = () => {
		const content = (
			<Box display="flex" alignItems="center">
				<Typography variant="body1" sx={{ marginLeft: 2 }}>
					{text}
				</Typography>
			</Box>
		);
		const event = new CustomEvent("openDialog", {
			detail: {
				title: title,
				content: content,
				showCloseButton: closeButton,
			},
		});
		window.dispatchEvent(event);
	}
	if (timer) {
		_openDialog();
		setTimeout(() => {
			closeDialog();
		}, timer);
	} else {
		_openDialog();
	}
}


export const closeDialog = () => {
	const event = new Event("closeDialog");
	window.dispatchEvent(event);
};

export const lastDialogLoad = (title, text, wait) => {

	const content = (
		<Box display="flex" alignItems="center">
			<Typography variant="body1" sx={{ marginLeft: 2 }}>
				{text}
			</Typography>
		</Box>
	);
	const event = new CustomEvent("editDialog", {
		detail: {
			title: title,
			content: content,
			showCloseButton: true,
		},
	});
	window.dispatchEvent(event);
	if (wait) {
		setTimeout(() => {
			closeDialog();
		}, wait);
	}
};

export const optimizeImageToWebP = (blob, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url); // Liberar la URL temporal

      // Crear un canvas con las dimensiones de la imagen cargada
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      // Dibujar la imagen en el canvas
      ctx.drawImage(img, 0, 0);

      // Convertir el canvas a un Blob en formato WebP
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob) {
            resolve(webpBlob); // Resolver con el Blob WebP optimizado
          } else {
            reject(new Error("Error al convertir la imagen a WebP."));
          }
        },
        "image/webp",
        quality // Ajuste de calidad
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url); // Liberar la URL temporal en caso de error
      reject(new Error("No se pudo cargar la imagen."));
    };

    // Cargar la imagen
    img.src = url;
  });
};

const optimizeImageToJPG = (
	blob,
	quality = 0.8,
	maxWidth = 1000,
	maxHeight = 1000
) => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(blob);

		img.onload = () => {
			URL.revokeObjectURL(url);

			let width = img.width;
			let height = img.height;

			if (width > maxWidth || height > maxHeight) {
				const aspectRatio = width / height;
				if (width > height) {
					width = maxWidth;
					height = maxWidth / aspectRatio;
				} else {
					height = maxHeight;
					width = maxHeight * aspectRatio;
				}
			}

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(jpgBlob) => {
					if (jpgBlob) {
						resolve(jpgBlob);
					} else {
						reject(new Error("Error al convertir la imagen a JPG."));
					}
				},
				"image/jpeg",
				quality
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("No se pudo cargar la imagen."));
		};

		img.src = url;
	});
};

export const processImages = async () => {
	try {
		// Obtener todos los types
		const types = await db.types.toArray();

		for (const type of types) {
			// Determinar el campo de imagen principal en cada type
			const mainImageField = type.fields.find(
				(field) => field.type === "image" && field.main === true
			);

			if (!mainImageField) {
				console.log(
					`No se encontró un campo de imagen principal para el tipo ${type.id}`
				);
				continue;
			}

			const imageFieldId = mainImageField.id;

			// Obtener todos los items que coinciden con el type actual
			["items", "lists-items"].forEach(async (document) => {
				const items = await db[document].where("type").equals(type.id).toArray();

				for (const item of items) {
					// Obtener el Blob original de la imagen
					const originalBlob = item.fields[imageFieldId];

					if (!(originalBlob instanceof Blob)) {
						console.log(
							`El campo de imagen en el ${document} ${item.id} no es un Blob.`
						);
						continue;
					}

					const webpBlob = await optimizeImageToJPG(originalBlob);

					const webpURL = URL.createObjectURL(webpBlob);
					console.log(`URL optimizada para ${document} ${item.id}: ${webpURL}`);
					item.fields[imageFieldId] = webpBlob;
					db[document].update(item.id, { fields: item.fields });
				}
			});
		}
	} catch (error) {
		console.error("Error al procesar las imágenes:", error);
	}
};

export const processImagesToBase64 = async () => {
	try {
		// Obtener todos los types
		const types = await db.types.toArray();

		for (const type of types) {
			// Determinar el campo de imagen principal en cada type
			const mainImageField = type.fields.find(
				(field) => field.type === "image" && field.main === true
			);

			if (!mainImageField) {
				console.log(
					`No se encontró un campo de imagen principal para el tipo ${type.id}`
				);
				continue;
			}

			const imageFieldId = mainImageField.id;

			// Obtener todos los items que coinciden con el type actual
			["items", "lists-items"].forEach(async (document) => {
				const items = await db[document].where("type").equals(type.id).toArray();

				for (const item of items) {
					// Obtener el Blob original de la imagen
					const originalBlob = item.fields[imageFieldId];

					if (!(originalBlob instanceof Blob)) {
						console.log(
							`El campo de imagen en el ${document} ${item.id} no es un Blob.`
						);
						continue;
					}

					const reader = new FileReader();
					reader.onload = () => {
						const base64 = reader.result;
						item.fields[imageFieldId] = base64;
						db[document].update(item.id, { fields: item.fields });
					};
					reader.readAsDataURL(originalBlob);
				}
			});
		}
	} catch (error) {
		console.error("Error al procesar las imágenes:", error);
	}
}

export const deleteDuplicateInList = async (listId) => {
	const list = await db.lists.get(listId);
	if (list && list.items) {
		let items = list.items;
		items = items.filter((item, index) => (item + "").indexOf("lists-lists") === -1);
		const itemsSet = new Set(items);
		// if (itemsSet.size !== items.length) {
			list.items = Array.from(itemsSet);
			await db.lists.update(listId, list);
		// }
	}
}

export const deleteDuplicateInLists = async () => {
	let lists = await db.lists.toArray();
	for (const list of lists) {
		await deleteDuplicateInList(list.id);
	}
}

let cv = window.cv;

export async function cropLargestObject(imageBlob) {
	if (!cv) {
		// Asegurar que cv está disponible
		cv = window.cv;
		if (!cv) {
			throw new Error(
				"OpenCV.js no está disponible. Asegúrate de incluir el script en tu HTML."
			);
		}
		
	}

	// Ajusta la agresividad para la eliminación final de color
	// (si lo deseas usar después del flood fill)
	const COLOR_THRESHOLD = 1;

	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = async () => {
			// 1) Dibujamos la imagen en un canvas para obtener su ImageData
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, img.width, img.height);

			if (cv instanceof Promise) {
				cv = await cv;
			}

			// 2) Convertimos a Mat RGBA (4 canales)
			const src = cv.matFromImageData(imageData);
			const width = src.cols;
			const height = src.rows;

			// -------------------------------------------------------------------
			// A) Crear una versión en escala de grises para el floodFill
			// -------------------------------------------------------------------
			const gray = new cv.Mat();
			cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

			// -------------------------------------------------------------------
			// B) Preparar la máscara para floodFill: debe ser [rows+2, cols+2]
			//    y la inicializamos a 0
			// -------------------------------------------------------------------
			const floodMask = new cv.Mat();
			floodMask.create(height + 2, width + 2, cv.CV_8UC1);
			floodMask.setTo(new cv.Scalar(0));

			// Vamos a rellenar desde las 4 esquinas,
			// asumiendo que en los bordes tenemos fondo.
			// Podrías floodFill desde más puntos si lo requieres.

			// LoDiff y UpDiff indican cuánta variación de color tolera el floodFill
			// Ajusta estos valores para que capte mejor el fondo
			const loDiff = new cv.Scalar(5);
			const upDiff = new cv.Scalar(5);

			// flags para floodFill:
			// - 4 conectado (usamos 4, o usa cv.FLOODFILL_FIXED_RANGE si quieres)
			// - SHIFT = 8 => La máscara es 2pix mayor en cada dimensión
			const flags =
				4 |
				(255 << 8) /* color de relleno en la mask */ |
				cv.FLOODFILL_MASK_ONLY;

			// Flood fill desde cada esquina
			floodFillCorner(0, 0);
			floodFillCorner(width - 1, 0);
			floodFillCorner(0, height - 1);
			floodFillCorner(width - 1, height - 1);

			// -------------------------------------------------------------------
			// C) floodFillCorner: función auxiliar
			// -------------------------------------------------------------------
			function floodFillCorner(x, y) {
				// Nota que la mascara se pasa desplazada en +1, +1
				const seedPoint = new cv.Point(x, y);
				cv.floodFill(
					gray,
					floodMask,
					seedPoint,
					new cv.Scalar(255),
					new cv.Rect(0, 0, 0, 0),
					loDiff,
					upDiff,
					flags
				);
			}

			// -------------------------------------------------------------------
			// D) floodMask ahora contiene 255 en las zonas “fondo”.
			//    Extraemos la ROI (size = original), quitando el borde extra
			// -------------------------------------------------------------------
			const maskRoi = floodMask.roi(new cv.Rect(1, 1, width, height));

			// En maskRoi, lo que es fondo = 255, lo que es no relleno = 0
			// Vamos a invertirlo => el objeto = 255, fondo = 0
			const objectMask = new cv.Mat();
			cv.threshold(maskRoi, objectMask, 128, 255, cv.THRESH_BINARY_INV);

			// -------------------------------------------------------------------
			// E) Opcional: operación morfológica para cerrar huecos del objeto
			// -------------------------------------------------------------------
			const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
			cv.morphologyEx(objectMask, objectMask, cv.MORPH_CLOSE, kernel);
			kernel.delete();

			// -------------------------------------------------------------------
			// F) Encontrar contornos en objectMask (RETR_EXTERNAL)
			// -------------------------------------------------------------------
			const contours = new cv.MatVector();
			const hierarchy = new cv.Mat();
			cv.findContours(
				objectMask,
				contours,
				hierarchy,
				cv.RETR_EXTERNAL,
				cv.CHAIN_APPROX_SIMPLE
			);

			// Buscar contorno más grande
			let largestContour = null;
			let largestArea = 0;
			for (let i = 0; i < contours.size(); i++) {
				const contour = contours.get(i);
				const area = cv.contourArea(contour);
				if (area > largestArea) {
					largestArea = area;
					largestContour = contour;
				}
			}

			if (!largestContour) {
				// No hay contornos => devolvemos la original
				canvas.toBlob((blob) => resolve(blob), "image/png");
				cleanup();
				return;
			}

			// -------------------------------------------------------------------
			// G) Creamos la máscara final (0/255) solo para el contorno mayor
			// -------------------------------------------------------------------
			const finalMask = new cv.Mat.zeros(height, width, cv.CV_8UC1);
			{
				const vec = new cv.MatVector();
				vec.push_back(largestContour);
				cv.drawContours(finalMask, vec, 0, new cv.Scalar(255), -1);
				vec.delete();
			}

			// -------------------------------------------------------------------
			// H) Incrustar finalMask como canal alfa en src
			// -------------------------------------------------------------------
			for (let r = 0; r < height; r++) {
				for (let c = 0; c < width; c++) {
					const alpha = finalMask.ucharPtr(r, c)[0]; // 0 ó 255
					const pixelSrc = src.ucharPtr(r, c); // [R,G,B,A]
					pixelSrc[3] = alpha;
				}
			}

			// -------------------------------------------------------------------
			// I) Recortar boundingRect del contorno mayor
			// -------------------------------------------------------------------
			const boundingRect = cv.boundingRect(largestContour);
			const cropped = src.roi(boundingRect);

			// Copiamos la ROI a un Mat contiguo para evitar distorsiones
			const finalMat = new cv.Mat();
			cropped.copyTo(finalMat);

			// -------------------------------------------------------------------
			// J) (Opcional) Eliminar color de fondo por tolerancia
			// -------------------------------------------------------------------
			const bgColor = detectMostFrequentColorWithAlpha0(finalMat);
			if (bgColor) {
				for (let rr = 0; rr < finalMat.rows; rr++) {
					for (let cc = 0; cc < finalMat.cols; cc++) {
						const px = finalMat.ucharPtr(rr, cc); // [R,G,B,A]
						if (px[3] !== 0) {
							if (
								areColorsSimilar(
									px[0],
									px[1],
									px[2],
									bgColor.r,
									bgColor.g,
									bgColor.b,
									COLOR_THRESHOLD
								)
							) {
								px[3] = 0;
							}
						}
					}
				}
			}

			// -------------------------------------------------------------------
			// K) Convertir finalMat (RGBA) a Blob PNG
			// -------------------------------------------------------------------
			const outCanvas = document.createElement("canvas");
			outCanvas.width = boundingRect.width;
			outCanvas.height = boundingRect.height;
			const outCtx = outCanvas.getContext("2d");

			const outImageData = new ImageData(
				new Uint8ClampedArray(finalMat.data),
				boundingRect.width,
				boundingRect.height
			);
			outCtx.putImageData(outImageData, 0, 0);

			outCanvas.toBlob((blob) => resolve(blob), "image/png");

			// -------------------------------------------------------------------
			// Liberar memoria
			// -------------------------------------------------------------------
			function cleanup() {
				src.delete();
				gray.delete();
				floodMask.delete();
				maskRoi.delete();
				objectMask.delete();
				contours.delete();
				hierarchy.delete();
				finalMask.delete();
				cropped.delete();
				finalMat.delete();
			}
			cleanup();
		};

		img.onerror = (e) => reject(e);
		img.src = URL.createObjectURL(imageBlob);
	});
}

/**
 * Busca el color (R,G,B) más frecuente entre los píxeles con alpha=0
 * en un Mat RGBA. Devuelve {r,g,b} o null si no hay píxeles con alpha=0.
 */
function detectMostFrequentColorWithAlpha0(rgbaMat) {
	const colorCount = new Map();
	for (let r = 0; r < rgbaMat.rows; r++) {
		for (let c = 0; c < rgbaMat.cols; c++) {
			const px = rgbaMat.ucharPtr(r, c); // [R,G,B,A]
			if (px[3] === 0) {
				const key = `${px[0]},${px[1]},${px[2]}`;
				colorCount.set(key, (colorCount.get(key) || 0) + 1);
			}
		}
	}
	if (colorCount.size === 0) return null;

	let maxKey = null;
	let maxVal = 0;
	for (const [key, val] of colorCount.entries()) {
		if (val > maxVal) {
			maxVal = val;
			maxKey = key;
		}
	}
	if (!maxKey) return null;
	const [r, g, b] = maxKey.split(",").map(Number);
	return { r, g, b };
}

/**
 * Verifica si (r1,g1,b1) está dentro de la tolerancia de (r2,g2,b2)
 */
function areColorsSimilar(r1, g1, b1, r2, g2, b2, threshold) {
	return (
		Math.abs(r1 - r2) <= threshold &&
		Math.abs(g1 - g2) <= threshold &&
		Math.abs(b1 - b2) <= threshold
	);
}



export {
	generateIdFromText,
	generateId,
	getEntityType,
	clearCacheEntityType,
	clearCacheEntityTypesAll,
	setMenuVisible,
	setMaximized,
	isMaximized,
	setDetailVisible,
	isDetailVisible,
	selectDetail,
	addCollectionItem,
	changeRow,
	scrollTableEnd,
	setSelectedItemId,
	getSelectedItemId,
	selectPopup,
	getColumnNamesFromCSV,
	deleteRow,
	refreshCacheEntityType,
	updateEntityCacheInItems,
	getItemsType,
	clearCacheItemsType,
	clearCacheItemsTypesAll,
	refreshCacheItemsType,
	itemToString,
	GenerateItemCacheEntity,
	listItemRefToInline,
	refreshListHighlight,
	calculateProbabilitySameArticle,
	setCollectionLayout,
	getCollectionLayout,
	updatePopup,
	replaceKeysInValues,
	getOrAddEntity,
	normalizeString,
	refreshListData,
	changeListSelected,
	valueToString,























































































































};