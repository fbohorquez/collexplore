import React from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Tooltip } from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SaveIcon from "@mui/icons-material/Save";
import HighlightOff from "@mui/icons-material/HighlightOff";
import AddToQueueIcon from "@mui/icons-material/AddToQueue";
import { selectPopup } from "./helper";
import db from "./db";
import Box from "@mui/material/Box";


const t = i18n.t;


const deepCopyAndClean = (obj) => {
	if (Array.isArray(obj)) {
		return obj.map((item) => deepCopyAndClean(item));
	} else if (typeof obj === "object" && obj !== null) {
		const newObj = {};
		for (let key in obj) {
			if (
				key !== "indexes" &&
				key !== "filtersInput" &&
				key !== "report" &&
				key !== "previousStepResult" &&
				key !== "groupFunctions" &&
				key !== "excludeWordsRepeat" &&
				key !== "omit" &&
				key !== "item"
			) {
				newObj[key] = obj[key];
			}
		}
		return newObj;
	} else {
		return obj;
	}
};

const isFieldImage = (resultValue) => {
	if (!resultValue) {
		return false;
	}
	if (typeof resultValue === "string" && resultValue.startsWith("http")) {
		resultValue = resultValue.split("?")[0];
		if (
			resultValue.endsWith(".jpg") ||
			resultValue.endsWith(".jpeg") ||
			resultValue.endsWith(".png") ||
			resultValue.endsWith(".gif") ||
			resultValue.endsWith(".svg")
		) {
			return true;
		}
	}
	return false;
};

const getFieldImage = (result) => {
	if (typeof result === "object" && result !== null) {
		for (let key in result) {
			if (result[key] && isFieldImage(result[key])) {
				return result[key];
			}
		}
	}
	return null;
};

export const generateIdentifier = (content) => {
	if (typeof content == "string" && content.startsWith("http")) {
		return content.split("?")[0];
	}
	if (typeof content === "object" && content !== null) {
		let identifier = "";
		for (let key in content) {
			identifier += key + generateIdentifier(content[key]);
		}
		return identifier;
	} else {
		return content;
	}
};

export const printResults = (results, data, handleOmitElement, handleSaveElement, handleAddToScrappingObject, scrapingObjects) => {
	if (!results) return null;
	let groupFunctions = null;
	if (
		results.results &&
		results.results.length > 0 &&
		results.results[0].groupFunctions
	) {
		groupFunctions = results.results[0].groupFunctions;
	}
	const processedResults = deepCopyAndClean(results.results);

	return (
		<div>
			{groupFunctions && (
				<div className="group-functions">
					{Object.entries(groupFunctions).map(
						([key, value]) =>
							data.omit &&
							!data.omit.includes(generateIdentifier(value.item)) && (
								<div key={key}>
									<strong>{key}:</strong>
									<div
										style={{ marginLeft: "15px" }}
										className="group-functions-item"
									>
										<div className="item-actions">
											{handleOmitElement && (
												<Tooltip title={t("Omitir")}>
													<VisibilityOffIcon
														onClick={() =>
															handleOmitElement(generateIdentifier(value.item))
														}
													/>
												</Tooltip>
											)}
											{handleSaveElement && (
												<Tooltip title={t("Guardar")}>
													<SaveIcon
														onClick={() => handleSaveElement(value.item)}
													/>
												</Tooltip>
											)}
											{handleAddToScrappingObject && (
												<Tooltip title={t("add-to-scraping-object")}>
													<AddToQueueIcon
														onClick={() =>
															handleAddToScrappingObject(value.item)
														}
													/>
												</Tooltip>
											)}
										</div>
										{printResultsRecursively(
											value.item,
											1,
											null,
											null,
											data,
											handleOmitElement,
											handleSaveElement,
											handleAddToScrappingObject,
											scrapingObjects
										)}
									</div>
								</div>
							)
					)}
				</div>
			)}
			{processedResults &&
				printResultsRecursively(
					processedResults,
					0,
					null,
					null,
					data,
					handleOmitElement,
					handleSaveElement,
					handleAddToScrappingObject,
					scrapingObjects
				)}
		</div>
	);
};

const searchInScrappingObjects = (scrapingObjects, identifier) => {
  let results = [];
  for (let scrapingObject of scrapingObjects) {
    if (scrapingObject.items) {
      for (let item of scrapingObject.items) {
        if (generateIdentifier(item) === identifier) {
          results.push(scrapingObject);
          break;
        }
      }
    }
  }
  return results;
}

