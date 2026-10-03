// Convert hex to RGB
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Convert RGB to HSL
export const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
};

// Convert HSL to RGB
export const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
};

// Convert RGB to Hex
export const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

// Generate human-readable color name from any hex code
export const getColorNameFromHex = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const { r, g, b } = rgb;
    const { h, s, l } = rgbToHsl(r, g, b);

    // Handle grayscale colors first
    if (s < 10) {
        if (l < 15) return 'Black';
        if (l < 30) return 'Very Dark Gray';
        if (l < 45) return 'Dark Gray';
        if (l < 55) return 'Gray';
        if (l < 70) return 'Light Gray';
        if (l < 90) return 'Very Light Gray';
        return 'White';
    }

    // Determine color family based on hue
    let baseColor = '';
    if (h < 15) baseColor = 'Red';
    else if (h < 35) baseColor = 'Orange Red';
    else if (h < 45) baseColor = 'Orange';
    else if (h < 55) baseColor = 'Gold';
    else if (h < 70) baseColor = 'Yellow';
    else if (h < 80) baseColor = 'Yellow Green';
    else if (h < 100) baseColor = 'Light Green';
    else if (h < 140) baseColor = 'Green';
    else if (h < 170) baseColor = 'Teal';
    else if (h < 190) baseColor = 'Cyan';
    else if (h < 210) baseColor = 'Sky Blue';
    else if (h < 230) baseColor = 'Blue';
    else if (h < 250) baseColor = 'Royal Blue';
    else if (h < 270) baseColor = 'Purple';
    else if (h < 290) baseColor = 'Violet';
    else if (h < 310) baseColor = 'Magenta';
    else if (h < 330) baseColor = 'Pink';
    else if (h < 350) baseColor = 'Rose';
    else baseColor = 'Red';

    // Determine brightness modifier
    let modifier = '';
    if (l < 15) modifier = 'Very Dark ';
    else if (l < 30) modifier = 'Dark ';
    else if (l > 85) modifier = 'Very Light ';
    else if (l > 70) modifier = 'Light ';

    // Determine saturation modifier
    if (s < 20 && l >= 30 && l <= 70) modifier = 'Grayish ';
    else if (s < 40 && l >= 30 && l <= 70) modifier = 'Muted ';
    else if (s > 85) {
        if (modifier === 'Dark ' || modifier === 'Very Dark ') modifier = 'Deep ';
        else if (modifier === 'Light ' || modifier === 'Very Light ') modifier = 'Bright ';
        else modifier = 'Vivid ';
    }

    return modifier + baseColor;
};

// Check if a value is a color code (hex)
export const isColorValue = (value) => {
    if (typeof value !== 'string') return false;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value.trim());
};

// Alias for isColorValue
export const isHexColor = isColorValue;

// Check if an attribute name suggests it's a color
export const isColorAttributeName = (key) => {
    const lowerKey = key.toLowerCase().replace(/[_\s-]/g, '');
    const colorKeys = [
        'color', 'colour',
        'fabriccolor', 'structurecolor', 'framecolor',
        'basecolor', 'paintcolor', 'textcolor',
        'bgcolor', 'backgroundcolor', 'bordercolor'
    ];
    return colorKeys.some(ck => lowerKey.includes(ck));
};

// Get text color (black or white) based on background color for contrast
export const getContrastColor = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000';

    const { r, g, b } = rgb;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Format attribute key to readable label
export const formatAttributeKey = (key) => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .trim()
        .replace(/^./, str => str.toUpperCase());
};