import React, {useState, useEffect} from "react";
import { AppContext } from "../../services/context";
import { useTranslation } from "react-i18next";

export default function ResumeComponent({}) {
  const { t } = useTranslation();
	const { itemListConfig } = React.useContext(AppContext);
	const { typeSelected } = itemListConfig;

  const [data, setData] = useState({});

  function searchData (items, result) {
    if (typeof items === 'object' && !Array.isArray(items)) {
      if (items[0]) {
        items = Object.values(items);
      }
    }
    if (Array.isArray(items)) {
      items.forEach((item) => {
        searchData(item, result);
      });
    }
    else if (typeof items === 'object' && items.items) {
      searchData(items.items, result);
    }
    else {
      if (items.created_at && (typeof items.created_at === 'string' || items.created_at instanceof Date)) {
				if (!result["last-created-date"] || items.created_at > result["last-created-date"]) {
					result["last-created-date"] = items.created_at;
					result["last-created-item"] = items;
				}
			}
      if (items.updated_at && (typeof items.updated_at === 'string' || items.updated_at instanceof Date)) {
        if (!result["last-updated-date"] || items.updated_at > result["last-updated-date"]) {
          result["last-updated-date"] = items.updated_at;
          result["last-updated-item"] = items;
        }
      }
    }
  }

  function printValue(value) {
		if (!value) {
			return "";
		}
		if (value instanceof Date) {
			return value.toLocaleString();
		} else if (typeof value === "object") {
			let label =
				value.name || value.title || value.id || JSON.stringify(value);
			if (value.index) {
				return (
					<span
						className="link"
						onClick={() => {
							let event = new CustomEvent("scroll-to", {
								detail: { index: value.index },
							});
							window.dispatchEvent(event);
						}}
					>
						{label}
						{value.date && (
							<span className="date">
								{value.date
									.toLocaleString()
									.split(":")
									.slice(0, -1)
									.join(":")
									.replace(",", "")}
							</span>
						)}
					</span>
				);
			} else {
				return label;
			}
		} else {
			return value;
		}
	}


  useEffect(() => {
		if (itemListConfig.itemsListRaw) {
      let result = {
				"last-created-item": null,
				"last-created-date": null,
				"last-updated-item": null,
				"last-updated-date": null,
			};
			searchData(itemListConfig.itemsListRaw, result);
      if (result["last-created-item"] && result["last-created-item"].name) {
				result["last-created-item"] = {
					name: result["last-created-item"].name,
					date: new Date(result["last-created-date"]),
					index: result["last-created-item"].index,
				};
				delete result["last-created-date"];
			}
			if (result["last-updated-item"] && result["last-updated-item"].name) {
				result["last-updated-item"] = {
					name: result["last-updated-item"].name,
					date: new Date(result["last-updated-date"]),
					index: result["last-updated-item"].index,
				};
				delete result["last-updated-date"];
			}

      
      setData(result);
		}
	}, [itemListConfig.itemsListRaw]);

	return (
    <div className="chart-resume">
      {
        Object.keys(data).map((key, index) => {
          let value = data[key];
          return (
            <div key={index}>
              <span className="key"><span>{t(key)}</span></span>
              <span className="value">{printValue(value)}</span>
            </div>
          )
        })
      }
    </div>
  )
}







