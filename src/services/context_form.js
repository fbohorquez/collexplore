import React, { createContext, useRef } from "react";

export const FormContext = createContext();

export const FormProvider = ({ children }) => {
	const subscribers = useRef({});

	const subscribe = (targetFieldId, callback) => {
		subscribers.current[targetFieldId] = callback;
	};

	const notify = (fieldId, value, reference) => {
		if (subscribers.current[fieldId]) {
			subscribers.current[fieldId](fieldId, value, reference);
		}
	};

	return (
		<FormContext.Provider value={{ subscribe, notify }}>
			{children}
		</FormContext.Provider>
	);
};

