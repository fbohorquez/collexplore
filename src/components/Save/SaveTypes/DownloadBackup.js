// src/components/DownloadBackup.js
import React, { useRef } from "react";
import {ListItemText, Typography } from "@mui/material";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import BackupService from "../../../services/backup"; // Asegúrate de que la ruta es correcta
import { useTranslation } from "react-i18next";

const DownloadBackup = () => {

  const {t} = useTranslation();

	const fileInputRef = useRef(null);
	const CHUNK_SIZE = 500; // Tamaño de cada chunk
	const PREFIX = "BKP1"; // Prefijo para hacer el archivo no legible directamente

	// Función para agregar un prefijo a un Blob
	const prependPrefix = (blob, prefix) => {
		const encoder = new TextEncoder();
		const prefixBytes = encoder.encode(prefix);
		return new Blob([prefixBytes, blob], { type: blob.type });
	};

	// Función para eliminar un prefijo de un ArrayBuffer
	const removePrefix = (arrayBuffer, prefix) => {
		const encoder = new TextEncoder(); // Corrección: Usar TextEncoder en lugar de TextDecoder
		const prefixBytes = encoder.encode(prefix);
		const buffer = new Uint8Array(arrayBuffer);

		if (buffer.length < prefixBytes.length) {
			throw new Error("Archivo de backup inválido o corrupto.");
		}

		for (let i = 0; i < prefixBytes.length; i++) {
			if (buffer[i] !== prefixBytes[i]) {
				throw new Error("El archivo de backup no tiene el prefijo esperado.");
			}
		}

		return buffer.slice(prefixBytes.length);
	};

	// Función para manejar la descarga del backup
	const handleSaveBackup = async () => {
		try {
			// Crear el backup completo
			const dbCopy = await BackupService.createFullBackup();

			// Crear una instancia de JSZip
			const zip = new JSZip();

			// Objeto para almacenar el header
			const header = {};

			// Iterar sobre cada tabla y crear archivos por chunks
			for (const tableName in dbCopy) {
				if (dbCopy.hasOwnProperty(tableName)) {
					const records = dbCopy[tableName];
					const totalRecords = records.length;
					const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

					header[tableName] = totalRecords;

					for (let i = 0; i < totalChunks; i++) {
						const chunk = records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
						const jsonString = JSON.stringify(chunk);
						// Añadir cada chunk al zip
						zip.file(`${tableName}_chunk_${i}.json`, jsonString);
					}
				}
			}

			// Añadir el archivo header al zip
			const headerString = JSON.stringify(header);
			zip.file("header.json", headerString);

			// Generar el zip como Blob
			const zipBlob = await zip.generateAsync({ type: "blob" });

			// Prepend prefix
			const finalBlob = prependPrefix(zipBlob, PREFIX);

			// Descargar el archivo .bak usando file-saver
			saveAs(finalBlob, `collexplore_${new Date().toISOString()}.bak`);

			// alert("Backup guardado exitosamente.");
		} catch (error) {
			console.error("Error al guardar el backup:", error);
			// alert("Hubo un error al guardar el backup.");
		}
	};

	// Función para manejar la restauración del backup
	const handleRestoreBackup = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	// Función para procesar el archivo seleccionado
	const handleFileChange = async (event) => {
		const file = event.target.files[0];
		if (!file) {
			alert("No se seleccionó ningún archivo.");
			return;
		}

		try {
			// Leer el archivo como ArrayBuffer
			const reader = new FileReader();
			reader.onload = async (e) => {
				const arrayBuffer = e.target.result;

				// Eliminar el prefijo
				const zipArrayBuffer = removePrefix(arrayBuffer, PREFIX);

				// Crear Blob del zip
				const zipBlob = new Blob([zipArrayBuffer]);

				// Cargar el zip usando JSZip
				const zip = await JSZip.loadAsync(zipBlob);

				// Obtener y parsear el archivo header
				const headerFile = zip.file("header.json");
				if (!headerFile) {
					throw new Error(
						"No se encontró el archivo header.json en el backup."
					);
				}
				const headerString = await headerFile.async("string");
				const header = JSON.parse(headerString);

				// Iterar sobre cada tabla en el header y restaurar los chunks
				for (const tableName in header) {
					if (header.hasOwnProperty(tableName)) {
						const totalRecords = header[tableName];
						const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);
						const allRecords = [];

						for (let i = 0; i < totalChunks; i++) {
							const fileName = `${tableName}_chunk_${i}.json`;
							const chunkFile = zip.file(fileName);

							if (!chunkFile) {
								console.warn(
									`No se encontró el archivo ${fileName} en el backup. Saltando este chunk.`
								);
								continue;
							}

							const chunkString = await chunkFile.async("string");
							const chunkData = JSON.parse(chunkString);

							allRecords.push(...chunkData);
						}

						// Restaurar la tabla con todos los registros
						await BackupService.restoreTableBackup(tableName, allRecords);
						console.log(
							`Restaurados ${allRecords.length} registros de la tabla ${tableName}`
						);
					}
				}

				// alert("Backup restaurado exitosamente.");
        window.location.reload();
			};
			reader.onerror = () => {
				console.error("Error al leer el archivo.");
				alert("Hubo un error al leer el archivo.");
			};
			reader.readAsArrayBuffer(file);
		} catch (error) {
			console.error("Error al restaurar el backup:", error);
			alert("Hubo un error al restaurar el backup.");
		} finally {
			// Resetear el input de archivo para permitir seleccionar el mismo archivo nuevamente si es necesario
			event.target.value = null;
		}
	};

	return (
    <span style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", width: "180px"}}>
      <ListItemText primary={(
        <button onClick={handleSaveBackup}>{t("save")}</button>
      )}/>
      <ListItemText primary={(
        <span>
          <button onClick={handleRestoreBackup}>{t("restore")}</button>
          <input
          type="file"
          accept=".bak"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        </span>
      )}/>
      </span>
			
	);
};

export default DownloadBackup;



