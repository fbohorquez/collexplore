
import i18n from "./i18n";
import {
	getSelectedItemId,
	selectPopup,
	selectDetail,
	refreshListHighlight,
} from "./helper";

import Config from "./config";

import db from "./db";

import Papa from "papaparse";

const getBaseTypes = (component, type) => {
  if (component === "lists") {
    return getBaseListsTypes(type);
  }
  if (component === "items" || component === "lists-items" || component === "null-tmp") {
		return getBaseItemsTypes(type, component);
	}
}

const getBaseItemsTypes = (type, component) => {
	if (!type.tabs){
		type.tabs = [];
	}
	if (!type.fields){
		type.fields = [];
	}
	
	if (Config.getFromCache("module_lists") && !type.tabs.find((tab) => tab.label === i18n.t("lists"))) {
		type.tabs.push({
			label: i18n.t("lists"),
			groups: [
				{
					label: "",
					layout: [
						{
							w: 12,
							h: 12,
							x: 0,
							y: 0,
							i: "lists",
							minW: 2,
							minH: 2,
							maxH: 8,
							moved: false,
							static: false,
						},
					],
				},
			],
		});
		type.fields.push({
			id: "lists",
			label: i18n.t("lists"),
			type: "list",
			main: true,
			labelPosition: "none",
			onChange: (field, value, reference, old_value) => {
				let adds_values = value.filter((x) => !old_value.includes(x));
				let deletes_values = old_value.filter((x) => !value.includes(x));
				const selected_item = parseInt(getSelectedItemId());
				deletes_values.forEach((id) => {
					db.lists.get(id).then((list) => {
						if (list) {
							if (list.items) {
								list.items.forEach((item) => {
									if (item === selected_item) {
										list.items.splice(list.items.indexOf(item), 1);
										db.lists.update(list.id, list);
									}
								});
							}
						}
					});
				});
				adds_values.forEach((id) => {
					db.lists.get(id).then((list) => {
						if (list) {
							if (!list.fields.items) {
								list.items = [];
							}
							let mod_selected_item = selected_item;
							if (component === "lists-items") {
								mod_selected_item = "list-" + selected_item;
							}
							list.items.push(mod_selected_item);
							db.lists.update(list.id, list);
						}
					});
				});
				return true;
			}
		});
	}
	if (Config.getFromCache("module_location") && !type.tabs.find((tab) => tab.label === i18n.t("location"))) {
		type.tabs.push({
			active: true,
			label: i18n.t("location"),
			groups: [
				{
					label: "",
					layout: [
						{
							w: 12,
							h: 12,
							x: 0,
							y: 0,
							i: "location",
							minW: 2,
							minH: 2,
							maxH: 8,
							moved: false,
							static: false,
						},
					],
				},
			],
		});
		type.fields.push({
			id: "location",
			label: i18n.t("location"),
			type: "key-value",
			default: "",
			labelPosition: "none",
		});
	}
	if (Config.getFromCache("module_lending") && !type.tabs.find((tab) => tab.label === i18n.t("lending"))) {
		type.tabs.push({
			label: i18n.t("lending"),
			groups: [
				{
					label: "",
					layout: [
						{
							w: 12,
							h: 12,
							x: 0,
							y: 0,
							i: "lending",
							minW: 2,
							minH: 2,
							maxH: 8,
							moved: false,
							static: false,
						},
					],
				},
			],
		});
		type.fields.push({
			id: "lending",
			label: i18n.t("lending"),
			type: "lending",
			default: "",
			labelPosition: "none",
		});
	}
	if (Config.getFromCache("module_google_images") && !type.tabs.find((tab) => tab.label === i18n.t("google-images"))) {
		type.tabs.push({
			label: i18n.t("google-images"),
			groups: [
				{
					label: "",
					layout: [
						{
							w: 12,
							h: 12,
							x: 0,
							y: 0,
							i: "google-images",
							minW: 2,
							minH: 2,
							maxH: 8,
							moved: false,
							static: false,
						},
					],
				},
			],
		});
		type.fields.push({
			id: "google-images",
			label: i18n.t("google-images"),
			type: "google-images",
			type_name: type.name,
			api_key: Config.getFromCache("google_images_api_key"),
			cx: Config.getFromCache("google_images_cx"),
			add_search_data: Config.getFromCache(
				"google_images_cxgoogle_images_add_search_data"
			),
			default: "",
			labelPosition: "none",
		});
	}

	if (Config.getFromCache("module_searxng") && !type.tabs.find((tab) => tab.label === i18n.t("search-images"))) {
		type.tabs.push({
			label: i18n.t("search-images"),
			groups: [
				{
					label: "",
					layout: [
						{
							w: 12,
							h: 12,
							x: 0,
							y: 0,
							i: "module_searxng",
							minW: 2,
							minH: 2,
							maxH: 8,
							moved: false,
							static: false,
						},
					],
				},
			],
		});
		type.fields.push({
			id: "module_searxng",
			label: i18n.t("search-images"),
			type: "searxng-images",
			type_name: type.name,
			instance: Config.getFromCache("module_searxng_instance"),
			add_search_data: Config.getFromCache("module_searxng_add_search_data"),
			default: "",
			labelPosition: "none",
		});
	}
  return type;
}


