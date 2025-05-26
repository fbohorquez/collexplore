import React, { useContext } from "react";
import { Box } from "@mui/material";
import ItemList from "../ItemList";
import ItemDetail from "../ItemDetail";
import Popup from "./Popup";
import Dialog from "./Dialog";
import { AppContext } from "./../../services/context";
import { AppProviderDetail } from "./../../services/context_detail"; 
import { AppProviderPopup } from "./../../services/context_popup"; 

import {
	setMaximized,
	setDetailVisible,
	fadeVirtuoso,
} from "./../../services/helper";

function Content () {
	const { isMobile} = useContext(AppContext);

	return (
		<Box
			sx={{
				display: "flex",
				position: "relative",
				height: "100%",
			}}
		>
			<Box
				className="panel-content"
				sx={{
					overflow: "hidden",
				}}
			>
				<ItemList />
			</Box>
			<AppProviderDetail>
				<ItemDetail
					className="detail"
					onMaximize={() => setMaximized()}
					onClose={() => {
						fadeVirtuoso(500);
						setTimeout(() => {
							let event = new CustomEvent("close-detail");
							window.dispatchEvent(event);
							setTimeout(() => {setDetailVisible(false);}, 200);
						}, 10);	
					}}
					isMobile={isMobile}
				/>
			</AppProviderDetail>
			<AppProviderDetail>
				<AppProviderPopup>
					<Popup />
					<Dialog />
				</AppProviderPopup>
			</AppProviderDetail>
		</Box>
	);
}

export default Content;



































