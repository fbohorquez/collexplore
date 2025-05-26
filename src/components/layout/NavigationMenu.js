import React, { useState, useContext, useEffect } from "react";
import {
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Collapse,
	Select,
	MenuItem,
	Box,
	ClickAwayListener,
} from "@mui/material";

import logoDefault from "./../../assets/logo.png";
import lang_icon_en from "./../../assets/us.svg";
import lang_icon_es from "./../../assets/es.svg";

import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import TranslateIcon from '@mui/icons-material/Translate';
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import EditIcon from "@mui/icons-material/Edit";
import CategoryIcon from "@mui/icons-material/Category";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import EntityIcon from "@mui/icons-material/ChromeReaderMode";
import ListIcon from "@mui/icons-material/List";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ApiIcon from "@mui/icons-material/Api";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { AppContext } from "./../../services/context";

import { setMenuVisible } from "./../../services/helper";


import { useTranslation } from "react-i18next";

function NavigationMenu() {

	

	const [openConfig, setOpenConfig] = useState(false);
	const [openList, setOpenList] = useState(true);
	const [isCollectionImgVisible, setIsCollectionImgVisible] = useState(false);
	const [collectionImg, setCollectionImg] = useState(null);
	const [logo, setLogo] = useState(null);

	const { isMobile } = useContext(AppContext);

	const width = isMobile ? "calc(100% - 68px)" : "220px";

	const { config, trigger } = useContext(AppContext);


	
	useEffect(() => {
		async function fetchSetting() {
			const collectionImg = await config.get("collection-img");
			if (collectionImg) {
				let url = URL.createObjectURL(collectionImg);
				setCollectionImg (url);
			}else{
				setLogo(logoDefault);
			}
			setIsCollectionImgVisible(await config.get("collection-img-visible"));
		}
		fetchSetting();
	}, [config, trigger]); 

	

	const {
		selectComponent,
		// setFilterItems,
		setSearchFuzzyValue,
		// setListSelected,
		// setSearchAdvancedValue,
		itemListConfig,
		setItemListConfig,
	} = useContext(AppContext);

	const handleClickConfig = () => {
		setOpenConfig(!openConfig);
		setOpenList(false);
	};

	const handleClickList = () => {
		setOpenList(!openList);
		setOpenConfig(false);
	};

	const { t, i18n } = useTranslation();
	const [language, setLanguage] = useState(i18n.language);

	const handleLanguageChange = (event) => {
		const selectedLang = event.target.value;
		setLanguage(selectedLang);
		i18n.changeLanguage(selectedLang);
	};

	const LanguageSelectValue = ({ language }) => (
		<Box sx={{ display: "flex", alignItems: "center" }}>
			<img
				src={language === "en" ? lang_icon_en : lang_icon_es}
				alt={t("language")}
				style={{ width: 18, height: "auto", marginRight: 2, marginTop: 4 }}
			/>
		</Box>
	);

	return (
		<ClickAwayListener
			onClickAway={(event) => {
				if (event.target === document.body) {
					return;
				}
				//if parents has class menu-icon, don't close the menu
				if (event.target.closest(".menu-icon")) {
					return;
				}
				isMobile && setMenuVisible(false);
			}}
		>
			<Box
				sx={{
					width: width,
					minWidth: width,
					bgcolor: "background.paper",
					borderRight: "1px solid #ccc",
				}}
			>
				{(logo || collectionImg) && isCollectionImgVisible && (
					<img
						src={collectionImg || logo}
						alt="Logo"
						style={{ width: "100%", height: "auto", padding: "15px 40px" }}
					/>
				)}

				<Box
					sx={{
						borderBottom: "1px solid #ccc",
						borderTop: "1px solid #ccc",
					}}
				>
					<List component="div" disablePadding>
						<ListItem onClick={() => selectComponent("dashboard")} button>
							<ListItemIcon style={{ minWidth: "38px" }}>
								<DashboardIcon />
							</ListItemIcon>
							<ListItemText primary={t("dashboard")} />
						</ListItem>
					</List>
					<List component="div" disablePadding>
						<ListItem
							onClick={() => {
								setSearchFuzzyValue("");
								// setListSelected(null);								
								// setSearchAdvancedValue([]);
								setItemListConfig({
									...itemListConfig,
									listSelected: null,
									searchAdvancedValue: [],
								});
								selectComponent("items");
							}}
							button
						>
							<ListItemIcon style={{ minWidth: "38px" }}>
								<CollectionsBookmarkIcon />
							</ListItemIcon>
							<ListItemText primary={t("collection")} />
						</ListItem>
					</List>
				</Box>
				<Box sx={{ borderBottom: "1px solid #ccc" }}>
					<List component="nav">
						<ListItem button onClick={handleClickConfig}>
							<ListItemIcon style={{ minWidth: "38px" }}>
								<SettingsIcon />
							</ListItemIcon>
							<ListItemText primary={t("configuration")} />
							{openConfig ? <ExpandLess /> : <ExpandMore />}
						</ListItem>
					</List>
					<Collapse
						in={openConfig}
						timeout="auto"
						unmountOnExit
						style={{ paddingLeft: "15px" }}
					>
						<List component="div" disablePadding>
							<ListItem button onClick={() => selectComponent("types")}>
								<ListItemIcon style={{ minWidth: "38px" }}>
									<CategoryIcon />
								</ListItemIcon>
								<ListItemText primary={t("item-types")} />
							</ListItem>

							<ListItem button onClick={() => selectComponent("lists-types")}>
								<ListItemIcon style={{ minWidth: "38px" }}>
									<ListAltIcon />
								</ListItemIcon>
								<ListItemText primary={t("lists-types")} />
							</ListItem>

							<ListItem button onClick={() => selectComponent("entity-types")}>
								<ListItemIcon style={{ minWidth: "38px" }}>
									<EntityIcon />
								</ListItemIcon>
								<ListItemText primary={t("entity-types")} />
							</ListItem>

							<ListItem button onClick={() => selectComponent("sources")}>
								<ListItemIcon style={{ minWidth: "38px" }}>
									<ApiIcon />
								</ListItemIcon>
								<ListItemText primary={t("sources")} />
							</ListItem>

							<ListItem button onClick={() => selectComponent("config-editor")}>
								<ListItemIcon style={{ minWidth: "38px" }}>
									<EditIcon />
								</ListItemIcon>
								<ListItemText primary={t("config-editor")} />
							</ListItem>
							<ListItem button onClick={() => selectComponent("import-export")}>
								<ListItemIcon style={{ minWidth: "38px" }}>
									<ImportExportIcon />
								</ListItemIcon>
								<ListItemText primary={t("import-export")} />
							</ListItem>
							<ListItem button onClick={() => selectComponent("account")}>
								<ListItemIcon style={{ minWidth: "38px" }}>
									<AccountCircleIcon />
								</ListItemIcon>
								<ListItemText primary={t("my-account")} />
							</ListItem>
							<ListItem button>
								<ListItemIcon style={{ minWidth: "38px" }}>
									<TranslateIcon />
								</ListItemIcon>
								<Select
									value={language}
									onChange={handleLanguageChange}
									displayEmpty
									inputProps={{ "aria-label": "Without label" }}
									renderValue={() => (
										<LanguageSelectValue language={language} />
									)}
									style={{ height: "38px" }}
									MenuProps={{
										disableEnforceFocus: true,
										disableAutoFocus: true,
										getContentAnchorEl: null,
										disableScrollLock: true, // Desactiva el bloqueo de scroll
									}}
								>
									<MenuItem value="en">
										<img
											src={lang_icon_en}
											alt="English"
											style={{ width: "18px" }}
										/>
									</MenuItem>
									<MenuItem value="es">
										<img
											src={lang_icon_es}
											alt="Español"
											style={{ width: "18px" }}
										/>
									</MenuItem>
								</Select>
							</ListItem>
						</List>
					</Collapse>
				</Box>
			</Box>
		</ClickAwayListener>
	);
}

export default NavigationMenu;














































































