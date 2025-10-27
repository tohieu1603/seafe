'use client';

import { useState, useEffect } from 'react';
import {
  getProvinces,
  getProvinceWithDistricts,
  getDistrictWithWards,
  formatFullAddress,
  Province,
  District,
  Ward,
} from '@/lib/vietnam-address';

interface AddressSelectorProps {
  onAddressChange: (address: string, components: AddressComponents) => void;
  initialAddress?: string;
  className?: string;
  required?: boolean;
}

export interface AddressComponents {
  province: Province | null;
  district: District | null;
  ward: Ward | null;
  street: string;
}

export default function AddressSelector({
  onAddressChange,
  initialAddress = '',
  className = '',
  required = false,
}: AddressSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [streetAddress, setStreetAddress] = useState('');

  const [loading, setLoading] = useState(true);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    setLoading(true);
    const data = await getProvinces();
    setProvinces(data);
    setLoading(false);
  };

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      loadDistricts(selectedProvince.code);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    if (selectedDistrict) {
      loadWards(selectedDistrict.code);
    } else {
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedDistrict]);

  // Notify parent when address changes
  useEffect(() => {
    const fullAddress = formatFullAddress(
      selectedWard,
      selectedDistrict,
      selectedProvince,
      streetAddress
    );

    onAddressChange(fullAddress, {
      province: selectedProvince,
      district: selectedDistrict,
      ward: selectedWard,
      street: streetAddress,
    });
  }, [selectedProvince, selectedDistrict, selectedWard, streetAddress]);

  const loadDistricts = async (provinceCode: number) => {
    const provinceData = await getProvinceWithDistricts(provinceCode);
    if (provinceData?.districts) {
      setDistricts(provinceData.districts);
    }
  };

  const loadWards = async (districtCode: number) => {
    const districtData = await getDistrictWithWards(districtCode);
    if (districtData?.wards) {
      setWards(districtData.wards);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const province = provinces.find(p => p.code === code) || null;
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const district = districts.find(d => d.code === code) || null;
    setSelectedDistrict(district);
    setSelectedWard(null);
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const ward = wards.find(w => w.code === code) || null;
    setSelectedWard(ward);
  };

  return (
    <div className={className}>
      {/* Street Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số nhà, tên đường {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          placeholder="VD: 123 Nguyễn Văn Linh"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required={required}
        />
      </div>

      {/* Province */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tỉnh/Thành phố {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedProvince?.code || ''}
          onChange={handleProvinceChange}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          required={required}
        >
          <option value="">-- Chọn Tỉnh/Thành phố --</option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quận/Huyện {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedDistrict?.code || ''}
          onChange={handleDistrictChange}
          disabled={!selectedProvince || districts.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          required={required}
        >
          <option value="">-- Chọn Quận/Huyện --</option>
          {districts.map((district) => (
            <option key={district.code} value={district.code}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ward */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phường/Xã {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedWard?.code || ''}
          onChange={handleWardChange}
          disabled={!selectedDistrict || wards.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          required={required}
        >
          <option value="">-- Chọn Phường/Xã --</option>
          {wards.map((ward) => (
            <option key={ward.code} value={ward.code}>
              {ward.name}
            </option>
          ))}
        </select>
      </div>

      {/* Preview */}
      {(selectedProvince || selectedDistrict || selectedWard || streetAddress) && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Địa chỉ đầy đủ:</p>
          <p className="text-sm text-gray-900 font-medium">
            {formatFullAddress(selectedWard, selectedDistrict, selectedProvince, streetAddress) ||
              <span className="text-gray-400 italic">Chưa chọn địa chỉ</span>
            }
          </p>
        </div>
      )}
    </div>
  );
}
