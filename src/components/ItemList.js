import React, {useContext} from "react";
import { AppContext } from "./../services/context";
function ItemList() {
	const { activeComponent } = useContext(AppContext);
	const Component = activeComponent;
	return Component ? <Component /> : <div></div>;
}

export default ItemList;




