// sortWorker.js

function sanitizeString(str) {
	if (!str) return "";
	return String(str)
		.toLowerCase()
		.replace(/[áàâäãāă]/g, "a")
		.replace(/[éèêëēĕėę]/g, "e")
		.replace(/[íìîïīĭ]/g, "i")
		.replace(/[óòôöõōŏ]/g, "o")
		.replace(/[úùûüūŭ]/g, "u")
		.replace(/[ç]/g, "c")
		.replace(/[¿!?¡.•\[\]·]/g, "")
		.trim();
}

function getField(item, fieldName, main) {
	if (fieldName === "name") {
		return item.name;
	}
	let field = main
		? item[fieldName]
		: item.cache[fieldName] && item.fields[fieldName]
		? item.cache[fieldName]
		: item.fields[fieldName];
	return field;
}

function normalizeField(field) {
	if (Array.isArray(field)) {
		return field.map((f) => {
			if (f && typeof f === "object" && f.name) {
				f = sanitizeString(f.name);
			}
			if (typeof f === "string") {
				f = sanitizeString(f);
			}
			return f;
		});
	} else {
		if (field && typeof field === "object" && field.name) {
			field = sanitizeString(field.name);
		}
		if (typeof field === "string") {
			field = sanitizeString(field);
		}
		return field;
	}
}

