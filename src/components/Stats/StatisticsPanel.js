import React, { useState, useEffect } from "react";
import { Box, Button, Modal, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
// Librería de grid layout, p.ej. react-grid-layout
import RGL, { WidthProvider } from "react-grid-layout";

import db from "../services/db"; // O tu wrapper DB
import Config from "../services/config";

import ChartComponent from "./ChartComponent";

const ReactGridLayout = WidthProvider(RGL);

export default function StatisticsPanel({
	typeSelected,
	listSelected,
	isOpen,
	onClose,
	currentGrouping, // si queremos que se use o no
}) {
	const [layoutConfig, setLayoutConfig] = useState(null);

	useEffect(() => {
		// 1. Cargar config de la base
		let key = `statsPanel:${typeSelected}`;
		if (listSelected) {
			key += `:${listSelected.id}`;
		}
		Config.get(key, null).then((cfg) => {
			if (!cfg) {
				// Si no hay config, creamos una por defecto
				const defaultCfg = {
					version: 1,
					gridLayout: {
						cols: 12,
						rowHeight: 30,
						margin: [10, 10],
						items: [],
					},
				};
				setLayoutConfig(defaultCfg);
			} else {
				setLayoutConfig(cfg);
			}
		});
	}, [typeSelected, listSelected]);

	const handleLayoutChange = (newLayout) => {
		if (!layoutConfig) return;
		// Actualizar la parte de items con su nueva (x,y,w,h)
		const updatedItems = layoutConfig.gridLayout.items.map((item) => {
			const l = newLayout.find((l) => l.i === item.id);
			if (l) {
				return {
					...item,
					x: l.x,
					y: l.y,
					w: l.w,
					h: l.h,
				};
			}
			return item;
		});
		const newConfig = {
			...layoutConfig,
			gridLayout: {
				...layoutConfig.gridLayout,
				items: updatedItems,
			},
		};
		setLayoutConfig(newConfig);
		// Persistimos:
		let key = `statsPanel:${typeSelected}`;
		if (listSelected) {
			key += `:${listSelected.id}`;
		}
		Config.set(key, newConfig);
	};

	const addNewComponent = () => {
		// Abre un formulario o un modal para configurar la Query + Visualización
		// Por simplificar, generamos un dummy:
		const newItem = {
			id: `component-${Date.now()}`,
			x: 0,
			y: 0,
			w: 3,
			h: 3,
			type: "KpiNumber",
			config: {
				title: "Nuevo KPI",
				query: { base: { type: "items" } },
				ignoreGrouping: false,
			},
		};
		const newConfig = {
			...layoutConfig,
			gridLayout: {
				...layoutConfig.gridLayout,
				items: [...layoutConfig.gridLayout.items, newItem],
			},
		};
		setLayoutConfig(newConfig);
		// Persistimos en DB
		let key = `statsPanel:${typeSelected}`;
		if (listSelected) {
			key += `:${listSelected.id}`;
		}
		Config.set(key, newConfig);
	};

	if (!layoutConfig) return null;

	const layout = layoutConfig.gridLayout.items.map((item) => ({
		i: item.id,
		x: item.x,
		y: item.y,
		w: item.w,
		h: item.h,
	}));

	return (
		<Modal open={isOpen} onClose={onClose}>
			<Box
				sx={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					bgcolor: "background.paper",
					p: 2,
					overflow: "auto",
				}}
			>
				<IconButton onClick={addNewComponent}>
					<AddIcon />
				</IconButton>

				<ReactGridLayout
					className="layout"
					layout={layout}
					cols={layoutConfig.gridLayout.cols}
					rowHeight={layoutConfig.gridLayout.rowHeight}
					margin={layoutConfig.gridLayout.margin}
					onLayoutChange={handleLayoutChange}
					style={{ background: "#f7f7f7" }}
				>
					{layoutConfig.gridLayout.items.map((item) => {
						return (
							<div key={item.id} style={{ border: "1px solid #ccc" }}>
								<ChartComponent
									type={item.type}
									config={item.config}
									currentGrouping={currentGrouping}
								/>
							</div>
						);
					})}
				</ReactGridLayout>
			</Box>
		</Modal>
	);
}

