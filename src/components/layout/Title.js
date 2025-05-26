import React from "react";

import { Typography, Box } from "@mui/material";

import MainMenu from "./MainMenu";

import BackButton from "./BackButton";


function Title({ title, subtitle, after, before, back = false, back_action = null }) {
	return (
		<Box
			className="header-list-title"
			sx={{
				bgcolor: "background.paper",
			}}
		>
			<Box sx={{ display: "flex", paddingLeft: 2, width: "25%" }} className="header-list-title-before">
				<MainMenu />
				{before}
			</Box>
			<Typography variant="h6" component="div" sx={{ marginTop: "-10px", width: "50%", textAlign: "center" }} className="header-list-title-title">
				<Box sx={{ display: "flex", alignItems: "center", marginLeft: "auto", marginRight: "auto", width: "fit-content" }} className="header-list-title-center">
					{back ? (
						<BackButton style={{ padding: 0 }} onClick={back_action} />
					) : null}
					<Box 
						className="list-title"
						sx={{  }}>{title}</Box>
					{subtitle}
				</Box>
			</Typography>
			<Box sx={{ width: "25%", display: "flex", justifyContent: "flex-end" }} className="header-list-title-after">
				{after}
			</Box>
		</Box>
	);
}




export default Title;