import React from "react";
import {
	Box,
	Fab,
	IconButton,
	Zoom,
	Typography,
	styled,
	ClickAwayListener,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddCircleIcon from "@mui/icons-material/AddCircle";

import { useTranslation } from "react-i18next";

function FloatingMenu() {
	const [open, setOpen] = React.useState(false);

  const { t } = useTranslation();

	const toggleMenu = () => {
		setOpen(!open);
	};

	const handleClose = (event) => {
		if (
			event.type === "keydown" &&
			(event.key === "Tab" || event.key === "Shift")
		) {
			return;
		}
		setOpen(false);
	};

  const MenuBox = styled(Box)(({ theme }) => ({
		position: "fixed",
		bottom: 16,
		right: 16,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		"&::after": {
			content: '""',
			position: "absolute",
			bottom: "61px",
			right: "12px",
			width: "0",
			height: "0",
			borderLeft: "15px solid transparent",
			borderRight: "15px solid transparent",
			borderTop: "20px solid #ccc",
      visibility: open ? "visible" : "hidden",
      transition: "visibility 0s, opacity 0.5s linear",
		},
	}));

	return (
		<ClickAwayListener onClickAway={handleClose}>
			<MenuBox>
				<Zoom
					style={{
						width: "160px",
						borderTop: "1px solid #ccc",
						borderLeft: "1px solid #ccc",
						borderRight: "1px solid #ccc",
						marginBottom: "0px",
						padding: "8px",
						transitionDelay: open ? "100ms" : "0ms",
					}}
					in={open}
				>
					<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
						<IconButton onClick={toggleMenu} style={{ borderRadius: 0, width: '100%' }}>
							<NoteAddIcon />
							<Typography variant="body2" sx={{ marginLeft: 1 }}>
								{t('new-item')}
							</Typography>
						</IconButton>
					</Box>
				</Zoom>
				<Zoom
					in={open}
					style={{
						width: "160px",
						borderTop: "1px solid #ccc",
						borderLeft: "1px solid #ccc",
						borderRight: "1px solid #ccc",
						marginBottom: "0px",
						transitionDelay: open ? "50ms" : "0ms",
						padding: "8px",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
						<IconButton onClick={toggleMenu} style={{ borderRadius: 0, width: '100%' }}>
							<PlaylistAddIcon />
							<Typography variant="body2" sx={{ marginLeft: 1 }}>
								{t('new-list')}
							</Typography>
						</IconButton>
					</Box>
				</Zoom>
				<Zoom
					in={open}
					style={{
						width: "160px",
						borderTop: "1px solid #ccc",
						borderLeft: "1px solid #ccc",
						borderRight: "1px solid #ccc",
						borderBottom: "1px solid #ccc",
						transitionDelay: open ? "0ms" : "0ms",
						marginBottom: "0px",
						padding: "8px",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
						<IconButton onClick={toggleMenu} style={{ borderRadius: 0, width: '100%' }}>
							<AddCircleIcon />
							<Typography variant="body2" sx={{ marginLeft: 1 }}>
								{t('new-type')}
							</Typography>
						</IconButton>
					</Box>
				</Zoom>
				<Fab
					style={{ marginTop: "25px",marginLeft: 'auto', transitionDelay: open ? "0ms" : "0ms" }}
					color="primary"
					onClick={toggleMenu}
				>
					<AddIcon />
				</Fab>
			</MenuBox>
		</ClickAwayListener>
	);
}

export default FloatingMenu;




















