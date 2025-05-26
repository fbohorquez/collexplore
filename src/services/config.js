import EventEmitter from "events";

import db from "./db";

import i18n from "i18next";

class Config extends EventEmitter {
	static instance = null;

	static document = "config";

	static dbReady = false;

	static default = {
	};

	static cache = {};

	constructor() {
		super();
		if (!Config.instance) {
			Config.instance = this;
			this.initializeDB();
			this.initDefault();
		}
		return Config.instance;
	}

	async initializeDB() {
		try {
			await db.open();
			Config.dbReady = true;
		} catch (error) {
			console.error("Failed to initialize database", error);
		}
	}

	initDefault() {
		let def = Config.getDefInputs();
		for (let k in def) {
			for (let i = 0; i < def[k].length; i++) {
				if (def[k][i].default !== undefined ) {
					Config.default[def[k][i].id] = def[k][i].default;
				}
			}
		}
	}

	static async initConfigCache() {
		Config.cache = {};
		const config = await db.config.toArray();
		config.forEach((c) => {
			Config.cache[c.key] = c.value;
		});
	}

	static getFromCache(key, defaultValue) {
		return typeof Config.cache[key] !== "undefined" ? Config.cache[key] : defaultValue;
	}

	static async getFromCacheOrDB(key) {
		if (Config.cache[key] !== undefined) {
			return Config.cache[key];
		}
		return await this.get(key);
	}

	static setInCache(key, value) {
		Config.cache[key] = value;
		db.config.put({ key, value });
	}

	static me() {
		return new Config();
	}

	async get(key, defaultValue) {
		if (!Config.dbReady) {
			await this.initializeDB();
		}

		let result = null;
		try {
			const r = await db.config.where("key").equals(key).first();

			result = r?.value;

			if (result === undefined || result === null) {
				result = Config.default[key];
			}
		} catch (error) {
			console.error("Error retrieving key from IndexedDB", error);
		}
		if (result === undefined) {
			result = defaultValue;
		}
		return result;
	}

	static get(key, defaultValue) {
		return this.instance.get(key, defaultValue);
	}

	set(key, value) {
		db.config
			.where("key")
			.equals(key)
			.first()
			.then((r) => {
				if (r) {
					db.config.update(r.key, { value });
				} else {
					db.config.add({ key, value });
				}
				this.emit("updated", { key, value });
			});
	}

	static set(key, value) {
		this.instance.set(key, value);
	}

