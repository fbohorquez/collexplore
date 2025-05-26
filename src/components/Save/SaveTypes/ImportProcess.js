import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { LinearProgress } from "@mui/material";
import db from "../../../services/db";
import { getOrAddEntity,clearCacheEntity } from "../../../services/helper";
import countries from "../../../locales/countries";

const { equivalenceTable: equivalenceCountry } = countries;

// let entityCache = {};

// async function getOrAddEntity(name, fieldType) {
// 	if (!entityCache[name]) {
// 		entityCache[name] = new Promise((resolve, reject) => {
// 			db.entity
// 				.where("name")
// 				.equals(name)
// 				.first()
// 				.then((entity) => {
// 					if (entity) {
// 						resolve({id:entity.id, item:entity});
// 					} else {
// 						let newEntity = {
// 							name: name,
// 							type: fieldType.entity,
// 							fields: fieldType.fields || {},
// 						};
// 						db.entity
// 							.add(newEntity)
// 							.then((id) => {
// 								newEntity.id = id;
// 								resolve({id: newEntity});
// 							})
// 							.catch((error) => {
// 								reject(error);
// 							});
// 					}
// 				}
// 			);
// 		});
// 	}
// 	return entityCache[name];
// }

async function processRow(row, type, columns, fieldsType) {
	if (!row[columns.find((col) => col.field === "name").index]){
		return;
	}
	let currentDate = new Date();
	if (row[columns.find((col) => col.field === "created_at").index]) {
		let dateNotFormatted = row[columns.find((col) => col.field === "created_at").index];
		let sep = "-";
		if (dateNotFormatted.includes("/")) {
			sep = "/";
		}
		let date = dateNotFormatted.split(sep);
		let yearIndex = 2;
		let monthIndex = 1;
		let dayIndex = 0;
		if (date[0].length === 4) {
			yearIndex = 0;
			dayIndex = 2;
			monthIndex = 1;
		}
		let year = parseInt(date[yearIndex]);
		let month = parseInt(date[monthIndex]);
		let day = parseInt(date[dayIndex]);
		if (year && month && day) {
			currentDate = new Date(year, month - 1, day);
		}
	}
	let record = {
		name: row[columns.find((col) => col.field === "name").index],
		type: type,
		created_at: currentDate,
		updated_at: currentDate,
		fields: {},
		cache: {},
	};

	for (const col of columns.filter(
		(col) => col.field && col.field !== "name"
	)) {
		const fieldType = fieldsType.find((f) => f.id === col.field);
		if (!fieldType) continue;

		if (fieldType.type === "image") {
			const row_value = row[col.index];
			try {
				let file = [...col.files].find((f) => f.name === row_value);
				if (file) {
					let blob = new Blob([file], { type: file.type });
					record.fields[fieldType.id] = blob;
				}
			} catch (error) {
				console.error("Error adding image", error);
			}
		} 
		else if (fieldType.type === "entity" && row[col.index]) {
			if (fieldType.multiple) {
				record.fields[fieldType.id] = [];
				record.cache[fieldType.id] = [];
			}
			const split = row[col.index].split(",");
			for (const name of split) {
				const {id:entityId, item:entity} = await getOrAddEntity(name, fieldType)
				if (entityId) {
					if (fieldType.multiple) {
						record.fields[fieldType.id].push(entityId);
						record.cache[fieldType.id].push(clearCacheEntity(entity));
					} else {
						record.fields[fieldType.id] = entityId;
						record.cache[fieldType.id] = clearCacheEntity(entity);
					}
				} else {
					console.error("-> Error adding entity", name);
				}
			}
		}
		else if (fieldType.type === "country" && row[col.index]) {
			let split = row[col.index].split(",");
			for (let value of split) {
				value = equivalenceCountry(value);
				if (value) {
					if (fieldType.multiple) {
						if (!record.fields[fieldType.id]) {
							record.fields[fieldType.id] = [];
						}
						record.fields[fieldType.id].push(value);
					} else {
						record.fields[fieldType.id] = value;
					}
				}
			}
		} 
		else {
			record.fields[fieldType.id] = row[col.index];
		}
	}
	return record;
}

function processCSV(data, columns, fieldsType, updateProgress) {
	const { type, csv } = data;
	const processedData = [];
	let rowCount = 0;

	Papa.parse(csv, {
		header: true,
		worker: true,
		step: (result) => {
			rowCount++;
		},
		complete: () => {
			let rowNumber = 0;
			Papa.parse(csv, {
				header: false,
				worker: true,
				step: async (result, parser) => {
					if (rowNumber++ === 0) return; // skip header

					const record = await processRow(
						result.data,
						type,
						columns,
						fieldsType
					);
					db.items
						.add(record)
						.then((id) => {
							processedData.push(record);
							console.log(
								"Item added with id",
								id,
								"rowNumber:",
								rowNumber,
								"rowCount:",
								rowCount
							);
							updateProgress(rowNumber, rowCount);
						})
						.catch((error) => {
							console.error("Error adding item", error);
						});
				},
				complete: () => {
					console.log("Processed data:", processedData);
					updateProgress(1, 1);
				},
			});
		},
	});
}

function ImportProcess({ data, columns, fieldsType }) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		processCSV(data, columns, fieldsType, (currentRow, totalRows) => {
			setProgress((currentRow / totalRows) * 100);
		});
	}, [data, columns, fieldsType]);

	return (
		<div>
			<LinearProgress variant="determinate" value={progress} />
			{/* Aquí el resto de tu UI */}
		</div>
	);
}

export default ImportProcess;









