import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

const Code = ({value, onChange, field}) => {
	return (
		<div className="code-editor">
			<Editor
				height="400px"
				style={{ width: "100%", border: "1px solid #ccc" }}
				language="json"
				value={value}
				onChange={onChange}
				options={{
					minimap: { enabled: false },
					automaticLayout: true,
					wordWrap: "on",
				}}
			/>
		</div>
	);
};

export default Code;