const proceesItem = async (item) => {
	if (typeof item === "string") {
		return item;
	}
	else if (typeof item === "object") {
		if (item.fields) {
			let columns = [];
			columns.push(item.name);
			for (const field in item.fields) {
				if (item.fields[field] instanceof Object && !(item.fields[field] instanceof Array)) {
					continue;
				}
				let process_value = item.fields[field];
				if (item.cache[field]) {
					process_value = item.cache[field];
				}
				if (!(process_value instanceof Array)) {
					process_value = [process_value];
				}
				process_value = process_value.map((value) => {
					if (typeof value === "object") {
						return value.name;
					}
					return value;
				});
				columns.push(process_value.join(", "));
			}
			columns = columns.map((col) => col.replace(/"/g, "\"\""));
			columns = columns.map((col) => "\"" + col + "\"");
			return columns.join(",");
		}
	}
	else if (typeof item === "number") {
		const ref_item = await db.items.get(item);
		return proceesItem(ref_item);
	}
	return "";
}

const getBaseListsTypes = (type) => {
	let global_list_import_file = null;
	let global_list_import_separator = ";";
	let global_list_import_skip_header = true;

	return {
		tabs: [
			{
				label: i18n.t("items"),
				groups: [
					{
						label: "",
						layout: [
							{
								w: 12,
								h: 12,
								x: 0,
								y: 0,
								i: "items",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
						],
					},
				],
			},
			{
				label: i18n.t("configuration"),
				groups: [
					{
						className: "import-export",
						label: "",
						layout: [
							{
								w: 4,
								h: 6,
								x: 0,
								y: 0,
								i: "image",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
							{
								w: 8,
								h: 12,
								x: 4,
								y: 0,
								i: "description",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
							{
								w: 12,
								h: 1,
								x: 0,
								y: 12,
								i: "highlight",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
						],
					},
				],
			},
			{
				label: i18n.t("import-export"),
				groups: [
					{
						className: "import-export",
						label: i18n.t("import"),
						layout: [
							{
								w: 6,
								h: 1,
								x: 0,
								y: 0,
								i: "import-file",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
							{
								w: 3,
								h: 1,
								x: 6,
								y: 0,
								i: "import-separator",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
							{
								w: 3,
								h: 1,
								x: 9,
								y: 0,
								i: "import-skip-header",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
							{
								w: 12,
								h: 12,
								x: 0,
								y: 1,
								i: "import-btn",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
						],
					},
					{
						className: "import-export",
						label: i18n.t("export"),
						layout: [
							{
								w: 12,
								h: 12,
								x: 0,
								y: 0,
								i: "export-btn",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
						],
					},
				],
			},
		],
		fields: [
			{
				id: "items",
				label: i18n.t("items"),
				type: "list-items",
				main: true,
				labelPosition: "none",
			},
			{
				id: "image",
				label: i18n.t("image"),
				type: "image",
				default: "",
				labelPosition: "none",
			},
			{
				id: "description",
				label: i18n.t("description"),
				type: "textrich",
				default: "",
			},
			{
				id: "highlight",
				label: i18n.t("highlight"),
				type: "checkbox",
				default: false,
				onChange: (field, value) => {
					const list_id = parseInt(getSelectedItemId());
					db["lists-hightlight"]
						.where("list_id")
						.equals(list_id)
						.toArray()
						.then((highlights) => {
							if (value && highlights.length === 0) {
								db.lists.get(list_id).then((list) => {
									db["lists-hightlight"]
										.add({
											list_id: list_id,
											name: list.name,
										})
										.then(() => {
											refreshListHighlight();
										});
								});
							} else if (!value && highlights.length > 0) {
								db["lists-hightlight"].delete(highlights[0].id).then(() => {
									refreshListHighlight();
								});
							}
						});
				},
			},
			{
				id: "import-file",
				label: i18n.t("file-csv"),
				type: "file",
				accept: ".csv",
				main: false,
				onChange: (field, value) => {
					global_list_import_file = value;
				},
			},
			{
				id: "import-separator",
				label: i18n.t("separator"),
				type: "text",
				default: ";",
				onChange: (field, value) => {
					global_list_import_separator = value;
				},
			},
			{
				id: "import-skip-header",
				label: i18n.t("skip-header"),
				type: "checkbox",
				default: true,
				onChange: (field, value) => {
					global_list_import_skip_header = value;
				},
			},
			{
				id: "import-btn",
				label: i18n.t("import"),
				type: "button",
				action: "import",
				labelPosition: "none",
				className: "full-width",
				onClick: (field, value) => {
					const list_id = parseInt(getSelectedItemId());
					const separator = global_list_import_separator;
					const file = global_list_import_file;
					db.lists.get(list_id).then((list) => {
						if (list) {
							let items = list.fields.items || [];

							Papa.parse(file, {
								header: global_list_import_skip_header,
								worker: true,
								skipEmptyLines: true,
								step: (result) => {
									if (global_list_import_skip_header) {
										result.data = Object.values(result.data);
									}
									const filtered = result.data.filter((row) => row !== "");
									const line_str = filtered.join(" | ");
									items.push(line_str);
								},
								delimiter: separator,
								complete: (result) => {
									list.fields.items = items;
									db.lists.update(list_id, list).then(() => {
										selectDetail("lists", list);
										selectPopup({
											title: i18n.t("import-completed"),
											content: i18n.t("import-completed-message"),
											btns: [
												{
													label: i18n.t("ok"),
													action: () => {
														selectPopup(null);
													},
												},
											],
										});
									});
								},
							});
						}
					});
				},
			},
			{
				id: "export-btn",
				label: i18n.t("export"),
				type: "button",
				action: "export",
				labelPosition: "none",
				className: "full-width",
				onClick: (field, value) => {
					const list_id = parseInt(getSelectedItemId());
					db.lists.get(list_id).then(async (list) => {
						if (list) {
							const items = list.fields.items || [];
							let csv = "";
							for (const item of items) {
								csv += (await proceesItem(item)) + "\n";
							}
							const blob = new Blob([csv], { type: "text/csv" });
							const url = URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = url;
							a.download = "export.csv";
							a.click();
						}
					});
				},
			},
		],
	};
};


const getDashboardType = () => {
	return {
		tabs: [
			{
				label: i18n.t("dashboard"),
				groups: [
					{
						label: "",
						layout: [
							{
								w: 12,
								h: 12,
								x: 0,
								y: 0,
								i: "dashboard",
								minW: 2,
								minH: 2,
								maxH: 8,
								moved: false,
								static: false,
							},
						],
					},
				],
			},
		],
		fields: [
			{
				id: "dashboard",
				label: i18n.t("dashboard-type"),
				type: "select",
				options: [
					{
						value: "table",
						label: i18n.t("table"),
					},
					{
						value: "bar",
						label: i18n.t("bar"),
					}
				],
			},
		],
	};
}




export { getBaseTypes, getBaseListsTypes, getBaseItemsTypes, getDashboardType };