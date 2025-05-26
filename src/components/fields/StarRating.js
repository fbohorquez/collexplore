import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarOutlineIcon from "@mui/icons-material/StarOutline";

const StarRating = ({ 
  value = 0, 
  max = 10, 
  onChange,
  showNumber = true
}) => {
	const [rating, setRating] = useState(value);
	const [hoverRating, setHoverRating] = useState(0);

	const handleClick = (index) => {
		let newRating;
		if (rating === index + 1) {
			newRating = index + 0.5;
		} else if (rating === index + 0.5) {
			newRating = 0;
		} else {
			newRating = index + 1;
		}
		setRating(newRating);
		onChange(newRating);
	};

	const handleMouseEnter = (index) => {
		setHoverRating(index + 1);
	};

	const handleMouseLeave = () => {
		setHoverRating(0);
	};

	const renderStar = (index) => {
		if (hoverRating >= index + 1) {
			return <StarIcon />;
		} else if (rating >= index + 1) {
			return <StarIcon />;
		} else if (rating >= index + 0.5) {
			return <StarHalfIcon />;
		} else {
			return <StarOutlineIcon />;
		}
	};

  React.useEffect(() => {
    setRating(value);
  }
  , [value]);

	return (
		<Box className="rating" display="flex">
			{Array.from({ length: max }, (_, index) => (
				<IconButton
					key={index}
					onClick={() => handleClick(index)}
					onMouseEnter={() => handleMouseEnter(index)}
					onMouseLeave={handleMouseLeave}
          sx={{ p: 0, mt: '10px' }}
				>
					{renderStar(index)}
				</IconButton>
			))}
      {showNumber && 
        <Box ml={1} className="rating-number">
            <span className="rating-number-value">{rating}</span> /
            <span className="rating-number-max">{max}</span>
        </Box>
      }
		</Box>
	);
};

export default StarRating;

