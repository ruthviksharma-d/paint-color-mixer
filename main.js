// Define our basic paint colors
// JavaScript doesn't have interfaces, so we'll just use regular objects

// Define the base paint colors we'll use for mixing
const baseColors = [
  { name: 'White', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { name: 'Black', hex: '#000000', rgb: [0, 0, 0] },
  { name: 'Red', hex: '#FF0000', rgb: [255, 0, 0] },
  { name: 'Yellow', hex: '#FFFF00', rgb: [255, 255, 0] },
  { name: 'Blue', hex: '#0000FF', rgb: [0, 0, 255] },
  { name: 'Green', hex: '#00FF00', rgb: [0, 255, 0] },
  { name: 'Cyan', hex: '#00FFFF', rgb: [0, 255, 255] },
  { name: 'Magenta', hex: '#FF00FF', rgb: [255, 0, 255] },
  { name: 'Brown', hex: '#A52A2A', rgb: [165, 42, 42] },
];

// Theme related functions
function toggleTheme() {
  const htmlElement = document.documentElement;
  const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  htmlElement.setAttribute('data-theme', newTheme);

  // Save theme preference to localStorage
  localStorage.setItem('theme', newTheme);
}

function initTheme() {
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    // Check if user prefers dark mode
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }
}

// Utility functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        Number.parseInt(result[1], 16),
        Number.parseInt(result[2], 16),
        Number.parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

