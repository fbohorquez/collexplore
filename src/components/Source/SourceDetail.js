import React, { useContext, useEffect, useState } from "react";


import { XMLParser } from "fast-xml-parser";


import {
	Box,
	Typography,
	Button,
	Tabs,
	Tab,
  Tooltip,
} from "@mui/material";

import FormBuilder from "../FormBuilder";
import db from "../../services/db";
import PropTypes from "prop-types";

import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import {
	selectPopup,
	replaceKeysInValues,
	refreshListData,
} from "../../services/helper";

import { useTranslation } from 'react-i18next';

import i18n from "../../services/i18n";

import { AppContext } from "../../services/context";
import { AppContextDetail } from "../../services/context_detail";


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
				<Box sx={{ p: 3, pt: 0 }}>
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

function runRequest(data, concat_data, indexLast, indexCurrent, callback) {
	let headers = {};
  let request = data.requests[indexCurrent];
  concat_data = {...concat_data, ...request};
	concat_data = replaceKeysInValues(concat_data);
	if (concat_data.headers) {
		concat_data.headers.split("\n").forEach((line) => {
			let [key, value] = line.split(":");
			if (!key || !value) return;
			headers[key.trim()] = value.trim();
		});
	}
	let body = {};
	if (concat_data.body) {
		try {
			body = JSON.parse(concat_data.body);
		} catch (e) {
			console.error(e);
		}
	}
	let request_options = {
		method: concat_data.method,
		headers: headers,
	};
	if (concat_data.method !== "GET") {
		request_options.body = JSON.stringify(body);
	}
  if (concat_data.url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
    return callback([(indexCurrent + 1) + ":img"]);
  }

	fetch(concat_data.url, request_options)
		.then((response) => {
      const contentType = response.headers.get("content-type");
			if (contentType && (contentType.includes("application/xml") || contentType.includes("text/xml"))) {
				return response.text().then((str) => {
					const parser = new XMLParser({
						ignoreAttributes: false,
						attributeNamePrefix: "@_",
					});
					return parser.parse(str);
				});
			} else {
				return response.json();
			}
    })
		.then((resp) => {
      if (indexCurrent === indexLast) {
        let keys_json = [];
        selectPopup({
          title: i18n.t("validate"),
          content: () => (
            <Box>
              <Typography>{i18n.t("source-validate-select-json")}</Typography>
              <FormBuilder
                definition={{
                  ondemand: false,
                  reference: true,
                  root: keys_json,
                  def: [
                    {
                      id: "json",
                      label: i18n.t("JSON"),
                      type: "JSONKeys",
                      json: resp,
                    },
                  ],
                }}
                reference={keys_json}
                style={{
                  marginTop: "20px",
                  marginBottom: "20px",
                }}
              />
            </Box>
          ),
          btns: [
            {
              label: i18n.t("ok"),
              action: () => {
                let resp = keys_json.json.map((key) => (indexCurrent + 1) + ":" + key);
                callback(resp);
              },
            },
            {
              label: i18n.t("cancel"),
              action: () => {
                selectPopup(null);
              },
              variant: "outlined",
            },
          ],
        });
      }else {
        if (request.keys_json) {
					let values = {};
					for (let key of request.keys_json) {
            let [req_index, subkey] = key.split(":");
            key = subkey;
						let keys = key.split(".");
						let value = resp;
						for (let i = 0; i < keys.length; i++) {
							if (keys[i].includes("[")) {
								let [k, index] = keys[i].split("[");
								index = index.replace("]", "");
								value = value[k][index];
							} else {
								value = value[keys[i]];
							}
						}
						values[req_index + ":" + key] = value;
					}
					concat_data = { ...concat_data, ...values };
				}
        runRequest(data, concat_data, indexLast, indexCurrent + 1, callback);
      }
		});
}

