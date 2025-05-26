import React, { useState, useEffect, useContext } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import _ from "lodash";
import { AppContext } from "./../../services/context";
import { isMaximized } from "./../../services/helper";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DynamicGrid = ({
	layout,
	onLayoutChange,
	breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
	cols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 },
	rowHeight = 30,
	isDraggable = true,
	isResizable = true,
	layoutItemContent = {},
}) => {
	const [containerWidth, setContainerWidth] = useState(window.innerWidth);
	const { isMobile } = useContext(AppContext);

	useEffect(() => {
		const handleResize = () => {
			setContainerWidth(window.innerWidth);
		};

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const calcContainerWidth = () => {
		if (isMobile || !document.body.classList.contains("menu-visible")) {
			if (isMaximized()) return containerWidth - 80;
			return containerWidth / 2 - 80;
		} else {
			if (isMaximized()) return containerWidth - 220 - 80;
			return (containerWidth - 220) / 2 - 80;
		}
	};

	const colWidth = calcContainerWidth() / cols.sm;
	const gridStyle = {
		backgroundSize: `${colWidth}px ${rowHeight}px`,
		backgroundImage: `
            linear-gradient(to right, grey 1px, transparent 2px, transparent ${
							colWidth - 1
						}px),
            linear-gradient(to bottom, grey 1px, transparent 2px, transparent ${
							rowHeight - 1
						}px)
        `,
	};

	const generateDOM = () => {
		return _.map(layout, (l, index) => {
			return (
				<div key={l.i} data-grid={l}>
					{typeof layoutItemContent === "function"
						? layoutItemContent (l, index)
						: ''}
				</div>
			);
		});
	};

	return (
		<ResponsiveGridLayout
			className="layout"
			layouts={{ lg: layout.map((l) => ({ ...l, minW:1, minH:1 })) }}
			breakpoints={breakpoints}
			cols={cols}
			rowHeight={rowHeight}
			isDraggable={isDraggable}
			isResizable={isResizable}
			onLayoutChange={onLayoutChange}
			style={gridStyle}
			margin={[0, 0]}
			draggableHandle=".dragHandle"
		>
			{generateDOM()}
		</ResponsiveGridLayout>
	);
};

export default DynamicGrid;














