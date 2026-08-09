/**
 * Geocoding Service Abstraction
 * Currently uses OpenStreetMap Nominatim for reverse geocoding & search.
 * Structured behind an interface so it can easily be swapped with Google, Mapbox, or custom GIS endpoints.
 */

export interface GeocodedLocation {
  displayName: string;
  locality: string;
  district: string;
  state: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

export interface GeocodingProvider {
  reverseGeocode(lat: number, lng: number): Promise<GeocodedLocation | null>;
  searchLocation(query: string): Promise<GeocodedLocation[]>;
}

class NominatimProvider implements GeocodingProvider {
  async reverseGeocode(lat: number, lng: number): Promise<GeocodedLocation | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NagrikSetu-CivicPlatform/1.0',
          },
        }
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (!data || !data.address) return null;

      const addr = data.address;
      const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.village || addr.town || addr.city_district || addr.city || 'Local Area';
      const district = addr.city || addr.county || addr.state_district || '';
      const state = addr.state || '';
      const postcode = addr.postcode || '';

      return {
        displayName: data.display_name || `${locality}, ${district}`,
        locality,
        district,
        state,
        postcode,
        latitude: lat,
        longitude: lng,
      };
    } catch (err) {
      console.warn('[GeocodingService] Reverse geocoding failed:', err);
      return null;
    }
  }

  async searchLocation(query: string): Promise<GeocodedLocation[]> {
    if (!query || query.trim().length < 3) return [];
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        {
          headers: {
            'User-Agent': 'NagrikSetu-CivicPlatform/1.0',
          },
        }
      );
      if (!response.ok) return [];
      const results = await response.json();

      return results.map((item: any) => {
        const addr = item.address || {};
        const locality = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || (item.display_name ? item.display_name.split(',')[0] : 'Search Location');
        return {
          displayName: item.display_name,
          locality,
          district: addr.city || addr.county || '',
          state: addr.state || '',
          postcode: addr.postcode || '',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      });
    } catch (err) {
      console.warn('[GeocodingService] Location search failed:', err);
      return [];
    }
  }
}

// Export default provider instance
export const geocodingService: GeocodingProvider = new NominatimProvider();