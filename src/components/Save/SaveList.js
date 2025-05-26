import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";
import { useTranslation } from "react-i18next";
import TitleButtons from "../layout/TitleButtons";
import DownloadBackup from "./SaveTypes/DownloadBackup";
import ImportExportList from "./SaveTypes/ImportExportList";
import GoogleDriveBackup from "./SaveTypes/GoogleDriveBackup";
import { AppContext } from "./../../services/context";
import {
	pushInitialSync,
	pullInitialSync,
	resetAllPouches,
} from "./../../services/pouchService";

import Title from "./../layout/Title";


function base64EncodeUnicode(str) {
	// Primero, codifica la cadena como URI component
	// Luego, reemplaza los caracteres especiales y usa btoa
	return btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
			String.fromCharCode("0x" + p1)
		)
	);
}

// Función para decodificar una cadena Base64 a Unicode
function base64DecodeUnicode(str) {
	// Primero, decodifica la cadena Base64 a una cadena binaria
	// Luego, reconstruye la cadena original usando decodeURIComponent
	return decodeURIComponent(
		atob(str)
			.split("")
			.map((c) => {
				return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join("")
	);
}

function SaveList() {
	const { t } = useTranslation();

	const { selectComponent, itemListConfig } = useContext(AppContext);

  const [listItems, setListItems] = useState([]);

	const btns = [];

  

  useEffect(() => {
    const fetchListItems = async () => {
      const listItems = [];
      if (navigator.storage && navigator.storage.estimate) {
          navigator.storage.estimate().then((estimate) => {
              const used = estimate.usage;
              const quota = estimate.quota;
              console.log(`Espacio usado: ${used} bytes`);
              console.log(`Espacio máximo permitido: ${quota} bytes`);
              console.log(`Porcentaje utilizado: ${(used / quota * 100).toFixed(2)}%`);
              listItems.push([
								t("navigator-storage"),
								t("navigator-storage-used") + ": " + parseFloat(estimate.usage / 1024 / 1024 / 1024).toFixed(2) + " GB",
								t("navigator-storage-quota") + ": " + parseFloat(estimate.quota / 1024 / 1024 / 1024).toFixed(2) + " GB",
								// t("navigator-storage-percentage") + ": " +
								((estimate.usage / estimate.quota) * 100).toFixed(2) + "%",
							]);
              listItems.push([
                t("host-storage"),
                (
                  <DownloadBackup />
                )
              ]);
              listItems.push([
                t("csv-storage"),
                (
                  <ImportExportList />
                )
              ]);
              listItems.push([
                t("googledrive-storage"),
                (
                  <GoogleDriveBackup />
                )
              ]);
              listItems.push([
                t("pouch-couch-storage"),
                (
                  <button onClick={() => {pushInitialSync();} }>
                    {t("save")}
                  </button>
                ),
                (
                  <button onClick={() => {pullInitialSync();} }>
                    {t("restore")}
                  </button>
                ),
                (
                  <button onClick={() => {resetAllPouches();} }>
                    {t("reset")}
                  </button>
                )
              ]);
              setListItems(listItems);
          });  
      } else {
          console.error("StorageManager no es compatible con este navegador.");
      }
    };
    fetchListItems();
  }, []);


	return (
		<Box className={"save-list-container"}>
			<Title
				title={t("save-list")}
				after={
					<Box style={{ display: "flex" }} className={"list-title-actions"}>
						<TitleButtons btns={btns} />
					</Box>
				}
				back={true}
				back_action={() => selectComponent("items")}
			/>
			<List
				sx={{
					width: "calc(100% - 1px)",
					height: "calc(100vh - 52px)",
					overflow: "auto",
					borderRadius: "0px",
				}}
			>
        {listItems.map((item, index) => (
          (
            <ListItem key={index}>
              {item.map((subitem, subindex) => {
                return (
                  <ListItemText key={subindex} primary={subitem} />
                )
              })}
            </ListItem>
          ))
        )}
			</List>
		</Box>
	);
}

export default SaveList;





















