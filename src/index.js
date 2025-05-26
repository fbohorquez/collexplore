import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { AppProvider } from "./services/context"; 
import { ProcessProvider } from "./services/context_scraping";
import { FormProvider } from "./services/context_form";
import { ImgCacheProvider } from "./services/context_img_cache";
import reportWebVitals from "./reportWebVitals";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

ReactDOM.render(
	<AppProvider>
		{" "}
		{}
		<ImgCacheProvider>
			<ProcessProvider>
				<FormProvider>
					<App />
				</FormProvider>
			</ProcessProvider>
		</ImgCacheProvider>
	</AppProvider>,
	document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();






