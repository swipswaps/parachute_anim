/**
 * Extracts the YouTube video ID from a URL
 * @param {string} url - The YouTube URL
 * @returns {string|null} - The YouTube video ID or null if not found
 */
export const extractVideoId = (url) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

/**
 * Gets the thumbnail URL for a YouTube video
 * @param {string} videoId - The YouTube video ID
 * @param {string} quality - The thumbnail quality ('default', 'hqdefault', 'mqdefault', 'sddefault', 'maxresdefault')
 * @returns {string} - The thumbnail URL
 */
export const getYouTubeThumbnailUrl = (videoId, quality = 'maxresdefault') => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Validates if a string is a valid YouTube URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is a valid YouTube URL
 */
export const isValidYouTubeUrl = (url) => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
};
