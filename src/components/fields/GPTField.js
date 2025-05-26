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
import { openErrorDialog, selectPopup, sendPromptGPT } from "../../services/helper";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";
// import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SmartToyIcon from "@mui/icons-material/SmartToy";

import Dexie from "dexie";


const prompt = `
Actúa como un agente experto en determinar el valor de un campo de un objeto de colección {{typeName}}.

Es necesario que busques en internet para obtener la mejor respuesta.

Contexto: {{context}}

Definición del campo: {{fieldDefinition}}

{{fieldTypeLimitations}}

{{fieldLimitations}}

Debes dar un valor para el camp con el formato: #RESP{{solución}}

Es importante dar datos reales, precisos y completos para obtener el valor correcto.
`;

function GPTField({ value, onChange, field, definition }) {
	const { t } = useTranslation();

  const [typeName, setTypeName] = useState("");
  const [context, setContext] = useState([]);
  const [fieldDefinition, setFieldDefinition] = useState([]);
  const [fieldTypeLimitations, setFieldTypeLimitations] = useState([]);

  const checkFilters = (item) => {
		const compareFilters = (value1, value2) => {
			if (value1 instanceof Array && value2 instanceof Array) {
				for (let i = 0; i < value1.length; i++) {
					if (value2.indexOf(value1[i]) !== -1) {
						return true;
					}
				}
			} else if (!(value1 instanceof Array) && value2 instanceof Array) {
				if (value2.indexOf(value1) !== -1) {
					return true;
				}
			} else if (value1 instanceof Array && !(value2 instanceof Array)) {
				if (value1.indexOf(value2) !== -1) {
					return true;
				}
			} else if (value1 === value2) {
				return true;
			}
			return false;
		};

		let data_all_conditions = true;
		for (let key in field.fields) {
			if (key === "updatedAt") {
				continue;
			}
			if (
				!item.fields ||
				!compareFilters(item.fields[key], field.fields[key])
			) {
				data_all_conditions = false;
				break;
			}
		}
		return data_all_conditions;
	};

  useEffect(() => {
    const initData = async () => {
      try {
        if (definition && definition.root && definition.root.type) {
          const type_id = definition.root.type;
          const type_obj = await db.types.where("id").equals(type_id).first();
          if (type_obj.fields) {
            setTypeName(type_obj.name);
            let query_fields = [
              {
                field: "name",
                value: definition.root.name,
              }
            ];
            type_obj.fields.forEach((field) => {
              if (field.use_for_gpt_query) {
                if (definition && definition.root && !Array.isArray(definition.root) && definition.root.cache && definition.root.fields) {
                  query_fields.push({
                    field: field.label,
                    value: definition.root.cache[field.id] ?  definition.root.cache[field.id] : definition.root.fields[field.id],
                  });
                }
              }
            });
            setContext(JSON.stringify(query_fields));

            setFieldDefinition(JSON.stringify({
              type: field.type,
              label: field.label,
              multiple: field.multiple,
            }));
            
            if (field.type === "entity") {
              db.entity
								.where("[type+name]")
								.between(
									[field.entity, Dexie.minKey],
									[field.entity, Dexie.maxKey]
								)
								.toArray()
								.then((data) => {
                  let units = "una";
									let format = " solo el id ";
									if (field.multiple) {
										units = "una o varias";
										format = " una array de ids [id1, id2, ...] ";
									}
									if (field.fields && Object.keys(field.fields).length > 0) {
										let data_new = [];
										for (let i = 0; i < data.length; i++) {
											if (checkFilters(data[i])) {
												data_new.push(data[i]);
											}
										}
                    data = JSON.stringify(data_new);
										setFieldTypeLimitations(
											`Solo puedes seleccionar ${units} entre estas entidades: ${data}. Es importante que el fomato sea ${format}.`
										);

									} else {
                    let cleanData = data.map((item) => ({
                      "id": item.id,
                      "name": item.name,
                    }));
                    cleanData = JSON.stringify(cleanData);
										setFieldTypeLimitations(
											`Solo puedes seleccionar ${units} entre estas entidades: ${cleanData}. Es importante que el fomato sea ${format}.`
										);
									}
								})
								.catch((error) => {
									console.error(error);
									setFieldTypeLimitations("");
								});
            }
            if (field.type === "tags") {
              db.autocompleteTags
                .where("field")
                .equals(field.id)
                .toArray()
                .then((data) => {
                  const filteredData = data.filter((element) => element && element.label);
                  let units = "una o varias";
									let format = " una array de valores cadenas ['tag1', 'tag2', ...] ";
                  let cleanData = filteredData.map((item) => item.label);
                  cleanData = JSON.stringify(cleanData);
                  setFieldTypeLimitations(
                    `Solo puedes seleccionar ${units} entre estas etiquetas: ${cleanData}. Es importante que el fomato sea ${format}.`
                  );
            
                });
            }
          }
        }
      } catch (error) {
        console.error("GPTField: Error al inicializar el campo:", error);
      }
    }
    initData();
  }, [value, field, definition]);

  const handleClick = async () => {
    try{
      let resp = await sendPromptGPT (
        prompt
          .replace("{{typeName}}", typeName)
          .replace("{{context}}", context)
          .replace("{{fieldDefinition}}", fieldDefinition)
          .replace("{{fieldTypeLimitations}}", fieldTypeLimitations)
          .replace("{{fieldLimitations}}", field.field_gpt_text || "")
      );
      let extract = resp.match(/#RESP(.*)/);
      if (extract && extract[1]) {
        let value = eval(extract[1].replace(/\[\[/g, "[").replace(/\]\]/g, "]"));
        onChange(field.id, value);
      }
    }catch (error) {
      openErrorDialog(t("error-gpt"), JSON.stringify(error.message));
    }
  };

  if (Array.isArray(definition.root)) {
    return null;
  }

	return (
		<Box className="gpt-field">
			<Button onClick={handleClick} variant="contained" color="primary">
				<Tooltip title={t("generate-gpt")}>
					<SmartToyIcon />
				</Tooltip>
			</Button>
		</Box>
	);
}

export default GPTField;
