const clearIdentifier = (identifier) => {
  return identifier.replace(/[^a-zA-Z0-9]/g, "");
}

export const printResultsRecursively = (results, depth, showKeys, actions, data, handleOmitElement, handleSaveElement, handleAddToScrappingObject, scrapingObjects) => {
  if (!data) {
    return null;
  }
	if (Array.isArray(results)) {
		return results.map((result, index) => {
			const identifier = generateIdentifier(result);
			if (data.omit && data.omit.includes(identifier)) {
				return null;
			}
			return (
				<div key={index} className="item">
					{printResultsRecursively(result, depth + 1, showKeys, actions, data, handleOmitElement, handleSaveElement, handleAddToScrappingObject, scrapingObjects)}
				</div>
			);
		});
	} else if (typeof results === "object" && results !== null) {
    let scrapings = searchInScrappingObjects(scrapingObjects || [], generateIdentifier(results));
		return (
			<div style={{ display: "flex", gap: "12px" }} className={`item-content`}>
				{(function () {
					let image = getFieldImage(results);
					if (image) {
						return (
							<img
								src={image}
								alt={t("Imagen")}
								style={{ maxWidth: "100%", maxHeight: "100%" }}
							/>
						);
					}
					return null;
				})()}
				<div className="item-keys">
					{Object.entries(results).map(([key, value]) => (
						<div
							key={key}
							className={depth > 0 ? "result-item" : "result-root"}
						>
							{depth > 0 || showKeys ? <strong>{key}:</strong> : null}{" "}
							{printResultsRecursively(
								value,
								depth + 1,
								showKeys,
								actions,
								data,
								handleOmitElement,
								handleSaveElement,
								handleAddToScrappingObject,
								scrapingObjects
							)}
						</div>
					))}
				</div>
				{scrapings.length > 0 && (
					<div className="item-scraping-objects">
						{scrapings.map((scraping, index) => (
							<div
								key={index}
								className="scraping-object"
								data-id={`${clearIdentifier(generateIdentifier(results))}-${scraping.id}-${index}`}
							>
								<strong>{scraping.name}</strong>
								<Tooltip title={t("delete")}>
									<HighlightOff
                    style={{ cursor: "pointer", fontSize: "1.5em" }}
										onClick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											selectPopup({
												title: t("delete-item"),
												content: () => (
													<Box>
														<p>{t("delete-item-confirm")}</p>
													</Box>
												),
												btns: [
													{
														label: t("yes"),
														action: () => {
															selectPopup(null);
															document
																.querySelector(
																	`.scraping-object[data-id="${clearIdentifier(generateIdentifier(results))}-${scraping.id}-${index}"]`
																)
																.remove();
															db.scrapingObjects.update(scraping.id, {
																items: scraping.items.filter(
																	(item) =>
																		generateIdentifier(item) !==
																		generateIdentifier(results)
																),
															});
														},
													},
													{
														label: t("no"),
														action: () => selectPopup(null),
														variant: "outlined",
													},
												],
											});
										}}
									/>
								</Tooltip>
							</div>
						))}
					</div>
				)}
				<div className="item-actions" data-depth={depth}>
					{depth > 1 ? (
						<div className="item-actions-sub" data-depth={depth}>
							{handleSaveElement && (
								<Tooltip title={t("Guardar")}>
									<SaveIcon onClick={() => handleSaveElement(results)} />
								</Tooltip>
							)}
							{handleOmitElement && (
								<Tooltip title={t("Omitir")}>
									<VisibilityOffIcon
										onClick={() =>
											handleOmitElement(generateIdentifier(results))
										}
									/>
								</Tooltip>
							)}
							{handleAddToScrappingObject && (
								<Tooltip title={t("add-to-scraping-object")}>
									<AddToQueueIcon
										onClick={() => handleAddToScrappingObject(results)}
									/>
								</Tooltip>
							)}
						</div>
					) : null}
					{typeof actions === "function"
						? actions(results)
						: actions
						? actions
						: null}
				</div>
			</div>
		);
	} else {
		if (results === null) {
			return "";
		}
		// If it's a URL:
		if (typeof results === "string" && results.startsWith("http")) {
			return (
				<a href={results} target="_blank" rel="noreferrer">
					{results}
				</a>
			);
		}
		return <span>{String(results)}</span>;
	}
};


