	static getDefInputs () {
		const t = i18n.t.bind(i18n);
		return {
			view: [
				{
					id: "collection-img-visible",
					label: t("show-collection-img"),
					type: "checkbox",
					default: true,
				},
				{
					id: "collection-img",
					label: t("collection-img"),
					type: "image",
					accept: ".png, .jpg, .jpeg, .gif",
				},
				{
					id: "maximized",
					label: t("config-show-maximixed"),
					type: "select",
					options: [
						{ value: "remember", label: t("remember") },
						{ value: "allways", label: t("allways") },
						{ value: "never", label: t("never") },
					],
					default: "never",
				},
				{
					id: "list-to-collection",
					label: t("list-to-collection"),
					type: "select",
					options: [
						{ value: "check", label: t("check") },
						{ value: "new", label: t("allaways-new") },
					],
					default: "check",
				},
				{
					id: "automatic-scroll-change-detail",
					label: t("automatic-scroll-change-detail"),
					type: "checkbox",
					default: true,
				},
				{
					id: "automatic-scroll-create-detail",
					label: t("automatic-scroll-create-detail"),
					type: "checkbox",
					default: true,
				},
			],
			data: [
				{
					id: "module_lists",
					label: t("lists-module"),
					type: "checkbox",
					required: false,
					maxLength: 100,
					labelPosition: "left",
					help: t("lists-module-help"),
				},
				{
					id: "module_location",
					label: t("location-module"),
					type: "checkbox",
					required: false,
					maxLength: 50,
					labelPosition: "left",
					help: t("location-module-help"),
				},
				{
					id: "module_lending",
					label: t("lending-module"),
					type: "checkbox",
					required: false,
					maxLength: 50,
					labelPosition: "left",
					help: t("lending-module-help"),
				},
				{
					id: "module_searxng",
					label: t("searxng-images-module"),
					type: "checkbox",
					required: false,
					maxLength: 50,
					labelPosition: "left",
					help: t("search-module-help"),
					subform: {
						visible: "module_searxng",
						def: [
							{
								id: "module_searxng_instance",
								label: t("searxng-instance"),
								type: "text",
								required: true,
								maxLength: 50,
								labelPosition: "top",
							},
							{
								id: "module_searxng_add_search_data",
								label: t("add-search-data"),
								type: "key-value",
								required: false,
								maxLength: 50,
								labelPosition: "top",
							},
						],
					},
				},
				{
					id: "module_google_images",
					label: t("google-images-module"),
					type: "checkbox",
					required: false,
					maxLength: 50,
					labelPosition: "left",
					help: t("google-images-module-help"),
					subform: {
						visible: "module_google_images",
						def: [
							{
								id: "google_images_api_key",
								label: t("google-images-api-key"),
								type: "text",
								required: true,
								maxLength: 50,
								labelPosition: "top",
							},
							{
								id: "google_images_cx",
								label: t("google-images-cx"),
								type: "text",
								required: true,
								maxLength: 50,
								labelPosition: "top",
							},
							{
								id: "google_images_cxgoogle_images_add_search_data",
								label: t("add-search-data"),
								type: "key-value",
								required: false,
								maxLength: 50,
								labelPosition: "top",
							},
						],
					},
				},

				{
					id: "module_googledrive",
					label: t("googledrive-module"),
					type: "checkbox",
					required: false,
					maxLength: 50,
					labelPosition: "left",
					help: t("googledrive-module-help"),
					subform: {
						visible: "module_googledrive",
						def: [
							// {
							// 	id: "login_googledrive",
							// 	label: t("login-googledrive"),
							// 	type: "button",
							// 	onClick: async () => {
							// 		const { default: GoogleDrive } = await import(
							// 			"../components/Save/SaveTypes/GoogleDriveBackup"
							// 		);
							// 		const googleDrive = new GoogleDrive();
							// 		googleDrive.login();
							// 	},
							// },
							{
								id: "download_googledrive",
								label: t("download-googledrive"),
								type: "button",
								onClick: async () => {
									const { default: GoogleDrive } = await import(
										"../components/Save/SaveTypes/GoogleDriveBackup"
									);
									await Config.initConfigCache();
									const googleDrive = new GoogleDrive();
									googleDrive.downloadBackup(true);
								},
							},
						],
					},
				},
				{
					id: "module_server_scraping",
					label: t("server-scraping-module"),
					type: "checkbox",
					required: false,
					maxLength: 50,
					labelPosition: "left",
					help: t("server-scraping-module-help"),
					subform: {
						visible: "module_server_scraping",
						def: [
							{
								id: "server_scraping_url",
								label: t("server-scraping-url"),
								type: "text",
								required: true,
								maxLength: 500,
								labelPosition: "top",
							},
						],
					},
				},
				{
					id: "module_sort_list",
					label: t("module-sort-list"),
					type: "checkbox",
					required: false,
					maxLength: 50,
					labelPosition: "left",
					help: t("sort-list-module-help"),
				},
				{
					id: "module_gpt",
					label: t("gpt-module"),
					type: "checkbox",
					required: false,
					maxLength: 50,
					labelPosition: "left",
					help: t("gpt-module-help"),
					subform: {
						visible: "module_gpt",
						def: [
							{
								id: "gpt_api_backend",
								label: t("gpt-api-backend"),
								type: "text",
								required: true,
								maxLength: 500,
								labelPosition: "top",
							},
						],
					},
				},
			],
		};
	}

	static columns = {
		view: 2,
		data: 1,
	};

	static getDef(type) {
		const def = Config.getDefInputs();
		return {
			document: "config",
			"key/value": true,
			ondemand: false,
			reset: false,
			def: def[type],
			columns: Config.columns[type],
			after: (data) => {
				Config.instance.emit("updated");
			}
		};
	}

	onUpdate(callback) {
		this.on("updated", callback);
	}
}












export default Config;