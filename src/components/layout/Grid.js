import React, { useContext } from "react";
import { AppContext } from "./../../services/context";

import FormBuilder from "./../FormBuilder";



const Grid = ({
	layout,
	fields,
	reference,
	definition,
	ondemand,
	pasteRef = null,
	onSaved = () => {},
}) => {
	const { isMobile } = useContext(AppContext);

	const getFieldComponent = (id) => {
		const field = fields.find((f) => f.id === id);
		if (!field) return null;
		return (
			<FormBuilder
				reference={reference}
				definition={generateDefinition(field)}
				className={`form-${field.type}`}
				ondemand={ondemand}
				pasteRef={pasteRef}
				onSaved={onSaved}
			/>
		);
	};

	const getFieldType = (id) => {
		const field = fields.find((f) => f.id === id);
		if (!field) return null;
		return field.type;
	};

	const generateDefinition = (field) => {
		let definitionNew = { ...definition };
		definitionNew.def = [field];
		return definitionNew;
	};

	//Order layout by x and y
	layout.sort((a, b) => {
		if (a.y === b.y) {
			return a.x - b.x;
		}
		return a.y - b.y;
	});

	return (
		<div
			className={`grid-container ${isMobile ? "mobile" : ""}`}
			style={{ maxWidth: "100%" }}
		>
			{layout.map((item) => {
				return (
					<div
						key={item.i}
						style={{
							gridColumnStart: item.x + 1,
							gridColumnEnd: `span ${item.w}`,
							gridRowStart: item.y + 1,
							gridRowEnd: `span ${item.h}`,
							padding: "4px 10px",
							maxHeight: `${98 * item.h}px`,
							boxSizing: "border-box",
							overflow: "auto",
						}}
						className={`grid-container-item grid-container-${getFieldType(
							item.i
						)}`}
					>
						{getFieldComponent(item.i)}
					</div>
				)
			})}
		</div>
	);
};

export default Grid;








