/**
 * Vietnam Address API Integration
 * Using https://provinces.open-api.vn/api/
 */

const API_BASE = 'https://provinces.open-api.vn/api';

export interface Province {
  code: number;
  name: string;
  name_en?: string;
  full_name: string;
  full_name_en?: string;
  code_name: string;
}

export interface District {
  code: number;
  name: string;
  name_en?: string;
  full_name: string;
  full_name_en?: string;
  code_name: string;
  province_code: number;
}

export interface Ward {
  code: number;
  name: string;
  name_en?: string;
  full_name: string;
  full_name_en?: string;
  code_name: string;
  district_code: number;
}

export interface ProvinceWithDetails extends Province {
  districts?: District[];
}

export interface DistrictWithDetails extends District {
  wards?: Ward[];
}

/**
 * Get all provinces
 */
export async function getProvinces(): Promise<Province[]> {
  try {
    const response = await fetch(`${API_BASE}/p/`);
    if (!response.ok) throw new Error('Failed to fetch provinces');
    return await response.json();
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
}

/**
 * Get province by code with districts
 */
export async function getProvinceWithDistricts(provinceCode: number): Promise<ProvinceWithDetails | null> {
  try {
    const response = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`);
    if (!response.ok) throw new Error('Failed to fetch province');
    return await response.json();
  } catch (error) {
    console.error('Error fetching province:', error);
    return null;
  }
}

/**
 * Get district by code with wards
 */
export async function getDistrictWithWards(districtCode: number): Promise<DistrictWithDetails | null> {
  try {
    const response = await fetch(`${API_BASE}/d/${districtCode}?depth=2`);
    if (!response.ok) throw new Error('Failed to fetch district');
    return await response.json();
  } catch (error) {
    console.error('Error fetching district:', error);
    return null;
  }
}

/**
 * Format full address from selected values
 */
export function formatFullAddress(
  ward: Ward | null,
  district: District | null,
  province: Province | null,
  streetAddress?: string
): string {
  const parts = [];

  if (streetAddress?.trim()) {
    parts.push(streetAddress.trim());
  }

  if (ward) {
    parts.push(ward.full_name);
  }

  if (district) {
    parts.push(district.full_name);
  }

  if (province) {
    parts.push(province.full_name);
  }

  return parts.join(', ');
}

/**
 * Parse address string back to components (best effort)
 */
export function parseAddress(addressString: string): {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
} {
  const parts = addressString.split(',').map(p => p.trim());

  return {
    street: parts[0] || undefined,
    ward: parts[1] || undefined,
    district: parts[2] || undefined,
    province: parts[3] || undefined,
  };
}

/**
 * Search provinces by name
 */
export function searchProvinces(provinces: Province[], query: string): Province[] {
  if (!query) return provinces;

  const lowerQuery = query.toLowerCase();
  return provinces.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.full_name.toLowerCase().includes(lowerQuery) ||
    p.code_name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search districts by name
 */
export function searchDistricts(districts: District[], query: string): District[] {
  if (!query) return districts;

  const lowerQuery = query.toLowerCase();
  return districts.filter(d =>
    d.name.toLowerCase().includes(lowerQuery) ||
    d.full_name.toLowerCase().includes(lowerQuery) ||
    d.code_name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search wards by name
 */
export function searchWards(wards: Ward[], query: string): Ward[] {
  if (!query) return wards;

  const lowerQuery = query.toLowerCase();
  return wards.filter(w =>
    w.name.toLowerCase().includes(lowerQuery) ||
    w.full_name.toLowerCase().includes(lowerQuery) ||
    w.code_name.toLowerCase().includes(lowerQuery)
  );
}
