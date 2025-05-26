import React, { useContext, useState, useEffect } from "react";
import {
	Box,
	Typography,
	FormControlLabel,
	Switch,
	Select,
	MenuItem,
	Button,
} from "@mui/material";
import { AppContextDetail } from "../../../services/context_detail";
import db from "../../../services/db";
import { useTranslation } from "react-i18next";
import JSZip from "jszip";
import { saveAs } from "file-saver";

function ExportDetail() {
	const { selectedItem } = useContext(AppContextDetail);
	const [data, setData] = useState({
		type: 0,
		fields: [],
	});
	const [types, setTypes] = useState([]);
	const [type, setType] = useState(null);
	const [fieldsType, setFieldsType] = useState([]);
	const [selectedFields, setSelectedFields] = useState([]);
	const { t } = useTranslation();

	useEffect(() => {
		db.types.toArray().then((data) => {
			setTypes(data);
		});
	}, []);

	const handleExport = async () => {
    if (selectedFields.length !== 0 && selectedFields[0].id !== "name") {
      selectedFields.unshift({ id: "name", label: t("name"), type: "text" });
    }
		const items = await db.items.where("type").equals(data.type).toArray();
		if (items.length === 0 || selectedFields.length === 0) {
			alert(t("No data or fields selected for export"));
			return;
		}

		const zip = new JSZip();
		const csvData = [];
    
		const header = selectedFields.map((field) => field.label.replace(/"/g, '\\"')).join(",");
		csvData.push(header);
    

		items.forEach((item) => {
      
			const row = selectedFields
				.map((field) => {
					let value = field.id === 'name' ? item.name : item.fields[field.id];
					if (field.type === "date") {
						value = new Date(value).toLocaleDateString();
					} else if (field.type === "boolean") {
						value = value ? t("Yes") : t("No");
					} else if (
						(field.type === "image" || field.type === "image-gallery") &&
						value
					) {
						if (!(value instanceof Array)) {
							value = [value];
						}

						value = value
							.map((file, index) => {
								let item_name = item.name
									.replace(/[^a-z0-9]/gi, "_")
									.toLowerCase();
								const filename = `${item.id}_${field.id}_${item_name}.png`;
								zip.file("img/" + filename, file);
								return filename;
							})
							.join(", ");
					} else if (field.type === "entity" && value) {
						if (item.cache[field.id]) {
							value = item.cache[field.id];
						}
						if (!(value instanceof Array)) {
							value = [value];
						}
						value = value.map((entity) => entity.name).join(", ");
					} else if (!value) {
						value = "";
					}
          
					return '"' + value.toString().replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
				})
				.join(",");
			csvData.push(row);
		});

		const csvContent = csvData.join("\n");
		zip.file(`export_${type.name}.csv`, csvContent);

		zip.generateAsync({ type: "blob" }).then((content) => {
			saveAs(content, `export_${type.name}.zip`);
		});
	};

	return (
		<Box className="export-detail-container">
			<Select
				value={data.type}
				onChange={(e) => {
					const selectedType = types.find((type) => type.id === e.target.value);
					setData({ ...data, type: e.target.value });
					setFieldsType(selectedType.fields);
					setType(selectedType);
					setSelectedFields([]); // Reset selected fields when type changes
				}}
			>
				{types.map((type) => (
					<MenuItem key={type.id} value={type.id}>
						{type.name}
					</MenuItem>
				))}
			</Select>
			{fieldsType.length > 0 && (
				<Box className="export-detail-fields" style={{ marginTop: "16px" }}>
					<Typography variant="h6">{t("select-fields")}</Typography>
					{fieldsType.map((field) => (
						<FormControlLabel
							key={field.id}
							control={
								<Switch
									checked={selectedFields.includes(field)}
									onChange={() => {
										setSelectedFields((prev) =>
											prev.includes(field)
												? prev.filter((f) => f !== field)
												: [...prev, field]
										);
									}}
								/>
							}
							label={field.label}
						/>
					))}
				</Box>
			)}
      {selectedFields.length > 0 && data.type && (
        <Button
          onClick={handleExport}
          variant="contained"
          color="primary"
          disabled={selectedFields.length === 0 || !data.type}
          style={{ marginTop: 10 }}
        >
          {t("export")}
        </Button>
      )}
		</Box>
	);
}

export default ExportDetail;




