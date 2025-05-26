
import React from "react";
import { gapi } from "gapi-script";
import Config from "../../../services/config";
import Dexie from "dexie";
import "dexie-export-import";
import { useTranslation } from "react-i18next";
import { ListItemText, Typography } from "@mui/material";
import { exportTableToBase64, importTableFromBase64 } from "../../../services/init_db";
import BackupService from "../../../services/backup";
import db from "../../../services/db"; 
import {
	openDialogLoad,
	closeDialog,
	lastDialogLoad,
	selectPopup,
} from "../../../services/helper";
import pLimit from "p-limit";

const CHUNK_SIZE = 500;


const limitConcurrency = (maxConcurrent, tasks) => {
	const results = [];
	let index = 0;
	let active = 0;

	return new Promise((resolve, reject) => {
		const next = () => {
			if (index === tasks.length && active === 0) {
				resolve(results);
				return;
			}
			while (active < maxConcurrent && index < tasks.length) {
				active++;
				const i = index++;
				tasks[i]()
					.then((result) => {
						results[i] = result;
						active--;
						next();
					})
					.catch(reject);
			}
		};
		next();
	});
};

class GoogleDriveService {
	constructor() {
		this.CLIENT_ID =
			"613407987552-uvhbj4hdf1d8dei637kg5daidcemeid2.apps.googleusercontent.com";
		this.SCOPES = "https://www.googleapis.com/auth/drive.file";
		this.TOKEN_KEY = "googledrive_token";
		this.FILE_NAME = "collexplore.json";
		this.FOLDER_NAME = "collexplore";
		this.authInstance = null;
		this.HEADER_FILE_NAME = "collexplore_header.json";
	}

	initializeGapiClient = () => {
		return new Promise((resolve, reject) => {
			gapi.load("client:auth2", async () => {
				try {
					await gapi.client.init({
						clientId: this.CLIENT_ID,
						scope: this.SCOPES,
						discoveryDocs: [
							"https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
						],
					});
					this.authInstance = gapi.auth2.getAuthInstance();

					const storedToken = Config.getFromCache(this.TOKEN_KEY);
					if (storedToken) {
						this.authInstance.isSignedIn.listen(this.updateSigninStatus);
						if (!this.authInstance.isSignedIn.get()) {
							await this.authInstance.signIn();
						}
					}
					resolve();
				} catch (error) {
					console.error("Error initializing GAPI client", error);
					reject(error);
				}
			});
		});
	};

	login = async () => {
		try {
			await this.initializeGapiClient();
			const user = await this.authInstance.signIn();
			const authResponse = user.getAuthResponse();
			Config.setInCache(this.TOKEN_KEY, authResponse.access_token);
			console.log("User signed in and token stored.");
		} catch (error) {
			console.error("Error during login", error);
		}
	};

	logout = () => {
		if (this.authInstance) {
			this.authInstance.signOut().then(() => {
				Config.removeFromCache(this.TOKEN_KEY);
				console.log("User signed out and token removed.");
			});
		}
	};