export default function SourceDetail() {
  const component = "sources";

	const { selectedItem, setSelectedItem } = useContext(AppContextDetail);

	const { t } = useTranslation();

	const generateDataInit = () => {
		return {
			name: "",
			active: true,
			api_key: "",
			requests: [
				{
					url: "",
					headers: "",
					method: "GET",
					body: "",
					validate: false,
				},
			],
		};
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

	

	const nameFormDefinitionInit = {
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
      {
        id: "api_key",
        label: t("api_key"),
        type: "text",
        labelPosition: "top",
        // help: t("source-api-key-help"),
      },
			{
				id: "selectors_naming",
				label: t("selectors-naming"),
				type: "text",
				labelPosition: "top",
			},
			{
				id: "is_list_generator",
				label: t("is-list-generator"),
				type: "checkbox",
				subform: {
					def: [
						{
							id: "activator",
							label: t("activator"),
							type: "text",
						},
						{
							id: "sources_map",
							label: t("use-map-of-sources"),
							type: "select",
							default: "none",
							options: [
								{ value: "none", label: t("none") },
							],
						},
						{
							id: "source_fields_map",
							label: t("source-fields-map"),
							type: "textarea",

						}
					],
				},
			}
		],
	};

	const [nameFormDefinition, setNameFormDefinition] = useState(nameFormDefinitionInit);

	useEffect(() => {
		let options = [{
			value: "none",
			label: t("none"),
		}];
		db.types.get(data.item_type).then((type) => {
			if (type.sources) {
				let sourcesType = type.sources;
				db.sources.toArray().then((sources) => {
					sources = sources.filter((source) => source.item_type === data.item_type && sourcesType.findIndex(function (item) { return item.source === source.id; }) !== -1);
					for (let i = 0; i < sources.length; i++) {
						options.push({
							value: sources[i].id,
							label: sources[i].name,
						});
					}
					let nameFormDefinitioCP = { ...nameFormDefinitionInit };
					nameFormDefinitioCP.def[3].subform.def[1].options = options;
					setNameFormDefinition(nameFormDefinitioCP);
				});
			}
		});
		
	}, []);
			


  const requestFormDefinition = {
		ondemand: false,
		reference: true,
		document: component,
		root: data,
		def: [
			{
				id: "url",
				label: t("url"),
				type: "text",
				// help: t("source-api-url-help"),
			},
			{
				id: "headers",
				label: t("headers"),
				type: "textarea",
				// help: t("source-api-headers-help"),
			},
			{
				id: "method",
				label: t("method"),
				type: "select",
				default: "GET",
				options: [
					{ value: "GET", label: "GET" },
					{
						value: "POST",
						label: "POST",
						subform: {
							def: [
								{
									id: "body",
									label: t("body"),
									type: "textarea",
									// help: t("source-api-body-help"),
								},
							],
						},
					},
				],
				// help: t("source-api-method-help"),
			},
			{
				id: "unique",
				label: t("unique"),
				type: "checkbox",
				// help: t("source-api-single-help"),
			},
		],
	};

  const [tabValue, setTabValue] = useState(0);


	const newTab = () => {
		let newData = {
			...data,
			requests: [
				...data.requests,
				{
					url: "",
          headers: "",
          method: "GET",
          body: "",
          validate: false,
				},
			],
		};
		setData(newData);
		// saveRoot(newData);
	};

	const removeTab = (index) => {
		selectPopup({
			title: t("delete-request"),
			content: () => <Typography>{t("delete-request-confirm")}</Typography>,
			btns: [
				{
					label: t("yes"),
					action: () => {
						selectPopup(null);
						const newData = { ...data };
						newData.requests = newData.requests.filter(
							(tab, idx) => idx !== index
						);
						setData(newData);
						db.sources.update(data.id, newData);
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

	React.useEffect(() => {
			setTabValue(0);
	}, [selectedItem]);

	const { itemListConfig } = useContext(AppContext);

	const [optionMap, setOptionMap] = React.useState([]);

	useEffect(() => {
		let options = [];
		db.types
			.orderBy("order")
			.toArray()
			.then((data) => {
				for (let i = 0; i < data.length; i++) {
					if (!data[i].active) {
						continue;
					}
					options.push({ value: data[i].id, label: data[i].name });
				}
				setOptionMap(options);
			});
	}, []);


	let additionalFieldsTitle = [
		{
			ondemand: false,
			reference: true,
			document: "sources",
			def: [
				{
					id: "item_type",
					label: t("item-type"),
					type: "select",
					labelPosition: "none",
					options: optionMap,
					default: itemListConfig.typeSelected,
					onChange: (value) => {
						refreshListData();
					},
				},
			],
		},
	];

	return (
		<Box className="source-detail">
			<Box style={{ display: "flex"}}>
				{!data.id && (
					<Typography variant="h5">{t("new-" + component)}</Typography>
				)}
				{data.id && (
					<Typography variant="h5">{t("edit-" + component)}</Typography>
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
				onChange={(field, value) => {
					if (data.id) {
						data[field] = value;
						data.validate = false;
						db.sources.update(data.id, data);
						setData({ ...data });
					}
					else {
						data.validate = false;
						db.sources.add(data).then((id) => {
							data.id = id;
							setData({ ...data });
						});
					}
				}}
			/>
			<Tabs
				value={tabValue}
				onChange={(event, newValue) => setTabValue(newValue)}
				aria-label="simple tabs example"
				variant="scrollable"
				scrollButtons="auto"
			>
				{data.requests &&
					data.requests.map((tab, index) => (
						<Tab
							key={index}
							label={t("request") + " " + (index + 1)}
							icon={
								<Box>
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
				/>
			</Tabs>
			{data.requests &&
				data.requests.map((request, tabIndex) => (
					<CustomTabPanel key={tabIndex} value={tabValue} index={tabIndex}>
						<FormBuilder
							definition={requestFormDefinition}
							reference={request}
							style={{ marginTop: "20px", marginBottom: "20px" }}
							onChange={(field, value) => {
								request[field] = value;
								request.validate = false;
								data.requests[tabIndex] = request;
								setData({ ...data });
								db.sources.update(data.id, data);
							}}
						/>
						<Box style={{ marginTop: "80px" }}>
              <Typography>{t("source-response-keys")}</Typography>
							{request.keys_json &&
								request.keys_json.map((key, index) => (
									<Box
										key={index}
										style={{ display: "flex", justifyContent: "space-between", marginLeft: "20px" }}
									>
										<Typography>{key}</Typography>
									</Box>
								))}
						</Box>
						<Button
              style={{ marginTop: "20px" }}
							onClick={() => {
								let validate_form_data = {};
                selectPopup({
                  title: "",
                  content: () => (
                    <FormBuilder
                      definition={{
                        ondemand: false,
                        reference: true,
                        root: validate_form_data,
                        def: [
                          {
                            id: "search",
                            label: t("search-txt"),
                            type: "text",
                          },
                        ],
                      }}
                      reference={validate_form_data}
                      style={{ marginTop: "20px", marginBottom: "20px" }}
                    />
                  ),
                  btns: [
                    {
                      label: t("validate"),
                      action: async () => {

                        
                        let data_request = { ...request };
                        if (!data_request.method) {
                          data_request.method = "GET";
                        }
                        data_request.search = validate_form_data.search;
                        data_request.lang = i18n.language;
                        data_request.api_key = data.api_key;

                        runRequest(data, data_request, tabIndex, 0, (keys_json) => {
                          request.validate = true;
													request.keys_json = keys_json;
													data.requests[tabIndex] = request;
													setData({ ...data });
													db.sources.update(data.id, data);
													selectPopup(null);
                        });
                      },
                    },
                    {
                      label: t("cancel"),
                      action: () => {
                        selectPopup(null);
                      },
                      variant: "outlined",
                    },
                  ],
                });
								
							}}
							variant="contained"
							color="primary"
							disabled={data.validate}
						>
							{t("source-set-response-keys")}
						</Button>
					</CustomTabPanel>
				))}
		</Box>
	);
























































}