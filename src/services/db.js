// src/services/db.js
import Dexie from "dexie";
// import { localPouch } from "./pouchService";
import BackupService from "./backup";
import Config from "./config";
const db = new Dexie("MyCollectionDB");

db.version(11).stores({
	items: "++id, name, type, fields, created_at, update_at", // Artículos
	types: "++id, name, fields, order, created_at, update_at", // Tipos
	entity: "++id, type, name, fields, [type+name], created_at, update_at", // Entidades
	"entity-types": "++id, name, fields, created_at, update_at", // Tipos de entidades
	config: "++key, value, created_at, update_at", // Configuración
	// listColumns: "++id, key, field, label, created_at, update_at", // Columnas de listas
	autocompleteTags: "++id, field, label, created_at, update_at",
	fieldListSort: "++id, field, value, data, created_at, update_at",
	lists: "++id, name, items, order, created_at, update_at",
	"lists-items": "++id, name, type, fields, created_at, update_at", // Artículos de listas
	sources: "++id, name, type, fields, created_at, update_at",
	dashboard: "++id, name, type, fields, values, created_at, update_at",
	scraping:
		"++id, name, type, definition, items, filters, processId, processResults, processStatus, created_at, update_at",
	scrapingObjects: "++id, name, items, created_at, update_at",
});


// window.addEventListener("change-table-{config}", (e) => {
// 	const { key, value } = e.detail;
// 	if (key === "collection-img-visible") {
// 		setIsCollectionImgVisible(value);
// 	}
// });

// async function removeGroupEditionFromExistingItems() {
// 	for (const table of db.tables) {
// 		await table.toCollection().modify((item) => {
// 			if (item.groupEdition !== undefined) {
// 				delete item.groupEdition;
// 			}
// 		});
// 	}
// }

// // Llama a la función de limpieza al iniciar para asegurarte de que "groupEdition" no esté presente
// removeGroupEditionFromExistingItems();

export const stateSync = {
	isSyncingFromDexie: false,
	isSyncingFromPouch: false,
};

db.tables.forEach((table) => {
	table.hook("creating", function (primKey, obj, trans) {
		if(!obj.created_at){
			obj.created_at = new Date();
		}
		if(!obj.updated_at){
			obj.updated_at = new Date();
		}

		let event = new CustomEvent("creating-table-" + table.name, {
			detail:
				{
					primKey,
					obj,
					trans,
				}
		});
		window.dispatchEvent(event);

		// async function pouchPut() {
		// 	if (!stateSync.isSyncingFromPouch) {
		// 		try {
		// 			stateSync.isSyncingFromDexie = true;
		// 			const serializedObj = await BackupService.serializeBlobsInObject(obj);
		// 			const doc = {
		// 				_id: `${table.name}:${
		// 					primKey || Dexie.getByKeyPath(obj, table.schema.primKey.keyPath)
		// 				}`,
		// 				docType: table.name,
		// 				...serializedObj,
		// 			};
		// 			await localPouch.put(doc);
		// 		} catch (err) {
		// 		} finally {
		// 			stateSync.isSyncingFromDexie = false;
		// 		}
		// 	}
		// }
		// pouchPut();
	});

	table.hook("updating", function (modifications, primKey, obj, trans) {
		if(!obj.updated_at){
			obj.updated_at = new Date();
		}
		
		let event = new CustomEvent("updating-table-" + table.name, {
			detail:
				{
					modifications,
					primKey,
					obj,
					trans,
				}
		});
		window.dispatchEvent(event);
		if (table.name === "config") {
			setTimeout(() => {
				Config.initConfigCache();
			}, 500);
			Config.initConfigCache();
		}

		// async function pouchPut() {
		// 	if (!stateSync.isSyncingFromPouch) {
		// 		try {
		// 			stateSync.isSyncingFromDexie = true;
		// 			const serializedModifications =
		// 				await BackupService.serializeBlobsInObject(modifications);
		// 			try {
		// 				const doc = await localPouch.get(`${table.name}:${primKey}`);
		// 				const newDoc = {
		// 					...doc,
		// 					...serializedModifications,
		// 				};
		// 				await localPouch.put(newDoc);
		// 			} catch (err) {
		// 				if (err.status === 404) {
		// 					// Si no existe en Pouch, crearlo
		// 					const newDoc = {
		// 						_id: `${table.name}:${primKey}`,
		// 						docType: table.name,
		// 						...obj,
		// 						...serializedModifications,
		// 					};
		// 					await localPouch.put(newDoc);
		// 				} else {
		// 					console.error("Error actualizando en Pouch", err);
		// 				}
		// 			} finally {
		// 				stateSync.isSyncingFromDexie = false;
		// 			}
		// 		} catch (err) {}
		// 	}
		// }
		// pouchPut();
	});

  table.hook("deleting", function (primKey, obj, transaction) {
		try {
			// async function pouchDelete() {
			// 	const doc = await localPouch.get(`${table.name}:${primKey}`);
			// 	await localPouch.remove(doc);
			// }
			// pouchDelete();
    } catch (err) {
      if (err.status !== 404) {
        console.error("Error borrando en Pouch", err);
      }
		}
	});
});


