// 256 color palette for data visualization
// Based on a perceptually uniform color space with good contrast
export const VISUALIZATION_COLORS = [
  // Reds
  '#FF6B6B', '#FF5252', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C', '#FF1744',
  '#FF8A80', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F',

  // Pinks
  '#E91E63', '#AD1457', '#880E4F', '#C2185B', '#EC407A', '#F06292', '#F48FB1', '#F8BBD9',
  '#FCE4EC', '#FF4081', '#F50057', '#C51162', '#E91E63', '#AD1457', '#880E4F', '#C2185B',

  // Purples
  '#9C27B0', '#7B1FA2', '#4A148C', '#6A1B9A', '#AB47BC', '#BA68C8', '#CE93D8', '#E1BEE7',
  '#F3E5F5', '#E040FB', '#D500F9', '#AA00FF', '#9C27B0', '#7B1FA2', '#4A148C', '#6A1B9A',

  // Deep Purples
  '#673AB7', '#512DA8', '#311B92', '#5E35B1', '#7E57C2', '#9575CD', '#B39DDB', '#D1C4E9',
  '#EDE7F6', '#7C4DFF', '#651FFF', '#6200EA', '#673AB7', '#512DA8', '#311B92', '#5E35B1',

  // Indigos
  '#3F51B5', '#303F9F', '#1A237E', '#3949AB', '#5C6BC0', '#7986CB', '#9FA8DA', '#C5CAE9',
  '#E8EAF6', '#536DFE', '#3D5AFE', '#304FFE', '#3F51B5', '#303F9F', '#1A237E', '#3949AB',

  // Blues
  '#2196F3', '#1976D2', '#0D47A1', '#1565C0', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB',
  '#E3F2FD', '#448AFF', '#2979FF', '#2962FF', '#2196F3', '#1976D2', '#0D47A1', '#1565C0',

  // Light Blues
  '#03A9F4', '#0288D1', '#01579B', '#0277BD', '#29B6F6', '#4FC3F7', '#81D4FA', '#B3E5FC',
  '#E1F5FE', '#40C4FF', '#00B0FF', '#0091EA', '#03A9F4', '#0288D1', '#01579B', '#0277BD',

  // Cyans
  '#00BCD4', '#0097A7', '#006064', '#00838F', '#26C6DA', '#4DD0E1', '#80DEEA', '#B2EBF2',
  '#E0F7FA', '#18FFFF', '#00E5FF', '#00B8D4', '#00BCD4', '#0097A7', '#006064', '#00838F',

  // Teals
  '#009688', '#00695C', '#004D40', '#00796B', '#26A69A', '#4DB6AC', '#80CBC4', '#B2DFDB',
  '#E0F2F1', '#64FFDA', '#1DE9B6', '#00BFA5', '#009688', '#00695C', '#004D40', '#00796B',

  // Greens
  '#4CAF50', '#388E3C', '#1B5E20', '#2E7D32', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9',
  '#E8F5E8', '#69F0AE', '#00E676', '#00C853', '#4CAF50', '#388E3C', '#1B5E20', '#2E7D32',

  // Light Greens
  '#8BC34A', '#689F38', '#33691E', '#558B2F', '#9CCC65', '#AED581', '#C5E1A5', '#DCEDC8',
  '#F1F8E9', '#B2FF59', '#76FF03', '#64DD17', '#8BC34A', '#689F38', '#33691E', '#558B2F',

  // Limes
  '#CDDC39', '#AFB42B', '#827717', '#9E9D24', '#D4E157', '#DCE775', '#E6EE9C', '#F0F4C3',
  '#F9FBE7', '#EEFF41', '#C6FF00', '#AEEA00', '#CDDC39', '#AFB42B', '#827717', '#9E9D24',

  // Yellows
  '#FFEB3B', '#F57F17', '#F57F17', '#F9A825', '#FFEE58', '#FFF176', '#FFF59D', '#FFF9C4',
  '#FFFDE7', '#FFFF00', '#FFEA00', '#FFD600', '#FFEB3B', '#F57F17', '#F57F17', '#F9A825',

  // Ambers
  '#FFC107', '#FF8F00', '#FF6F00', '#FFA000', '#FFCA28', '#FFD54F', '#FFE082', '#FFECB3',
  '#FFF8E1', '#FFC400', '#FFAB00', '#FF6D00', '#FFC107', '#FF8F00', '#FF6F00', '#FFA000',

  // Oranges
  '#FF9800', '#E65100', '#BF360C', '#F57C00', '#FFB74D', '#FFCC02', '#FFCCBC', '#FBE9E7',
  '#FFF3E0', '#FF9100', '#FF6D00', '#FF3D00', '#FF9800', '#E65100', '#BF360C', '#F57C00',

  // Deep Oranges
  '#FF5722', '#BF360C', '#3E2723', '#D84315', '#FF8A65', '#FFAB91', '#FFCCBC', '#FBE9E7',
  '#FFF3E0', '#FF6E40', '#FF3D00', '#DD2C00', '#FF5722', '#BF360C', '#3E2723', '#D84315',

  // Additional vibrant colors for better distribution
  '#FF007F', '#8000FF', '#0080FF', '#00FF80', '#80FF00', '#FF8000', '#FF0040', '#4000FF',
  '#0040FF', '#00FF40', '#40FF00', '#FF4000', '#FF0080', '#8040FF', '#0040FF', '#40FF80'
] as const;

export type VisualizationColor = typeof VISUALIZATION_COLORS[number];

// Function to get a color by index with wraparound
export function getVisualizationColor(index: number): VisualizationColor {
  return VISUALIZATION_COLORS[index % VISUALIZATION_COLORS.length];
}

// Function to get a deterministic color based on a string (for consistent coloring)
export function getColorForString(str: string): VisualizationColor {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return getVisualizationColor(Math.abs(hash));
}

// Function to get contrasting text color (black or white) for a given background color
export function getContrastingTextColor(backgroundColor: VisualizationColor): '#000000' | '#FFFFFF' {
  // Remove # and convert to RGB
  const hex = backgroundColor.slice(1);
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}