	uploadBackup = async (limit) => {
		if(!limit) limit = 100000;
		try {
			openDialogLoad("Subiendo copia a Google Drive...");
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				lastDialogLoad(
					"Error",
					"No se encontró el token de acceso a Google Drive. Por favor, inicia sesión."
				);
				console.error("No access token found. Please log in.");
				return;
			}

			// Crear o obtener la carpeta "collexplore"
			const folderId = await this.createOrGetFolder(this.FOLDER_NAME);

			const header = {};

			// Para cada tabla en la base de datos
			for (const table of db.tables) {
				const totalRecords = await table.count();
				header[table.name] = Math.min(totalRecords, limit);

				// Obtener todos los registros de la tabla
				const records = await table.toArray().then((data) => data.slice(0, limit));

				// Dividir los registros en bloques de CHUNK_SIZE
				for (let i = 0; i < records.length; i += CHUNK_SIZE) {
					const chunk = records.slice(i, i + CHUNK_SIZE);

					// Serializar los blobs en el bloque
					const serializedChunk = [];
					for (const record of chunk) {
						const serializedRecord = await BackupService.serializeBlobsInObject(
							record
						);
						serializedChunk.push(serializedRecord);
					}

					const jsonString = JSON.stringify(serializedChunk);
					const blob = new Blob([jsonString], { type: "application/json" });

					const fileName = `collexplore_${table.name}_${i / CHUNK_SIZE}.json`;

					// Subir el archivo a Google Drive dentro de la carpeta
					await this.uploadFileToDrive(
						blob,
						fileName,
						folderId,
						"application/json"
					);
				}
			}

			// Subir el archivo header
			const headerJsonString = JSON.stringify(header);
			const headerBlob = new Blob([headerJsonString], {
				type: "application/json",
			});

			await this.uploadFileToDrive(
				headerBlob,
				this.HEADER_FILE_NAME,
				folderId,
				"application/json"
			);

			console.log("Backup uploaded to Google Drive.");
			lastDialogLoad(
				"Éxito",
				"Copia de seguridad subida a Google Drive.",
				4000
			);
		} catch (error) {
			lastDialogLoad(
				"Error",
				"No se pudo subir la copia de seguridad a Google Drive."
			);
			console.error("Error uploading backup", error);
		}
	};

	downloadBackup = async () => {
		try {
			let active = Config.getFromCache("module_googledrive");
			if (!active) {
				console.log("Google Drive module is not active.");
				return;
			}
			openDialogLoad("Descargando copia de Google Drive...");
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				lastDialogLoad(
					"Error",
					"No se encontró el token de acceso a Google Drive. Por favor, inicia sesión."
				);
				console.error("No access token found. Please log in.");
				return;
			}

			// Obtener la carpeta "collexplore"
			const folderId = await this.getFolderIdByName(this.FOLDER_NAME);
			if (!folderId) {
				lastDialogLoad(
					"Error",
					"No se encontró la carpeta de respaldo en Google Drive."
				);
				console.log("No backup folder found in Google Drive.");
				return;
			}

			// Descargar el archivo header
			const headerFileId = await this.getFileIdByName(
				this.HEADER_FILE_NAME,
				folderId
			);
			if (!headerFileId) {
				lastDialogLoad(
					"Error",
					"No se encontró el archivo de cabecera en Google Drive."
				);
				console.log("No header file found in Google Drive.");
				return;
			}

			const headerBlob = await this.downloadFileFromDrive(headerFileId);
			const headerText = await headerBlob.text();
			const header = JSON.parse(headerText);

			// Restaurar las tablas
			for (const tableName in header) {
				const totalRecords = header[tableName];
				const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

				// Limpiar la tabla existente
				const table = db.table(tableName);
				if (table) {
					await table.clear();
				} else {
					console.warn(`La tabla ${tableName} no existe en la base de datos.`);
					continue;
				}

				// Crear tareas de descarga para todos los chunks de esta tabla
				const downloadTasks = [];
				for (let i = 0; i < totalChunks; i++) {
					const fileName = `collexplore_${tableName}_${i}.json`;
					downloadTasks.push(async () => {
						const fileId = await this.getFileIdByName(fileName, folderId);
						if (!fileId) {
							console.warn(
								`No se encontró el archivo ${fileName} en Google Drive.`
							);
							return null;
						}

						const chunkBlob = await this.downloadFileFromDrive(fileId);
						const chunkText = await chunkBlob.text();
						const chunkData = JSON.parse(chunkText);

						const deserializedRecords = [];
						for (const record of chunkData) {
							const deserializedRecord =
								await BackupService.deserializeBlobsInObject(record);
							deserializedRecords.push(deserializedRecord);
						}

						return deserializedRecords;
					});
				}

				// Descargar y procesar los chunks con límite de concurrencia
				const MAX_CONCURRENT_DOWNLOADS = 5; // Ajusta este valor según tus necesidades
				const chunksData = await limitConcurrency(
					MAX_CONCURRENT_DOWNLOADS,
					downloadTasks
				);

				// Filtrar posibles null (si algún chunk no se descargó)
				const validChunks = chunksData.filter((chunk) => chunk !== null);

				// Agregar todos los registros a la tabla
				for (const deserializedRecords of validChunks) {
					await table.bulkAdd(deserializedRecords);
				}

				console.log(`Restored ${totalRecords} records of ${tableName}`);
			}

			console.log("Data restored from backup.");
			lastDialogLoad(
				"Éxito",
				"Copia de seguridad descargada de Google Drive.",
				4000
			);
		} catch (error) {
			lastDialogLoad(
				"Error",
				"No se pudo descargar la copia de seguridad de Google Drive."
			);
			console.error("Error downloading backup", error);
		}
	};

	// importBackup = async (blob) => {
	// 	try {
	// 		const jsonText = await blob.text();
	// 		const dbCopy = JSON.parse(jsonText);

	// 		await deserializeDatabase(dbCopy);
	// 		console.log("Backup successfully imported.");
	// 	} catch (error) {
	// 		console.error("Error during importBackup:", error);
	// 		throw error;
	// 	}
	// };

	getFileMetadata = async (fileId) => {
		try {
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				throw new Error("No access token found. Please log in.");
			}

			const response = await fetch(
				`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,properties`,
				{
					method: "GET",
					headers: new Headers({ Authorization: "Bearer " + accessToken }),
				}
			);

			if (!response.ok) {
				const result = await response.json();
				throw new Error(
					`Error fetching file metadata: ${result.error.message}`
				);
			}

			const metadata = await response.json();
			return metadata;
		} catch (error) {
			console.error("Error in getFileMetadata:", error);
			throw error;
		}
	};

	createOrGetFolder = async (folderName) => {
		const folderId = await this.getFolderIdByName(folderName);
		if (folderId) {
			return folderId;
		} else {
			return await this.createFolder(folderName);
		}
	};

	getFolderIdByName = async (folderName) => {
		try {
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				console.error("No access token found. Please log in.");
				return null;
			}

			const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
			const response = await fetch(
				`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
					query
				)}&fields=files(id,name)`,
				{
					headers: new Headers({ Authorization: "Bearer " + accessToken }),
				}
			);

			if (!response.ok) {
				const result = await response.json();
				throw new Error(`Error fetching folder ID: ${result.error.message}`);
			}

			const data = await response.json();

			if (data.files && data.files.length > 0) {
				return data.files[0].id;
			}
			return null;
		} catch (error) {
			console.error("Error in getFolderIdByName:", error);
			throw error;
		}
	};

	createFolder = async (folderName) => {
		try {
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				throw new Error("No access token found. Please log in.");
			}

			const fileMetadata = {
				name: folderName,
				mimeType: "application/vnd.google-apps.folder",
			};

			const response = await fetch(
				"https://www.googleapis.com/drive/v3/files",
				{
					method: "POST",
					headers: new Headers({
						Authorization: "Bearer " + accessToken,
						"Content-Type": "application/json",
					}),
					body: JSON.stringify(fileMetadata),
				}
			);

			const result = await response.json();

			if (response.ok) {
				return result.id;
			} else {
				throw new Error(`Error creating folder: ${result.error.message}`);
			}
		} catch (error) {
			console.error("Error in createFolder:", error);
			throw error;
		}
	};

	uploadFileToDrive = async (
		fileBlob,
		fileName,
		folderId,
		mimeType = "application/octet-stream"
	) => {
		try {
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				throw new Error("No access token found. Please log in.");
			}

			// Verificar si el archivo ya existe en la carpeta y eliminarlo
			const existingFileId = await this.getFileIdByName(fileName, folderId);
			if (existingFileId) {
				await this.deleteFileFromDrive(existingFileId);
				console.log(`Archivo existente eliminado: ID ${existingFileId}`);
			}

			const fileMetadata = {
				name: fileName,
				parents: [folderId],
			};

			const form = new FormData();
			form.append(
				"metadata",
				new Blob([JSON.stringify(fileMetadata)], { type: "application/json" })
			);
			form.append("file", fileBlob);

			const url =
				"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

			const response = await fetch(url, {
				method: "POST",
				headers: new Headers({ Authorization: "Bearer " + accessToken }),
				body: form,
			});

			const result = await response.json();

			if (response.ok) {
				console.log("Archivo subido exitosamente:", result);
			} else {
				throw new Error(`Error al subir el archivo: ${result.error.message}`);
			}
		} catch (error) {
			console.error("Error en uploadFileToDrive:", error);
			throw error;
		}
	};

	getFileIdByName = async (fileName, folderId) => {
		try {
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				console.error("No access token found. Please log in.");
				return null;
			}

			const query = `'${folderId}' in parents and name='${fileName}' and trashed=false`;
			const response = await fetch(
				`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
					query
				)}&fields=files(id,name)`,
				{
					headers: new Headers({ Authorization: "Bearer " + accessToken }),
				}
			);

			if (!response.ok) {
				const result = await response.json();
				throw new Error(`Error fetching file ID: ${result.error.message}`);
			}

			const data = await response.json();

			if (data.files && data.files.length > 0) {
				return data.files[0].id;
			}
			return null;
		} catch (error) {
			console.error("Error in getFileIdByName:", error);
			throw error;
		}
	};

	downloadFileFromDrive = async (fileId) => {
		try {
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				throw new Error("No access token found. Please log in.");
			}

			const response = await fetch(
				`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
				{
					method: "GET",
					headers: new Headers({ Authorization: "Bearer " + accessToken }),
				}
			);

			if (!response.ok) {
				const result = await response.json();
				throw new Error(`Error downloading file: ${result.error.message}`);
			}

			const blob = await response.blob();
			return blob;
		} catch (error) {
			console.error("Error in downloadFileFromDrive:", error);
			throw error;
		}
	};

	deleteFileFromDrive = async (fileId) => {
		try {
			const accessToken = Config.getFromCache(this.TOKEN_KEY);
			if (!accessToken) {
				throw new Error(
					"No se encontró el token de acceso. Por favor, inicia sesión."
				);
			}

			const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

			const response = await fetch(url, {
				method: "DELETE",
				headers: new Headers({ Authorization: "Bearer " + accessToken }),
			});

			if (response.ok) {
				console.log(`Archivo con ID ${fileId} eliminado exitosamente.`);
			} else {
				const result = await response.json();
				throw new Error(
					`Error al eliminar el archivo: ${result.error.message}`
				);
			}
		} catch (error) {
			console.error("Error en deleteFileFromDrive:", error);
			throw error;
		}
	};
}

function GoogleDriveBackup({}){
	const {t} = useTranslation();

	return (
		<span
			style={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "flex-start",
				width: "560px",
			}}
		>
			<ListItemText
				primary={
					<button
						onClick={async () => {
							const googleDrive = new GoogleDriveService();
							googleDrive.uploadBackup();
						}}
					>
						<ListItemText primary={t("save")} />
					</button>
				}
			></ListItemText>
			<ListItemText
				primary={
					<button
						onClick={async () => {
							selectPopup({
								title: t("restore-backup"),
								content: () => (
									<Typography>{t("restore-backup-confirm")}</Typography>
								),
								btns: [
									{
										label: t("yes"),
										action: async () => {
											await Config.initConfigCache();
											const googleDrive = new GoogleDriveService();
											googleDrive.downloadBackup(true);
										},
									},
									{
										label: t("no"),
										action: () => selectPopup(null),
										variant: "outlined",
									},
								],
							});
						}}
					>
						<ListItemText primary={t("restore")} />
					</button>
				}
			></ListItemText>
			<ListItemText
				primary={
					<button
						onClick={async () => {
							const googleDrive = new GoogleDriveService();
							googleDrive.login();
						}}
					>
						<ListItemText primary={t("login-googledrive")} />
					</button>
				}
			></ListItemText>
		</span>
	);
}

export default GoogleDriveBackup;






































































