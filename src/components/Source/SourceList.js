import React from 'react';

import { useTranslation } from 'react-i18next';

import db from '../../services/db';

import { selectDetail } from '../../services/helper';

import { AppContext } from "../../services/context";

import TypeList from "../Type/TypeList";

import Title from '../layout/Title';
import TitleButtons from '../layout/TitleButtons';

import Box from '@mui/material/Box';

export default function SourceList() {
  const { t } = useTranslation();

  const { updateComponent, itemListConfig, selectComponent } =
		React.useContext(AppContext);

  const [sources, setSources] = React.useState([]);

	const [title, setTitle] = React.useState("");

	React.useEffect(() => {
		db.types.get(itemListConfig.typeSelected).then((data) => {
			setTitle(t("sources") + " " + data.name);
		});
	}, []);

  React.useEffect(() => {
		db.sources.toArray().then((data) => {
			setSources(data);
		});
	}, [updateComponent]);

  const btns = [
		{
			label: t("new/a"),
			action: () => {
				selectDetail("sources", "new");
			},
			key: "alt_n",
		},
	];

  return (
		<TypeList set_title={title} component="sources" dragdrop={false} female={true} filterFunction={(item) => {
			return item.item_type === itemListConfig.typeSelected;
		}}
		back_action={() => selectComponent("types")}
	/>
	);












}