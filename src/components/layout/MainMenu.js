// Icon MainMenu and elements
import React, { useState, useEffect, useContext } from "react";
import { Typography, Box, Menu, MenuItem, IconButton } from "@mui/material";
import MainMenuIcon from "@mui/icons-material/Menu";
import { useTranslation } from "react-i18next";
import { AppContext } from "../../services/context";
import { setSelectedItemId, fadeVirtuoso } from "../../services/helper";
import Config from "../../services/config";
import logoDefault from "./../../assets/logo.png";

import SaveIcon from "@mui/icons-material/Save";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import CategoryIcon from "@mui/icons-material/Category";
import WebhookIcon from "@mui/icons-material/Webhook";

function MainMenu() {
	const [anchorEl, setAnchorEl] = useState(null);
  const [collectionImg, setCollectionImg] = useState(null);
  const [isCollectionImgVisible, setIsCollectionImgVisible] = useState(false);
  const [logo, setLogo] = useState(null);
	// const [isGoogleDriveEnabled, setIsGoogleDriveEnabled] = useState(false);
	const [isServerScraping, setIsServerScraping] = useState(false);

  const { t } = useTranslation();

	const handleClick = (event) => {
		console.log("handleClick");
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

  const { config, trigger, selectComponent,
    // setListSelected,
    // setFilterItems,
    setSearchFuzzyValue,
    // setSearchAdvancedValue,
		itemListConfig,
		resetListGrid,
		setItemListConfig
   } = useContext(AppContext);

	useEffect(() => {
		async function fetchSetting() {
			const collectionImg = await config.get("collection-img");
			if (collectionImg) {
				let url = URL.createObjectURL(collectionImg);
				setCollectionImg(url);
			} else {
				setLogo(logoDefault);
			}
			setIsCollectionImgVisible(await config.get("collection-img-visible"));
		}
		fetchSetting();
	}, [config, trigger]); 


	useEffect(() => {
		// const isGoogleDriveEnabled = Config.getFromCache("module_googledrive");
		// setIsGoogleDriveEnabled(isGoogleDriveEnabled);

		const isServerScraping = Config.getFromCache("module_server_scraping");
		setIsServerScraping(isServerScraping);

		const handleUpdatingTableConfig = async (e) => {
			const { modifications, obj } = e.detail;
			if (modifications) {
				const { value } = modifications;
				const { key } = obj;
				// if (key === "module_googledrive") {
				// 	setIsGoogleDriveEnabled(value);
				// }
				if (key === "module_server_scraping") {
					setIsServerScraping(value);
				}
			}else {
				const { key, value } = obj;
				// if (key === "module_googledrive") {
				// 	setIsGoogleDriveEnabled(value);
				// }
				if (key === "module_server_scraping") {
					setIsServerScraping(value);
				}
			}
		};

		window.addEventListener("creating-table-config", handleUpdatingTableConfig);
		window.addEventListener("updating-table-config", handleUpdatingTableConfig);
	}, []);


	return (
		<Box style={{ cursor: "pointer" }} onMouseLeave={handleClose}>
			<IconButton
				onClick={handleClick}
				className="main-menu-button"
				onMouseEnter={handleClick}
			>
				<MainMenuIcon />
			</IconButton>
			<Menu
				className={"main-menu"}
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleClose}
				style={{ border: "1px solid #000" }}
				onMouseLeave={handleClose}
				disablePortal // Desactiva el portal para que se renderice en el flujo del DOM
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				MenuListProps={{
					onMouseLeave: handleClose,
				}}
			>
				{(logo || collectionImg) && isCollectionImgVisible && (
					<img
						src={collectionImg || logo}
						alt="Logo"
						onClick={async () => {
							resetListGrid();
							handleClose();
						}}
						style={{
							width: "240px",
							height: "auto",
							padding: "15px 40px",
							borderBottom: "1px solid #e0e0e0",
							cursor: "pointer",
						}}
					/>
				)}
				<MenuItem onClick={() => selectComponent("types")}>
					<CategoryIcon style={{ marginRight: "10px" }} />
					<Typography variant="inherit">{t("item-types")} </Typography>
				</MenuItem>
				<MenuItem onClick={() => selectComponent("config-editor")}>
					<SettingsApplicationsIcon style={{ marginRight: "10px" }} />
					<Typography variant="inherit">{t("config-editor")} </Typography>
				</MenuItem>
				{/* <MenuItem onClick={() => selectComponent("import-export")}>
					<ImportExportIcon style={{ marginRight: "10px" }} />
					<Typography variant="inherit">{t("import-export")} </Typography>
				</MenuItem> */}
				{isServerScraping ? (
					<MenuItem
						onClick={() => {
							selectComponent("scraping");
							handleClose();
						}}
					>
						<WebhookIcon style={{ marginRight: "10px" }} />
						<Typography variant="inherit">{t("scraping-process")} </Typography>
					</MenuItem>
				) : null}
				{/* {isGoogleDriveEnabled ? (
					<MenuItem
						onClick={async () => {
							const { default: GoogleDrive } = await import(
								"../../services/googleDrive"
							);
							const googleDrive = new GoogleDrive();
							googleDrive.uploadBackup();
						}}
					>
						<SaveIcon style={{ marginRight: "10px" }} />
						<Typography variant="inherit">{t("save")} </Typography>
					</MenuItem>
				) : null} */}
				<MenuItem
					onClick={() => {
						selectComponent("save");
						handleClose();
					}}
				>
					<SaveIcon style={{ marginRight: "10px" }} />
					<Typography variant="inherit">{t("save-list")} </Typography>
				</MenuItem>
			</Menu>
		</Box>
	);
}

export default MainMenu;

























































