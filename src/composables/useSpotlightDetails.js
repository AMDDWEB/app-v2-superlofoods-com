export function useSpotlightDetails() {
  const transformSpotlightData = (spotlight, id) => {
    return {
      id,
      image_url: spotlight.image_url || '',
      price: spotlight.price || '',
      description: spotlight.details || '',
    };
  };

  const transformAllSpotlights = (data = []) => {
    // Handle empty or invalid data
    if (!Array.isArray(data) || data.length === 0) return [];

    // Get the first spotlight group (assuming we only show one group at a time)
    const spotlightGroup = data[0];

    // Transform each product in the products array
    return spotlightGroup.products.map((product, idx) =>
      transformSpotlightData(product, `spotlight-${idx}`)
    );
  };

  return {
    transformSpotlightData,
    transformAllSpotlights,
  };
} 