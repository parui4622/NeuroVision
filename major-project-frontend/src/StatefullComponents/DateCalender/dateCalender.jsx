import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import * as React from 'react';

export default function DateCalendarViews() {
  const [value, setValue] = React.useState(dayjs());

  const handleToday = () => {
    setValue(dayjs());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <DateCalendar
          value={value}
          onChange={setValue}
          views={['year', 'month', 'day']}
          sx={{ width: 320, minWidth: 0, margin: '0 auto' }}
        />
        <button
          style={{
            marginTop: 12,
            padding: '6px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#468ef9',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={handleToday}
        >
          Set to today
        </button>
      </div>
    </LocalizationProvider>
  );
}
