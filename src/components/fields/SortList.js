import React, { useState, useEffect, useContext, useMemo } from "react";
import {
	Box,
	Switch,
	FormControlLabel,
	Typography,
	Tooltip,
	Button,
} from "@mui/material";
import { FormContext } from "../../services/context_form";
import db from "../../services/db";
import { openErrorDialog, selectPopup } from "../../services/helper";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";

function SortList({ value, onChange, field, definition }) {
	const { t } = useTranslation();

  const { subscribe, notify } = useContext(FormContext);

  const deleteItemFromSortList = async (fieldId, value, reference) => {
    try {
      let sortList = (await db.fieldListSort
        .where("field")
        .equals(fieldId)
        .toArray())
        .find((item) => item.value === value);
      if (sortList) {
        let sortData = sortList.data;
        let index = sortData.findIndex((item) => item.id === reference.id);
        if (index !== -1) {
          sortData.splice(index, 1);
          await db.fieldListSort.update(sortList.id, { data: sortData });
          setSortFieldIndex(0);
          setSortFieldList(sortData);
          setSortFieldListSubList([]);
        }
      }
    } catch (error) {
      console.error("SortList: Error al eliminar el elemento:", error);
    }
  
  }

  const addItemToSortList = async (fieldId, newValue, reference) => {
		try {
			let sortList = (
				await db.fieldListSort.where("field").equals(fieldId).toArray()
			).find((item) => item.value === newValue);
			if (!sortList) {
				await db.fieldListSort.add({
					field: fieldId,
					value: newValue,
					data: [],
				});
				sortList = (
					await db.fieldListSort.where("field").equals(fieldId).toArray()
				).find((item) => item.value === newValue);
			}

			let sortData = sortList.data;
			let direction = field.dir || "asc"; // Dirección de ordenación: 'asc' o 'desc'
			let fieldSort = field.sort; // Campo por el cual se ordena
			let valueSort = reference.fields[fieldSort]; // Valor actual del campo de ordenación

			// Suponiendo que 'valueSort' es el nuevo valor que se inserta
			// y que 'sortData' ya está ordenado según 'fieldSort' y 'direction'

			// Crear el nuevo elemento a insertar
			const newItem = reference;

			// Encontrar la posición correcta para insertar el nuevo elemento
			let insertIndex = sortData.findIndex((item) => {
				if (direction === "asc") {
					return item.fields[fieldSort] > valueSort;
				} else {
					// "desc"
					return item.fields[fieldSort] < valueSort;
				}
			});

			if (insertIndex === -1) {
				// Insertar al final si no se encuentra una posición adecuada
				sortData.push(newItem);
				insertIndex = sortData.length - 1;
			} else {
				// Insertar en la posición encontrada
				sortData.splice(insertIndex, 0, newItem);
			}
      if (!insertIndex) {
        insertIndex = 0;
      }

			// Actualizar la base de datos con el nuevo orden
			await db.fieldListSort.update(sortList.id, { data: sortData });
      setSortFieldIndex(insertIndex);
      setSortFieldList(sortData);
      setSortFieldListSubList(
        sortData.slice(
          insertIndex - lengthSubList,
          insertIndex + 1 + lengthSubList
        )
      );
		} catch (error) {
			console.error("SortList: Error al actualizar el orden:", error);
		}
	};

  useEffect(() => {
			const callback = async (fieldId, newValue, reference) => {
				if (fieldId === field.field) {
					let currentValue = reference.fields[fieldId];
					if (newValue !== currentValue && !value) {
            await deleteItemFromSortList(fieldId, currentValue, reference);
						await addItemToSortList(fieldId, newValue, reference);
					}
				}
			};

			subscribe(field.field, callback);

			return () => {
			};
	}, [field.field, value, field.dir, field.sort]);

  const [sortFieldValue, setSortFieldValue] = useState(value);
  const [sortFieldIndex, setSortFieldIndex] = useState(0);
  const [sortFieldList, setSortFieldList] = useState([]);
  const [sortFieldListSubList, setSortFieldListSubList] = useState([]);
  const [seeAll, setSeeAll] = useState(false);

  const lengthSubList = 1;

  const valueCP = value;

  const printSortFieldValue = (value) => {
    let str = "";
    if (typeof value === "object") {
      if (value.name) {
        str += value.name;
      }
      if (value.fields && !valueCP && Object.keys(value.fields).length) {
				str += " [";
				Object.keys(value.fields).forEach((key) => {
					str += `${value.fields[key]} | `;
				});
				str = str.slice(0, -3);
				str += "]";
			}
      if (!str) {
        str = JSON.stringify(value);
      }
    } else {
      str = value;
    }
    return (
      str
    );
  }


  useEffect(() => {
    let root = definition.root;
		if (!root) {
			return;
		}
    if (typeof root.id === "string" && root.id.includes("lists-")) {
      
      root.id = (Number(root.id.replace("lists-", "")) ) + 0;
    } 
    if (definition && definition.root) {
      let fieldValue = (definition.root.cache && definition.root.cache[field.field]) || definition.root.fields[field.field];
      setSortFieldValue(printSortFieldValue(fieldValue));
    }
    if (!value) {
      db.fieldListSort.where("field").equals(field.field).toArray().then((sortLists) => {
        let sortList = sortLists.find(
					(item) => item.value === definition.root.fields[field.field]
				);
        if (sortList) {
          let sortData = sortList.data;
          let index = sortData.findIndex((item) => item.id === definition.root.id);
          if (index !== -1) {
            setSortFieldIndex(index);
            setSortFieldList(sortData);
            let sortDataLimit = sortData.slice(
              index - lengthSubList > 0 ? index - lengthSubList : 0,
              index + 1 + lengthSubList
            );
            if (seeAll) {
              setSortFieldListSubList(sortData);  
            }else {
              setSortFieldListSubList(sortDataLimit);
            }

          }
        }
        else {
          setSortFieldIndex(0);
          setSortFieldList([]);
          setSortFieldListSubList([]);
        }
      });
      
    }
      
  }, [definition, field.field]);


	return (
		<Box className="field-sort-list">
			<Box alignItems="center">
				<Typography>{sortFieldValue ? sortFieldValue : ""}</Typography>
				<Box>
					{!value &&
						sortFieldListSubList.length && (
							<Typography>
								{" "}
								· {` ${sortFieldIndex + 1}/${sortFieldList.length}`}
							</Typography>
						) || ""}
					{(!seeAll && (
						<Button
							className="btn-sort-list"
							onClick={() => {
								setSeeAll(true);
								setSortFieldListSubList(sortFieldList);
							}}
						>
							{t("sort-list-see-all")}
						</Button>
					)) || (
						<Button
							className="btn-sort-list"
							onClick={() => {
								setSeeAll(false);
								setSortFieldListSubList(
									sortFieldList.slice(
										sortFieldIndex - lengthSubList > 0
											? sortFieldIndex - lengthSubList
											: 0,
										sortFieldIndex + 1 + lengthSubList
									)
								);
							}}
						>
							{t("sort-list-see-less")}
						</Button>
					)}
				</Box>
				<Box>
					{!value &&
						sortFieldListSubList.map((item, index) => (
							<Box key={index}>
								<Typography className={`sort-list-item ${item.id === definition.root.id ? "sort-list-item-active" : ""}`}>
									{(seeAll ? 0 : sortFieldIndex - lengthSubList) + index + 1 > 1
										? (seeAll ? 0 : sortFieldIndex - lengthSubList) + index + 1
										: index + 1}
									. {item.name}
								</Typography>
							</Box>
						))}
				</Box>
			</Box>
			<FormControlLabel
				control={
					<Switch
						checked={
							value === true || value === "true" || value === 1 || value === "1"
						}
						onChange={function (e) {
							if (e.target.checked) {
								deleteItemFromSortList(
									field.field,
									definition.root.fields[field.field],
									definition.root
								);
							} else {
								addItemToSortList(
									field.field,
									definition.root.fields[field.field],
									definition.root
								);
							}
							onChange(e.target.checked);
						}}
						name={field.id}
					/>
				}
				label={t("sort-list-exclude")}
			/>
		</Box>
	);
}

export default SortList;







































