import React, { useContext, useState, useEffect, useMemo } from "react";
import { Collapse, Box, Typography, Button, Tooltip } from "@mui/material";
import { AppContextDetail } from "./../../services/context_detail";
import { ProcessContext } from "./../../services/context_scraping";
import { selectPopup, openErrorDialog} from "./../../services/helper";
import DeleteIcon from "@mui/icons-material/Delete";
import Config from "./../../services/config";
import db from "./../../services/db";
import {
	printResultsRecursively,
	printResults,
	generateIdentifier,
} from "../../services/scraping_helper";

import AddToQueueIcon from "@mui/icons-material/AddToQueue";

import FormBuilder from "./../FormBuilder";

import { useTranslation } from "react-i18next";

function ScrapingDetail() {
	const { t } = useTranslation();
	const { selectedItem, setSelectedItem } = useContext(AppContextDetail);
	const { updateProcess, startProcess, getProcessStatus, processes } =
		useContext(ProcessContext);

	const [typesByID, setTypesByID] = React.useState({});

	useEffect(() => {
		db.types
			.orderBy("order")
			.toArray()
			.then((data) => {
				let types = {};
				for (let i = 0; i < data.length; i++) {
					if (!data[i].active) {
						continue;
					}
					types[data[i].id] = data[i];
				}
				setTypesByID(types);
			});
	}, [selectedItem]);

	const defName = {
		document: "scraping",
		reference: true,
		ondemand: false,
		def: [
			{
				id: "name",
				type: "text",
				label: null,
				placeholder: t("name"),
				name: "name",
				style: { maxWidth: "90%" },
			},
		],
	};


	

	const generateDef = (types) => {
		if (!types) {
			types = [];
		}
		const def = {
			document: "scraping",
			reference: true,
			ondemand: false,
			def: [
				{
					id: "type",
					label: t("type"),
					type: "select",
					name: "type",
					options: [
						{ value: "scraping-for-item", label: t("scraping-for-item") },
						{
							value: "scraping-to-list",
							label: t("scraping-to-list"),
							subform: {
								def: [
									{
										id: "activator",
										label: t("activator"),
										type: "text",
									},
									{
										id: "itemType",
										label: t("item-type"),
										type: "select",
										options: types,
									},
								],
							},
						},
						{ value: "scraping-for-item-from-list", label: t("scraping-for-item-from-list") },
						{ value: "scraping-for-field", label: t("scraping-for-field") },
						{ value: "scraping-for-link", label: t("scraping-for-link") },
						{ value: "scraping-for-list", label: t("scraping-for-list") },
						{ value: "scraping-for-objects", label: t("scraping-for-objects") },
						{ value: "scraping-for-raw", label: t("scraping-for-raw") },
					],
				},
				{
					id: "types",
					label: t("types"),
					type: "tags",
					options: Object.values(typesByID).map((type) => ({
						id: type.id,
						label: type.name,
					})),
					multiple: true,
					force: true,
					rel: true,

				},
				{
					id: "definition",
					label: t("definition"),
					type: "code",
					name: "definition",
				},
			],
		};
		return def;
	}
	const [defHeaderForm, setDefHeaderForm] = useState(generateDef([]));

	useEffect(() => {
		db.types.toArray().then((types) => {
			setDefHeaderForm(
				generateDef(types.map((type) => ({ value: type.id, label: type.name })))
			);
		});
	}, [typesByID]);

	const [title, setTitle] = useState(t("new-scraping"));
	const [isOpenedForm, setIsOpenedForm] = useState(selectedItem === "new");
	const [isOpenedResult, setIsOpenedResult] = useState(selectedItem !== "new");
	const [isNew, setIsNew] = useState(selectedItem === "new");
	const initialData = {
		type: "scraping-for-field",
		omit: [], // Añadido
	};

	const initialFormProcess = {
		reference: true,
		ondemand: false,
		def: [],
	};

	const data = useMemo(() => {
		if (isNew) {
			return initialData;
		} else {
			const process = processes.find((p) => p.id === selectedItem.id);
			return process || selectedItem;
		}
	}, [isNew, selectedItem, processes]);

	const [formProcessData, setFormProcessData] = useState({});
	const [formProcess, setFormProcess] = useState(initialFormProcess);

	const [scrapingObjects, setScrapingObjects] = useState([]);

	useEffect(() => {
		setIsNew(typeof selectedItem === "string");
		setIsOpenedForm(true);
		setIsOpenedResult(typeof selectedItem !== "string");

		db.lists.toArray().then((lists) => {
			let options = lists.map((list) => {
				return {
					label: list.name,
					value: "list_" + list.id,
				};
			});
			db.scrapingObjects.toArray().then((objects) => {
				let optionsObjects = objects.map((object) => {
					return {
						label: object.name,
						value: object.id,
					};
				});
				db.types.toArray().then((types) => {
					options = options.concat(
						types.map((type) => {
							return {
								label: type.name,
								value: "type_" + type.id,
							};
						})
					);
					let newFormProcess = { ...initialFormProcess };
					if (
						selectedItem &&
						(selectedItem.type === "scraping-for-field" ||
							selectedItem.type === "scraping-to-list" ||
							selectedItem.type === "scraping-for-item" ||
							selectedItem.type === "scraping-for-item-from-list" ||
							selectedItem.type === "scraping-for-link")
					) {
						newFormProcess.def = [
							{
								id: "name",
								label: t("name"),
								type: "text",
								name: "name",
							},
							{
								id: "filter",
								label: t("filter"),
								type: "select",
								name: "filter",
								options: options,
							},
						];
					} else if (
						selectedItem &&
						selectedItem.type === "scraping-for-list"
					) {
						newFormProcess.def = [
							{
								id: "list",
								label: t("list"),
								type: "select",
								name: "list",
								options: options,
							},
							{
								id: "filter",
								label: t("filter"),
								type: "select",
								name: "filter",
								options: options,
							},
						];
					} else if (
						selectedItem &&
						selectedItem.type === "scraping-for-objects"
					) {
						newFormProcess.def = [
							{
								id: "scraping-object",
								label: t("scraping-object"),
								type: "select",
								options: optionsObjects,
							},
							{
								id: "filter",
								label: t("filter"),
								type: "select",
								name: "filter",
								options: options,
							},
						];
					} else {
						newFormProcess.def = [
							{
								id: "input",
								label: t("input"),
								type: "text",
								name: "input",
							},
							{
								id: "filter",
								label: t("filter"),
								type: "text",
								name: "filter",
							},
						];
					}
					setFormProcess(newFormProcess);
				});
			});
		});
		db.scrapingObjects.toArray().then((objects) => {
			setScrapingObjects(objects);
		});
	}, [selectedItem, selectedItem.type]);

	const processFilters =  async (formProcessData) => {
		let filtersInput = [];
		if (formProcessData.filter) {
			if (formProcessData.filter.startsWith("type")) {
				filtersInput = await db.items
					.where("type")
					.equals(parseInt(formProcessData.filter.split("_")[1]))
					.toArray();
				filtersInput = [
					{
						type: "exclude",
						value: filtersInput.map((item) => item.name),
					},
				];
			} else {
				filtersInput = [];
				const dataList = await db.lists.get(
					parseInt(formProcessData.filter.split("_")[1])
				);
				for (let i = 0; i < dataList.items.length; i++) {
					let item = dataList.items[i];

					if (typeof item === "string") {
						const initial = item;
						let id_str = item.replace("lists-", "");
						if (new Number(id_str).toString() === id_str) {
							item = await db["lists-items"].get(parseInt(id_str));
							if (!item) {
								const list = dataList;
								list.items.splice(i, 1);
								db.lists.update(
									parseInt(formProcessData.filter.split("_")[1]),
									list
								);
								continue;
							}
							item.in_collection = false;
							item.document = "lists-items";
							item.id = initial;
						}
					} else if (typeof item === "number") {
						item = await db.items.get(item);
						if (!item) {
							const list = dataList;
							list.items.splice(i, 1);
							db.lists.update(
								parseInt(formProcessData.filter.split("_")[1]),
								list
							);
							continue;
						}
						item.in_collection = true;
						item.document = "items";
					} else {
						item.in_collection = false;
						item.id = false;
						item.document = "lists-items";
					}
					item.type_in_line = typesByID[item.type];
					filtersInput.push(item);
				}
				filtersInput = filtersInput.filter((item) => {
					return item.hasOwnProperty("type");
				});
				filtersInput = [
					{
						type: "exclude",
						value: filtersInput.map((item) => item.name),
					},
				];
			}
		}
		return filtersInput;
	}

	const handleStartProcess = async () => {
		try {
			if (!data.definition) {
				throw new Error("Definition is empty");
			}
			if (!JSON.parse(data.definition)) {
				throw new Error("Definition is not valid JSON");
			}
			let definition = JSON.parse(data.definition);
			let items = [];
			let filtersInput = [{}];
			if (data.type === "scraping-for-raw") {
				items = JSON.parse(formProcessData.input);
				filtersInput = JSON.parse(formProcessData.filter || "[]");
			} else if (data.type === "scraping-for-list") {
				if (formProcessData.list.startsWith("type")) {
					items = await db.items
						.where("type")
						.equals(parseInt(formProcessData.list.split("_")[1]))
						.toArray();
				} else {
					items = [];
					const dataList = await db.lists.get(
						parseInt(formProcessData.list.split("_")[1])
					);
					for (let i = 0; i < dataList.items.length; i++) {
						let item = dataList.items[i];

						if (typeof item === "string") {
							const initial = item;
							let id_str = item.replace("lists-", "");
							if (new Number(id_str).toString() === id_str) {
								item = await db["lists-items"].get(parseInt(id_str));
								if (!item) {
									const list = dataList;
									list.items.splice(i, 1);
									db.lists.update(
										parseInt(formProcessData.list.split("_")[1]),
										list
									);
									continue;
								}
								item.in_collection = false;
								item.document = "lists-items";
								item.id = initial;
							}
						} else if (typeof item === "number") {
							item = await db.items.get(item);
							if (!item) {
								const list = dataList;
								list.items.splice(i, 1);
								db.lists.update(
									parseInt(formProcessData.list.split("_")[1]),
									list
								);
								continue;
							}
							item.in_collection = true;
							item.document = "items";
						} else {
							item.in_collection = false;
							item.id = false;
							item.document = "lists-items";
						}
						item.type_in_line = typesByID[item.type];
						items.push(item);
					}
					items = items.filter((item) => {
						return item.hasOwnProperty("type");
					});
				}
				if (items) {
					items = items.map((item) => {
						return { name: item.name };
					});
				}
				filtersInput = await processFilters(formProcessData);
			} else if (data.type === "scraping-for-objects") {
				const scrapingObject = scrapingObjects.find(
					(obj) => obj.id === formProcessData["scraping-object"]
				);
				if (scrapingObject) {
					items = scrapingObject.items;
				}
				filtersInput = await processFilters(formProcessData);	
			} else if (
				(data.type === "scraping-for-field" ||
					data.type === "scraping-for-item" ||
					data.type === "scraping-for-item-from-list" ||
					data.type === "scraping-for-link" ||
					data.type === "scraping-to-list") &&
				formProcessData.name
			) {
				items = [{ name: formProcessData.name }];
			}

			startProcess(definition, items, filtersInput, data.omit, data.id);
		} catch (error) {
			console.error(error);
		}
	};

	// Función para manejar la omisión de elementos
	const handleOmitElement = (identifier) => {
		selectPopup({
			title: t("omit-scraping-element"),
			content: () => (
				<Typography>{t("omit-scraping-element-confirm")}</Typography>
			),
			btns: [
				{
					label: t("yes"),
					action: () => {
						selectPopup(null);
						const currentOmitList = data.omit || [];
						let newOmitList;
						if (currentOmitList.includes(identifier)) {
							// Remover el identificador
							newOmitList = currentOmitList.filter((id) => id !== identifier);
						} else {
							// Añadir el identificador
							newOmitList = [...currentOmitList, identifier];
						}
						// Actualizar el proceso y el elemento seleccionado
						const updatedData = { ...data, omit: newOmitList };
						updateProcess(updatedData);
						db.scraping.update(data.id, updatedData);
						setSelectedItem(updatedData);
					},
				},
				{
					label: t("no"),
					action: () => selectPopup(null),
					variant: "outlined",
				},
			],
		});
	};



	const handleAddToScrappingObject = async (element) => {
		let formData = {
			scrapingObject: "",
			name: "",
		};
		selectPopup({
			title: t("add-to-scraping-object"),
			content: () => {
				return (
					<FormBuilder
						definition={{
							ondemand: true,
							def: [
								{
									id: "scrapingObject",
									label: t("scraping-object"),
									type: "select",
									options: scrapingObjects
										.map((obj) => ({
											value: obj.id,
											label: obj.name,
										}))
										.concat({
											value: "new",
											label: t("new"),
											subform: {
												def: [
													{
														id: "name",
														label: t("name"),
														type: "text",
													},
												],
											},
										}),
								},
							],
						}}
						onChange={(key, value) => {
							formData[key] = value;
						}}
					/>
				);
			},
			btns: [
				{
					label: t("save"),
					action: () => {
						if (formData) {
							if (formData.scrapingObject === "new") {
								if (!formData.name) {
									openErrorDialog(t("error"), t("name-required"));
									return;
								}
								db.scrapingObjects
									.add({
										name: formData.name,
										items: [element],
									})
									.then((id) => {
										setScrapingObjects([
											...scrapingObjects,
											{
												id,
												name: formData.name,
												items: [element],
											},
										]);
										selectPopup(null);
									});
							} else {
								let scrapingObject = scrapingObjects.find(
									(obj) => obj.id === formData.scrapingObject
								);
								if (scrapingObject) {
									if (scrapingObject.items) {
										let item = scrapingObject.items.find((item) => {
											if (
												generateIdentifier(item) === generateIdentifier(element)
											) {
												openErrorDialog(
													t("error"),
													t("element-already-exists")
												);
												return true;
											}
											return false;
										});
										if (item) {
											return;
										}
									}
									scrapingObject.items.push(element);
									db.scrapingObjects
										.update(scrapingObject.id, scrapingObject)
										.then(() => {
											setScrapingObjects(
												scrapingObjects.map((obj) => {
													if (obj.id === scrapingObject.id) {
														return scrapingObject;
													}
													return obj;
												})
											);
											selectPopup(null);
										});
								}
							}
						}
					},
				},
				{
					label: t("cancel"),
					action: () => {
						selectPopup(null);
					},
				},
			],
		});
	};

	return (
		<Box className="scraping-editor-detail">
			<Typography variant="h5" component="div" style={{ marginBottom: "12px" }}>
				<FormBuilder
					definition={defName}
					reference={data}
					onSaved={(id) => {
						let dataCopy = { ...data };
						updateProcess(dataCopy);
						setSelectedItem(dataCopy);
					}}
				/>
			</Typography>
			<div className="scraping-detail">
				{!isNew && (
					<Typography
						variant="h6"
						component="div"
						style={{
							marginBottom: "12px",
							cursor: "pointer",
							userSelect: "none",
						}}
						onClick={() => setIsOpenedForm(!isOpenedForm)}
					>
						{t("scraping-form")}
						{isOpenedForm ? "▲" : "▼"}
					</Typography>
				)}
				<Collapse in={isOpenedForm}>
					<div className="config-editor-form" style={{ marginBottom: "32px" }}>
						{defHeaderForm && (
							<FormBuilder
								definition={defHeaderForm}
								reference={data}
								onSaved={(id) => {
									let dataCopy = { ...data };
									updateProcess(dataCopy);
									setSelectedItem(dataCopy);
								}}
							/>
						)}
					</div>
				</Collapse>
				<Typography
					variant="h6"
					component="div"
					style={{
						marginBottom: "12px",
						cursor: "pointer",
						userSelect: "none",
					}}
					onClick={() => setIsOpenedResult(!isOpenedResult)}
				>
					{t("scraping-process")}
					{isOpenedResult ? "▲" : "▼"}
				</Typography>
				<Collapse in={isOpenedResult}>
					<Box>
						<Box
							style={{
								padding: "12px",
								border: "1px solid #ddd",
								borderRadius: "4px",
								backgroundColor: "#f8f8f8",
							}}
						>
							<FormBuilder
								definition={formProcess}
								reference={formProcessData}
							/>
							<Button
								variant="contained"
								color="primary"
								onClick={handleStartProcess}
								style={{ marginTop: "16px" }}
							>
								{t("start-process")}
							</Button>
							{data.processStatus === "stopped" ? (
								<Button
									variant="contained"
									color="primary"
									onClick={() => {
										getProcessStatus(data.processId);
									}}
									style={{ marginTop: "16px", marginLeft: "16px" }}
								>
									{t("continue")}
								</Button>
							) : null}
						</Box>
					</Box>
					<Box className="form-scraping">
						<Typography variant="h6" style={{ marginTop: "12px" }}>
							{data.processId ? data.processId : t("no-process")}
						</Typography>
						{data.omit && data.omit.length > 0 ? (
							<Button
								color="primary"
								onClick={() => {
									const updatedData = { ...data, omit: [] };
									updateProcess(updatedData);
									setSelectedItem(updatedData);
								}}
								style={{ marginTop: "16px", marginLeft: "16px" }}
							>
								{t("show-all")}
							</Button>
						) : null}
						{data.processResults &&
							printResults(
								data.processResults,
								data,
								handleOmitElement,
								null,
								handleAddToScrappingObject,
								scrapingObjects
							)}
					</Box>
				</Collapse>
			</div>
		</Box>
	);
}

export default ScrapingDetail;




























