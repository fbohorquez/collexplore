import React, { createContext, useState, useEffect } from "react";
import ItemDetail from "./../components/Item/ItemDetail";
import ItemTypeDetail from "./../components/ItemType/ItemTypeDetail";
import SourceDetail from "./../components/Source/SourceDetail";
import EntityTypeDetail from "./../components/EntityType/EntityTypeDetail";
import ConfigEditorDetail from "./../components/ConfigEditor/ConfigEditorDetail";
import ImportExportDetail from "../components/Save/SaveTypes/ImportExportDetail";
import ScrapingDetail from "./../components/Scraping/ScrapingDetail";
import ScrapingObjectDetail from "./../components/ScrapingObject/ScrapingObjectDetail";
import Config from "./config";


import {
	setMaximized,
	setDetailVisible,
	setSelectedItemId,
} from "./../services/helper";

const AppContextDetail = createContext();

const detailMap = {
	types: ItemTypeDetail,
	items: ItemDetail,
	"entity-types": EntityTypeDetail,
	"config-editor": ConfigEditorDetail,
	"import-export": ImportExportDetail,
	sources: SourceDetail,
	scraping: ScrapingDetail,
	"scraping-object": ScrapingObjectDetail,
};

function AppProviderDetail({ children }) {
	const [activeDetail, setActiveDetail] = useState(null);
	const [selectedItem, setSelectedItem] = useState(null);
	const [additionalData, setAdditionalData] = useState(null);
	
	const [config] = useState(Config.me());

	useEffect(() => {
		const handleSelectDetail = (event) => {
			const { menu, item, additionalData } = event.detail;
			selectDetail(menu, item, additionalData);
		};

		window.addEventListener("selectDetail", handleSelectDetail);

		return () => {
			window.removeEventListener("selectDetail", handleSelectDetail);
		};
	}, []);

	const selectDetail = async (menu, item, additionalData) => {
		if (!menu) {
			setActiveDetail(null);
			setDetailVisible(false);
			setSelectedItemId(null);
			setSelectedItem(null);
			return;
		}
		const Component = detailMap[menu] || null;
		setActiveDetail(() => Component);
		setSelectedItem(item);
		setSelectedItemId(item?.id);
		setDetailVisible(true);
		setAdditionalData(additionalData);
		let max = await config.get("maximized");
		if (document.querySelectorAll(".app-container.mobile").length > 0) {
			max = "allways";
		}
		switch (max) {
			case "allways":
				setMaximized(true);
				break;
			case "never":
				setMaximized(false);
				break;
			default:
				break;
		}
	};

	return (
		<AppContextDetail.Provider
			value={{
				activeDetail,
				selectDetail,
				additionalData,
				selectedItem,
				setSelectedItem,
			}}
		>
			{children}
		</AppContextDetail.Provider>
	);
}













export { AppContextDetail, AppProviderDetail };