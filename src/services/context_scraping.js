import React, { createContext, useState, useEffect, useRef } from "react";
import db from "./db";
import Config from "./config";
import { openErrorDialog, openOkDialog } from "./helper";

export const ProcessContext = createContext();

export const ProcessProvider = ({ children }) => {
	const [processes, setProcesses] = useState([]);
	const websocketsRef = useRef({});
  const processSubscribers = useRef({});
	const processIdToId = useRef({});

	const connectWebSocketForProcess = (processId, force = false) => {
		const url = Config.getFromCache("server_scraping_url");
		if (!url) {
			openErrorDialog("Error de configuración", "No hay URL del servidor");
			return Promise.reject(new Error("No server_scraping_url"));
		}

		if (!force && websocketsRef.current[processId]?.ws) {
			const existingWS = websocketsRef.current[processId].ws;
			if (
				existingWS.readyState === WebSocket.OPEN ||
				existingWS.readyState === WebSocket.CONNECTING
			) {
				return Promise.resolve();
			}
		}

		if (websocketsRef.current[processId]?.ws) {
			try {
				websocketsRef.current[processId].ws.close();
			} catch {}
			delete websocketsRef.current[processId];
		}

		const wsInstance = new WebSocket(url);

		websocketsRef.current[processId] = {
			ws: wsInstance,
			reconnectTimeout: null,
		};

		let reconnect = false;

		wsInstance.onopen = () => {
			console.log(`WS abierto para proceso ${processId}`);
			if (reconnect) {
				openOkDialog(
					"Conexión restablecida",
					`La conexión para el proceso ${processId} se ha restablecido`
				);
				reconnect = false;
			}
		};

		wsInstance.onmessage = (event) => {
			const message = JSON.parse(event.data);
			const data = message.data || {};
			if (data.processId && data.id) {
				processIdToId.current[data.processId] = data.id;
			}
			const id =
				data.id || processIdToId.current[data.processId] || data.processId;

			if (processSubscribers.current[id]) {
				processSubscribers.current[id](message);
			} else if (processSubscribers.current[data.processId]) {
				processSubscribers.current[data.processId](message);
			} else {
				switch (message.event) {
					case "processStarted":
						handleProcessStarted(data);
						break;
					case "processStatus":
						handleProcessStatus(data);
						break;
					case "processError":
						handleProcessError(data);
						break;
					case "stepError":
						handleStepError(data);
						break;
					case "processCompleted":
						handleProcessCompleted(data);
						break;
					case "stepReport":
						handleStepReport(data);
						break;
					case "runningProcesses":
						handleRunningProcesses(data);
						break;
					default:
						console.log("Evento desconocido:", message.event);
				}
			}
		};

		wsInstance.onclose = () => {
			console.log(`WS cerrado para proceso ${processId}`);
			reconnect = true;
			openErrorDialog(
				`Conexión perdida (proceso ${processId})`,
				"La conexión con el servidor de scraping se ha perdido"
			);
			websocketsRef.current[processId].ws = null;

			const t = setTimeout(() => {
				connectWebSocketForProcess(processId, true);
			}, 60000);

			websocketsRef.current[processId].reconnectTimeout = t;
		};

		return new Promise((resolve, reject) => {
			wsInstance.onerror = (err) => {
				console.error("Error en WS (proceso " + processId + "): ", err);
				reject(err);
			};
			const originalOpen = wsInstance.onopen;
			wsInstance.onopen = (ev) => {
				if (typeof originalOpen === "function") {
					originalOpen(ev);
				}
				resolve();
			};
		});
	};


	useEffect(() => {
		const fetchProcesses = async () => {
			const allProcesses = await db.scraping.toArray();
			setProcesses(allProcesses);
		};
		fetchProcesses();

		return () => {
			Object.keys(websocketsRef.current).forEach((pId) => {
				const { ws } = websocketsRef.current[pId];
				if (ws) {
					ws.close();
				}
			});
		};
	}, []);
	
  const handleProcessError = (data) => {
    const { processId, error } = data;
    db.scraping.where("processId").equals(processId).first().then((process) => {
      updateProcess({ id: process.id, processStatus: "stopped" });
      db.scraping.update(process.id, { processStatus: "stopped" });
      console.error(`Error en el proceso ${processId}:`, error);
    });
  };

  const handleStepError = (data) => {
    const { processId, error } = data;
    db.scraping.where("processId").equals(processId).first().then((process) => {
      updateProcess({ id: process.id, processStatus: "stopped" });
      db.scraping.update(process.id, { processStatus: "stopped" });
      console.error(`Error en el paso del proceso ${processId}:`, error);
      openErrorDialog("Error en el proceso", error);
    });
  };

	const handleProcessStarted = async (data) => {
		const { processId, id } = data;
		updateProcess({ id, processId, processResults: {}, processStatus: "running" });
    await db.scraping.update(id, {
			processId,
			processStatus: "running",
			processResults: {},
		});
	};

	const handleProcessStatus = (data) => {
		const { processId, status } = data;
		setProcesses((prevProcesses) =>
			prevProcesses.map((process) =>
				process.id === processId ? { ...process, status } : process
			)
		);
	};

	const handleProcessCompleted = (data) => {
		const { processId, results } = data;
    db.scraping.where("processId").equals(processId).first().then((process) => {

      updateProcess({
				id: process.id,
				processStatus: "completed",
				processResults: results,
			});
      db.scraping.update(process.id, {
				processStatus: "completed",
				processResults: results,
			});
      openOkDialog("Proceso completado", `El proceso de scraping ${processId} ha finalizado correctamente`);
    });
	};

	const handleStepReport = (data) => {
		const { processId, context } = data;
    db.scraping.where("processId").equals(processId).first().then((process) => {
      updateProcess({ id: process.id, processResults: context, processStatus: "running" });
      db.scraping.update(process.id, {
				processResults: context,
        processStatus: "running",
      });
    });
	};

	const handleRunningProcesses = (data) => {
		setProcesses((prevProcesses) => {
			const newProcesses = data.map((process) => ({
				id: process.processId,
				name: process.name || `Proceso ${process.processId}`,
				status: process.status || "running",
			}));
			const combinedProcesses = [...prevProcesses, ...newProcesses];
			const uniqueProcesses = combinedProcesses.filter(
				(process, index, self) =>
					index === self.findIndex((p) => p.id === process.id)
			);
			return uniqueProcesses;
		});
	};

	const startProcess = async (
		processDefinition,
		items,
		filtersInput,
		omit,
		id,
		callback
	) => {
		try {
			await connectWebSocketForProcess(id);
			console.log("startProcess -> connectWebSocketForProcess OK", processDefinition);
		} catch (err) {
			openErrorDialog(
				"Error de conexión",
				"No se pudo iniciar el proceso de scraping (WS no disponible)"
			);
			console.error("startProcess -> connectWebSocketForProcess error", err);
			return null;
		}

		const wsObj = websocketsRef.current[id];
		if (!wsObj || !wsObj.ws || wsObj.ws.readyState !== WebSocket.OPEN) {
			openErrorDialog(
				"Error de conexión",
				"El WebSocket para este proceso no está abierto."
			);
			return null;
		}

		const data = { processDefinition, items, filtersInput, id, omit };
		wsObj.ws.send(JSON.stringify({ event: "startScrapingProcess", data }));

		if (callback) {
			processSubscribers.current[id] = callback;
		}
		return processSubscribers;
	};


	const getProcessStatus = async (processId) => {
		try {
			await connectWebSocketForProcess(processId);
		} catch (err) {
			openErrorDialog(
				"Error de conexión",
				"No se pudo obtener el estado del proceso (WS no disponible)."
			);
			console.error("getProcessStatus -> connectWebSocketForProcess", err);
			return;
		}

		const wsObj = websocketsRef.current[processId];
		if (wsObj?.ws && wsObj.ws.readyState === WebSocket.OPEN) {
			wsObj.ws.send(
				JSON.stringify({
					event: "getScrapingProcessStatus",
					data: { processId },
				})
			);
		} else {
			openErrorDialog(
				"Error de conexión",
				"No se pudo obtener el estado, WS cerrado."
			);
		}
	};

	const updateProcess = (updatedProcess) => {
		setProcesses((prevProcesses) => {
			const processExists = prevProcesses.some(
				(process) => process.id === updatedProcess.id
			);

			if (processExists) {
				return prevProcesses.map((process) =>
					process.id === updatedProcess.id
						? { ...process, ...updatedProcess }
						: process
				);
			} else {
				return [...prevProcesses, { ...updatedProcess }];
			}
		});
	};

	const deleteProcess = (processId) => {
		setProcesses((prevProcesses) =>
			prevProcesses.filter((process) => process.id !== processId)
		);
	};

	return (
		<ProcessContext.Provider
			value={{
				processes,
				updateProcess,
				deleteProcess,
				startProcess,
				getProcessStatus,
				processSubscribers,
			}}
		>
			{children}
		</ProcessContext.Provider>
	);
};


































