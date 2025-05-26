// src/components/Stats/charts/GooglePieChart.js

import React, { useEffect, useState, useContext } from "react";
import { Box, Button } from "@mui/material";
import { Chart } from "react-google-charts";
import { AppContext } from "../../../services/context";
import { valueToString } from "../../../services/helper";
import { useTranslation } from "react-i18next";

export default function PieChart({ title, data, config }) {
  const { t } = useTranslation();

	const [chartData, setChartData] = useState([]);
	const [currentGroup, setCurrentGroup] = useState(null);
	const { itemListConfig } = useContext(AppContext);

	useEffect(() => {
		if (!data || !data.groups || data.groups.length === 0) {
			setChartData([]);
			return;
		}

		// Procesar los datos según el nivel actual
		let groupsToProcess = data.groups;

		if (currentGroup) {
			const parent = findGroupByKey(data.groups, currentGroup);
			if (parent && parent.subGroups) {
				groupsToProcess = parent.subGroups;
			} else {
				groupsToProcess = [];
			}
		}

		const processedData = [["Category", "Value"]];

		groupsToProcess.forEach((group) => {
			let value = group.counts || group.totalItems || 0;
			if (typeof value === "object") {
				value = Object.values(value).reduce((acc, val) => acc + val, 0);
			}
			processedData.push([group.groupKey, value]);
		});
    setTimeout(() => {
		  setChartData(processedData);
    }, 100);
	}, [data, currentGroup]);

	const findGroupByKey = (groups, key) => {
		for (let group of groups) {
			if (group.groupKey === key) return group;
			if (group.subGroups && group.subGroups.length > 0) {
				const found = findGroupByKey(group.subGroups, key);
				if (found) return found;
			}
		}
		return null;
	};

	const options = {
		title: null,
		is3D: config?.is3D || false,
		...config?.options,
		legend: "none",
		backgroundColor: "transparent",
		chartArea: {
			left: "5%", // Espacio desde el borde izquierdo
			top: "5%", // Espacio desde la parte superior
			width: "90%", // Asegúrate de que ocupe todo el ancho
			height: "90%", // Asegúrate de que ocupe toda la altura
		},
		colors: ["#331f08", "#8c7d74", "#ffec3c"],
	};

	const handleSelect = (chartWrapper) => {
		const chart = chartWrapper.getChart();
		const selection = chart.getSelection();
		if (selection.length > 0) {
			const selectedItem = selection[0];
			const groupKey = chartData[selectedItem.row + 1][0];
			const group = findGroupByKey(data.groups, groupKey);
			if (group && group.subGroups && group.subGroups.length > 0) {
				setCurrentGroup(groupKey);
			}
		}
	};

	const handleBack = () => {
		if (currentGroup) {
			// Encontrar el padre del grupo actual
			const parent = findParentGroup(data.groups, currentGroup);
			if (parent) {
				setCurrentGroup(parent.groupKey);
			} else {
				setCurrentGroup(null);
			}
		}
	};

	const findParentGroup = (groups, childKey, parent = null) => {
		for (let group of groups) {
			if (group.groupKey === childKey) {
				return parent;
			}
			if (group.subGroups && group.subGroups.length > 0) {
				const found = findParentGroup(group.subGroups, childKey, group);
				if (found) return found;
			}
		}
		return null;
	};

	return (
		<Box className="google-pie-chart">
			{currentGroup && (
				<Button
					variant="contained"
					onClick={handleBack}
					style={{ marginBottom: "10px" }}
				>
					{"< " + currentGroup}
				</Button>
			)}
			{(chartData && chartData.length && (
				<Chart
					chartType="PieChart"
					data={chartData}
					options={options}
					width={"100%"}
					height={"100%"}
					chartEvents={[
						{
							eventName: "select",
							callback: ({ chartWrapper }) => handleSelect(chartWrapper),
						},
					]}
				/>
			)) ||
				""}
		</Box>
	);
}







