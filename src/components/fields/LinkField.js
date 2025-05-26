import React, { useState, useEffect, useContext } from "react";

import { Box, Button, ButtonIcon, Link, Tooltip, Typography } from "@mui/material";
import { ProcessContext } from "../../services/context_scraping";

import { useTranslation } from "react-i18next";

import db from "../../services/db";
import { getValuesFieldsByLabel } from "../../services/helper";

const urlEncode = (str) => {
  return encodeURIComponent(str).replace(/%20/g, "+");
}




export default function LinkField({ value, onChange, field, definition, reference }) {
	const { t, i18n } = useTranslation();

  const { startProcess, processSubscribers } = useContext(ProcessContext);

	let icon = field.icon ? field.icon : "";
	let url = field.url ? field.url : "";
	let name = field.label ? field.label : "";
	let show_label = field.show_label;

	const [stateURL, setStateURL] = useState(null);

	const processScraping = async () => {
		let scraping = await db.scraping.get(field.scraping_id);
		if (definition && definition.root && !Array.isArray(reference)) {
			let item = { name: definition.root.name };
			if (definition.root.fields) {
				item = {
					...item,
					...(await getValuesFieldsByLabel(
						definition.root.type,
						definition.root.fields
					)),
				};
			}
			const items = [item];
			let def_obj;
			try {
				def_obj = JSON.parse(scraping.definition);
			} catch (e) {
				console.error("Error parsing definition:", e);
				return;
			}

			const handleProcessMessage = (message) => {
				const { event, data: msg } = message;
				if (
					event === "processCompleted" &&
					msg.results &&
					msg.results.results &&
					msg.results.results.length > 0 &&
					msg.results.results[0].value
				) {

					setStateURL(msg.results.results[0].value);
					// onChange(field.id, msg.results.results[0].value);
					if (definition.root && definition.root.fields) {
						definition.root.fields[field.id] = msg.results.results[0].value;
						db[definition.document].update(definition.root.id, definition.root);
					}
					document.dispatchEvent(new CustomEvent("processCompleted", { detail: {msg, field_id: field.id} }));
				}
			};

			startProcess(
				def_obj,
				items,
				[],
				[],
				field.id + "-" + definition.root.id,
				handleProcessMessage
			);
		}
	};

	const processURL = async (url) => {
		if (definition && definition.root && definition.root) {
			let replaceEquivalences = {
				name: definition.root.name,
			};
			if (
				definition.root &&
				!Array.isArray(reference) &&
				definition.root.fields
			) {
				replaceEquivalences = {
					...replaceEquivalences,
					...(await getValuesFieldsByLabel(
						definition.root.type,
						definition.root.fields
					)),
				};
			}
			Object.keys(replaceEquivalences).forEach((key) => {
				url = url.replace(`{${key}}`, urlEncode(replaceEquivalences[key]));
			});
		}
		setStateURL(url);
	};
	
	useEffect(() => {
		if (definition.root.name === "" || !definition.root.id) {
			return;
		}
		

    

    if (field.scraping_id) {
      setStateURL(
				definition &&
				definition.root &&
				definition.root.fields &&
				definition.root.fields[field.id]
			);
		
      // processScraping();
    }else {
      processURL(url);
    }

    return () => {
      if (field.scraping_id) {
        processSubscribers[field.id + "-" + definition.root.id] = null;
      }
    }
	}, [url, definition.root.id, field.id, definition.root.name]);

	

	useEffect(() => {

		const saveDetail = (e) => {
			if (field.scraping_id) {
				processScraping();
			}
		}

		

		document.addEventListener("saveDetail", saveDetail);

		

		return () => {
			document.removeEventListener("saveDetail", saveDetail);
		};
	}, [definition.root.id, field.id]);


	useEffect(() => {
		const processCompleted = (e) => {
			const {msg, field_id} = e.detail;
			if (field_id !== field.id) {
				return;
			}
			if (definition.root.fields[field.id]) {
				if (field.new_window) {
					window.open(
						definition.root.fields[field.id],
						"_blank", // Nombre de la ventana
						`fullscreen=yes,scrollbars=yes,resizable=yes,top=0,left=0,width=${window.screen.width},height=${window.screen.height}`
					);
				} else {
					//in new tab
					window.open(definition.root.fields[field.id], "_blank");
				}
			}
		}

		document.addEventListener("processCompleted", processCompleted);

		return () => {
			document.removeEventListener("processCompleted", processCompleted);
		}
	}, [stateURL]);


	

	if (Array.isArray(reference)) {
		return null;
	}

	return (
		<Box>
			<Tooltip title={name}>
				<Link
					target="_blank"
					onClick={(e) => {
						e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
						if (stateURL && !e.ctrlKey) {
							if (field.new_window) {
								window.open(
									stateURL,
									"_blank", // Nombre de la ventana
									`fullscreen=yes,scrollbars=yes,resizable=yes,top=0,left=0,width=${window.screen.width},height=${window.screen.height}`
								);
							} else {
								//in new tab
								window.open(stateURL, "_blank");
							}
						} else {
							if (field.scraping_id) {
								processScraping();
							} else {
								processURL(url);
							}
						}
					}}
				>
					{icon && (
						<img src={URL.createObjectURL(icon)} alt={name} draggable="false" />
					)}
					{show_label && <Typography>{name}</Typography>}
				</Link>
			</Tooltip>
		</Box>
	);

































}