import React, { useState, useEffect } from "react";

const JSONKeys = ({ value, onChange, json, field }) => {
	const [selectedKeys, setSelectedKeys] = useState(value || []);
  delete json.json;

	useEffect(() => {
		if (onChange) {
			onChange(selectedKeys);
		}
	}, [selectedKeys]);

	const handleCheckboxChange = (keyPath) => {
		setSelectedKeys((prevSelectedKeys) => {
			if (prevSelectedKeys.includes(keyPath)) {
				return prevSelectedKeys.filter((key) => key !== keyPath);
			} else {
				return [...prevSelectedKeys, keyPath];
			}
		});
	};

	const renderJSON = (obj, currentPath = "") => {
		if (typeof obj === "object" && obj !== null) {
			return Object.keys(obj).map((key) => {
				const keyPath = currentPath ? `${currentPath}.${key}` : key;
				return (
					<div key={keyPath} style={{ marginLeft: "20px" }}>
						<label>
							<input
								type="checkbox"
								checked={selectedKeys.includes(keyPath)}
								onChange={() => handleCheckboxChange(keyPath)}
							/>
							{key}:{" "}
							{typeof obj[key] === "object"
								? ""
								: obj[key].toString().substring(0, 20) +
								  (obj[key].toString().length > 20 ? "..." : "")}
						</label>
						{Array.isArray(obj[key]) ? (
							<div>
								{renderJSON(obj[key][0], `${keyPath}[0]`)}
								<div style={{ marginLeft: "20px" }}>...</div>
							</div>
						) : typeof obj[key] === "object" ? (
							renderJSON(obj[key], keyPath)
						) : null}
					</div>
				);
			});
		}
		return null;
	};

	return <div>{renderJSON(json)}</div>;
};

export default JSONKeys;


