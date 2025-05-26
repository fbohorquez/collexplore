import React, { createContext, useState, useEffect } from "react";
import ItemList from "../components/Item/ItemList";
import ItemTypeList from "./../components/ItemType/ItemTypeList";
import EntityTypeList from "./../components/EntityType/EntityTypeList";
import ConfigEditorList from "./../components/ConfigEditor/ConfigEditorList";
import ImportExportList from "../components/Save/SaveTypes/ImportExportList";
import SourceList from "./../components/Source/SourceList";
import SaveList from "./../components/Save/SaveList";
import ScrapingList from "./../components/Scraping/ScrapingList";
import ScrapingObjectList from "./../components/ScrapingObject/ScrapingObjectList";
import ListList from "./../components/List/ListList";

import Config from "./config";
import db from "./db";
import { selectDetail, getInitItemListConfig } from "./helper";
import {useMediaQuery } from "@mui/material";
import { theme } from "./theme";

import {
	setMenuVisible,
	setDetailVisible,
	fadeVirtuoso,
	setSelectedItemId,
} from "./../services/helper";

const AppContext = createContext();

const listMap = {
	"types": ItemTypeList,
	"items": ItemList,
	"config-editor": ConfigEditorList,
	"import-export": ImportExportList,
	"entity-types": EntityTypeList,
	"sources": SourceList,
	"scraping": ScrapingList,
	"lists": ListList,
	"scrapping-object": ScrapingObjectList,
	"save": SaveList,
};

function AppProvider({ children }) {
	const [activeComponent, setActiveComponent] = useState(null);
	const [searchFuzzyValue, setSearchFuzzyValue] = useState("");
	const [activeList, setActiveList] = useState(null);
	const [config] = useState(Config.me());
	const [trigger, setTrigger] = useState(false);
	const [isMobile] = useState(useMediaQuery(theme.breakpoints.down("sm")));
	const [isCollapseMenu, setIsCollapseMenu] = useState(false);
	const [globalTextValidate, setGlobalTextValidate] = useState({});
	const [updateComponent, setUpdateComponent] = useState(false);
	const [updateRow, setUpdateRow] = useState(false);
	const [disableAutoFocus, setDisableAutoFocus] = useState(false);

	const [itemListConfig, setItemListConfig] = useState(getInitItemListConfig());

	const setListSelected = (list) => {
		setItemListConfig((old) => {
			return {
				...old,
				listSelected: list,
			};
		});
		if (list) {
			document.body.dataset.list = list.id;
		}else {
			document.body.dataset.list = "";
		}
	}

	useEffect(() => {
		const handleUpdate = () => {
			setTrigger((old) => !old);
			async function fetchSetting() {
				setIsCollapseMenu(await config.get("is-collapse-menu"));
			}
			fetchSetting();
		};
		config.onUpdate(handleUpdate);
		return () => config.removeListener("updated", handleUpdate);
	}, [config]);


	useEffect(() => {
		if (!isMobile) {
			setMenuVisible(true);
		}
	}, [isMobile]); 


	const selectComponent = (menu) => {
		const Component = listMap[menu] || null;
		setActiveComponent(() => Component);
    setDetailVisible(false);
		if (isMobile) {
			setMenuVisible(false);
		}
		selectDetail(null, null);
	};

	const resetListGrid = () => {
		fadeVirtuoso();
		setSearchFuzzyValue("");
		setItemListConfig(getInitItemListConfig());

		setSelectedItemId(null);
		window.ModeExplorer = false;
		selectComponent("items");
		setTimeout(() => {
			window.dispatchEvent(new CustomEvent("resetList"));
		}, 100);
		let event = new CustomEvent("close-detail", {
			detail: {
				scrollToTop: true,
			},
		});
		window.dispatchEvent(event);
	}


	return (
		<AppContext.Provider
			value={{
				activeComponent,
				selectComponent,
				updateComponent,
				setUpdateComponent,
				config,
				trigger,
				isMobile,
				isCollapseMenu,
				setIsCollapseMenu,
				globalTextValidate,
				setGlobalTextValidate,
				setListSelected,
				updateRow,
				setUpdateRow,
				activeList,
				searchFuzzyValue,
				setSearchFuzzyValue,
				disableAutoFocus,
				setDisableAutoFocus,
				itemListConfig,
				setItemListConfig,
				resetListGrid,
			}}
		>
			{children}
		</AppContext.Provider>
	);
}

export { AppContext, AppProvider };
















































































