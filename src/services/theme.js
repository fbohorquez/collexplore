
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
	palette: {
		primary: {
			main: "#331f08",
		},
		background: {
			paper: "rgb(243 237 223)", // Color que representa "background.paper"
		},
	},
});

export { theme, ThemeProvider };




