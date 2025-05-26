import React, { useState, useContext } from "react";
import { AppContext } from "../../../services/context";
import { Typography, Menu, MenuItem, IconButton, Box } from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import { useTranslation } from "react-i18next";
import FormBuilder from "../../FormBuilder";
import { valueToString, isDetailVisible } from "../../../services/helper";
import Config from "../../../services/config";

import ChartComponent from "../../Stats/ChartComponent";
import ResumeComponent from "../../Stats/ResumeComponent";

import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/Delete";

export const ListGroupHeader = ({ item, listConfig, setListConfig, colsN }) => {
	const { itemListConfig } = useContext(AppContext);

	const { t } = useTranslation();
	const [anchorEl, setAnchorEl] = useState(null);
	const [currentSubgroups, setCurrentSubgroups] = useState([]);
	const [anchorMenuStatsHeader, setAnchorMenuStatsHeader] = useState(null);
	const [cacheImg, setCacheImg] = useState({});

	const handleMenuOpen = (event, subgroups) => {
		setAnchorEl(event.currentTarget);
		setCurrentSubgroups(subgroups || []);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setCurrentSubgroups([]);
	};

	const [clickId, setClickId] = useState(null);

	const printRootGroup = (group, index) => {
		if (group.groupKey === true || group.groupKey === "true") {
			group.groupKey = t("i-have-it");
		} else if (group.groupKey === false || group.groupKey === "false") {
			group.groupKey = t("i-dont-have-it");
		}
		return (
			<li key={index} className="list-group-header-item">
				<span className="count">{group.itemsIds?.size || 0}</span>
				<span
					className="name"
					onClick={() => {
						let event = new CustomEvent("scroll-to", {
							detail: {
								index: group.index,
							},
						});
						window.dispatchEvent(event);
					}}
				>
					<span
						dangerouslySetInnerHTML={{
							__html: valueToString(
								group.groupKey,
								group.groupBy,
								item.typeSelected,
								true
							),
						}}
					></span>
				</span>
				<span className="stats-resume">
					{listConfig.listStatsHeaderDef &&
						listConfig.listStatsHeaderDef.map((obj) => {
							if (group.stats && group.stats[obj.id]) {
								let url = null;
								if (obj.img && obj.img instanceof Blob) {
									if (cacheImg[obj.id]) {
										url = cacheImg[obj.id];
									} else {
										url = URL.createObjectURL(obj.img);
										setCacheImg({ ...cacheImg, [obj.id]: url });
									}
								} else {
									let hash = 0;
									for (let i = 0; i < obj.id.length; i++) {
										hash = 31 * hash + obj.id.charCodeAt(i);
									}
									const N = hash % 256;

									const A = N % 256;
									const B = (N * 10) % 256;
									const C = (N * 20) % 256;

									url =
										'data:image/svg+xml,<svg viewBox="0 0 50 50" version="1.1" id="svg1" inkscape:version="1.4 (e7c3feb100, 2024-10-09)" sodipodi:docname="test.svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><sodipodi:namedview id="namedview1" pagecolor="%23ffffff" bordercolor="%23000000" borderopacity="0.25" inkscape:showpageshadow="2" inkscape:pageopacity="0.0" inkscape:pagecheckerboard="0" inkscape:deskcolor="%23d1d1d1" inkscape:document-units="mm" inkscape:zoom="0.75900673" inkscape:cx="396.57092" inkscape:cy="561.25984" inkscape:window-width="1920" inkscape:window-height="1063" inkscape:window-x="1080" inkscape:window-y="1080" inkscape:window-maximized="1" inkscape:current-layer="layer1" /><defs id="defs1" /><g inkscape:label="Capa 1" inkscape:groupmode="layer" id="layer1"><circle style="fill:rgba(' +
										A +
										"," +
										B +
										"," +
										C +
										',0.5);stroke-width:0.118133" id="path1" cx="25.25" cy="25.25" r="25" /></g></svg>';
								}

								return (
									<div
										className="stats-resume-container"
										onMouseEnter={(event) => {
											let el = event.target;
											let container = el.closest(".stats-resume-container");
											container
												.querySelectorAll(".stats-resume-count")
												.forEach((el) => {
													if (
														container.getBoundingClientRect().left +
															20 +
															el.offsetWidth >
														window.innerWidth
													) {
														el.style.left =
															container.getBoundingClientRect().left -
															el.offsetWidth +
															"px";
													} else {
														el.style.left =
															container.getBoundingClientRect().left +
															20 +
															"px";
													}
													if (
														container.getBoundingClientRect().top +
															20 +
															el.offsetHeight >
															window.innerHeight &&
														container.getBoundingClientRect().top -
															el.offsetHeight -
															20 >
															0
													) {
														el.style.top =
															container.getBoundingClientRect().top -
															el.offsetHeight -
															20 +
															"px";
													} else {
														el.style.top =
															container.getBoundingClientRect().top + 20 + "px";
													}
												});
										}}
									>
										{url ? (
											<img
												src={url}
												alt=""
												title=""
												className="stats-resume-img"
											/>
										) : null}
										<div className="stats-resume-count">
											{Object.keys(group.stats[obj.id])
												.sort((a, b) => {
													let A = group.stats[obj.id][a].size;
													let B = group.stats[obj.id][b].size;
													if (A > B) {
														return -1;
													}
													if (A < B) {
														return 1;
													}
													return 0;
												})
												.map((key) => {
													return (
														<div className="stats-resume-item">
															<span className="stats-resume-item-value">
																{group.stats[obj.id][key].size}
															</span>
															<span
																className="stats-resume-item-key"
																dangerouslySetInnerHTML={{ __html: key }}
															></span>
														</div>
													);
												})}
										</div>
									</div>
								);
							}
							return null;
						})}
					{group.groups && group.groups.length > 0 && (
						<IconButton
							size="small"
							onClick={(event) => handleMenuOpen(event, group.groups)}
						>
							<AnalyticsIcon />
						</IconButton>
					)}
				</span>
			</li>
		);
	};

	return (
		<div
			className="list-group-header-container"
			style={{
				width: "calc(" + (100 * colsN) + "% - 20px)",
			}}
		>
			{/* <div className="list-group-header-title">
				<Typography
					variant="h6"
					sx={{ textAlign: "left", paddingLeft: "10px" }}
				>
					{item &&
					item.typeSelected &&
					item.typesByID &&
					item.typesByID[item.typeSelected]
						? item.typesByID[item.typeSelected].name
						: t("groups")}
					{item.listGroupDef &&
						Object.keys(item.listGroupDef).map((key) => {
							if (item && item.typesByID && item.typesByID[item.typeSelected]) {
								let field = item.typesByID[item.typeSelected].fields.find(
									(field) => {
										if (field.id === key) {
											return field;
										}
										return null;
									}
								);
								if (field && field.label) {
									return <span className="subgroup-title">{field.label}</span>;
								} else {
									return <span className="subgroup-title">{key}</span>;
								}
							}
							return null;
						})}
				</Typography>
				<IconButton
					size="small"
					onClick={(event) => setAnchorMenuStatsHeader(event.currentTarget)}
				>
					<SettingsIcon />
				</IconButton>
				<Box>
					<Menu
						id="simple-menu"
						anchorEl={anchorMenuStatsHeader}
						open={Boolean(anchorMenuStatsHeader)}
						onClose={() => {
							setAnchorMenuStatsHeader(null);
						}}
						disableScrollLock
						className="list-group-header-stats-menu"
					>
						{listConfig.listStatsHeaderDef &&
							listConfig.listStatsHeaderDef.map((obj) => {
								const id = obj.id;
								let key = obj.id;
								if (!item.typesByID || !item.typesByID[item.typeSelected]) {
									return null;
								}
								if (key === "name") {
									key = "Nombre";
								} else if (key === "in_collection") {
									key = t("i-have-it");
								} else {
									const field = item.typesByID[item.typeSelected].fields.find(
										(field) => field.id === key
									);
									if (!field) {
										return null;
									}
									if (field.label) {
										key = field.label;
									}
								}
								const onSaved = (data) => {
									let key = "gridStatsHeader:" + item.typeSelected;
									if (item.listSelected) {
										key =
											"gridStatsHeader:" +
											item.typeSelected +
											":" +
											item.listSelected.id;
									}
									if (window.ModeExplorer) {
										key += ":explorer";
									}
									Config.get(key, null).then((conf) => {
										if (conf && conf[item.typeSelected]) {
											conf[item.typeSelected].forEach((item) => {
												if (item.id === clickId) {
													item.img = data.img;
												}
											});
											Config.set(key, conf);
											let listStatsHeaderDefNew = conf[item.typeSelected];
											listStatsHeaderDefNew.forEach((item) => {
												if (item.id === clickId) {
													item.img = data.img;
												}
											});
											// setListStatsHeaderDef(listStatsHeaderDefNew);
											setListConfig({
												...listConfig,
												listStatsHeaderDef: listStatsHeaderDefNew,
											});
										}
									});
								};

								return (
									<MenuItem
										key={key}
										variant="head"
										align="left"
										onClick={(e) => {
											setClickId(obj.id);
										}}
										sx={{
											backgroundColor: "background.paper",
										}}
									>
										<span>{key}</span>
										<FormBuilder
											className={`${obj.id}`}
											onSaved={onSaved}
											reference={{ ...obj }}
											definition={{
												reference: true,
												root: { ...obj },
												def: [
													{
														id: "img",
														type: "image",
														required: true,
													},
												],
											}}
										/>
										<DeleteIcon
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												let listStatsHeaderDefNew =
													listConfig.listStatsHeaderDef.filter(
														(item) => item.id !== id
													);
												// setListStatsHeaderDef(listStatsHeaderDefNew);
												setListConfig({
													...listConfig,
													listStatsHeaderDef: listStatsHeaderDefNew,
												});
												let key = "gridStatsHeader:" + item.typeSelected;
												if (item.listSelected) {
													key =
														"gridStatsHeader:" +
														item.typeSelected +
														":" +
														item.listSelected.id;
												}
												if (window.ModeExplorer) {
													key += ":explorer";
												}
												Config.get(key, null).then((data) => {
													if (!data) {
														data = {};
													}
													let newForType = {};
													newForType[item.typeSelected] = listStatsHeaderDefNew;
													data = { ...data, ...newForType };
													Config.set(key, data);
												});
											}}
										/>
									</MenuItem>
								);
							})}
						{listConfig.listStatsHeaderDef &&
							Object.keys(listConfig.listStatsHeaderDef).length > 0 && (
								<hr style={{ margin: "5px 0" }} />
							)}
						{item.listColumnsDef &&
							item.listColumnsDef.map &&
							item.listColumnsDef
								.filter((column) => {
									return !listConfig.listStatsHeaderDef.find(
										(item) => item.id === column.field
									);
								})
								.map((column) => {
									let field = item.typesByID[item.typeSelected].fields.find(
										(field) => field.id === column.field
									);
									if (
										(listConfig.listStatsHeaderDef[column.field] || !field) &&
										column.field !== "in_collection"
									) {
										return null;
									}
									if (
										column.field !== "in_collection" &&
										(column.field === "name" || field.type === "image")
									) {
										return null;
									}
									return (
										<MenuItem
											key={column.field}
											variant="head"
											align={column.numeric || false ? "right" : "left"}
											sx={{
												backgroundColor: "background.paper",
											}}
											onClick={(e) => {
												e.stopPropagation();
												e.preventDefault();
												let listStatsHeaderDefNew = [
													...listConfig.listStatsHeaderDef,
												];

												if (!listStatsHeaderDefNew) {
													listStatsHeaderDefNew = [];
												}
												listStatsHeaderDefNew.push({
													img: null,
													id: column.field,
													label: column.label,
												});
												// setListStatsHeaderDef(listStatsHeaderDefNew);
												setListConfig({
													...listConfig,
													listStatsHeaderDef: listStatsHeaderDefNew,
												});
												let key = "gridStatsHeader:" + item.typeSelected;
												if (item.listSelected) {
													key =
														"gridStatsHeader:" +
														item.typeSelected +
														":" +
														item.listSelected.id;
												}
												if (window.ModeExplorer) {
													key += ":explorer";
												}
												Config.get(key, null).then((data) => {
													if (!data) {
														data = {};
													}
													let newForType = {};
													newForType[item.typeSelected] = listStatsHeaderDefNew;
													data = { ...data, ...newForType };
													Config.set(key, data);
												});
											}}
										>
											{column.label}
										</MenuItem>
									);
								})}
					</Menu>
				</Box>
			</div> */}
			<ul className="list-group-header-resume">
				<li className="list-group-header-item">
					<ChartComponent
						type="KpiNumber"
						config={{
							title: "Total",
							query: {
								base: {
									type: "items",
								},
							},
							ignoreGrouping: true,
						}}
					></ChartComponent>
				</li>
				<li className="list-group-header-item">
					<ChartComponent
						type="KpiNumber"
						config={{
							title: "Agrupación",
							query: {
								base: {
									type: "items",
								},
							},
						}}
					></ChartComponent>
				</li>

				<li className="list-group-header-item">
					<ResumeComponent></ResumeComponent>
				</li>
				<li className="list-group-header-item">
					<ChartComponent
						type="PieChart"
						config={{
							title: "Agrupación",
							query: {
								base: {
									type: "items",
								},
							},
						}}
					></ChartComponent>
				</li>
				{/* <li className="list-group-header-item">
					<ChartComponent
						type="KpiNumber"
						config={{
							title: "Por valoración",
							query: {
								base: {
									type: "items",
									fields: ["rating"],
								},
							},
							ignoreGrouping: true,
						}}
						currentGrouping={item}
					></ChartComponent>
				</li>
				<li className="list-group-header-item">
					<ChartComponent
						type="KpiNumber"
						config={{
							title: "Por Año",
							query: {
								base: {
									type: "items",
									fields: ["year"],
								},
							},
							ignoreGrouping: true,
						}}
						currentGrouping={item}
					></ChartComponent>
				</li>
				<li className="list-group-header-item">
					<ChartComponent
						type="KpiNumber"
						config={{
							title: "Por paises",
							query: {
								base: {
									type: "items",
									fields: ["countries"],
								},
							},
							ignoreGrouping: true,
							display: "grid",
							layout: "<span class='bubble'>%s</span>",
						}}
						currentGrouping={item}
					></ChartComponent>
				</li> */}
			</ul>
			{/* <ul className="list-group-header-resume">
				{item &&
					item.groups &&
					item.groups.length > 0 &&
					listConfig.listStatsHeaderDef &&
					item.groups
						.sort((a, b) => {
							let A = a.itemsIds?.size || 0;
							let B = b.itemsIds?.size || 0;
							if (A > B) {
								return -1;
							}
							if (A < B) {
								return 1;
							}
							return 0;
						})
						.slice(0, 4)
						.map(printRootGroup)}
			</ul> */}
			{/* <ul className="list-group-header">
				{item &&
					item.groups &&
					item.groups.length > 0 &&
					listConfig.listStatsHeaderDef &&
					item.groups.map(printRootGroup)}
			</ul>

			{}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
				className="list-group-header-menu"
			>
				{currentSubgroups
					.filter((subgroup) => subgroup.itemsIds?.size > 0)
					.map((subgroup, idx) => {
						return (
							<MenuItem key={idx} className="list-group-header-subgroup">
								<span className="count">{subgroup.itemsIds?.size || 0}</span>
								<span
									className="name"
									onClick={() => {
										handleMenuClose();
										setTimeout(() => {
											let event = new CustomEvent("scroll-to", {
												detail: {
													index: subgroup.index,
												},
											});
											window.dispatchEvent(event);
										}, 100);
									}}
									dangerouslySetInnerHTML={{
										__html: valueToString(
											subgroup.groupKey,
											subgroup.groupBy,
											item.typeSelected,
											true
										),
									}}
								></span>
								<span className="stats-resume">
									{listConfig.listStatsHeaderDef &&
										listConfig.listStatsHeaderDef.map((obj) => {
											if (subgroup.stats && subgroup.stats[obj.id]) {
												let url = null;
												if (obj.img && obj.img instanceof Blob) {
													if (cacheImg[obj.id]) {
														url = cacheImg[obj.id];
													} else {
														url = URL.createObjectURL(obj.img);
														setCacheImg({ ...cacheImg, [obj.id]: url });
													}
												} else {
													let hash = 0;
													for (let i = 0; i < obj.id.length; i++) {
														hash = 31 * hash + obj.id.charCodeAt(i);
													}
													const N = hash % 256;

													const A = N % 256;
													const B = (N * 10) % 256;
													const C = (N * 20) % 256;

													url =
														'data:image/svg+xml,<svg viewBox="0 0 50 50" version="1.1" id="svg1" inkscape:version="1.4 (e7c3feb100, 2024-10-09)" sodipodi:docname="test.svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><sodipodi:namedview id="namedview1" pagecolor="%23ffffff" bordercolor="%23000000" borderopacity="0.25" inkscape:showpageshadow="2" inkscape:pageopacity="0.0" inkscape:pagecheckerboard="0" inkscape:deskcolor="%23d1d1d1" inkscape:document-units="mm" inkscape:zoom="0.75900673" inkscape:cx="396.57092" inkscape:cy="561.25984" inkscape:window-width="1920" inkscape:window-height="1063" inkscape:window-x="1080" inkscape:window-y="1080" inkscape:window-maximized="1" inkscape:current-layer="layer1" /><defs id="defs1" /><g inkscape:label="Capa 1" inkscape:groupmode="layer" id="layer1"><circle style="fill:rgba(' +
														A +
														"," +
														B +
														"," +
														C +
														',0.5);stroke-width:0.118133" id="path1" cx="25.25" cy="25.25" r="25" /></g></svg>';
												}

												return (
													<div
														className="stats-resume-container"
														onMouseEnter={(event) => {
															let el = event.target;
															let container = el.closest(
																".stats-resume-container"
															);
															container
																.querySelectorAll(".stats-resume-count")
																.forEach((el) => {
																	if (
																		container.getBoundingClientRect().left +
																			20 +
																			el.offsetWidth >
																		window.innerWidth
																	) {
																		el.style.left =
																			container.getBoundingClientRect().left -
																			el.offsetWidth +
																			"px";
																	} else {
																		el.style.left =
																			container.getBoundingClientRect().left +
																			20 +
																			"px";
																	}
																	if (
																		container.getBoundingClientRect().top +
																			20 +
																			el.offsetHeight >
																		window.innerHeight
																	) {
																		el.style.top =
																			container.getBoundingClientRect().top -
																			el.offsetHeight -
																			20 +
																			"px";
																	} else {
																		el.style.top =
																			container.getBoundingClientRect().top +
																			20 +
																			"px";
																	}
																});
														}}
													>
														{url ? (
															<img
																src={url}
																alt=""
																title=""
																className="stats-resume-img"
															/>
														) : null}
														<div className="stats-resume-count">
															{Object.keys(subgroup.stats[obj.id]).map(
																(key) => {
																	return (
																		<div className="stats-resume-item">
																			<span className="stats-resume-item-value">
																				{subgroup.stats[obj.id][key].size}
																			</span>
																			<span
																				className="stats-resume-item-key"
																				dangerouslySetInnerHTML={{
																					__html: key,
																				}}
																			></span>
																		</div>
																	);
																}
															)}
														</div>
													</div>
												);
											}
											return null;
										})}
								</span>
							</MenuItem>
						);
					})}
			</Menu> */}
		</div>
	);
};





























































































