// Popup.js
import React, { useContext } from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from "@mui/material";
import { AppContextPopup } from "./../../services/context_popup";

function Popup() {
	const { popupStack, removePopup } = useContext(AppContextPopup);

	const handleClose = (index) => {
		if (popupStack.length > 0) {
			const activePopup = popupStack[index];
			if (activePopup?.onClose) {
				activePopup.onClose();
			}
			removePopup();
		}
	};

	return (
		<>
			{popupStack.map((popup, index) => (
				<Dialog
					key={index}
					open={true}
					onClose={() => handleClose(index)}
					aria-labelledby="alert-dialog-title"
					aria-describedby="alert-dialog-description"
					className={`popup popup-${index} ${popup.className}`}
				>
					<DialogTitle id="alert-dialog-title">{popup.title}</DialogTitle>
					<DialogContent>
						<DialogContentText id="alert-dialog-description">
							{typeof popup.content === "function" ? (
								<popup.content />
							) : (
								popup.content
							)}
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						{popup.btns.map((btn, btnIndex) => {
							return (
								<Button
									key={btnIndex}
									onClick={btn.action}
									color={btn.color || "primary"}
									variant={btn.variant || "contained"}
									className={
										btn.overrideClass
											? btn.overrideClass
											: `btn-popup btn-popup-${btnIndex} ${btn.className}`
									}
								>
									{btn.label}
								</Button>
							);
						})}
					</DialogActions>
				</Dialog>
			))}
		</>
	);
}

export default Popup;

