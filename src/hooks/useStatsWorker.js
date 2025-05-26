// src/hooks/useStatsWorker.js

import { useEffect, useState, useRef } from "react";

export default function useStatsWorker(typeSelected, config, itemListConfig) {
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const workerRef = useRef(null);

	useEffect(() => {
		if (!typeSelected || !config || !itemListConfig) return;

		// Crear una instancia del Worker
		workerRef.current = new Worker(`${process.env.PUBLIC_URL}/statsWorker.js`);

		// Listener para mensajes del Worker
		workerRef.current.onmessage = (e) => {
			const { success, data: buffer, error: workerError } = e.data;
			if (success) {
				try {
					// Convertir ArrayBuffer a string
					const decoder = new TextDecoder();
					const jsonString = decoder.decode(buffer);

					// Parsear JSON
					const parsedData = JSON.parse(jsonString);
					setData(parsedData);
				} catch (parseError) {
					setError(`Error al procesar datos: ${parseError.message}`);
				}
			} else {
				setError(workerError);
			}

			// Terminar el Worker después de recibir la respuesta
			workerRef.current.terminate();
			workerRef.current = null;
		};

		// Listener para errores del Worker
		workerRef.current.onerror = (e) => {
			setError(`Error en el Worker: ${e.message}`);
			workerRef.current.terminate();
			workerRef.current = null;
		};

		// Enviar los datos al Worker
		let data = JSON.stringify({ typeSelected, config, itemListConfig });
		workerRef.current.postMessage(JSON.parse(data));

		// Limpiar el Worker cuando el componente se desmonte o las dependencias cambien
		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
		};
	}, [typeSelected, config, itemListConfig.itemsListRaw]);

	return { data, error };
}


