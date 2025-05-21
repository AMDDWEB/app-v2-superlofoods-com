import { format, parse } from 'date-fns'

export const useDateFormat = () => {
  const formatDate = date => {
    return format(parse(date, 'yyyyMMdd', new Date()), 'MM/dd')
  }

  const formatTime = time => {
    const parsedTime = parse(time, 'HH:mm:ss', new Date())
    return format(parsedTime, 'h:mm a')
  }

  function formatDateAbbr(date) {
    return format(parse(date, 'yyyyMMdd', new Date()), 'EEE, MMMM do')
  }
  return {
    formatDate,
    formatTime,
    formatDateAbbr
  }
}