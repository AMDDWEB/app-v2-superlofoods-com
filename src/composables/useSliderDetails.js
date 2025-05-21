export function useSliderDetails() {
  const transformSliderData = (slider = {}) => {
    return {
      imageUrl: slider.slider_image_url || '',
      hasWebsiteLink: Boolean(slider.website_link),
      websiteUrl: slider.website_link ? slider.website_url : null,
    };
  };

  const transformAllSliders = (sliders = []) => {
    return sliders.map(transformSliderData);
  };

  return {
    transformSliderData,
    transformAllSliders,
  };
}