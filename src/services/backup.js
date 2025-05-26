// service/backup.js
import db from "./db"; // O donde tengas definida tu instancia Dexie
// Si prefieres, se lo puedes pasar al constructor y no importarlo directamente.

const CHUNK_SIZE = 500;
// Podrías colocar un chunk_size en cada método si quieres,
// o exponerlo como get/set. Depende de cómo quieras usarlo en Drive vs local.

class BackupService {
	// Serializa la BD entera en un único objeto
	async createFullBackup(limit = Infinity) {
		const dbCopy = {};

		for (const table of db.tables) {
			const totalRecords = await table.count();
			const records = await table
				.toArray()
				.then((data) => data.slice(0, limit)); // limit opcional

			const serializedRecords = [];
			for (const record of records) {
				const serializedRecord = await this.serializeBlobsInObject(record);
				serializedRecords.push(serializedRecord);
			}

			dbCopy[table.name] = serializedRecords;
		}

		return dbCopy;
	}

	// Restaura la BD completa desde un objeto con la misma estructura que createFullBackup
	async restoreFullBackup(dbCopy) {
		const tables = Object.keys(dbCopy);

		for (const tableName of tables) {
			const table = db.table(tableName);
			if (!table) {
				console.warn(`La tabla ${tableName} no existe en la base de datos.`);
				continue;
			}

			// Deserializamos cada registro
			const records = dbCopy[tableName];
			const deserializedRecords = [];
			for (const record of records) {
				const deserializedRecord = await this.deserializeBlobsInObject(record);
				deserializedRecords.push(deserializedRecord);
			}

			// Limpiamos la tabla y agregamos los registros
			await table.clear();
			await table.bulkAdd(deserializedRecords);
		}
	}

	async restoreTableBackup(tableName, records) {
		const table = db.table(tableName);
		if (!table) {
			console.warn(`La tabla ${tableName} no existe en la base de datos.`);
			return;
		}

		const deserializedRecords = [];
		for (const record of records) {
			const deserializedRecord = await this.deserializeBlobsInObject(record);
			deserializedRecords.push(deserializedRecord);
		}

		await table.clear();
		await table.bulkAdd(deserializedRecords);
	}

	// -----------------------------
	// Métodos auxiliares de (des)serialización
	// -----------------------------
	async serializeBlobsInObject(obj) {
		if (obj === null) return null;
		if (obj instanceof Blob) {
			const base64 = await this.blobToBase64(obj);
			return `base64/${base64}`;
		}

		if (Array.isArray(obj)) {
			const serializedArray = [];
			for (const item of obj) {
				serializedArray.push(await this.serializeBlobsInObject(item));
			}
			return serializedArray;
		}

		if (typeof obj === "object" && Object.keys(obj).length > 0) {
			const serializedObj = {};
			for (const key in obj) {
				if (Object.hasOwn(obj, key) && obj[key]) {
					serializedObj[key] = await this.serializeBlobsInObject(obj[key]);
				}else{
					serializedObj[key] = null;
				}
			}
			return serializedObj;
		}

		// Caso primitivo (string, number, etc.)
		return obj;
	}

	async deserializeBlobsInObject(obj) {
		if (obj === null) return null;
		if (typeof obj === "string" && obj.startsWith("base64/")) {
			const base64Data = obj.substring(7);
			return this.base64ToBlob(base64Data);
		}

		if (Array.isArray(obj)) {
			const deserializedArray = [];
			for (const item of obj) {
				deserializedArray.push(await this.deserializeBlobsInObject(item));
			}
			return deserializedArray;
		}

		if (typeof obj === "object") {
			const deserializedObj = {};
			for (const key in obj) {
				if (Object.hasOwn(obj, key)) {
					deserializedObj[key] = await this.deserializeBlobsInObject(obj[key]);
				}
			}
			return deserializedObj;
		}

		return obj;
	}

	blobToBase64(blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const dataUrl = reader.result;
				const base64 = dataUrl.split(",")[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	base64ToBlob(base64Data) {
		const byteCharacters = atob(base64Data);
		const byteArrays = [];
		const sliceSize = 512;

		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);
			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}

		return new Blob(byteArrays);
	}
}

export default new BackupService();



