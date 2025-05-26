import React, { useState, useEffect } from "react";
import { Paper, Typography, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";

const StatusBar = ({
	scrollRef = null,
}) => {
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

		window.addEventListener("openStatusBar", handleOpen);
		window.addEventListener("editStatusBar", handleEdit);
		window.addEventListener("closeStatusBar", handleClose);

		return () => {
			window.removeEventListener("openStatusBar", handleOpen);
			window.removeEventListener("editStatusBar", handleEdit);
			window.removeEventListener("closeStatusBar", handleClose);
		};
	}, []);

	if (!open) return null;

	return (
		<Box className="status-bar">
      {/* {typeof content === "string" ? (
        <Typography variant="body1"
          dangerouslySetInnerHTML={{ __html: content }}
        ></Typography>
      ) : (
        content
      )} */}
			<div className="status-bar-to-up">
				<KeyboardDoubleArrowUpIcon 
					onClick={() => {
						scrollRef.current.scrollToIndex(0, { align: "start" });
					}}
				/>
			</div>
    </Box>
  );
};

export default StatusBar;


