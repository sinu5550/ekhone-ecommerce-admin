"use client";

import {
    getColorNameFromHex,
    isColorAttributeName,
    formatAttributeKey,
    isColorValue,
} from "@/lib/colorUtils";

/**
 * @param {Object} props
 * @param {Object} props.variant - The product variant object
 * @param {string} props.size - Size variant ('sm', 'md', 'lg') - defaults to 'sm'
 * @param {boolean} props.showIcon - Whether to show the Layers icon - defaults to true
 * @param {string} props.className - Additional CSS classes
 */
const VariantAttributes = ({
    variant,
    size = 'sm',
    className = ''
}) => {
    if (!variant) return null;

    const attributes = [];

    const addAttribute = (key, value) => {
        if (!value || value === 'null' || value === 'undefined' || value === '') return;

        const stringValue = String(value).trim();

        // Check if this value is a color (either by attribute name or hex code)
        if (isColorAttributeName(key) || isColorValue(stringValue)) {
            if (isColorValue(stringValue)) {
                const colorName = getColorNameFromHex(stringValue);
                attributes.push({
                    type: 'color',
                    label: key,
                    hex: stringValue,
                    colorName: colorName,
                });
            } else {
                // Attribute name suggests color, but value is not a hex code
                attributes.push({
                    type: 'text',
                    label: key,
                    value: stringValue,
                });
            }
        } else {
            attributes.push({
                type: 'text',
                label: key,
                value: stringValue,
            });
        }
    };

    // Process standard attributes
    const standardAttrs = [
        { key: 'Size', value: variant.size },
        { key: 'Color', value: variant.color },
        { key: 'Weight', value: variant.weight },
        { key: 'Material', value: variant.material },
        { key: 'Style', value: variant.style },
        { key: 'Fabric', value: variant.fabric },
        { key: 'Fabric Color', value: variant.fabricColor },
        { key: 'Structure', value: variant.structureBase },
        { key: 'Structure Color', value: variant.structureColor },
    ];

    standardAttrs.forEach(attr => {
        if (attr.value) addAttribute(attr.key, attr.value);
    });

    // Process custom attributes from JSON field
    if (attributes.length === 0 && variant.attributes) {
        try {
            const customAttrs = typeof variant.attributes === 'string'
                ? JSON.parse(variant.attributes)
                : variant.attributes;

            if (customAttrs && typeof customAttrs === 'object') {
                Object.entries(customAttrs).forEach(([key, value]) => {
                    if (value && value !== 'null' && value !== 'undefined') {
                        const formattedKey = formatAttributeKey(key);
                        addAttribute(formattedKey, value);
                    }
                });
            }
        } catch (e) {
            if (typeof variant.attributes === 'string' && variant.attributes.trim()) {
                attributes.push({
                    type: 'text',
                    label: 'Attributes',
                    value: variant.attributes,
                });
            }
        }
    }

    // If still no attributes, check all variant properties
    if (attributes.length === 0) {
        const excludeKeys = ['id', 'productId', 'price', 'quantity', 'sku', 'createdAt', 'updatedAt', 'attributes', 'images'];
        Object.entries(variant).forEach(([key, value]) => {
            if (!excludeKeys.includes(key) && value && typeof value !== 'object') {
                const formattedKey = formatAttributeKey(key);
                addAttribute(formattedKey, value);
            }
        });
    }

    if (attributes.length === 0) return null;

    // Size configurations
    const sizeConfigs = {
        sm: {
            container: 'gap-1.5',
            badge: 'px-1.5 py-0.5 text-xs',
            swatch: 'w-3 h-3',
            icon: 'w-3 h-3',
        },
        md: {
            container: 'gap-2',
            badge: 'px-2.5 py-1 text-sm',
            swatch: 'w-4 h-4',
            icon: 'w-4 h-4',
        },
        lg: {
            container: 'gap-3',
            badge: 'px-3 py-1.5 text-base',
            swatch: 'w-5 h-5',
            icon: 'w-5 h-5',
        },
    };

    const sizeConfig = sizeConfigs[size] || sizeConfigs.sm;

    return (
        <div className={`flex items-start ${sizeConfig.container} ${className} `}>
            <div className={`grid grid-cols-2 gap-2 ${sizeConfig.container}`}>
                {attributes.map((attr, index) => (
                    attr.type === 'color' ? (
                        <span
                            key={index}
                            className={`inline-flex items-center gap-1.5 ${sizeConfig.badge} rounded-full font-medium bg-stone-50 text-gray-700 border border-purple-200`}
                            title={`${attr.label}: ${attr.colorName} (${attr.hex})`}
                        >
                            <span
                                className={`${sizeConfig.swatch} rounded-full border border-gray-300 inline-block flex-shrink-0 ring-1 ring-gray-200`}
                                style={{ backgroundColor: attr.hex }}
                            />
                            <span>
                                <span className="font-normal">{attr.label} :</span>{' '}
                                <span className="font-semibold">{attr.colorName}</span>
                            </span>
                        </span>
                    ) : (
                        <span
                            key={index}
                            className={`inline-flex items-center ${sizeConfig.badge} rounded-full font-medium bg-gray-100 text-gray-700 border border-gray-200`}
                        >
                            <span className="text-gray-500 font-normal">{attr.label} : </span>{' '}
                            <span>{attr.value}</span>
                        </span>
                    )
                ))}
            </div>
        </div>
    );
};

export default VariantAttributes;