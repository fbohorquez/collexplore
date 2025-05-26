import React from 'react';

import { useTranslation } from 'react-i18next';

import { Box, Typography, Tooltip, IconButton, TextField } from '@mui/material';

import Tags from './Tags';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';


export default function KeyValueList({
  value = [],
  onChange,
  field,
  definition = null,
}) {
  const { t } = useTranslation();

  const [values, setValues] = React.useState({...value});

  React.useEffect(() => {
    setValues({...value});
  }, [value]);


  const handleAdd = (event) => {
    const newValues = {...values};
    newValues[''] = '';
    setValues(newValues);
    onChange(newValues);
  };

  return (
    <Box>
      {Object.keys(values).map((key, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
          <Box sx={{ width: '50%' }}>
            <Tags
              options={definition.options}
              value={key}
              multiple={false}
              onChange={(newValues) => {
                const value = values[key];
                delete values[key];
                values[newValues] = value;
                setValues({...values});
                onChange({...values});
              }}
              field={field}
              style={{ width: '50%' }}
            />
          </Box>
          <TextField
            value={values[key]}
            onChange={(event) => {
              const newValues = {...values};
              newValues[key] = event.target.value;
              setValues(newValues);
              onChange(newValues);
            }}
            style={{ width: '50%' }}
          />
          <Box>
            <Tooltip title={t('delete')}>
              <IconButton onClick={() => {
                const newValues = {...values};
                delete newValues[key];
                setValues(newValues);
                onChange(newValues);
              }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}
      <Tooltip title={t('add')}>
        <IconButton onClick={handleAdd}>
          <AddIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
      
