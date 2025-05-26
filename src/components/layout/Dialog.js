import React, { useState, useEffect } from "react";
import { Paper, Typography, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const Dialog = () => {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState(null);
	const [showCloseButton, setShowCloseButton] = useState(true);

	useEffect(() => {
		const handleOpen = (event) => {
			const { title, content, showCloseButton } = event.detail;
			setTitle(title || "");
			setContent(content || null);
			setShowCloseButton(
				showCloseButton !== undefined ? showCloseButton : true
			);
			setOpen(true);
		};

		const handleEdit = (event) => {
			const { title, content, showCloseButton } = event.detail;
			if (title !== undefined) setTitle(title);
			if (content !== undefined) setContent(content);
			if (showCloseButton !== undefined) setShowCloseButton(showCloseButton);
		};

		const handleClose = () => {
			setOpen(false);
		};

		window.addEventListener("openDialog", handleOpen);
		window.addEventListener("editDialog", handleEdit);
		window.addEventListener("closeDialog", handleClose);

		return () => {
			window.removeEventListener("openDialog", handleOpen);
			window.removeEventListener("editDialog", handleEdit);
			window.removeEventListener("closeDialog", handleClose);
		};
	}, []);

	if (!open) return null;

	return (
		<Paper
			elevation={6}
			sx={{
				position: "fixed",
				bottom: 16,
				right: 16,
				width: 300,
				padding: 2,
				zIndex: 1300,
			}}
      className="dialog-popup"
		>
			<Box display="flex" justifyContent="space-between" alignItems="center">
				{title && (
					<Typography variant="h6" component="div">
						{title}
					</Typography>
				)}
				{showCloseButton && (
					<IconButton size="small" onClick={() => setOpen(false)}>
						<CloseIcon />
					</IconButton>
				)}
			</Box>
			<Box>
				{typeof content === "string" ? (
					<Typography variant="body1">{content}</Typography>
				) : (
					content
				)}
			</Box>
		</Paper>
	);
};

export default Dialog;

