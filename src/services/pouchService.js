// src/services/pouchService.js
import PouchDB from "pouchdb";
import db, { stateSync } from "./db";
import BackupService from "./backup";

// Base de datos local de Pouch
export let localPouch = new PouchDB("myLocalPouchDB");

// Base de datos remota de Couch (en tu servidor)
export let remoteCouch = new PouchDB(
	"http://admin:123456@18.194.133.72:5984/collexplore"
);

// Activar replicación en tiempo real local <-> remota
let syncHandler = null;

// Función para iniciar la replicación en vivo
export const startLiveSync = () => {
	if (!syncHandler) {
		syncHandler = localPouch
			.sync(remoteCouch, {
				live: true,
				retry: true,
			})
			.on("change", (info) => {
				// Opcional: Manejar cambios si es necesario
				console.log("Sync change:", info);
			})
			.on("error", (err) => {
				console.error("Sync error:", err);
			});
		console.log("Replicación en vivo iniciada.");
	}
};

// Función para detener la replicación en vivo
export const stopLiveSync = () => {
	if (syncHandler) {
		syncHandler.cancel();
		syncHandler = null;
		console.log("Replicación en vivo detenida.");
	}
};

export const pullInitialSync = async (onProgress) => {
	try {
		await resetLocalPouch();
		stateSync.isSyncingFromPouch = true;
		const result = await remoteCouch.allDocs({ include_docs: true });
		const docs = result.rows.map((row) => row.doc).filter((doc) => doc.docType);

		const total = docs.length;
		let current = 0;

		// Preparar documentos para bulkDocs con blobs serializados
		const bulkDocs = await Promise.all(
			docs.map(async (doc) => {
				const { _id, _rev, docType, ...data } = doc;
				const [tableName, dexieIdStr] = _id.split(":");
				let dexieId = dexieIdStr;
				if (!isNaN(dexieIdStr)) {
					dexieId = Number(dexieIdStr);
				}

				if (!db[tableName]) {
					console.warn(
						`Tabla '${tableName}' no existe en Dexie. Documento '${_id}' omitido.`
					);
					current++;
					if (onProgress) onProgress(current, total);
					return null;
				}

				// Deserializar blobs
				const deserializedData = await BackupService.deserializeBlobsInObject(
					data
				);

				return {
					_id: _id, // Mantener el mismo _id para futuras sincronizaciones
					docType: tableName,
					...deserializedData,
				};
			})
		);

		// Filtrar documentos nulos
		const validBulkDocs = bulkDocs.filter((doc) => doc !== null);

		// Insertar en Dexie usando bulkAdd
		const tablesToAdd = {};

		validBulkDocs.forEach((doc) => {
			const tableName = doc.docType;
			if (!tablesToAdd[tableName]) {
				tablesToAdd[tableName] = [];
			}
			tablesToAdd[tableName].push(doc);
		});

		for (const tableName in tablesToAdd) {
			try {
				await db[tableName].clear();
				await db[tableName].bulkPut(tablesToAdd[tableName]);
				console.log(`Restauración de la tabla '${tableName}' completada.`);
			} catch (err) {
				console.error(`Error al restaurar la tabla '${tableName}':`, err);
			}
		}

		// Actualizar progreso final
		current = total;
		if (onProgress) onProgress(current, total);

		console.log("Restauración desde CouchDB completada.");
		stateSync.isSyncingFromPouch = false;
	} catch (error) {
		console.error("Error durante la restauración desde CouchDB:", error);
		throw error;
	}
};

/**
 * Sincroniza datos locales a CouchDB, incluyendo la serialización de blobs.
 */
export const pushInitialSync = async () => {
	try {
		await resetAllPouches();
		// Recorrer todas las tablas en Dexie
		for (const table of db.tables) {
			// if (table.name !== "config" && table.name !== "items") {
			// 	continue;
			// }
			const allRecords = await table.toArray();

			// Serializar blobs en los registros
			const serializedRecords = await Promise.all(
				allRecords.map((record) => BackupService.serializeBlobsInObject(record))
			);

			// Mapear los registros a documentos de PouchDB
			const docs = serializedRecords.map((record) => ({
				_id: `${table.name}:${record.id || record.key}`, // Formato de ID consistente
				docType: table.name,
				// document: record.document,
				// fields: record.fields,
				// type: record.type,
				// name: record.name,
				// in_collection: record.in_collection,
				// created_at: record.created_at,
				// updated_at: record.updated_at,
				// cache: record.cache,
				...record,
			}));

			// Realizar una replicación bulkDocs a PouchDB
			let limit = 100;
			while (docs.length > 0) {
				const batch = docs.splice(0, limit);
				console.log(`Insertando ${batch.length} registros en la tabla ${table.name}...`);
				batch.forEach((doc) => {
					if(doc.fields) {
						Object.keys(doc.fields).forEach((field) => {
							if (doc.fields && doc.fields[field] && doc.fields[field].processResults) {
								delete doc.fields[field];
							}
						});
					}
				});
				let response = await localPouch.bulkDocs(batch);
				response.forEach((res, index) => {
					if (res.error) {
						console.error(`Error al insertar documento ${batch[index]._id}:`, res);
					}
				});
			}

			console.log(
				`Sincronización inicial de la tabla ${table.name} completada.`
			);
		}

		console.log("Sincronización inicial completa.");
	} catch (error) {
		console.error("Error durante la sincronización inicial:", error);
	}
};

export const resetLocalPouch = async () => {
	try {
		await localPouch.destroy();
		console.log("localPouchDB destruida exitosamente.");
		localPouch = new PouchDB("myLocalPouchDB");
		console.log("localPouchDB recreada.");
	} catch (err) {
		console.error("Error al resetear localPouchDB:", err);
	}
};

export const resetRemoteCouch = async () => {
	try {
		await remoteCouch.destroy();
		console.log("remoteCouch destruida exitosamente.");
		// Recrear la base de datos
		remoteCouch = new PouchDB(
			"http://admin:123456@18.194.133.72:5984/collexplore"
		);
		console.log("remoteCouch recreada.");
	} catch (err) {
		console.error("Error al resetear remoteCouch:", err);
	}

};

export const resetAllPouches = async () => {
	try {
		await resetLocalPouch();
		await resetRemoteCouch(); // Solo si es seguro hacerlo
		console.log("Ambas bases de datos han sido reseteadas.");
	} catch (err) {
		console.error("Error al resetear las bases de datos:", err);
	}


};

// Iniciar la replicación en vivo al cargar el servicio










startLiveSync();