function compareValues(a, b) {
	if (a === undefined || a === "") a = -1;
	if (b === undefined || b === "") b = -1;

	// Convert numeric strings to numbers for proper comparison
	const numA = parseFloat(a);
	const numB = parseFloat(b);
	const isANum = !isNaN(numA);
	const isBNum = !isNaN(numB);

	if (isANum && isBNum) {
		return numA - numB;
	}
	if (isANum) return -1;
	if (isBNum) return 1;

	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

self.onmessage = function (e) {
	let {
		items,
		fieldName,
		dir,
		main,
		filterItems,
		searchAdvancedValue,
		groupBy,
		typesByID,
	} = e.data;

	const filterItemsSet = filterItems ? new Set(filterItems) : null;

	const isOk = (item) => {
		// Tu lógica de filtrado existente permanece sin cambios
		if (item.fields) {
			Object.keys(item.fields).forEach((key) => {
				if (
					typeof item.fields[key] === "object" &&
					item.fields[key] instanceof Blob
				) {
					item.cache[key] = URL.createObjectURL(item.fields[key]);
				}
			});
		}
		if (
			(!filterItemsSet || filterItemsSet.size === 0) &&
			(!searchAdvancedValue || searchAdvancedValue.length === 0)
		) {
			return true;
		}
		if (
			filterItemsSet &&
			filterItemsSet.size > 0 &&
			(!searchAdvancedValue || searchAdvancedValue.length === 0)
		) {
			return filterItemsSet.has(item.id);
		}
		if (searchAdvancedValue && !Array.isArray(searchAdvancedValue)&&  searchAdvancedValue.query) {
			searchAdvancedValue = searchAdvancedValue.query;
		}
		if (searchAdvancedValue && searchAdvancedValue.length > 0) {
			for (let i = 0; i < searchAdvancedValue.length; i++) {
				let search = searchAdvancedValue[i];
				let search_keys = Object.keys(search);
				let isOk = true;
				for (let j = 0; j < search_keys.length; j++) {
					let search_item = search[search_keys[j]];
					if (typeof search_item === "boolean") {
						search_item = search_item ? "1" : "0";
					}
					let sk = search_keys[j];
					let or = false;
					if (sk.includes("OR")) {
						or = true;
						sk = sk.replace("OR", "");
					}
					let item_field = sk !== "name" ? item.fields[sk] : item.name;
					if (typeof search_item === "string") {
						if (search_item === "") {
							continue;
						}
						search_item = sanitizeString(search_item);
						item_field = sanitizeString(item_field);
						if (item_field.indexOf(search_item) === -1) {
							isOk = false;
							break;
						}
					} else if (search_item instanceof Array) {
						if (search_item.length === 0) {
							continue;
						}
						if (!or) {
							for (let k = 0; k < search_item.length; k++) {
								if (!item_field || item_field.indexOf(search_item[k]) === -1) {
									isOk = false;
									break;
								}
							}
							if (!isOk) {
								break;
							}
						} else {
							let exists = false;
							for (let k = 0; k < search_item.length; k++) {
								if (item_field && item_field.indexOf(search_item[k]) !== -1) {
									exists = true;
									break;
								}
							}
							if (!exists) {
								isOk = false;
								break;
							}
						}
					}
				}
				if (isOk) {
					return true;
				}
			}
		}
		return false;
	};

	const filteredItems = items.filter(isOk);

	const groupingArray = Array.isArray(groupBy)
		? groupBy
		: Object.entries(groupBy || {}).map(([field, dir]) => ({
				field,
				dir,
		  }));

	let result;

	if (groupingArray.length > 0) {
		result = groupItems(
			filteredItems,
			groupingArray,
			fieldName,
			dir,
			main,
			typesByID
		);
	} else {
		// Sin agrupación, ordenar los elementos directamente
		// result = filteredItems.sort((a, b) => {
		// 	let fieldA = getField(a, fieldName, main);
		// 	let fieldB = getField(b, fieldName, main);
		// 	fieldA = normalizeField(fieldA);
		// 	fieldB = normalizeField(fieldB);
		// 	let val = compareValues(fieldA, fieldB);
		// 	if (dir === "desc") val *= -1;
		// 	return val;
		// });
		result = filteredItems;
	}

	self.postMessage(result);
};

function groupItems(
	items,
	groupingFields,
	fieldName,
	dir,
	main,
	typesByID,
	level = 0
) {
	if (level >= groupingFields.length) {
		// No hay más campos para agrupar, ordenar los elementos
		items.sort((a, b) => {
			let fieldA = getField(a, fieldName, main);
			let fieldB = getField(b, fieldName, main);
			fieldA = normalizeField(fieldA);
			fieldB = normalizeField(fieldB);
			let val = compareValues(fieldA, fieldB);
			if (dir === "desc") val *= -1;
			return val;
		});
		// Calcular uniqueCount para este nivel
		const uniqueIds = new Set(items.map((item) => item.id));
		return { items, uniqueCount: uniqueIds.size };
	}

	const fieldInfo = groupingFields[level];
	const { field, dir: groupDir } = fieldInfo;
	const groups = {};
	for (const item of items) {
		main = field === "name" || field === "in_collection";
		let fieldValue = getField(item, field, main);
		fieldValue = normalizeField(fieldValue);
		if (Array.isArray(fieldValue) && fieldValue.length === 0) {
			fieldValue = undefined;
		}

		if (Array.isArray(fieldValue)) {
			// Para cada valor en el array, añade el elemento al grupo correspondiente
			fieldValue.forEach((value) => {
				const key = value !== undefined ? value : "__undefined__";

				if (!groups[key]) {
					groups[key] = [];
				}
				groups[key].push(item);
			});
		} else {
			let key = fieldValue !== undefined ? fieldValue : "__undefined__";
			let typeObj = typesByID[item.type];
			let fieldObj = typeObj.fields.find((f) => f.id === field);
			if (fieldObj && fieldObj.type === "checkbox") {
				if (
					key === true ||
					key === "true" ||
					key === "on" ||
					key === "1" ||
					key === 1
				) {
					key = true;
				} else {
					key = false;
				}
			} else if (fieldObj && fieldObj.type === "stars") {
				if (!key || key === "0" || key === "__undefined__") {
					key = "__undefined__";
				}
			}

			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		}
	}

	const groupKeys = Object.keys(groups);
	// Ordena las claves del grupo según groupDir
	groupKeys.sort((a, b) => {
		let val = compareValues(a, b);
		if (groupDir === "desc") val *= -1;
		return val;
	});

	const result = [];
	for (const key of groupKeys) {
		const groupItemsList = groups[key];
		const groupedResult = groupItems(
			groupItemsList,
			groupingFields,
			fieldName,
			dir,
			main,
			typesByID,
			level + 1
		);

		// Añadir uniqueCount al grupo actual
		let uniqueCount;
		if(Array.isArray(groupedResult)){
			uniqueCount = new Set();
			for (const group of groupedResult) {
				if (group.uniqueCount) {
					uniqueCount = new Set([...uniqueCount, ...group.uniqueCount]);
				}
			}
		}else {
			if (groupedResult.items) {
				// Es un grupo sin subgrupos
				uniqueCount = new Set(groupedResult.items);
			} else {
				// Es un grupo con subgrupos
				uniqueCount = groupedResult.reduce(
					(acc, subgroup) => {
						return new Set([...acc, ...subgroup.uniqueCount])
					},
				);
			}
		}

		result.push({
			groupKey: key,
			items: groupedResult.items || groupedResult,
			groupBy: field,
			uniqueCount: uniqueCount,
		});
	}
	return result;
}

