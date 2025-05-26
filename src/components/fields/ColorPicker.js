//Componente react para color picker
import React, { useState, useEffect, useRef } from "react";
import { ChromePicker } from "react-color";
import { Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import chroma from "chroma-js";


const getMaxContrastColor = (hex, offset = 0) => {
  if (offset && !isNaN(offset)) {
    let rgb = chroma(hex).rgb();
    let r = Math.min(255, Math.max(0,rgb[0] + offset));
    let g = Math.min(255, Math.max(0,rgb[1] + offset));
    let b = Math.min(255, Math.max(0,rgb[2] + offset));
    hex = chroma(r, g, b).hex();
  }
	return chroma.contrast(hex, "white") > chroma.contrast(hex, "black")
		? "#FFFFFF"
		: "#222222";
};

const getComplementaryColors = (hex, count) => {
	if (count < 1) return [];
	const base = chroma(hex);
	const hues = [];
	const step = 360 / count;
	for (let i = 1; i < count; i++) {
		hues.push((base.get("hsl.h") + step * i) % 360);
	}
	return hues.map((h) => chroma(base).set("hsl.h", h).hex());
};

export default function ColorPicker({ field,
	value,
	handleChange,
	definition = null,
	reference = null,
	onChangeForm = (field, value) => {}, }) {
  const { t } = useTranslation();
  const [color, setColor] = useState(value || field.default || "#000000");
  const [colorRange, setColorRange] = useState(null);
  const [open, setOpen] = useState(false);

  const btnRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (field.range) {
      if (value && value.dark && value.light) {
        setColor(value.color);
        setColorRange({
          dark: value.dark,
          light: value.light
        });
      }else {
        if (field.default && field.default.dark && field.default.light) {
          setColor(field.default.color);
          setColorRange({
            dark: field.default.dark,
            light: field.default.light
          });
        }
      }
    }else {
      setColor(value || field.default || "#000000");
    }

  }
  , [value]);

  const handleColorChange = (color) => {
    setColor(color.hex);
    let colorData = {
      color: color.hex,
    }
    if (field.range) {
      //dark
      let darkRgb = {
        r: Math.min(255, color.rgb.r + field.range),
        g: Math.min(255, color.rgb.g + field.range),
        b: Math.min(255, color.rgb.b + field.range)
      };
      let darkHex = `#${darkRgb.r.toString(16).padStart(2, "0")}${darkRgb.g.toString(16).padStart(2, "0")}${darkRgb.b.toString(16).padStart(2, "0")}`;

      let darkDarkRgb = {
        r: Math.min(255, darkRgb.r + (field.range * 2)),
        g: Math.min(255, darkRgb.g + (field.range * 2)),
        b: Math.min(255, darkRgb.b + (field.range * 2))
      };
      let darkDarkHex = `#${darkDarkRgb.r.toString(16).padStart(2, "0")}${darkDarkRgb.g.toString(16).padStart(2, "0")}${darkDarkRgb.b.toString(16).padStart(2, "0")}`;

      let lightRgb = {
        r: Math.max(0, color.rgb.r - field.range),
        g: Math.max(0, color.rgb.g - field.range),
        b: Math.max(0, color.rgb.b - field.range)
      };
      let lightHex = `#${lightRgb.r.toString(16).padStart(2, "0")}${lightRgb.g.toString(16).padStart(2, "0")}${lightRgb.b.toString(16).padStart(2, "0")}`;

      let lightLightRgb = {
        r: Math.max(0, lightRgb.r - (field.range * 2)),
        g: Math.max(0, lightRgb.g - (field.range * 2)),
        b: Math.max(0, lightRgb.b - (field.range * 2))
      };
      let lightLightHex = `#${lightLightRgb.r.toString(16).padStart(2, "0")}${lightLightRgb.g.toString(16).padStart(2, "0")}${lightLightRgb.b.toString(16).padStart(2, "0")}`;

      setColorRange({
        dark: darkHex,
        darkDark: darkDarkHex,
        light: lightHex,
        lightLight: lightLightHex
      });
      colorData.dark = lightHex;
      colorData.light = darkHex;
      colorData.darkDark = lightLightHex;
      colorData.lightLight = darkDarkHex;
    }

    if (field.complementary) {
      colorData.complementary = getComplementaryColors(color.hex, field.complementary);
    }

    if (field.contrast) {
      colorData.contrast = getMaxContrastColor(color.hex, field.contrast);
    }

    if (Object.keys(colorData).length === 1) {
      colorData = colorData.color;
      
    }
    console.log(colorData);
    handleChange(colorData);    
  }

  const handleOpen = () => {
    setOpen(!open);
  }

  //close click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        open && 
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
      ) {
        if (btnRef.current && !btnRef.current.contains(event.target)) {
          setOpen(false);
        }else {
          event.stopPropagation();
          event.preventDefault();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
		<Box>
			<Button
        ref={btnRef}
				onClick={handleOpen}
				style={{
					display: "inline-block",
					padding: "5px",
          width: "40px",
          height: "40px",
					background: colorRange
            ?'linear-gradient(90deg, ' + colorRange.dark + ' 0%, ' + color + ' 50%, ' + colorRange.light + ' 100%)'
            :color,
					borderRadius: "5px",
				}}
			>
			</Button>
			<Box></Box>
			{open && (
				<Box ref={pickerRef}>
					<ChromePicker color={color} onChange={handleColorChange} />
				</Box>
			)}
		</Box>
	);
}






