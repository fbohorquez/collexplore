// context_popup.js
import React, { createContext, useState, useEffect } from "react";

const AppContextPopup = createContext();


function AppProviderPopup({ children }) {

	// const [activePopup, setActivePopup] = useState(null);
	const [updatePopup, setUpdatePopup] = useState(false);
	const [popupStack, setPopupStack] = useState([]);

	const setActivePopup = (popup) => {
		if (popup) {
			setPopupStack((prevStack) => [...prevStack, popup]);
		} else {
			setPopupStack((prevStack) => prevStack.slice(0, -1));
		}
		
	};

	const removePopup = () => {
		setPopupStack((prevStack) => prevStack.slice(0, -1));
	}

  useEffect(() => {
		const handleSelectPopup = (event) => {
			const { popup } = event.detail;
			setActivePopup(popup);
		};

		const handleUpdatePopup = (event) => {
			setUpdatePopup((old) => !old);
		}
		
		window.addEventListener("selectPopup", handleSelectPopup);
		window.addEventListener("updatePopup", handleUpdatePopup);

		return () => {
			window.removeEventListener("selectPopup", handleSelectPopup);
			window.removeEventListener("updatePopup", handleUpdatePopup);
		};
	}, []);

	return (
		<AppContextPopup.Provider
			value={{
				popupStack, // Component to render as a popup {title: "Title", content: <Component />, btns: [{label: "label", action: ()=>{}}]}
				setActivePopup, // Function to set the popup
				updatePopup, // Boolean to force update
				setUpdatePopup, // Function to force update
				removePopup, // Function to remove
			}}
		>
			{children}
		</AppContextPopup.Provider>
	);
}



export { AppContextPopup, AppProviderPopup };










