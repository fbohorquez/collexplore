import React, { useState, useEffect, useRef } from "react";

import {
	Select,
	MenuItem,
	Box,
} from "@mui/material";

import FormBuilder from "../FormBuilder";

import "react-quill/dist/quill.snow.css";


export default function SelectField({
	field,
	value,
	handleChange,
	definition = null,
	reference = null,
	onChangeForm = (field, value) => {},
}) {

	const [menuOpen, setMenuOpen] = useState(false);
	const highlightedIndexRef = useRef(0);
	const selectRef = useRef(null);

	const effectiveValue =
		value === undefined ? (field.default ? field.default : "") : value;
	field.options = field.options.filter((option) => option !== null);

	const handleKeyDownMenuList = (event) => {
		if (event.key === "Tab") {
			event.preventDefault();
			event.stopPropagation();

			// // Selecciona el elemento actualmente resaltado
			const selectedOption = field.options[highlightedIndexRef.current];
			handleChange(event, null, selectedOption.value);

			// // Cierra el menú
			setMenuOpen(false);

			// Mueve el foco al siguiente campo
			const fieldForm = selectRef.current.closest(".grid-container-item");
			const nextField = fieldForm.nextElementSibling;
			if (nextField) {
				const nextInput = nextField.querySelector("[role=combobox], input, select, textarea");
				if (nextInput) {
					setTimeout(() => {
						nextInput.focus();
					}, 200);
				}
			}
		}
	};

	const handleMenuItemFocus = (index) => () => {
		highlightedIndexRef.current = index;
	};

	 const inputBufferRef = useRef("");
		const typingTimeoutRef = useRef(null);

 const handleKeyDownSelect = (event) => {
		if (event.key.length === 1) {
			// Sólo capturar letras, no teclas de control
			inputBufferRef.current += event.key;
			clearTimeout(typingTimeoutRef.current);

			typingTimeoutRef.current = setTimeout(() => {
				const searchText = inputBufferRef.current.toLowerCase();
				const matchedOption = field.options.find((option) =>
					option.label.toLowerCase().startsWith(searchText)
				);

				if (matchedOption) {
					handleChange(event, null, matchedOption.value);
				}

				inputBufferRef.current = ""; 
			}, 500);
		}
 };

 useEffect(() => {
		const selectNode = selectRef.current;

		if (selectNode) {
			selectNode.addEventListener("keydown", handleKeyDownSelect);

			return () => {
				selectNode.removeEventListener("keydown", handleKeyDownSelect);
			};
		}
 }, []);

	return (
		<Box>
			<Select
				ref={selectRef}
				value={effectiveValue}
				onChange={handleChange}
				// onKeyDown={(e) => e.stopPropagation()}
				onKeyDown={handleKeyDownSelect}
				open={menuOpen}
				onOpen={() => setMenuOpen(true)}
				onClose={() => setMenuOpen(false)}
				MenuProps={{
					MenuListProps: {
						onKeyDown: handleKeyDownMenuList,
					},
				}}
			>
				{field.options.map((option, index) => {
					if (!option) {
						return null;
					}
					return (
						<MenuItem
							key={option.value}
							value={option.value}
							onFocus={handleMenuItemFocus(index)}
						>
							{option.label}
						</MenuItem>
					);
				})}
			</Select>
			{field.options.map((option) => {
				if (!option) {
					return null;
				}
				if (option.subform) {
					option.subform = { ...definition, ...option.subform };
					option.subform.subform = true;
					const id = "subform-" + option.value;
					return (
						<Box
							id={id}
							style={{
								display: effectiveValue === option.value ? "block" : "none",
							}}
						>
							<FormBuilder
								definition={option.subform}
								reference={reference}
								className="subform"
								onChange={onChangeForm}
							/>
						</Box>
					);
				}
				return null;
			})}
		</Box>
	);














}