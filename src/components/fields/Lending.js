import React, { useState } from "react";
import { Box, TextField, Button, Typography, IconButton, Tooltip } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useTranslation } from "react-i18next";

import DeleteIcon from "@mui/icons-material/Delete";

function Lending({ value = [], onChange, field }) {
  if (!(value instanceof Array)) {
    value = [];
  }
	const [person, setPerson] = useState("");
	const [dateIni, setDateIni] = useState(Date.now());
	const { t } = useTranslation();

	const handleAddLending = () => {
		if (person && dateIni) {
			const newLending = { person, date_ini: dateIni, date_end: null };
			const newValues = [...value, newLending];
			onChange(newValues);
			setPerson("");
			setDateIni(null);
		}
	};

	const handleReturn = (index) => {
		const newValues = value.map((item, i) =>
			i === index ? { ...item, date_end: new Date() } : item
		);
		onChange(newValues);
	};

	return (
		<Box>
			<Box sx={{ display: "flex", gap: 2 }}>
				<TextField
					label={t("person")}
					value={person}
					onChange={(e) => setPerson(e.target.value)}
				/>
				<LocalizationProvider dateAdapter={AdapterDateFns}>
					<DatePicker
						label={t("start-date")}
						value={dateIni}
						onChange={(newValue) => setDateIni(newValue)}
						renderInput={(params) => <TextField {...params} />}
						inputFormat="dd/MM/yyyy"
					/>
				</LocalizationProvider>
				<Button onClick={handleAddLending} variant="contained" color="primary">
					{t("add-lending")}
				</Button>
			</Box>
			<Box className="lendings" sx={{ mt: 2 }}>
				{value.map((lending, index) => (
					<Box key={index} display="flex" alignItems="center" mb={2}>
						<Typography variant="body1">
							{lending.person} -{" "}
							{new Date(lending.date_ini).toLocaleDateString()} -{" "}
							{lending.date_end
								? new Date(lending.date_end).toLocaleDateString()
								: t("not-returned")}
						</Typography>
						{!lending.date_end && (
							<Button
								onClick={() => handleReturn(index)}
								variant="contained"
								color="primary"
                style={{ marginLeft: 10 }}
							>
								{t("return")}
							</Button>
						)}
            <Tooltip title={t('delete')}>
              <IconButton onClick={() => {
                const newValues = value.filter((item, i) => i !== index);
                onChange(newValues);
              }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>

					</Box>
				))}
			</Box>
		</Box>
	);
}

export default Lending;




