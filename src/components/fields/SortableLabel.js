import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
const ItemTypes = {
	CARD: "card",
};
export const SortableLabel = ({ id, text, index, moveCard }) => {
	const ref = useRef(null);

	// useDrop hook donde se configura el drop y se recoge handlerId
	const [{ handlerId }, drop] = useDrop({
		accept: ItemTypes.CARD,
		hover(item, monitor) {
			// Implementar la lógica de hover aquí si es necesario
		},
		drop(item, monitor) {
			const dragIndex = item.index;
			const hoverIndex = index;

			// Realizar el movimiento solo si los índices son diferentes
			if (dragIndex !== hoverIndex) {
				moveCard(dragIndex, hoverIndex);
				item.index = hoverIndex; // Actualizar el índice en el item arrastrado
			}
		},
		collect: (monitor) => ({
			handlerId: monitor.getHandlerId(),
		}),
	});

	// useDrag hook donde se configura el drag y se recoge isDragging
	const [{ isDragging }, drag] = useDrag({
		type: ItemTypes.CARD,
		item: () => ({
			id,
			index,
		}),
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	// Estilo condicional basado en si el elemento está siendo arrastrado
	const opacity = isDragging ? 0.5 : 1;
	drag(drop(ref)); // Aplicar las funciones drag y drop al mismo ref

	return (
		<div ref={ref} className="input-sortable-label" style={{ opacity }} data-handler-id={handlerId}>
			{text}
		</div>
	);
};




