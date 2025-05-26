import Fuse from "fuse.js";
import db from "../services/db";
import { normalizeString } from "./helper";




let maxFieldIndex = 0;

function normalizeItem (item) {
	item.normalize = {};
	if (item.fields) {
		let index = 0;
		Object.keys(item.fields).forEach((key) => {
			if (item.fields[key] instanceof Blob) {
				return;
			}
			if (item.cache && item.cache[key]) {
				if (item.cache[key] instanceof Array) {
					for (let i = 0; i < item.cache[key].length; i++) {
						let string = normalizeString(item.cache[key][i].name);
						item.normalize["normalize_" + index] = string;
						index++;
						string.split(" ").forEach((word) => {
							item.normalize["normalize_" + index] = word;
							index++;
						});
					}
				} else {
					let string = normalizeString(item.cache[key].name);
					item.normalize["normalize_" + index] = string;
					index++;
					string.split(" ").forEach((word) => {
						item.normalize["normalize_" + index] = word;
						index++;
					});
				}
			} else {
				if (item.fields[key] instanceof Array) {
					for (let i = 0; i < item.fields[key].length; i++) {
						let string = normalizeString(item.fields[key][i]);
						item.normalize["normalize_" + index] = string;
						index++;
						string.split(" ").forEach((word) => {
							item.normalize["normalize_" + index] = word;
							index++;
						});
					}
				} else {
					let string = normalizeString(item.fields[key]);
					item.normalize["normalize_" + index] = string;
					index++;
					string.split(" ").forEach((word) => {
						item.normalize["normalize_" + index] = word;
						index++;
					});
				}
			}
		});
		if (index > maxFieldIndex) {
			maxFieldIndex = index;
		}
	}
	item.name = normalizeString(item.name);
	return {...item, ...item.normalize};
}

class Search {
	static instance = null;

	static getInstance() {
		if (Search.instance === null) {
			Search.instance = new Search();
		}
		return Search.instance;
	}

	constructor() {
		this.fuse = null;
		this.init_engine();
	}

	static async init() {
		const searchInstance = Search.getInstance();
		await searchInstance.init_engine();
	}

	static search(query) {
		const searchInstance = Search.getInstance();
		return searchInstance.search_engine(query);
	}

  

	async init_engine() {
		let items = await db.items.toArray();
    items = items.map((item) => {
      return normalizeItem(item);
    });
		let fields_search = Array.from({ length: maxFieldIndex }, (_, i) => {
			return "normalize_" + i;
		});
		fields_search.unshift("name");
		const options = {
			includeScore: true,
			keys: fields_search,
			threshold: 0.2, // Ajustado para permitir más variaciones
			isCaseSensitive: false, // No es sensible a mayúsculas/minúsculas
			includeMatches: true,
			findAllMatches: true,
			minMatchCharLength: 0, // Ajustado para palabras más largas
			location: 0,
			distance: 100,
			useExtendedSearch: true, // Utiliza búsqueda extendida
		};
		this.fuse = new Fuse(items, options);
	}

	search_engine(query) {
		query = normalizeString(query);
		return this.fuse.search(query).map((result) => {
			return result.item.id;
		});
	}
}

export default Search;


















