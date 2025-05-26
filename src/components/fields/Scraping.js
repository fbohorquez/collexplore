import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { Box, Button, Typography, Tooltip, TextField } from "@mui/material";
import { ProcessContext } from "../../services/context_scraping";
import db from "../../services/db";
import {
	openErrorDialog,
	selectPopup,
	normalizeString,
} from "../../services/helper";
import {
	printResultsRecursively,
	printResults,
	generateIdentifier,
} from "../../services/scraping_helper";

import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from '@mui/icons-material/Save';
import AddToQueueIcon from "@mui/icons-material/AddToQueue";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import FormBuilder from "../FormBuilder";

function Scraping({ value, onChange, field, definition }) {
	const { t } = useTranslation();
	const { startProcess, processSubscribers } = useContext(ProcessContext);

	const initData = {
				definition: {},
				processId: null,
				processResults: null,
				processStatus: "stopped",
				saveResults: [],
        omit: [],
				text: "",
	};


	const [data, setData] = useState(() => {
		return (
			value || initData
		);
	});
	const [processStatus, setProcessStatus] = useState(null);
	const [processResults, setProcessResults] = useState(null);
	const [processName, setProcessName] = useState(t("Proceso de Scraping"));
	const [scrapingObjects, setScrapingObjects] = useState([]);

	const uniqueId = useMemo(() => `field_${Date.now()}_${Math.random()}`, []);

	// Obtener el nombre del ítem desde la definición
	const itemName =
		definition && definition.root && definition.root.name
			? definition.root.name
			: "";

	useEffect(() => {
		if (field.scraping_id) {
			db.scraping.get(field.scraping_id).then((scraping) => {
				if (scraping && scraping.definition) {
					try {
						const definition = scraping.definition;
						setProcessName(scraping.name);
						if (value) {
							// value.processResults = {};
							setData({...value, definition });
						} else {
							setData({...initData, definition });
						}
					} catch (error) {
						console.error("La definición del scraping no es un JSON válido");
					}
				}
			});
		}else {
			if (value) {
				setData(value);
			}
		}
		db.scrapingObjects.toArray().then((objects) => {
			setScrapingObjects(objects);
		});
	}, [field.scraping_id, value]);

	const handleProcessMessage = (message) => {
		const { event, data: msg } = message;
		switch (event) {
			case "processStarted":
				setProcessStatus("running");
				setData((prevData) => {
					const updatedData = {
						...prevData,
						processId: msg.processId,
						processStatus: "running",
            processResults: {},
            processDate: new Date().toLocaleString(),
					};
					onChange(updatedData);
					return updatedData;
				});
				// Update processSubscribers if necessary
				if (processSubscribers.current[uniqueId]) {
					delete processSubscribers.current[uniqueId];
					processSubscribers.current[msg.processId] = handleProcessMessage;
				}
				break;
			case "processCompleted":
				setProcessStatus("completed");
        let dataCopy = {
          ...data,
          processResults: msg.results,
          processStatus: "completed",
          processDate: new Date().toLocaleString(),
        }
        setData(dataCopy);
        onChange(dataCopy);

				break;
			case "processError":
				setProcessStatus("error");
        openErrorDialog("Error en el proceso", msg.error);
				setData((prevData) => {
					const updatedData = {
						...prevData,
						processStatus: "error",
            processDate: new Date().toLocaleString(),
					};
					onChange(updatedData);
					return updatedData;
				});
				break;
			case "stepReport":
        let dataReport = {
          ...data,
          processResults: msg.context,
          processStatus: "running",
          processDate: new Date().toLocaleString(),
        }
				setProcessResults(dataReport.processResults);
        setData(dataReport);
        onChange(dataReport);
				break;
			default:
				console.log("Evento desconocido:", event);
		}
	};

	const handleStartProcess = () => {
		const items = [{ name: normalizeString(data.text || itemName) }];

		// Parse definition safely
		let def_obj;
		try {
			def_obj = JSON.parse(data.definition);
		} catch (e) {
			console.error("Error parsing definition:", e);
			return;
		}

		startProcess(def_obj, items, [], data.omit, uniqueId, handleProcessMessage);
		setProcessStatus("starting");
	};

	

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
						data.omit = newOmitList;
            onChange(data);
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

	const handleSaveElement = (element) => {
		let dataCopy = {
			...data
		};
		if (!dataCopy.saveResults) {
			dataCopy.saveResults = [];
		}
		dataCopy.saveResults.push(element);
		onChange(dataCopy);
	};
	
	const [addScrapingObject, setAddScrapingObject] = useState({
		scrapingObject: "",
		name: "",
	});

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
									options: scrapingObjects.map((obj) => ({
										value: obj.id,
										label: obj.name,
									})).concat({
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
										}
									})
								},
							],
						}}
						onChange={(key, value) => {
							formData[key] = value
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
								db.scrapingObjects.add({
									name: formData.name,
									items: [element],
								}).then((id) => {
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
							}else {
								let scrapingObject = scrapingObjects.find((obj) => obj.id === formData.scrapingObject);
								if (scrapingObject) {
									if(scrapingObject.items) {
										let item = scrapingObject.items.find((item) => {
											if (generateIdentifier(item) === generateIdentifier(element)) {
												openErrorDialog(t("error"), t("element-already-exists"));
												return true;
											}
											return false;
										});
										if (item) {
											return;
										}
									}
									scrapingObject.items.push(element);
									db.scrapingObjects.update(scrapingObject.id, scrapingObject).then(() => {
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

	const [timeoutTextField, setTimeoutTextField] = useState(null);

	return (
		<Box>
			{data.saveResults && data.saveResults.length > 0 && (
				<Box mt={2} mb={5} className="form-scraping-save">
					<Typography variant="h6">{t("Resultados guardados")}</Typography>
					{data.saveResults.map((result, index) => (
						<div key={index} className="item">
							{printResultsRecursively(
								result,
								0,
								true,
								(itemData) => {
									return (
										<div className="item-actions">
											<Tooltip title={t("delete")}>
												<DeleteIcon
													onClick={() => {
														let dataCopy = {
															...data,
														};
														dataCopy.saveResults.splice(index, 1);
														onChange(dataCopy);
													}}
												/>
											</Tooltip>
											<Tooltip title={t("add-to-scraping-object")}>
												<AddToQueueIcon
													onClick={() => handleAddToScrappingObject(itemData)}
												/>
											</Tooltip>
										</div>
									);
								},
								data,
								handleOmitElement,
								handleSaveElement,
								handleAddToScrappingObject,
								scrapingObjects
							)}
						</div>
					))}
				</Box>
			)}
			<Box mt={3} className="form-scraping-start">
				<Tooltip title={t("params-for-scraping-process-tooltip")}>
					<TextField
						label={t("params-for-scraping-process")}
						value={data.text}
						onChange={(e) => {
							if (timeoutTextField) {
								clearTimeout(timeoutTextField);
							}
							setData((prevData) => {
								const updatedData = {
									...prevData,
									text: e.target.value,
								};
								return updatedData;
							});
							let timeoutTextLocal = setTimeout(() => {
								let dataCopy = {
									...data,
									text: e.target.value,
								};
								onChange(dataCopy);
								setTimeoutTextField(null);
							}, 1000);
							setTimeoutTextField(timeoutTextLocal);
						}}
						style={{ marginTop: "16px" }}
					/>
				</Tooltip>
				<Button
					variant="contained"
					color="primary"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleStartProcess();
						}
					}}
					onClick={handleStartProcess}
					style={{ marginTop: "16px" }}
				>
					{t("Iniciar Proceso")}
				</Button>
				{/* <Button
					variant="contained"
					color="primary"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleStartProcess();
						}
					}}
					onClick={() => {
						setData(initData);
						onChange(initData);
					}}
					style={{ marginTop: "16px", marginLeft: "16px" }}
				>
					{t("Limpiar")}
				</Button> */}
			</Box>
			{value && value.processId && value.processStatus && value.processDate && (
				<Typography variant="body1" style={{ marginTop: "16px" }}>
					{processName} # {value.processId} # {value.processStatus} #{" "}
					{value.processDate}
				</Typography>
			)}

			{value && value.processResults && (
				<Box marginTop={2}>
					{printResults(
						value.processResults,
						data,
						handleOmitElement,
						handleSaveElement,
						handleAddToScrappingObject,
						scrapingObjects
					)}
				</Box>
			)}
		</Box>
	);
}












export default Scraping;