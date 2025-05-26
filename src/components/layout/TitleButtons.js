import React from "react";

import { Box, Button, Tooltip } from "@mui/material";

function TitleButtons({ btns }) {
	return (
		<Box
			sx={{
				justifyContent: "space-between",
				alignItems: "center",
				borderBottom: "1px solid #ccc",
				p: 1,
				bgcolor: "background.paper",
			}}
			className="title-buttons"
		>
			{btns.map((btn, index) => (
				<Tooltip title={((btn.icon && (btn.label + ": ")) || "") + (btn.key && btn.key.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("+"))}>
					<Button
						onClick={btn.action}
						variant="contained"
						color="primary"
						data-key={btn.key}
						style={{ padding: "4px", minWidth: "initial", marginLeft: "4px" }}

					>
						
						{btn.icon || btn.label}
					</Button>
				</Tooltip>
			))}
		</Box>
	);
}

export default TitleButtons;

