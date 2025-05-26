// src/components/Stats/charts/KpiNumber.js

import React, { useEffect, useState, useContext } from "react";
import { Box } from "@mui/material";
import { Virtuoso } from "react-virtuoso";
import { AppContext } from "../../../services/context";
import { valueToString } from "../../../services/helper";

export default function KpiNumber({ title, data, config }) {
	const [value, setValue] = useState(null);
	const { itemListConfig } = useContext(AppContext);

	useEffect(() => {
		if (!data.counts || Object.keys(data.counts).length === 0) {
			if (data.totalItems !== undefined) {
				setValue(data.groups || data.totalItems);
			}
		} else {
			setValue(data.counts);
		}
	}, [data]);

	// Función para aplanar los datos y asignar profundidad
	const flattenData = (data, depth = 0, parentKey = "") => {
		let items = [];

		if (Array.isArray(data)) {
			data.forEach((item, index) => {
				const key = `${parentKey}-${index}`;
				items.push({ ...item, depth, key });
				if (item.subGroups && item.subGroups.length > 0) {
					items = items.concat(flattenData(item.subGroups, depth + 1, key));
				}
        if (item.counts && Object.keys(item.counts).length > 0) {
          Object.keys(item.counts).forEach((key, index) => {
            const subItem = item.counts[key];
            if (typeof subItem === "object" && subItem !== null) {
              Object.keys(subItem).forEach((subKey, subIndex) => {
                const uniqueKey = Date.now().toString().slice(-5).concat(Math.random().toString(36).slice(-5));
                items.push({
									groupKey: subKey,
									groupBy: key,
									counts: subItem[subKey],
									depth: depth + 1,
									key: uniqueKey,
									totalItems: subItem[subKey].totalItems || subItem[subKey],
								});
              });
            }
          });
        }
			});
		} else if (typeof data === "object" && data !== null) {
			Object.keys(data).forEach((key, index) => {
				const item = data[key];
				const uniqueKey = Date.now().toString().slice(-5).concat(Math.random().toString(36).slice(-5));
				items.push({ ...item, key: uniqueKey, depth });
				if (item.subGroups && item.subGroups.length > 0) {
					items = items.concat(
						flattenData(item.subGroups, depth + 1, uniqueKey)
					);
				}
			});
		}

		return items;
	};

	if (!value) {
		return null;
	}

	// Aplanar los datos si son grupos
	const flatList = Array.isArray(value)
		? flattenData(value)
		: value; 

	// Renderizar cada ítem de la lista
	const Item = ({ index, style }) => {
		const item = flatList[index];
		return (
			<Box style={style} className={`value-item depth-${item.depth}`}>
				{recursiveValue(
          item, 
          item.key, 
          true, 
          Date.now().toString().slice(-5).concat(Math.random().toString(36).slice(-5))
        )}
			</Box>
		);
	};

	// Mantener la lógica de renderización recursiva
	function recursiveValue(item, key, showKey = false, uniqueKey = null) {
		let groupBy = item.groupBy || null;
		let type = "value";
    let groupKey = item.groupKey || null;
		let valueContent = item.value || item.totalItems || null;

		if (config.layout && typeof valueContent === "number") {
			valueContent = config.layout.replace(/%s/g, valueContent);
		}

		if (showKey && type === "value") {
			let keySubNew = valueToString(
				groupKey,
				groupBy,
				itemListConfig.typeSelected,
				true,
				(item) => {
					const element = document.querySelector(`.key-${uniqueKey}`);
					if (element) {
						element.innerHTML = `${item.name}: `;
					}
				}
			);
			if (keySubNew) {
				groupKey = keySubNew;
			}
		}

		return (
			<Box
				className={`value-item 
          ${type === "value" ? "last" : ""} 
          ${type === "value" && config.display ? config.display : ""}
        `}
				key={key}
				style={{ cursor: item.index ? "pointer" : "default" }}
				onClick={() => {
					if (item.index){
						let event = new CustomEvent("scroll-to", {
							detail: {
								index: item.index,
							},
						});
						window.dispatchEvent(event);
					}
				}}
			>
				{showKey && (
					<Box
						className={`key key-${uniqueKey}`}
						dangerouslySetInnerHTML={{
							__html: `${groupKey}`,
						}}
					></Box>
				)}
				{type === "value" ? (
					<Box
						className="value"
						dangerouslySetInnerHTML={{ __html: valueContent }}
					></Box>
				) : (
					<Box className="value">
						{typeof valueContent === "object" && !Array.isArray(valueContent)
							? Object.keys(valueContent).map((keySub, idx) => {
									let valSub = valueContent[keySub];
									let keySubNew = keySub;
									const uniqueKey = Date.now().toString().slice(-5).concat(Math.random().toString(36).slice(-5));
									if (!Array.isArray(valSub) && typeof valSub !== "object") {
										keySubNew = valueToString(
											keySub,
											item.groupBy,
											itemListConfig.typeSelected,
											true,
											(item) => {
												const element = document.querySelector(`.key-${uniqueKey}`);
												if (element) {
													element.innerHTML = `${item.name}: `;
												}
											}
										);
										if (keySubNew) {
											keySub = keySubNew;
										}
									}
									return recursiveValue(valSub, keySub, true, uniqueKey);
							  })
							: valueContent.map((val, idx) => {
									return recursiveValue(val, `${key}-${idx}`, true);
							  })}
					</Box>
				)}
			</Box>
		);
	}

  function countDepth(value, depth = 0) {
		if (!value) {
			return 0;
		}
		if (Array.isArray(value)) {
			value = value[0];
		}
		if (value && value["subGroups"] && value["subGroups"].length > 0) {
			depth++;
			return countDepth(value["subGroups"][0], depth);
		} else {
			if (value && value["groupKey"]) {
				depth++;
        if (typeof value["counts"] === "object") {
					return depth + 1;
				}
				return depth;
			}
		}
		if (value && value["counts"]) {
      if (typeof value["counts"] === "object") {
        return depth + 1;
      }
			return depth;
		}
		return 0;
	}

  return (
		<Box
			className={`kpi-number kpi-depth-${countDepth(value)}`}
		>
			<Box className="title name">
				<span>{title}</span>
			</Box>
      {(Array.isArray(flatList) && flatList.length && (
        <Virtuoso
          style={{ height: "100%", width: "100%" }} // Ajusta el tamaño según tus necesidades
          totalCount={flatList.length}
          itemContent={(index) => <Item index={index} />}
        />
      )) || (
        <Box className="value-single">
          <span className="value">
            {flatList}
          </span>
        </Box>
      )}
		</Box>
	);
}












