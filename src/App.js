
import './App.css';

import React, { useContext, useMemo } from "react";
import './services/i18n';
import { Box, CssBaseline } from "@mui/material";
import { theme, ThemeProvider } from './services/theme';
import {
	refreshCacheEntityType,
	cleanEntitiesWithoutRelations,
	processImages,
	processImagesToBase64,
	deleteDuplicateInLists,
} from "./services/helper";
import NavigationMenu from './components/layout/NavigationMenu';
import Content from "./components/layout/Content";
import { AppContext } from "./services/context";

import {initDB} from "./services/init_db";
import Config from "./services/config";
import Search from "./services/search";
// import GoogleDrive from "./services/googleDrive";


if (process.env.NODE_ENV === "development") {
	// const whyDidYouRender = require("@welldone-software/why-did-you-render");
	// whyDidYouRender(React, {
	// 	trackAllPureComponents: true,
	// 	trackHooks: true,
	// });

	let originalError = console.error;
	console.error = function (message) {
		if (message.indexOf && message.indexOf("Warning:") === 0) {
			return;
		}
		originalError.apply(console, arguments);
	};
}

function App() {
	const { isMobile, selectComponent, activeComponent } = useContext(AppContext);
  refreshCacheEntityType();
	// Search.init();

	const isIOS = useMemo(() => {
		return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	}, []);
	
	React.useEffect(() => {
		const initializeApp = async () => {
			try  {
				// deleteDuplicateInLists();
				// cleanEntitiesWithoutRelations();
				if (isIOS) {
					console.log("isIOS");
					// processImagesToBase64();
				}
				// await processImages();
				await initDB();
				await Search.init();
				await Config.initConfigCache();
				// const googleDrive = new GoogleDrive();
				// googleDrive.downloadBackup();
				const initialComponent =
					Config.getFromCache("initial-component") || "items";
				if (!activeComponent) selectComponent(initialComponent);
				const clickOutType = (e) => {
					if (!e.target.closest(".list-table-tabs-container")) {
						const container = document.querySelector(".list-table-tabs-container");
						if (container) container.classList.remove("open");
					}
				};
				document.body.removeEventListener("click", clickOutType);
				document.body.addEventListener("click", clickOutType);
			} catch (error) {
				console.error(error);
			}
		};

		initializeApp();
	}, []);

	const handleKeyDown = React.useCallback((e) => {
		//esc
		if (e.key === "Escape") {
			document.querySelector(".btn-popup-0")?.click();
			document.querySelector(".btn-popup-cancel")?.click();
			if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
				
				
			}
		}
		//enter
		if (e.key === "Enter") {
			//if e.target not closet with .MuiAutocomplete-root
			if (!e.target.closest(".MuiAutocomplete-root")) {
				if (e.target.classList.contains("MuiMenuItem-root")) {
					e.target.click();
				} else {
					document.querySelector(".btn-popup-0")?.click();
				}	
			}
		}
		//alt + ...
		if (e.altKey) {
			let base = document.querySelector("[data-key='alt_" + e.key + "']");
			if (base) {
				let input = base.querySelector("input");
				if (input) {
					input.focus();
					input.select();
				}else {
					base.click();
				}
			}
			e.preventDefault(); 
			e.stopPropagation(); 
		}
	}, []);

	React.useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

  return (
		<ThemeProvider theme={theme}>
			<Box sx={{ display: "flex", height: "100vh" }}
				className={`app-container ${isMobile ? "mobile" : ""}`}
			>
				<CssBaseline />
				<Box
					className="content-container"
					sx={{
						height: "100vh",
						overflow: "hidden",
					}}
				>
					{/* <SearchBar /> */}
					<Content  />
					{/* <FloatingMenu /> */}
				</Box>
			</Box>
		</ThemeProvider>
	);
}

























































export default App;