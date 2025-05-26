import update from "immutability-helper";
import { useCallback, useState } from "react";
import { SortableCard } from "./SortableCard.js";
import { SortableLabel } from "./SortableLabel.js";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { useTranslation } from "react-i18next";

function Sortable({
  options = [],
  value = [],
  onChange,
}) {

    

    let initSelected = [];
    let initAllowed = [];
    
    for (let i = 0; i < value.length; i++) {
      let option = options.find((option) => option.value === value[i]);
      if (option) {
        initSelected.push(option);
      }
    }
    for (let i = 0; i < options.length; i++) {
			if (value.indexOf(options[i].value) === -1) {
				initAllowed.push(options[i]);
			}
		}
    const { t } = useTranslation();


    const [cardsSelected, setCardsSelected] = useState(initSelected);

    const [cardsAllowed, setCardsAllowed] = useState(initAllowed);

    const moveCard = useCallback(
			(dragIndex, hoverIndex) => {
				const [type_drag, id_drag_str] = dragIndex.split("_");
				const [type_hover, id_hover_str] = hoverIndex.split("_");
				const id_drag = parseInt(id_drag_str, 10);
				let id_hover = parseInt(id_hover_str, 10);

        if (id_drag === "label") {
          return;
        }

				if (type_drag === type_hover) {
					const setCards =
						type_drag === "selected" ? setCardsSelected : setCardsAllowed;
					const cards = type_drag === "selected" ? cardsSelected : cardsAllowed;
          const to_type = type_hover === "selected" ? "selected" : "allowed";
					let dragCard = cards[id_drag];
					let newCards = update(cards, {
						$splice: [[id_drag, 1]],
					});
					newCards = update(newCards, {
						$splice: [[id_hover, 0, dragCard]],
					});
					setCards(newCards);
          if (to_type === "selected") {
            onChange(newCards.map((card) => card.value));
          }
				}
        else if (type_drag === "selected" && type_hover === "allowed") {
          let dragCard = cardsSelected[id_drag];
          let newCardsSelected = update(cardsSelected, {
            $splice: [[id_drag, 1]],
          });
          let newCardsAllowed = update(cardsAllowed, {
            $splice: [[id_hover, 0, dragCard]],
          });
          setCardsSelected(newCardsSelected);
          setCardsAllowed(newCardsAllowed);
          let newValues = [];
          for (let i = 0; i < newCardsSelected.length; i++) {
            newValues.push(newCardsSelected[i].value);
          }
          onChange(newValues);
        }
        else if (type_drag === "allowed" && type_hover === "selected") {
          let dragCard = cardsAllowed[id_drag];
          let newCardsAllowed = update(cardsAllowed, {
            $splice: [[id_drag, 1]],
          });
          let newCardsSelected = update(cardsSelected, {
            $splice: [[id_hover, 0, dragCard]],
          });
          setCardsSelected(newCardsSelected);
          setCardsAllowed(newCardsAllowed);
          let newValues = [];
          for (let i = 0; i < newCardsSelected.length; i++) {
            newValues.push(newCardsSelected[i].value);
          }
          onChange(newValues);
        }
        
			},
			[cardsSelected, cardsAllowed, setCardsSelected, setCardsAllowed]
		);

    const moveCardToEmpty = useCallback(
      (dragIndex, hoverIndex) => {
        
        if (typeof dragIndex === "string" && dragIndex.indexOf("_") !== -1) {
          const hover_type = hoverIndex.replace("_label", "");
          let [type_drag, id_drag_str] = dragIndex.split("_");
          if (hover_type === type_drag) {
						return;
					}
          if (id_drag_str === "label") {
						return;
					}
          let from = type_drag === "selected" ? cardsSelected : cardsAllowed;
          let from_set = type_drag === "selected" ? setCardsSelected : setCardsAllowed;
          let from_type = type_drag === "selected" ? "selected" : "allowed";
          let to = type_drag === "selected" ? cardsAllowed : cardsSelected;
          let to_set = type_drag === "selected" ? setCardsAllowed : setCardsSelected;
          let to_type = type_drag === "selected" ? "allowed" : "selected";
          let index = parseInt(id_drag_str, 10);
          let elem = from[index];
          let newFrom = update(from, {
            $splice: [[index, 1]],
          });
          const let_index = 0;
          let newTo = update(to, {
            $splice: [[let_index, 0, elem]],
          });
          from_set(newFrom);
          to_set(newTo);
          if (to_type === "selected") {
            onChange(newTo.map((card) => card.value));
          }else {
            onChange(newFrom.map((card) => card.value));
          }
        }
      },
      [cardsSelected, cardsAllowed, setCardsSelected, setCardsAllowed]
    );

		const renderCard = useCallback(
			(card, index, type) => {
				return (
					<SortableCard
						key={card.value}
						index={`${type}_${index}`}
						value={card.value}
						text={card.label}
						moveCard={moveCard}
					/>
				);
			},
			[moveCard]
		);
    return (
			<DndProvider backend={HTML5Backend}>
				<>
					<div className="input-sortable-container">
						<SortableLabel
							id="selected_0"
							text={t("selected")}
							index="selected_label"
							moveCard={moveCardToEmpty}
						/>
						{cardsSelected.map((card, i) => renderCard(card, i, "selected"))}
					</div>
				</>
				<>
					<div className="input-sortable-container">
						<SortableLabel
							id="allowed_0"
							text={t("allowed")}
							index="allowed_label"
							moveCard={moveCardToEmpty}
						/>
						{cardsAllowed.map((card, i) => renderCard(card, i, "allowed"))}
					</div>
				</>
			</DndProvider>
		);
}

export default Sortable;



