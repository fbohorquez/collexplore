import React, { useContext, useEffect, useState } from "react";

import { XMLParser } from "fast-xml-parser";

import { Box, Typography, Button, Tabs, Tab, Tooltip } from "@mui/material";

import FormBuilder from "../FormBuilder";
import db from "../../services/db";
import PropTypes from "prop-types";

import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
	printResultsRecursively,
	printResults,
	generateIdentifier,
  
} from "../../services/scraping_helper";

import {
	selectPopup,
	replaceKeysInValues,
	refreshListData,
} from "../../services/helper";

import { useTranslation } from "react-i18next";

import i18n from "../../services/i18n";

import { AppContext } from "../../services/context";
import { AppContextDetail } from "../../services/context_detail";

export default function ScrapingObjectDetail() {
	const component = "scraping-object";

	const { selectedItem, setSelectedItem } = useContext(AppContextDetail);

	const { t } = useTranslation();

	const [data, setData] = useState(selectedItem);
	setSelectedItem(selectedItem);

	useEffect(() => {
		setData(selectedItem);
	}, [selectedItem]);

	return (
		<Box className="scraping-object-detail">
			<Box style={{ display: "flex" }}>
				{data.id && (
					<Typography variant="h5">{t("edit-" + component)}</Typography>
				)}
			</Box>
			<FormBuilder
				definition={{
          ondemand: false,
          reference: true,
          root: data,
          def: [
            {
              id: "name",
              label: t("name"),
              type: "text",
              required: true,
            },
          ],
        }}
				reference={data}
				style={{ marginTop: "20px", marginBottom: "20px" }}
			/>
      {data.id && data.items && data.items.length > 0 && (
        <Box className="form-scraping-object">
          <Typography variant="h6">{t("items")}</Typography>
          <Box className="form-scraping">
            {printResultsRecursively(data.items, 1, null, (itemProcess) => (
              <Tooltip title={t("delete")}>
                <Button
                  onClick={(e) => {
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
                            setData({
															...data,
															items: data.items.filter(
																(item) =>
																	generateIdentifier(item) !==
																	generateIdentifier(itemProcess)
															),
														});
                            db.scrapingObjects.update(data.id, {
															items: data.items.filter(
																(item) =>
																	generateIdentifier(item) !==
																	generateIdentifier(itemProcess)
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
                >
                  <DeleteIcon />
                </Button>
              </Tooltip>
            ), data)}
          </Box>
        </Box>
      )}
		</Box>
	);
}








