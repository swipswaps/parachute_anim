/**
 * Validates if a string is in a valid time format (HH:MM:SS, MM:SS, or seconds)
 * @param {string} timeStr - The time string to validate
 * @returns {boolean} - Whether the time string is in a valid format
 */
export const isValidTimeFormat = (timeStr) => {
  // Accept formats: HH:MM:SS, MM:SS, or just seconds
  const patterns = [
    /^\d{1,2}:\d{1,2}:\d{1,2}$/, // HH:MM:SS
    /^\d{1,2}:\d{1,2}$/,         // MM:SS
    /^\d+$/                      // Just seconds
  ];
  return patterns.some(pattern => pattern.test(timeStr));
};

/**
 * Converts a time string to seconds
 * @param {string} timeStr - The time string to convert (HH:MM:SS, MM:SS, or seconds)
 * @returns {number} - The time in seconds
 */
export const timeToSeconds = (timeStr) => {
  if (/^\d+$/.test(timeStr)) {
    return parseInt(timeStr, 10);
  }
  
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) { // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) { // MM:SS
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

/**
 * Formats seconds to a time string (MM:SS)
 * @param {number} seconds - The time in seconds
 * @returns {string} - The formatted time string
 */
export const formatTimeMMSS = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formats seconds to a time string (HH:MM:SS)
 * @param {number} seconds - The time in seconds
 * @returns {string} - The formatted time string
 */
export const formatTimeHHMMSS = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