// localPouch
// 	.changes({
// 		since: "now",
// 		live: true,
// 		include_docs: true,
// 	})
// 	.on("change", async (change) => {
// 		try {
// 			stateSync.isSyncingFromPouch = true;
// 			const { doc } = change;
// 			if (!doc.docType) return; // Ignorar documentos sin docType

// 			// Extraer el ID Dexie
// 			// Asumiendo _id = "<tabla>:<id>"
// 			let [tableName, dexieKeyStr] = doc._id.split(":");

// 			if (parseInt(tableName) && doc.document) {
// 				tableName = doc.document;
// 				dexieKeyStr = doc.id;
// 			}

// 			const dexieKey = Number(dexieKeyStr);

// 			if (!db[tableName]) return; // Si no hay tabla con ese nombre, ignorar

// 			if (doc._deleted) {
// 				// Borrado en Pouch -> Borrado en Dexie
// 				await db[tableName].delete(dexieKey);
// 			} else {
// 				// Creación/Actualización
// 				// Deserializar blobs
// 				const { _id, _rev, docType, ...dexieData } = doc;
// 				const deserializedData = await BackupService.deserializeBlobsInObject(
// 					dexieData
// 				);
// 				await db[tableName].put({
// 					_id: tableName + ":" + dexieKey,
// 					...deserializedData,
// 				});
// 			}
// 		} catch (err) {
// 			if (err.status !== 404) {
// 				console.error("Error borrando en Pouch", err);
// 			}
// 		} finally {
// 			stateSync.isSyncingFromPouch = false;
// 		}
// 	})
// 	.on("error", (err) => {
// 		console.error("Error en cambio de Pouch -> Dexie", err);
// 	});


/*
// Modo de solo lectura
// Lista de métodos de escritura a deshabilitar
const writeMethods = [
  "add",
  "put",
  "delete",
  "clear",
  "bulkAdd",
  "bulkPut",
  "bulkDelete",
];

// Configurar hooks para cada tabla
db.tables.forEach((table) => {
  // Hook para prevenir la creación de nuevos registros
  table.hook("creating", function (primKey, obj, trans) {
    // Si deseas mantener alguna lógica antes de bloquear, hazlo aquí
    // Por ejemplo, asignar fechas de creación
    if (!obj.created_at) {
      obj.created_at = new Date();
    }
    if (!obj.updated_at) {
      obj.updated_at = new Date();
    }

    // Dispara un evento personalizado si es necesario
    let event = new CustomEvent("creating-table-" + table.name, {
      detail: {
        primKey,
        obj,
        trans,
      },
    });
    window.dispatchEvent(event);

    // Lanzar un error para bloquear la operación
    throw new Error(`No se permite crear elementos en la tabla "${table.name}" en modo de solo lectura.`);
  });

  // Hook para prevenir la actualización de registros existentes
  table.hook("updating", function (modifications, primKey, obj, trans) {
    // Si deseas mantener alguna lógica antes de bloquear, hazlo aquí
    if (!obj.updated_at) {
      obj.updated_at = new Date();
    }

    // Dispara un evento personalizado si es necesario
    let event = new CustomEvent("updating-table-" + table.name, {
      detail: {
        modifications,
        primKey,
        obj,
        trans,
      },
    });
    window.dispatchEvent(event);

    // Si necesitas realizar acciones específicas para ciertas tablas
    if (table.name === "config") {
      setTimeout(() => {
        Config.initConfigCache();
      }, 500);
      Config.initConfigCache();
    }

    // Lanzar un error para bloquear la operación
    throw new Error(`No se permite actualizar elementos en la tabla "${table.name}" en modo de solo lectura.`);
  });

  // Hook para prevenir la eliminación de registros
  table.hook("deleting", function (primKey, obj, trans) {
    // Lanzar un error para bloquear la operación
    throw new Error(`No se permite eliminar elementos en la tabla "${table.name}" en modo de solo lectura.`);
  });
});
*/


export default db;


































































