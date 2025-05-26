import React from "react";
import { AppContext } from "../../services/context";
import BarChart from "./charts/BarChart";
import KpiNumber from "./charts/KpiNumber";
import PieChart from "./charts/PieChart";
import useStatsWorker from "../../hooks/useStatsWorker";

export default function ChartComponent({ type, config }) {
	const { itemListConfig } = React.useContext(AppContext);
	const { typeSelected } = itemListConfig;

	const { data, error } = useStatsWorker(typeSelected, config, itemListConfig);

	if (error) {
		return <div>Error: {error}</div>;
	}

	if (!data) {
		// return <div>Cargando...</div>;
		return null;
	}

	if (type === "BarChart") {
		return <BarChart data={data} title={config.title} />;
	} else if (type === "KpiNumber") {
		return <KpiNumber data={data} title={config.title} config={config} />;
	}
	else if (type === "PieChart") {
		return <PieChart data={data} title={config.title} config={config} />;
	}

	return null;
}


