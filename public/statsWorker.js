// public/statsWorker.js

/* eslint-disable no-restricted-globals */

// Función para aplicar filtros (debes implementar la lógica real de filtrado)
function applyFilters(items, filters) {
	// Implementa la lógica de filtrado según tus necesidades
	// Este es un ejemplo simple que no aplica ningún filtro
	return items;
}

// Función para procesar los datos (similar a tu fetchData original)
async function fetchData(typeSelected, config, itemListConfigRaw) {
	const { query = {}, ignoreGrouping } = config;
	const { base = {}, filters = [] } = query;

	const baseType = base.type || "items";
	const baseFields = base.fields || [];

	if (ignoreGrouping) {
    function getSetOfItems (items, set) {
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.items) {
            getSetOfItems(item.items, set);
          }else {
            set.add(item);
          }
        }
      } 
      else if (typeof items === 'object' && items.items) {
        if (items.items) {
          getSetOfItems(items.items, set);
        }else {
          set.add(items);
        }
      }
      else {
        set.add(items);
      }
          
    }
    const set = new Set();
    getSetOfItems(itemListConfigRaw.itemsListRaw, set);
    //set to Array
    let items = Array.from(set);
		// let items = await db[baseType].where({ type: parseInt(typeSelected) }).toArray();

		items = applyFilters(items, filters);

		const globalCounts = {};
		for (const field of baseFields) {
			globalCounts[field] = {};
		}

		for (const item of items) {
			for (const field of baseFields) {
				const value = item.fields?.[field];
				if (Array.isArray(value)) {
					for (const val of value) {
						globalCounts[field][val] = (globalCounts[field][val] || 0) + 1;
					}
				} else {
					if (value !== undefined && value !== null) {
						globalCounts[field][value] = (globalCounts[field][value] || 0) + 1;
					}
				}
			}
		}

		return {
			type: "GLOBAL",
			counts: globalCounts,
			totalItems: items.length,
		};
	}

	function processGroupNode(groupNode, depth, typesByID) {
		const { groupKey, groupBy, items: children, uniqueCount, index } = groupNode || {};
		if (!children || !Array.isArray(children)) {
			return {
				groupKey,
				depth,
				groupBy,
				index,
				counts: initCounts(baseFields),
				totalItems: (uniqueCount && uniqueCount.size) || 0,
				subGroups: [],
			};
		}

		let groupCounts = initCounts(baseFields);
		let totalItems = 0;
		const subGroups = [];

		for (const child of children) {
			if (child?.groupKey && Array.isArray(child.items)) {
				const subData = processGroupNode(child, depth + 1, typesByID);
				subGroups.push(subData);
			} else {
				totalItems++;
				if (baseFields && baseFields.length) {
					for (const field of baseFields) {
						let val =
							child[field] ?? child.cache?.[field] ?? child.fields?.[field];
						const fieldDef = typesByID[typeSelected].fields.find(
							(f) => f.id === field
						);
						if (
							fieldDef &&
							(fieldDef.type === "checkbox" || fieldDef.type === "select") &&
							val === undefined
						) {
							val = 0;
						}

						if (Array.isArray(val)) {
							for (let v of val) {
								if (v.name) {
									v = v.name;
								}
								groupCounts[field][v] = (groupCounts[field][v] || 0) + 1;
							}
						} else if (val !== undefined && val !== null) {
							groupCounts[field][val] = (groupCounts[field][val] || 0) + 1;
						}
					}
				} else {
					groupCounts++;
				}
			}
		}

		return {
			groupKey,
			depth,
			groupBy,
			index,
			counts: groupCounts,
			totalItems: (uniqueCount && uniqueCount.size) || totalItems,
			subGroups,
		};
	}

	function initCounts(baseFields) {
		if (baseFields && baseFields.length) {
			const obj = {};
			for (const f of baseFields) {
				obj[f] = {};
			}
			return obj;
		} else {
			return 0;
		}
	}

	const typesByID = itemListConfigRaw.typesByID;

	const groups = [];
	let grandTotalItems = 0;
	for (const top of itemListConfigRaw.itemsListRaw) {
		const result = processGroupNode(top, 0, typesByID);
		groups.push(result);
		grandTotalItems += result.totalItems + sumSubgroupItems(result.subGroups);
	}

	function sumSubgroupItems(subGroups) {
		let acc = 0;
		for (const sg of subGroups) {
			acc += sg.totalItems;
			if (sg.subGroups?.length) {
				acc += sumSubgroupItems(sg.subGroups);
			}
		}
		return acc;
	}

	return {
		type: "GROUPED",
		totalItems: grandTotalItems,
		groups,
	};
}

// search groupKey __undefined__ and move last
function moveGroupKeyUndefined(groups) {
	let index = -1;
	for (let i = 0; i < groups.length; i++) {
		if (groups[i].groupKey === "__undefined__") {
			groups[i].groupKey = "Sin asignar";
			index = i;
			break;
		}
	}
	if (index !== -1) {
		const group = groups.splice(index, 1);
		groups.push(group[0]);
	}
	if (groups.length) {
		for (let i = 0; i < groups.length; i++) {
			if (groups[i].subGroups) {
				moveGroupKeyUndefined(groups[i].subGroups);
			}
		}
	}
	return groups;
}

// Listener para mensajes entrantes desde el hilo principal
self.onmessage = async function (e) {
	const { typeSelected, config, itemListConfig } = e.data;

	try {
		const result = await fetchData(typeSelected, config, itemListConfig);
		if (result.groups && result.groups.length) {
			result.groups = moveGroupKeyUndefined(result.groups);
		}
		
		const jsonString = JSON.stringify(result);
		const encoder = new TextEncoder();
		const buffer = encoder.encode(jsonString).buffer;

		// Enviar el ArrayBuffer de vuelta, transfiriéndolo
		postMessage({ success: true, data: buffer }, [buffer]);

		// postMessage({ success: true, data: result });
	} catch (error) {
		postMessage({ success: false, error: error.message });
	}
};











