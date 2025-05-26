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
import { getColumnNamesFromCSV, selectPopup } from "../../../services/helper";

import ImportProcess from "./ImportProcess";



import Config from "../../../services/config";

import FormBuilder from "../../FormBuilder";

import { useTranslation } from "react-i18next";

function ImportDetail() {
	const { selectedItem } = useContext(AppContextDetail);

	const [data, setData] = useState({
		type: 0,
		files: [],
    file: null,
		fields: [],
	});

	const [types, setTypes] = useState([]);

  const [type, setType] = useState(null);
  const [fieldsType, setFieldsType] = useState([]);

  const [columns, setColumns] = useState([]);

	useEffect(() => {
		db.types.toArray().then((data) => {
			setTypes(data);
		});
	}, []);

	const { t } = useTranslation();

	const def = {
		ondemand: false,
		reference: true,
		root: data,
		def: [
			{
				id: "type",
				type: "select",
				label: t("type"),
				name: "type",
				options: types.map((type) => {
					return {
						label: type.name,
						value: type.id,
					};
				}),
				default: types.length > 0 ? types[0].id : null,
				onChange: (field, value) => {
					setData({ ...data, type: value });
          const type = types.find((type) => type.id === value);
          setFieldsType(type.fields);
          setType(type);
				},
			},
			{
				id: "csv",
				type: "file",
				label: t("file-csv"),
				accept: ".csv",
				onChange: (field, value) => {
					setData({ ...data, file: value });
          getColumnNamesFromCSV(value).then((columns) => {
            setColumns(columns);
          });
				},
			},
		],
	};

  let found = null;

	return (
		<Box className="import-detail-container">
			<FormBuilder
				reference={data}
				definition={def}
				value={Config[selectedItem]}
				onChange={(data) => {
					Config[selectedItem] = data;
				}}
			/>
			{(data.type && data.file && (
				<Box className="import-detail-columns">
					<Typography variant="h6">{t("columns")}</Typography>
					{columns.map((column) => (
						<Box key={column.index} className="import-detail-column">
							<Typography variant="span">{column.name}</Typography>
							<Select
								style={{ marginLeft: "32px", marginBottom: "12px" }}
								value={column.field || 0}
								onChange={(e) => {
									const newColumns = columns.map((c) => {
										if (c.index === column.index) {
											return { ...c, field: e.target.value };
										}
										return c;
									});
									setColumns(newColumns);
								}}
							>
								<MenuItem value={0}>
									<em>{t("not-assigned")}</em>
								</MenuItem>
                <MenuItem value="name">{t("name")}</MenuItem>
								<MenuItem value="created_at">{t("created-at")}</MenuItem>
								{fieldsType.map((option) => (
									<MenuItem key={option.id} value={option.id}>
										{option.label}
									</MenuItem>
								))}
							</Select>
							{(column.field &&
								(found = fieldsType.find(
									(field) => field.id === column.field
								)) &&
								found.type === "image" && (
									<input
										type="file"
										accept="image/*"
										multiple
										onChange={(e) => {
											const files = e.target.files;
											const newColumns = columns.map((c) => {
												if (c.index === column.index) {
													return { ...c, files: files };
												}
												return c;
											});
											setColumns(newColumns);
										}}
										style={{ marginLeft: "12px" }}
									/>
								)) ||
								null}
						</Box>
					))}
					<Button
						onClick={() => {
              selectPopup({
								title: t("import-data"),
								content: () => {
									return (
										<Box>
                      <Typography variant="span">{t("import-data-confirm")}</Typography>
                      <ImportProcess data={data} columns={columns} fieldsType={fieldsType} />
                    </Box>
									);
								},
								btns: [
									{
										label: t("ok"),
										action: () => {
											selectPopup(null);
										},
									},
								],
							});
						}}
            variant="contained"
					>
						{t("import-data")}
					</Button>
				</Box>
			)) ||
				null}
		</Box>
	);
}

export default ImportDetail;


















