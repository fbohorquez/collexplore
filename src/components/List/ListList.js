import React, { useState, useEffect, useContext } from "react";
import {
	Box,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Button,
	Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import db from "../../services/db";
import { AppContext } from "../../services/context";

import TypesTabs from "../layout/TypesTabs";

import { selectPopup, getTypesByID } from "../../services/helper";

import FormBuilder from "../FormBuilder";

import Title from "../layout/Title";
import TitleButtons from "../layout/TitleButtons";

// Import or define typesByID
// import typesByID from "../../services/typesByID"; // Adjust the import path as needed

function ListList() {
	const { t } = useTranslation();

	const [lists, setLists] = useState([]);

	const [ refreshLists, setRefreshLists ] = useState(false);

	const { itemListConfig, setItemListConfig } = useContext(AppContext);

	useEffect(() => {
		const fetchData = async () => {
			const data = (await db.lists.toArray()).sort((a, b) => {
				if (a.name < b.name) return -1;
				if (a.name > b.name) return 1;
				return 0;
			});
			
			const typesByID = itemListConfig.typesByID;

			const newLists = await Promise.all(
				data
					.filter(
						(list) => !list.types || list.types.length === 0 || list.types.includes(parseInt(itemListConfig.typeSelected))
					)
					.map(async (list) => {
						let image = list.image || null;
						if (true || !image) {
							image = await generateListImage(list, typesByID);
							if (image) {
								// Save the image to the list in the database for future use
								await db.lists.update(list.id, { image });
							}
						}
						return {
							id: list.id,
							name: list.name,
							items: list.items,
							count: list.items.length,
							countByType: list.items.reduce(
								(acc, id) => {
									if (typeof id === "string" && id.startsWith("list")) {
										acc["list"]++;
									} else {
										acc["item"]++;
									}
									return acc;
								},
								{ list: 0, item: 0 }
							),
							image,
						};
					})
			);

			


			setLists(newLists);
		};

		fetchData();
	}, [refreshLists, itemListConfig.typeSelected]);

	const handleDelete = (id) => {
		selectPopup({
			title: t("delete-list"),
			content: () => (
				<Box>
					<p>{t("delete-list-confirm")}</p>
				</Box>
			),
			btns: [
				{
					label: t("yes"),
					action: () => {
						selectPopup(null);
						db.lists.delete(id).then(() => {
							setLists(lists.filter((list) => list.id !== id));
						});
					},
				},
				{
					label: t("no"),
					action: () => selectPopup(null),
					variant: "outlined",
				},
			],
		});
	};

	const { selectComponent } = useContext(AppContext);
	
	const btns = [
		{
			label: t("new"),
			action: () => {
				setData({
					name: "",
					items: [],
				});
			},
			key: "alt_n",
		},
	];

	const [data, setData] = useState(null);

	useEffect(() => {
		if (!data) {
			return;
		}
		if (data.id) {
			newEditList(t("edit-list"));
		} else {
			newEditList(t("new-list"));
		}
	}, [data]);

	const newEditList = function (title) {
		const fieldFormDefinitionInit = {
			ondemand: false,
			reference: true,
			def: [
				{
					id: "name",
					label: t("name"),
					type: "text",
					required: true,
					selectOnFocus: true,
					autoFocus: true,
				},
				{
					id: "internal",
					label: t("internal"),
					type: "checkbox",
					default: false,
				},
				{
					id: "types",
					label: t("types"),
					type: "tags",
					options: Object.values(itemListConfig.typesByID).map((type) => ({
						id: type.id,
						label: type.name,
					})),
					multiple: true,
					force: true,
					rel: true,

				}
			],
		};
		selectPopup({
			title: title,
			content: () => (
				<FormBuilder definition={fieldFormDefinitionInit} reference={data} />
			),
			btns: [
				{
					label: t("save"),
					action: () => {
						if (!data.id) {
							data.order = lists.length;
							db.lists.add(data).then((id) => {
								data.id = id;
								setRefreshLists(!refreshLists);
								selectPopup(null);
							});
						} else {
							db.lists.update(data.id, data).then(() => {
								setRefreshLists(!refreshLists);
								selectPopup(null);
							});
						}
					},
				},
				{
					label: t("cancel"),
					action: () => {
						selectPopup(null);
					},
					variant: "outlined",
				},
			],
		});
	};

	return (
		<Box className={"list-list-container"}>
			<Title
				title={t("lists")}
				back={true}
				after={
					<Box style={{ display: "flex" }} className={"list-title-actions"}>
						<TitleButtons btns={btns} />
					</Box>
				}
				back_action={() => selectComponent("items")}
			/>
			<TypesTabs/>
			<List
				sx={{
					width: "calc(100% - 1px)",
					height: "calc(100vh - 52px)",
					overflow: "auto",
					bgcolor: "background.paper",
					borderRadius: "0px",
					margin: "0px",
					padding: "0px",
				}}
			>
				{lists.map((list) => (
					<ListItem
						key={list.id}
						className="list-list-item"
						onClick={(e) => {
							selectComponent("items");
							setItemListConfig({ ...itemListConfig, listSelected: list });
						}}
					>
						{list.image && (
							<ListItemIcon style={{ minWidth: "38px" }} className="list-image">
								<img src={list.image} alt={list.name} />
							</ListItemIcon>
						)}
						<ListItemText primary={list.name} className="list-name" />
						<ListItemText
							primary={`${list.countByType.item}/${list.count}`}
							style={{ maxWidth: "60px", minWidth: "60px" }}
						/>
						<ListItemText
							className="list-actions"
							style={{ minWidth: "60px", maxWidth: "60px", display: "flex" }}
							primaryTypographyProps={{ style: { display: "flex" } }}
						>
							<Tooltip title={t("edit-list")}>
								<EditIcon
									onClick={(e) => {
										e.stopPropagation();
										e.preventDefault();
										db.lists.get(list.id).then((data) => {
											setData(data);
										});
									}}
								/>
							</Tooltip>
							<Tooltip title={t("delete-list")}>
								<Button
									style={{ minWidth: "auto", padding: "0px" }}
									onClick={(e) => {
										e.stopPropagation();
										e.preventDefault();
										handleDelete(list.id);
									}}
								>
									<DeleteIcon />
								</Button>
							</Tooltip>
						</ListItemText>
					</ListItem>
				))}
			</List>
		</Box>
	);
}

export default ListList;

// Helper function to generate composite image
async function generateListImage(list, typesByID) {
	try {
		const itemsWithImages = [];

		for (const id of list.items) {
			let item;
			if (typeof id === "string" && id.startsWith("lists-")) {
				item = await db["lists-items"].get(parseInt(id.slice(6)));
			} else {
				item = await db.items.get(id);
			}

			if (item) {
				const type = item.type;
				const typeInfo = typesByID[type];
				if (typeInfo && typeInfo.fields) {
					const imgField = typeInfo.fields.find(
						(field) => field.type === "image" && field.main
					);
					if (imgField) {
						const imageBlob = item.fields[imgField.id];
						if (imageBlob) {
							itemsWithImages.push(imageBlob);
							if (itemsWithImages.length >= 9) break;
						}
					}
				}
			}
		}

		if (itemsWithImages.length === 0) {
			// No images to generate composite
			return null;
		}

		// Create a canvas to compose images
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		// Define the aspect ratio of a DVD cover
		const dvdAspectRatio = 184 / 129; // Height / Width ≈ 1.426
		let cols = 3;
		let rows = 3;
		if (itemsWithImages.length < 9) {
			cols = 2;
			rows = 2;
		}
		else if (itemsWithImages.length < 4) {
			cols = 1;
			rows = 1;
		}

		// Define canvas dimensions to match DVD cover proportions
		const cellWidth = 200; // You can adjust this value
		const cellHeight = cellWidth * dvdAspectRatio; // Adjust cell height based on aspect ratio

		canvas.width = cellWidth * cols;
		canvas.height = cellHeight * rows;

		// Load images and draw them on the canvas
		for (let i = 0; i < itemsWithImages.length; i++) {
			const imgBlob = itemsWithImages[i];
			const img = await blobToImage(imgBlob);
			const col = i % cols;
			const row = Math.floor(i / cols);

			// Calculate the position and size on the canvas
			const x = col * cellWidth;
			const y = row * cellHeight;

			// Draw the image onto the canvas, resizing and cropping as necessary
			drawImageCover(ctx, img, x, y, cellWidth, cellHeight);
		}

		// Convert canvas to data URL
		const dataURL = canvas.toDataURL();
		return dataURL;
	} catch (error) {
		console.error(error);
		return null;
	}
}

// Helper function to convert Blob to Image
function blobToImage(blob) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(blob);
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			reject(e);
		};
		img.src = url;
	});
}

// Helper function to draw image covering the specified area without distortion
function drawImageCover(ctx, img, x, y, width, height) {
	// Calculate aspect ratios
	const imgAspectRatio = img.height / img.width;
	const cellAspectRatio = height / width;

	let drawWidth, drawHeight, offsetX, offsetY;

	if (imgAspectRatio > cellAspectRatio) {
		// Image is taller than the cell, crop top and bottom
		drawWidth = width;
		drawHeight = width * imgAspectRatio;
		offsetX = x;
		offsetY = y - (drawHeight - height) / 2;
	} else {
		// Image is wider than the cell, crop sides
		drawWidth = height / imgAspectRatio;
		drawHeight = height;
		offsetX = x - (drawWidth - width) / 2;
		offsetY = y;
	}

	ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}





















