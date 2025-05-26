import React, { useContext } from "react";
import { Card, CardContent, IconButton, Box, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { AppContextDetail } from "./../services/context_detail";

function ItemDetail({ width, onMaximize, onClose, isMobile }) {

	const { activeDetail } = useContext(AppContextDetail);
	const Component = activeDetail;

	return (
		
		<Card 
			className="panel-detail"
			sx={{ 
      borderRadius: "0px",
    }}>
			<CardContent>
				{ 
					!isMobile && 
					<Tooltip title="Alt+M">
						<IconButton
							onClick={onMaximize}
							sx={{ position: "absolute", right: "50px", top: "8px", zIndex: 999 }}
							data-key="alt_m"
						>
							<FullscreenIcon />
						</IconButton> 
					</Tooltip>
				}
				<Tooltip title="Alt+C">
					<IconButton
						onClick={onClose}
						className="close-detail-btn"
						data-key="ctrl_c"
						sx={{ position: "absolute", right: "8px", top: "8px", zIndex: 999 }}
					>
						<CloseIcon />
					</IconButton>
				</Tooltip>
				<Box style={{height:'10px'}}>
					{Component ? <Component /> : <div></div>}
				</Box>
				
			</CardContent>
		</Card>
	);
}

export default ItemDetail;