function rgbToHex(r, g, b) {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Function to get a color by name or null if not found
function getColorByName(name) {
  return baseColors.find(c => c.name === name) || null;
}

// Function to determine the mixing formula
function calculateColorMix(targetRgb) {
  const [targetR, targetG, targetB] = targetRgb;

  // Special case: if the target color is one of our base colors
  for (const baseColor of baseColors) {
    const [baseR, baseG, baseB] = baseColor.rgb;
    if (baseR === targetR && baseG === targetG && baseB === targetB) {
      return [{ color: baseColor, percentage: 100, amount: getTotalVolume() }];
    }
  }

  // Start with primary colors approach
  // For realistic paint mixing, we need to use a subtractive color model
  // We'll use a simplified algorithm based on common paint mixing practices

  const formula = [];

  // Check if it's a grayscale color
  if (targetR === targetG && targetG === targetB) {
    // It's a grayscale color
    const blackPercentage = 100 - (targetR / 255 * 100);
    const whitePercentage = 100 - blackPercentage;

    const blackColor = getColorByName('Black');
    const whiteColor = getColorByName('White');

    if (blackPercentage > 0 && blackColor) {
      formula.push({
        color: blackColor,
        percentage: blackPercentage,
        amount: 0 // Will calculate later
      });
    }

    if (whitePercentage > 0 && whiteColor) {
      formula.push({
        color: whiteColor,
        percentage: whitePercentage,
        amount: 0 // Will calculate later
      });
    }
  } else {
    // For colored paints

    // Determine dominant channels
    const maxChannel = Math.max(targetR, targetG, targetB);
    const minChannel = Math.min(targetR, targetG, targetB);
    const midChannel = targetR + targetG + targetB - maxChannel - minChannel;

    // Brightness factor (how much white is needed)
    const brightness = (targetR + targetG + targetB) / (255 * 3);

    // Determine the primary hue
    let primaryColor = null;
    let secondaryColor = null;
    let tertiaryColor = null;

    // First, determine primary and secondary colors based on RGB values
    if (targetR > targetG && targetR > targetB) {
      // Red is dominant
      primaryColor = getColorByName('Red');

      if (targetG > targetB) {
        // More green than blue - yellow as secondary
        secondaryColor = getColorByName('Yellow');
      } else {
        // More blue than green - magenta as secondary
        secondaryColor = getColorByName('Magenta');
      }
    } else if (targetG > targetR && targetG > targetB) {
      // Green is dominant
      primaryColor = getColorByName('Green');

      if (targetR > targetB) {
        // More red than blue - yellow as secondary
        secondaryColor = getColorByName('Yellow');
      } else {
        // More blue than red - cyan as secondary
        secondaryColor = getColorByName('Cyan');
      }
    } else {
      // Blue is dominant
      primaryColor = getColorByName('Blue');

      if (targetR > targetG) {
        // More red than green - magenta as secondary
        secondaryColor = getColorByName('Magenta');
      } else {
        // More green than red - cyan as secondary
        secondaryColor = getColorByName('Cyan');
      }
    }

    // Determine color balance (simplified approach)
    let primaryPercentage = 0;
    let secondaryPercentage = 0;
    let whitePercentage = 0;
    let blackPercentage = 0;

    // Calculate saturation (how pure the color is)
    const saturation = (maxChannel - minChannel) / maxChannel;

    // If saturation is low, add white
    if (saturation < 0.5) {
      whitePercentage = (1 - saturation) * 30;
    }

    // If brightness is low, add black
    if (brightness < 0.5) {
      blackPercentage = (0.5 - brightness) * 40;
    }

    // Distribute the remaining percentage among primary and secondary
    const remainingPercentage = 100 - whitePercentage - blackPercentage;

    // Calculate primary vs secondary ratio based on RGB channels
    if (maxChannel === targetR && midChannel === targetG) {
      // Red-Green balance (yellow-ish)
      primaryPercentage = remainingPercentage * (targetR / (targetR + targetG));
      secondaryPercentage = remainingPercentage - primaryPercentage;
    } else if (maxChannel === targetR && midChannel === targetB) {
      // Red-Blue balance (magenta-ish)
      primaryPercentage = remainingPercentage * (targetR / (targetR + targetB));
      secondaryPercentage = remainingPercentage - primaryPercentage;
    } else if (maxChannel === targetG && midChannel === targetR) {
      // Green-Red balance (yellow-ish)
      primaryPercentage = remainingPercentage * (targetG / (targetG + targetR));
      secondaryPercentage = remainingPercentage - primaryPercentage;
    } else if (maxChannel === targetG && midChannel === targetB) {
      // Green-Blue balance (cyan-ish)
      primaryPercentage = remainingPercentage * (targetG / (targetG + targetB));
      secondaryPercentage = remainingPercentage - primaryPercentage;
    } else if (maxChannel === targetB && midChannel === targetR) {
      // Blue-Red balance (magenta-ish)
      primaryPercentage = remainingPercentage * (targetB / (targetB + targetR));
      secondaryPercentage = remainingPercentage - primaryPercentage;
    } else {
      // Blue-Green balance (cyan-ish)
      primaryPercentage = remainingPercentage * (targetB / (targetB + targetG));
      secondaryPercentage = remainingPercentage - primaryPercentage;
    }

    // Handle tertiary color for more complex colors
    const isDark = brightness < 0.4;
    const isMuted = saturation < 0.6;
    const isGrayish = saturation < 0.3;

    if (isGrayish) {
      // For grayish colors, add more white and black
      tertiaryColor = null;
      whitePercentage += secondaryPercentage * 0.3;
      blackPercentage += secondaryPercentage * 0.3;
      secondaryPercentage *= 0.4;
    } else if (isDark && !isMuted) {
      // For dark saturated colors, might need brown
      tertiaryColor = getColorByName('Brown');
    }

    // Build the formula with calculated percentages
    if (primaryPercentage > 0 && primaryColor) {
      formula.push({
        color: primaryColor,
        percentage: primaryPercentage,
        amount: 0 // Will calculate later
      });
    }

    if (secondaryPercentage > 0 && secondaryColor) {
      formula.push({
        color: secondaryColor,
        percentage: secondaryPercentage,
        amount: 0 // Will calculate later
      });
    }

    if (tertiaryColor && brightness < 0.4) {
      // Add brown for darker earthy tones
      const tertiaryPercentage = 10;
      // Adjust other percentages to maintain total of 100%
      const adjustmentFactor = (100 - tertiaryPercentage) / 100;

      for (const item of formula) {
        item.percentage *= adjustmentFactor;
      }

      formula.push({
        color: tertiaryColor,
        percentage: tertiaryPercentage,
        amount: 0 // Will calculate later
      });
    }

    const whiteColor = getColorByName('White');
    if (whitePercentage > 0 && whiteColor) {
      formula.push({
        color: whiteColor,
        percentage: whitePercentage,
        amount: 0 // Will calculate later
      });
    }

    const blackColor = getColorByName('Black');
    if (blackPercentage > 0 && blackColor) {
      formula.push({
        color: blackColor,
        percentage: blackPercentage,
        amount: 0 // Will calculate later
      });
    }
  }

  // Normalize percentages to ensure they sum to 100%
  const totalPercentage = formula.reduce((sum, item) => sum + item.percentage, 0);

  for (const item of formula) {
    item.percentage = Math.round((item.percentage / totalPercentage) * 100);
  }

  // Calculate amounts based on total volume
  const totalVolume = getTotalVolume();

  for (const item of formula) {
    item.amount = Math.round((item.percentage / 100) * totalVolume);
  }

  // Sort by percentage (descending)
  formula.sort((a, b) => b.percentage - a.percentage);

  return formula;
}

// UI Interaction functions
function getTotalVolume() {
  const volumeInput = document.getElementById('totalVolume');
  return Number.parseInt(volumeInput.value) || 1000;
}

function getVolumeUnit() {
  const unitSelect = document.getElementById('volumeUnit');
  return unitSelect.value;
}

function updateColorDisplay(colorHex) {
  const colorPreview = document.getElementById('selectedColor');
  const hexValue = document.getElementById('hexValue');
  const rgbValue = document.getElementById('rgbValue');

  const rgb = hexToRgb(colorHex);

  colorPreview.style.backgroundColor = colorHex;
  hexValue.textContent = colorHex.toUpperCase();
  rgbValue.textContent = `RGB(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

  updateMixingFormula(rgb);
}

function updateMixingFormula(rgb) {
  const mixingResults = document.getElementById('mixingResults');
  const colorMixVisual = document.getElementById('colorMixVisual');
  const volumeUnit = getVolumeUnit();

  // Calculate the mixing formula
  const formula = calculateColorMix(rgb);

  // Generate HTML for the formula
  if (formula.length === 0) {
    mixingResults.innerHTML = '<p>Could not determine a mixing formula for this color.</p>';
    colorMixVisual.innerHTML = '';
    return;
  }

  let formulaHTML = `<p>To mix this color, combine:</p><div class="color-formula">`;
  let visualHTML = '';

  for (const component of formula) {
    formulaHTML += `
      <div class="color-component">
        <div class="color-component-preview" style="background-color: ${component.color.hex}"></div>
        <div class="color-component-name">${component.color.name}</div>
        <div class="color-component-amount">${component.percentage}% (${component.amount}${volumeUnit})</div>
      </div>
    `;

    visualHTML += `<div class="color-mix-segment"
                       style="background-color: ${component.color.hex}; width: ${component.percentage}%;"
                       title="${component.color.name}: ${component.percentage}%"></div>`;
  }

  formulaHTML += '</div>';

  mixingResults.innerHTML = formulaHTML;
  colorMixVisual.innerHTML = visualHTML;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  initTheme();

  // Get all the DOM elements
  const colorPicker = document.getElementById('colorPicker');
  const volumeInput = document.getElementById('totalVolume');
  const unitSelect = document.getElementById('volumeUnit');
  const themeToggle = document.getElementById('themeToggle');

  // Initialize with default color
  updateColorDisplay(colorPicker.value);

  // Add event listeners
  colorPicker.addEventListener('input', () => {
    updateColorDisplay(colorPicker.value);
  });

  // Update amounts when volume changes
  volumeInput.addEventListener('input', () => {
    const rgb = hexToRgb(colorPicker.value);
    updateMixingFormula(rgb);
  });

  unitSelect.addEventListener('change', () => {
    const rgb = hexToRgb(colorPicker.value);
    updateMixingFormula(rgb);
  });

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
});
