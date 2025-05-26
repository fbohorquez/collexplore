import countries_en from "./countries_en";
import countries_es from "./countries_es";
import countries_iso from "./countries_iso";

const equivalenceTable = (txt) => {
  let sanatized = txt
    .toLowerCase()
    .replace(["á", "é", "í", "ó", "ú"], ["a", "e", "i", "o", "u"])
    .replace("ñ", "n")
    .replace(["ç", "ü"], ["c", "u"])
    .trim();
  if (countries_iso[sanatized]) {
		return countries_iso[sanatized];
	}
  return null;
};

const countries = {
	en: countries_en,
	es: countries_es,
	equivalenceTable: equivalenceTable,
};


export default countries;