export function useLocationDetails() {
  const transformLocationData = (location) => {
    // Helper function to find ad by type
    const findAdByType = (ads, typeName) => {
      return ads?.find(ad =>
        ad.file_url && ad.ad_type?.some(type => type.type_name === typeName)
      );
    };

    return {
      id: location.id.toString(),
      coupon_id: location.coupon_id || null,
      name: location.title,
      address: location.address?.address || '',
      street_number: location.address?.street_number || '',
      street_name: location.address?.street_name || '',
      city: location.address?.city || '',
      state: location.address?.state || '',
      state_short: location.address?.state_short || '',
      post_code: location.address?.post_code || '',
      phone_number: location.phone_number || '',
      hours: (location.hours_of_operation || []).map(hour => ({
        day: hour.location_day,
        opening: hour.location_opens,
        closing: hour.location_closes
      })),
      weekly_ad_url: findAdByType(location.ads, 'Weekly Ad')?.file_url || '',
      weekly_ad_type: 'Weekly Ad',
      weekly_ad_start_date: findAdByType(location.ads, 'Weekly Ad')?.ad_start_date || '',
      rewards_url: findAdByType(location.ads, 'Reward')?.file_url || '',
      rewards_type: 'Reward',
      rewards_start_date: findAdByType(location.ads, 'Reward')?.ad_start_date || '',
      sale_url: findAdByType(location.ads, 'Sale')?.file_url || '',
      sale_type: 'Sale',
      sale_start_date: findAdByType(location.ads, 'Sale')?.ad_start_date || '',
      ads: location.ads
        ?.filter(ad => ad.file_url && ad.ad_type?.length > 0)
        .map(ad => ({
          url: ad.file_url,
          start_date: ad.ad_start_date,
          types: ad.ad_type.map(type => type.type_name),
          title: ad.ad_title
        })),
      location_banner: location.location_banner?.map(banner => ({
        banner_id: banner.banner_id || '',
        banner_name: banner.banner_name || ''
      })) || []
    };
  };

  return {
    transformLocationData
  };
}