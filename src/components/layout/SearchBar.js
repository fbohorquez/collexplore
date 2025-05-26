import React, { useState, useEffect, useContext } from "react";
import { Paper, InputBase, Button, Box, Typography, Tabs, Tab, Tooltip} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

import { useTranslation } from "react-i18next";

import FormBuilder from "../FormBuilder";

import Search from "../../services/search";

import { setMenuVisible, selectPopup, updatePopup } from "../../services/helper";

import { AppContext } from "./../../services/context";

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

function CustomTabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					<Typography>{children}</Typography>
				</Box>
			)}
		</div>
	);
}

let timeoutChange = null;


function SearchBar({ typesByID = {}}) {
	const {
		isMobile,
		isCollapseMenu,
		setFilterItems,
		searchFuzzyValue,
		setSearchFuzzyValue,
		typeSelected,
		searchAdvancedValue,
		setSearchAdvancedValue,
	} = useContext(AppContext);


	const { t } = useTranslation();

	const [textValue, setTextValue] = useState(searchFuzzyValue);

	const inputRef = React.useRef(null);

	 useEffect(() => {
			const handleKeyDown = (event) => {
				if (event.altKey && event.key === "f") {
					if (inputRef.current) {
						inputRef.current.focus();
					}
				}
				if (event.key === "Escape") {
					setSearchFuzzyValue("");
					setTextValue("");
					document.activeElement.blur();
				}
			};

			// Agregar el event listener al presionar una tecla
			window.addEventListener("keydown", handleKeyDown);

			// Limpiar el listener cuando el componente se desmonte
			return () => {
				window.removeEventListener("keydown", handleKeyDown);
			};
		}, []);

	return (
		<Paper
			component="form"
			className="search-bar"
			sx={{
				p: "2px 4px",
				display: "flex",
				alignItems: "center",
				borderRadius: "0px",
				boxShadow: "none",
				height: "100%",
				position: "relative",
			}}
		>
			<InputBase
				sx={{ ml: 1, flex: 1, fontSize: "13px" }}
				inputRef={inputRef}
				value={textValue}
				autoFocus={true}
				placeholder={t("search-label")}
				inputProps={{ "aria-label": t("search-label") }}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
					}
				}}
				onChange={(e) => {
					let search_txt = e.target.value;
					setTextValue(search_txt);
					if (timeoutChange) {
						clearTimeout(timeoutChange);
					}
					timeoutChange = setTimeout(() => {
						if (typeof search_txt !== "string") {
							search_txt = "";
						} else {
							search_txt = search_txt.trim();
						}
						setSearchFuzzyValue(search_txt);
						const searchEvent = new CustomEvent("search", {
							detail: {
								txt: search_txt,
								altKey: e.altKey,
								key: e.key,
							},
						});
						window.dispatchEvent(searchEvent);
					}, 500);
				}}
				onKeyUp={(e) => {
					
					if (e.key === "Enter") {
						e.stopPropagation();
						e.preventDefault();
						if (e.altKey) {
							setTextValue("");
						}
						const searchEvent = new CustomEvent("search", {
							detail: {
								txt: e.target.value,
								altKey: e.altKey,
								key: e.key,
							},
						});
						window.dispatchEvent(searchEvent);
					}
				}}
				className="search-bar-input"
				data-key="alt_f"
			/>
			{searchFuzzyValue !== "" && (
				<Tooltip title={t("btn-clean")}>
					<Button
						hover="none"
						onClick={() => {
							setSearchFuzzyValue("");
							setTextValue("");
						}}
						sx={{
							"&:hover": {
								backgroundColor: "transparent",
								color: "#000",
							},
							p: "10px",
							position: "absolute",
							right: "12px",
							padding: "0px",
							width: "max-content",
							padding: "0",
							minWidth: "initial !important",
							display: "inline-block",
							color: "#888",
							fontSize: ".7rem",
						}}
						aria-label="search"
					>
						<CloseIcon sx={{ width: "16px", height: "16px" }} />
					</Button>
				</Tooltip>
			)}
		</Paper>
	);
}

export default SearchBar;























































