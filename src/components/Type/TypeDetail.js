import React, { useContext, useState, useEffect } from "react";
import {
	Box,
	Typography,
	Tabs,
	Tab,
	Button,
	Tooltip,
	TextField,
} from "@mui/material";
import { AppContext } from "../../services/context";
import { AppContextDetail } from "../../services/context_detail";
import PropTypes from "prop-types";

import { generateId, selectPopup, updatePopup } from "../../services/helper";
import Config from "../../services/config";

import ModeIcon from "@mui/icons-material/Mode";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import FormBuilder from "../FormBuilder";

import DynamicGrid from "../layout/DynamicGrid";
import ApiIcon from "@mui/icons-material/Api";


import db from "../../services/db";

import { useTranslation } from "react-i18next";

import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function CustomTabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					<Typography>{children}</Typography>
				</Box>
			)}
		</div>
	);
}

CustomTabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

function TypeDetail({ component, additionalFieldsTitle = [] }) {
	const { setUpdateComponent } = useContext(AppContext);

	const { selectedItem, setSelectedItem } = useContext(AppContextDetail);

	const [tabValue, setTabValue] = useState(0);
	// const [tabSourceValue, setTabSourceValue] = useState(0);

	const { t } = useTranslation();

	const generateDataInit = () => {
		let data = {
			name: "",
			active: true,
			order: 0,
			tabs: [],
			fields: [],
		};
		if (additionalFieldsTitle && additionalFieldsTitle.length > 0) {
			additionalFieldsTitle.forEach((additional) => {
				additional.def.forEach((field) => {
					data[field.id] = field.default;
				});
			});
		}
		return data;
	};

	let data_init = {};

	if (selectedItem === "add") {
		data_init = generateDataInit();
	} else {
		data_init = selectedItem;
	}

	const [data, setData] = useState(data_init);
	setSelectedItem(data_init);

	useEffect(() => {
		let data_init = {};
		if (selectedItem === "add") {
			data_init = generateDataInit();
		} else {
			data_init = selectedItem;
		}
		setData(data_init);
	}, [selectedItem]);

	const getLabelFormDefinition = (required, addFieldsDefinition = []) => {
		return {
			ondemand: false,
			reference: true,
			document: component,
			root: data,
			def: [
				{
					id: "label",
					label: t("name"),
					type: "text",
					required: required,
					selectOnFocus: true,
					autoFocus: true,
				},
				...addFieldsDefinition,
			],
		};
	};

	const getTabFormDefinition = (required) => {
		return {
			ondemand: false,
			reference: true,
			document: component,
			root: data,
			def: [
				{
					id: "label",
					label: t("name"),
					type: "text",
					required: required,
					selectOnFocus: true,
					autoFocus: true,
				},
				{
					id: "visible",
					label: t("visible"),
					type: "select",
					default: "all",
					options: [
						{ value: "all", label: t("everywhere") },
						{ value: "collection", label: t("collection") },
						{ value: "expolorer", label: t("explorer") },
					],
				}
			],
		};
	};

	const nameFormDefinition = {
		ondemand: false,
		reference: true,
		document: component,
		root: data,
		def: [
			{
				id: "name",
				label: t("name"),
				type: "text",
				labelPosition: "none",
				placeholder: t("name"),
				required: true,
				autoFocus: true,
			},
		],
	};

	const fieldFormDefinitionInit = {
		ondemand: false,
		reference: true,
		document: component,
		root: data,
		def: [
			{
				id: "label",
				label: t("name"),
				type: "text",
				required: true,
				selectOnFocus: true,
				autoFocus: true,
			},
			{
				id: "type",
				label: t("type"),
				type: "select",
				options: [
					{ value: "checkbox", label: t("checkbox") },
					{ value: "text", label: t("text") },
					{ value: "number", label: t("number") },
					{ value: "date", label: t("date") },
					{ value: "textarea", label: t("textarea") },
					{ value: "tags", label: t("tags") },
					{
						value: "image",
						label: t("image"),
						subform: {
							def: [
								{
									id: "main",
									label: t("main"),
									type: "checkbox",
									default: false,
									onChange: (id, value, reference) => {
										if (value) {
											reference.labelPosition = "none";
										} else {
											reference.labelPosition = "top";
										}
									},
								},
								{
									id: "autoCrop",
									label: t("enable-auto-crop"),
									type: "checkbox",
									default: false,
								},
							],
						},
					},
					{
						value: "image-gallery",
						label: t("image-gallery"),
					},
					{
						value: "select",
						label: t("selection"),
						subform: {
							def: [
								{
									id: "options",
									label: t("options"),
									type: "composition",
									def: [
										{
											id: "label",
											label: t("label"),
											type: "text",
											required: true,
											onChange: (id, value, reference) => {
												if (reference) {
													if (!reference.value) {
														reference.value = generateId();
													}
												}
											},
										},
									],
								},
							],
						},
					},
					{
						value: "country",
						label: t("country"),
						subform: {
							def: [
								{
									id: "multiple",
									label: t("is-multiple"),
									type: "checkbox",
									default: false,
								},
							],
						},
					},
					{
						value: "stars",
						label: t("stars"),
						subform: {
							def: [
								{
									id: "max",
									label: t("max"),
									type: "number",
									default: 10,
								},
							],
						},
					},
					{
						value: "link",
						label: t("link"),
						subform: {
							def: [
								{
									id: "icon",
									label: t("icon"),
									type: "image",
									required: false,
								},
								{
									id: "url",
									label: t("url"),
									type: "text",
									required: true,
								},
								{
									id: "show_label",
									label: t("show-label"),
									type: "checkbox",
									default: true,
								},
								{
									id: "new_window",
									label: t("open-in-new-window"),
									type: "checkbox",
									default: false,
								},
							],
						},
					},
					{
						value: "entity",
						label: t("entity"),
						subform: {
							def: [
								{
									id: "multiple",
									label: t("is-multiple"),
									type: "checkbox",
									default: false,
								},
								{
									id: "entity",
									label: t("entity-conditions"),
									type: "select",
									options: [],
								},
								{
									id: "integrated",
									label: t("integrated"),
									type: "checkbox",
									default: false,
								},
							],
						},
					},
					Config.getFromCache("module_server_scraping") && {
						value: "scraping",
						label: t("scraping"),
						subform: {
							def: [
								{
									id: "scraping_id",
									label: t("scraping-process"),
									type: "select",
									options: [],
								},
							],
						},
					},
					Config.getFromCache("module_sort_list") && {
						value: "sort-list",
						label: t("Sort list"),
						subform: {
							def: [
								{
									id: "field",
									label: t("sort-list-field"),
									type: "select",
									options: [],
								},
								{
									id: "sort",
									label: t("sort-list-sort"),
									type: "select",
									options: [],
								},
								{
									id: "dir",
									label: t("sort-list-dir"),
									type: "select",
									options: [
										{ value: "asc", label: t("sort-list-asc") },
										{ value: "desc", label: t("sort-list-desc") },
									],
									default: "asc",
								},
							],
						},
					},
				],
				default: "text",
			},
			// {
			// 	id: "public",
			// 	label: t("public"),
			// 	type: "checkbox",
			// 	default: true,
			// },
		],
	};

	const [fieldFormDefinition, setFieldFormDefinition] = useState(
		fieldFormDefinitionInit
	);

	useEffect(() => {
		let newFieldFormDefinition = { ...fieldFormDefinitionInit };
		const initEntityTypes = () => {
			db["entity-types"].toArray().then((data) => {
				let options = data
				.filter((item) => {
					return selectedItem.id === item.item_type || item.item_type === "general";
				})  
				.map((item) => {
					return {
						value: item.id,
						label: item.name,
						subform: {
							def: item.fields,
							field: "fields",
						},
					};
				});
				newFieldFormDefinition.def
					.find((item) => item.id === "type")
					.options.find((item) => item.value === "entity")
					.subform.def.find((item) => item.id === "entity").options = options;
				setFieldFormDefinition(newFieldFormDefinition);
			});
		};
		initEntityTypes();

		
		if (Config.getFromCache("module_server_scraping")) {
			const initScrapingTypes = () => {
				db.scraping
					.where("type")
					.equals("scraping-for-field")
					.toArray()
					.then((data) => {
						let options = data.map((item) => {
							return {
								value: item.id,
								label: item.name,
							};
						});
						newFieldFormDefinition.def
							.find((item) => item.id === "type")
							.options.find((item) => item.value === "scraping")
							.subform.def.find((item) => item.id === "scraping_id").options =
							options;
						setFieldFormDefinition(newFieldFormDefinition);
					});
				db.scraping
					.where("type")
					.equals("scraping-for-link")
					.toArray()
					.then((data) => {
						let options = data.map((item) => {
							return {
								value: item.id,
								label: item.name,
							};
						});
						newFieldFormDefinition.def
							.find((item) => item.id === "type")
							.options.find((item) => item.value === "link")
							.subform.def.push({
								id: "scraping_id",
								label: t("scraping-process"),
								type: "select",
								options: options,
							});
						setFieldFormDefinition(newFieldFormDefinition);
					});
			};	
			initScrapingTypes();
		}
		if (Config.getFromCache("module_sort_list")) {
			const initSortListTypes = () => {
				let options = data.fields.map((item) => {
					return {
						value: item.id,
						label: item.label,
					};
				});
				newFieldFormDefinition.def
					.find((item) => item.id === "type")
					.options.find((item) => item.value === "sort-list")
					.subform.def.find((item) => item.id === "field").options = options;
				newFieldFormDefinition.def
					.find((item) => item.id === "type")
					.options.find((item) => item.value === "sort-list")
					.subform.def.find((item) => item.id === "sort").options = options;
					setFieldFormDefinition(newFieldFormDefinition);
			}
			initSortListTypes();
		}
		if(Config.getFromCache("module_gpt")){
			const initGptTypes = () => {
					newFieldFormDefinition.def.push({
						id: "is_gpt_field",
						label: t("is-gpt-field"),
						type: "checkbox",
						default: false,
						subform: {
							def: [
								{
									id: "field_gpt_text",
									label: t("field-gpt-text"),
									type: "textarea",
									default: "",
								},
							]
						}			
					});
					newFieldFormDefinition.def.push({
						id: "use_for_gpt_query",
						label: t("use-for-gpt-query"),
						type: "checkbox",
						default: false,
					});
				// });
				setFieldFormDefinition(newFieldFormDefinition);
			};
			initGptTypes();
		}

		window.addEventListener("changeRow", initEntityTypes);
	}, [data]);

	const saveRoot = (root) => {
		if (!root || root.name === "") {
			return;
		}
		if (root.id) {
			db[component].update(root.id, root).then(() => {
				setSelectedItem(root);
				setUpdateComponent((prev) => !prev);
			});
		} else {
			db[component].add(root).then((id) => {
				root.id = id;
				setSelectedItem(root);
				setUpdateComponent((prev) => !prev);
			});
		}
	};

	const newTab = () => {
		let newData = {
			...data,
			tabs: [
				...data.tabs,
				{
					label: t("new-tab"),
					visible: "all",
					groups: [
						{
							label: "",
							layout: [],
						},
					],
				},
			],
		};
		setData(newData);
		saveRoot(newData);
	};

	const removeTab = (index) => {
		selectPopup({
			title: t("delete-tab"),
			content: () => <Typography>{t("delete-tab-confirm")}</Typography>,
			btns: [
				{
					label: t("yes"),
					action: () => {
						selectPopup(null);
						const newData = { ...data };
						newData.tabs = newData.tabs.filter((tab, idx) => idx !== index);
						setData(newData);
						saveRoot(newData);
					},
				},
				{
					label: t("no"),
					action: () => selectPopup(null),
					variant: "outlined",
				},
			],
		});
	};

	const addNewGroup = (tabIndex) => {
		const rand = Math.random().toString(36).substring(7);
		const newGroup = {
			label: "",
			layout: [],
		};

		const newData = { ...data };
		newData.tabs[tabIndex].groups = [
			...newData.tabs[tabIndex].groups,
			newGroup,
		];
		setData(newData);
		saveRoot(newData);
	};

	const removeGroup = (groupIndex, tabIndex) => {
		selectPopup({
			title: t("delete-group"),
			content: () => <Typography>{t("delete-group-confirm")}</Typography>,
			btns: [
				{
					label: t("yes"),
					action: () => {
						selectPopup(null);
						const newData = { ...data };
						newData.tabs[tabIndex].groups = newData.tabs[
							tabIndex
						].groups.filter((group, idx) => idx !== groupIndex);
						setData(newData);
						saveRoot(newData);
					},
				},
				{
					label: t("no"),
					action: () => selectPopup(null),
					variant: "outlined",
				},
			],
		});
		saveRoot();
	};

	const addFieldToGroup = (groupIndex, tabIndex) => {
		const rand = Math.random().toString(36).substring(7);
		const newLayoutItem = {
			i: rand,
			x: 0,
			y: 2000,
			w: 12,
			h: 2,
			minW: 1,
			minH: 2,
			maxH: 8,
			label: t("new-field"),
		};

		const newData = { ...data };

		newData.tabs[tabIndex].groups = newData.tabs[tabIndex].groups.map(
			(group, idx) => {
				if (idx === groupIndex) {
					return { ...group, layout: [...group.layout, newLayoutItem] };
				}
				return group;
			}
		);

		let newField = {
			id: rand,
			label: t("new-field"),
			type: "text",
		};

		newData.fields = [...newData.fields, newField];

		setData(newData);
		saveRoot(newData);
	};

	const layoutItemContent = (layout, item) => {
		const field = data.fields.find((f) => f.id === layout.i);
		if (!field || !field.label) {
			return;
		}
		return (
			<Box
				sx={{
					height: "100%",
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
				}}
			>
				<Typography
					className="dragHandle"
					style={{ textAlign: "center", width: "100%" }}
				>
					{t(field.label)} / {t(field.type)}
				</Typography>
				<Tooltip title={t("edit-" + component)}>
					<ModeIcon
						style={{ marginLeft: "auto", marginRight: "12px" }}
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							selectPopup({
								title: t("edit-field"),
								content: () => (
									<FormBuilder
										definition={fieldFormDefinition}
										reference={field}
										onChange={(field, value) => {
											setData({ ...data });
										}}
									/>
								),
								btns: [{ label: "OK", action: () => selectPopup(null) }],
							});
						}}
					/>
				</Tooltip>
				<Tooltip title={t("delete")}>
					<DeleteIcon
						style={{ marginLeft: "auto", marginRight: "12px" }}
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							selectPopup({
								title: t("delete-field"),
								content: () => (
									<Typography>{t("delete-field-confirm")}</Typography>
								),
								btns: [
									{
										label: t("yes"),
										action: () => {
											selectPopup(null);
											const newData = { ...data };
											newData.tabs = newData.tabs.map((tab) => {
												tab.groups = tab.groups.map((group) => {
													group.layout = group.layout.filter(
														(l) => l.i !== layout.i
													);
													return group;
												});
												return tab;
											});
											newData.fields = newData.fields.filter(
												(f) => f.id !== layout.i
											);
											setData(newData);
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
			</Box>
		);
	};

	return (
		<Box className="type-detail">
			<Box sx={{ display: "flex", alignItems: "center" }}>
				{!data.id && (
					<Typography variant="h5">{t("new-type-" + component)}</Typography>
				)}
				{data.id && (
					<Typography variant="h5">{t("edit-type-" + component)}</Typography>
				)}
				{
					//additional fields
					additionalFieldsTitle &&
						additionalFieldsTitle.map((field, index) => {
							return (
								<FormBuilder
									key={index}
									definition={field}
									reference={data}
									className="additional-fields"
									style={{ marginTop: "0px", marginBottom: "0px" }}
								/>
							);
						})
				}
			</Box>
			<FormBuilder
				definition={nameFormDefinition}
				reference={data}
				style={{ marginTop: "20px", marginBottom: "20px" }}
			/>

			<Tabs
				value={tabValue}
				onChange={(event, newValue) => setTabValue(newValue)}
				aria-label="simple tabs example"
				variant="scrollable"
				scrollButtons="auto"
			>
				{data.tabs.map((tab, index) => (
					<Tab
						key={index}
						label={t(tab.label)}
						icon={
							<Box>
								<Tooltip title={t("edit")}>
									<ModeIcon
										onClick={() => {
											selectPopup({
												title: t("edit-item-type"),
												content: () => (
													<FormBuilder
														definition={getTabFormDefinition(true)}
														reference={data.tabs[index]}
														onChange={(field, value) => {
															setData({ ...data });
														}}
													/>
												),
												btns: [
													{ label: "OK", action: () => selectPopup(null) },
												],
											});
										}}
									/>
								</Tooltip>
								<Tooltip title={t("delete")}>
									<DeleteIcon onClick={() => removeTab(index)} />
								</Tooltip>
							</Box>
						}
						iconPosition="end"
						{...a11yProps(index)}
					/>
				))}
				<Tab
					label={t("add")}
					icon={<AddIcon />}
					iconPosition="start"
					onClick={newTab}
					{...a11yProps(data.tabs.length)}
				/>
			</Tabs>
			{data.tabs.map((tab, tabIndex) => (
				<CustomTabPanel key={tabIndex} value={tabValue} index={tabIndex}>
					{tab.groups.map((group, groupIndex) => (
						<Box key={groupIndex} sx={{ marginBottom: "30px" }}>
							<Box sx={{ display: "flex" }}>
								<Typography
									variant="h7"
									style={{
										color: group.label ? "black" : "gray",
										lineHeight: "32px",
									}}
								>
									{group.label ? t(group.label) : t("no-title")}
								</Typography>
								<Tooltip title={t("edit")}>
									<ModeIcon
										style={{ marginTop: "8px" }}
										onClick={() => {
											selectPopup({
												title: t("edit-group"),
												content: () => (
													<FormBuilder
														definition={getLabelFormDefinition(false, [
															{
																id: "group-sticky",
																label: t("group-sticky"),
																type: "checkbox",
																default: false,
															},
														])}
														reference={data.tabs[tabIndex].groups[groupIndex]}
														onChange={(field, value) => {
															setData({ ...data });
														}}
													/>
												),
												btns: [
													{ label: "OK", action: () => selectPopup(null) },
												],
											});
										}}
									/>
								</Tooltip>
								<Tooltip title={t("delete")}>
									<DeleteIcon
										style={{ marginTop: "8px" }}
										onClick={() => removeGroup(groupIndex, tabIndex)}
									/>
								</Tooltip>
								<Tooltip title={t("add-new-field")}>
									<Button
										variant="subtitle"
										color="primary"
										onClick={() => addFieldToGroup(groupIndex, tabIndex)}
										style={{ marginLeft: "auto" }}
									>
										<AddIcon />
										{t("field")}
									</Button>
								</Tooltip>
							</Box>
							<DynamicGrid
								layout={group.layout}
								onLayoutChange={(layout) => {
									let data_copy = { ...data };
									data_copy.tabs[tabIndex].groups[groupIndex].layout = layout;
									setData(data_copy);
									saveRoot(data_copy);
								}}
								layoutItemContent={layoutItemContent}
							/>
						</Box>
					))}
					<Button
						variant="contained"
						color="primary"
						style={{ marginTop: "30px" }}
						onClick={() => addNewGroup(tabIndex)}
					>
						{t("add-new-group")}
					</Button>
				</CustomTabPanel>
			))}
			<Box>
				{component === "types" && (
					<Tooltip title={t("sources-data")}>
						<Button
							className="api-icon"
							variant="contained"
							color="primary"
							style={{ marginTop: "20px", cursor: "pointer" }}
							onClick={async () => {
								let sources = data.sources || [];
								let sourcesDB = await db["sources"].toArray();
								sourcesDB = sourcesDB.filter((item) => {
									return item.item_type === data.id;
								});
								let has_scraping = Config.getFromCache("module_server_scraping");
								if (has_scraping) {
									// let scraping = await db["scraping"].where("type").equals("scraping-for-item").toArray();
									let scraping = await db["scraping"].toArray();
									scraping = scraping.filter((item) => {
										return item.type === "scraping-for-item" || item.type === "scraping-for-item-from-list";
									});
									if (scraping) {
										scraping.forEach((item) => {
											sourcesDB.push({
												id: "scraping_" + item.id,
												name: item.name + " [Scraping]",
												active: true,
												requests: [
													{
														keys_json: Object.keys(item.processResults.results[0]),
													}
												]
											});
										});
									}
								}
								let tabSourceValue = 0;
								let popupDef = {
									title: t("sources-data"),
									content: () => {
										//add fields new to sources
										for (let i = 0; i < sources.length; i++) {
											if (!sources[i].fields) {
												sources[i].fields = [];
											}
											//has source id name
											if (!sources[i].fields.find((f) => f.id === "name")) {
												sources[i].fields.unshift({
													id: "name",
													label: t("name"),
													type: "text",
												});
											}
											for (let j = 0; j < data.fields.length; j++) {
												if (
													!sources[i].fields.find(
														(f) => f.id === data.fields[j].id
													)
												) {
													sources[i].fields.push({ ...data.fields[j] });
												}
											}
										}
										return (
											<Box>
												<Tabs
													value={tabSourceValue}
													onChange={(event, newValue) => {
														tabSourceValue = newValue;
														updatePopup();
													}}
													aria-label="simple tabs example"
													variant="scrollable"
													scrollButtons="auto"
												>
													{sources.map((item, index) => (
														<Tab
															key={index}
															icon={
																<Box>
																	<Tooltip title={t("delete")}>
																		<DeleteIcon
																			onClick={() => {
																				sources = sources.filter(
																					(source, idx) => idx !== index
																				);
																				const newData = { ...data };
																				newData.sources = sources;
																				setData(newData);
																				selectPopup(null);
																				setTimeout(() => {
																					selectPopup(popupDef);
																				}, 1);
																				db.types.update(data.id, newData);
																			}}
																		/>
																	</Tooltip>
																</Box>
															}
															iconPosition="end"
															label={
																<Select
																	value={item.source}
																	onChange={(event) => {
																		sources[index].source = event.target.value;
																		const newData = { ...data };
																		newData.sources = sources;
																		setData(newData);
																		updatePopup();
																	}}
																>
																	{sourcesDB.map((source) => (
																		<MenuItem key={source.id} value={source.id}>
																			{source.name}
																		</MenuItem>
																	))}
																</Select>
															}
															{...a11yProps(index)}
														/>
													))}
													<Tab
														label={t("add")}
														icon={<AddIcon />}
														iconPosition="start"
														onClick={() => {
															sources.push({ source: "" });
															const newData = { ...data };
															newData.sources = sources;
															setData(newData);
															selectPopup(null);
															setTimeout(() => {
																selectPopup(popupDef);
															}, 1);
															db.types.update(data.id, newData);
														}}
														{...a11yProps(
															data.sources ? data.sources.length : 0
														)}
													/>
												</Tabs>
												{sources.map((tabSource, tabSourceIndex) => {
													if (
														!tabSource.fields ||
														tabSource.fields.length === 0
													) {
														tabSource.fields = [...data.fields] || [];
														if (
															!tabSource.fields.find((f) => f.id === "name")
														) {
															tabSource.fields.unshift({
																id: "name",
																label: t("name"),
																type: "text",
															});
														}
													}
													let menuItems = [];
													if (
														sourcesDB &&
														sourcesDB.find(
															(source) => source.id === tabSource.source
														) &&
														sourcesDB.find(
															(source) => source.id === tabSource.source
														).requests
													) {
														menuItems = sourcesDB
															.find((source) => source.id === tabSource.source)
															.requests.map((request) => {
																return request.keys_json.map((key) => {
																	return key;
																});
															});
														menuItems = [].concat.apply([], menuItems);
													}

													return (
														<CustomTabPanel
															key={tabSourceIndex}
															value={tabSourceValue}
															index={tabSourceIndex}
														>
															{tabSource.source == "" && (
																<Typography>
																	{t("select-source-empty")}
																</Typography>
															)}
															{tabSource.source !== "" &&
																tabSource.fields.map((field, fieldIndex) => {
																	return (
																		<Box
																			key={fieldIndex}
																			sx={{ marginBottom: "30px" }}
																		>
																			<Typography>{field.label}</Typography>
																			<Select
																				value={field.selector}
																				style={{ width: "100%" }}
																				onChange={(event) => {
																					const field =
																						sources[tabSourceIndex].fields[
																							fieldIndex
																						];
																					sources[tabSourceIndex].fields[
																						fieldIndex
																					] = { ...field };
																					sources[tabSourceIndex].fields[
																						fieldIndex
																					].selector = event.target.value;
																					const newData = { ...data };
																					newData.sources = sources;
																					setData(newData);
																					updatePopup();
																					db.types.update(data.id, newData);
																				}}
																			>
																				<MenuItem value="">
																					<em>{t("none")}</em>
																				</MenuItem>
																				{menuItems.map((item) => {
																					return (
																						<MenuItem key={item} value={item}>
																							{item}
																						</MenuItem>
																					);
																				})}
																			</Select>
																			<TextField
																				style={{
																					display:
																						field.selector &&
																						field.selector !== "" &&
																						field.selector.match(/\[.*\]/)
																							? "block"
																							: "none",
																					marginTop: "10px",
																					width: "100%",
																				}}
																				label={t("filter-array")}
																				value={field.filter}
																				onChange={(event) => {
																					const field =
																						sources[tabSourceIndex].fields[
																							fieldIndex
																						];
																					sources[tabSourceIndex].fields[
																						fieldIndex
																					] = { ...field };
																					sources[tabSourceIndex].fields[
																						fieldIndex
																					].filter = event.target.value;
																					const newData = { ...data };
																					newData.sources = sources;
																					setData(newData);
																					updatePopup();
																					db.types.update(data.id, newData);
																				}}
																			/>
																			{((!field.selector ||
																				field.selector === "" ||
																				!field.transform) && (
																				<Typography
																					style={{ marginTop: "10px" }}
																					onClick={() => {
																						field.transform =
																							"function (value) {\n\treturn value;\n}";
																						updatePopup();
																					}}
																				>
																					{t("create-transform-function")}
																				</Typography>
																			)) || (
																				<Typography
																					style={{ marginTop: "10px" }}
																				>
																					{t("transform-function")}
																				</Typography>
																			)}
																			<TextField
																				id={`transform-${fieldIndex}`}
																				style={{
																					marginTop: "10px",
																					width: "100%",
																					display:
																						field.selector &&
																						field.selector !== "" &&
																						field.transform
																							? "block"
																							: "none",
																				}}
																				size="large"
																				onKeyDown={(event) => {
																					event.stopPropagation();
																				}}
																				value={field.transform}
																				multiline
																				rows={4}
																				onChange={(event) => {
																					const field =
																						sources[tabSourceIndex].fields[
																							fieldIndex
																						];
																					sources[tabSourceIndex].fields[
																						fieldIndex
																					] = { ...field };
																					sources[tabSourceIndex].fields[
																						fieldIndex
																					].transform = event.target.value;
																					const newData = { ...data };
																					newData.sources = sources;
																					setData(newData);
																					updatePopup();
																					db.types.update(data.id, newData);
																				}}
																			/>
																		</Box>
																	);
																})}
														</CustomTabPanel>
													);
												})}
											</Box>
										);
									},
									btns: [
										{
											label: t("ok"),
											action: () => selectPopup(null),
										},
									],
								};
								selectPopup(popupDef);
							}}
						>
							<ApiIcon style={{ marginRight: "10px" }} />
							{t("sources-data")}
						</Button>
					</Tooltip>
				)}
			</Box>
		</Box>
	);
}




export default TypeDetail;