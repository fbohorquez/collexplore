import React, {
	useEffect,
	useReducer,
	useRef,
	useState,
	useContext,
} from "react";

import { useTranslation } from "react-i18next";

import {
	openDialog,
} from "../../../services/helper";

const sanatizeStr = (str) => {
  return str.replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ü/g, "u");
}

const exludeFromName = (word) => {
  let exclude = ["de", "del", "la", "el", "los", "las", "en", "a", "con", "y", "o", "u", "ni", "que", "si", "no", "pero",];
  return exclude.includes(word);
}

export const ListSearchEvent = ({
	isGrouped,
	sortedGroups,
	sortedItems,
	virtuosoRef,
	onClick,
	setSelectedIndex,
	selectedIndex,
}) => {
	const { t } = useTranslation();
	const [lastSearchScroll, setLastSearchScroll] = useState(null);
	const [indexLastSearchScroll, setIndexLastSearchScroll] = useState(-1);

	const handleSearch = (text, altKey, key, forceIndex) => {
		let indexLastSearchScrollCP =
			typeof forceIndex != "undefined" ? forceIndex : indexLastSearchScroll;
		if (text !== lastSearchScroll) {
			setLastSearchScroll(text);
			if (indexLastSearchScrollCP !== -1) {
				setIndexLastSearchScroll(-1);
				indexLastSearchScrollCP = -1;
			}
		}
		if (text === "") {
			return;
		}
		if (isGrouped && false ) {
			const flattenedItems = [];
			let targetGroup = null;
			sortedGroups.forEach((group, groupIndex) => {
				flattenedItems.push({ type: "group", groupKey: group.groupKey });
				group.items.forEach((item) => {
					flattenedItems.push({ type: "item", item });
				});
			});

			// let startIndex = indexLastSearchScrollCP + 1;
			let startIndex = forceIndex ? forceIndex : selectedIndex + (key === "Enter" ? 1 : -1);
			if (altKey) {
				startIndex = startIndex - 2;
			}

			let itemInGroup = false;

			for (
				let groupIndex = startIndex;
				groupIndex < sortedGroups.length;
				groupIndex++
			) {
				const group = sortedGroups[groupIndex];
				if (group) {
					const itemIndex = group.items.findIndex(
						(item) =>
							item.name &&
							sanatizeStr(item.name.toLowerCase()).includes(
								sanatizeStr(text.toLowerCase())
							)
					);
					if (itemIndex !== -1) {
						itemInGroup = group.items[itemIndex];
						targetGroup = group;
						break;
					}
				}
			}

			if (targetGroup) {
				const groupIndex = sortedGroups.findIndex(
					(group) => group.groupKey === targetGroup.groupKey
				);

				setIndexLastSearchScroll(groupIndex);
				if (groupIndex !== -1 && virtuosoRef.current) {
					setIndexLastSearchScroll(groupIndex);
					setSelectedIndex(groupIndex);
					if (!document.body.classList.contains("group-edition")) {
						onClick(itemInGroup, true, altKey);
					}
					setTimeout(() => {
						setTimeout(() => {
							virtuosoRef.current.scrollToIndex({
								index: groupIndex,
							});
						}, 10);
						virtuosoRef.current.scrollToIndex({
							index: selectedIndex,
						});
					}, 500);
				}
			} else {
				setIndexLastSearchScroll(-1);
				if (typeof forceIndex === "undefined") {
					handleSearch(text, altKey, key, -1);
				} else {
					setLastSearchScroll(null);
					openDialog("", t("item-not-found"), 4000);
				}
			}
		} else {
			// let startIndex = indexLastSearchScrollCP;
			let startIndex = forceIndex ? forceIndex : selectedIndex + (key === "Enter" ? 1 : -1);
			if (altKey) {
				startIndex = startIndex - 1;
			}

			let sortedItemsCopy = sortedItems.slice(startIndex + 1);

			let index = sortedItemsCopy.findIndex((i) => {
				let allowed = true;
				if (i.item) {
					allowed = i.type === "item";
					i = i.item;
				}
				return (
					allowed &&
					i.name &&
					sanatizeStr(i.name.toLowerCase()).includes(
						sanatizeStr(text.toLowerCase())
					)
				);
			}); //search in name exactly

			if (index === -1) {
				index = sortedItemsCopy.findIndex((i) => {
					let words = sanatizeStr(text.toLowerCase()).split(" ");
					let all = true;
					words.forEach((word) => {
						if (!i.name) {
							all = false;
							return;
						}
						if (i.item) {
							i = i.item;
						}
						if (all && !sanatizeStr(i.name.toLowerCase()).includes(word)) {
							all = false;
						}
					});
					return all;
				}); //search in name by words
			}

			if (index === -1) {
				index = sortedItemsCopy.findIndex((i) => {
					if (i.item) {
						i = i.item;
					}
					let words = text.toLowerCase();
					words = sanatizeStr(words);
					words = words.split(" ");
					let all = true;
					let items_fields_concat = "";
					const concatFields = (item) => {
						if (item instanceof Blob) {
							return;
						}
						if (typeof item === "object") {
							if (!item) {
								return;
							}
							if (item.name) {
								items_fields_concat += sanatizeStr(item.name);
								return;
							}
							for (let key in item) {
								if (typeof item[key] === "object") {
									concatFields(item[key]);
								} else {
									items_fields_concat += item[key];
								}
							}
						} else if (Array.isArray(item)) {
							item.forEach((i) => {
								concatFields(i);
							});
						} else {
							items_fields_concat += item;
						}
					};
					concatFields({ ...i.fields, ...i.cache });
					let inname = false;
					words.forEach((word) => {
						if (!i.name) {
							all = false;
							return;
						}
						let nameSanatized = sanatizeStr(i.name.toLowerCase());
						if (
							all &&
							!(
								nameSanatized.includes(word) ||
								items_fields_concat.toLowerCase().includes(word)
							)
						) {
							all = false;
						}
						if (all && i.name.toLowerCase().includes(word)) {
							if (!exludeFromName(word)) {
								inname = true;
							} else {
								return;
							}
						}
						if (
							all &&
							items_fields_concat.toLowerCase().includes(word) &&
							!inname
						) {
							all = false;
						}
					});
					return all && inname;
				}); //search in name and fields by words
			}

			if (index !== -1 && virtuosoRef.current) {
				index += startIndex + 1;
				let item = sortedItems[index];
				if (item.item) {
					item = item.item;
				}
				setIndexLastSearchScroll(index);
				// if (!document.body.classList.contains("group-edition")) {
				onClick(item, true, altKey);
				// }
				setTimeout(() => {
					setSelectedIndex(index);
					virtuosoRef.current.scrollToIndex({ index });
				}, 10);
			} else {
				setIndexLastSearchScroll(-1);
				if (forceIndex !== -1) {
					handleSearch(text, altKey, key, -1);
				} else {
					setLastSearchScroll(null);
					openDialog("", t("item-not-found"), 4000);
				}
			}
		}
	};

	useEffect(() => {
		setLastSearchScroll(null);
		setIndexLastSearchScroll(-1);
	}, [sortedItems, sortedGroups, isGrouped]);

	useEffect(() => {
		document.querySelectorAll(".virtuoso-grid-list .list-grid-item-envolve.search").forEach((item) => {
			item.classList.remove("search");
		});
		const handleSearchEvent = (event) => {
			const {txt:searchString, altKey, key} = event.detail;
			handleSearch(searchString, altKey, key);
		};

		window.addEventListener("search", handleSearchEvent);

		return () => {
			window.removeEventListener("search", handleSearchEvent);
		};
	}, [sortedItems, sortedGroups, isGrouped, selectedIndex, indexLastSearchScroll, lastSearchScroll]);

	return null;
















};