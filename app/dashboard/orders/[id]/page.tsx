'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  Scale,
  Upload,
  Truck,
  Download,
  Edit2,
  Save,
  X
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface OrderItem {
  id: string
  seafood: {
    id: string
    name: string
    code: string
    current_price: number
  }
  weight: number
  estimated_weight?: number
  unit_price: number
  subtotal: number
  weight_image_url?: string
  notes: string
}

interface Order {
  id: string
  order_code: string
  customer_name: string
  customer_phone: string
  customer_address: string
  payment_method: string
  payment_status: string
  status: string
  notes: string
  discount_amount: number
  subtotal: number
  total_amount: number
  paid_amount: number
  created_at: string
  weighed_at?: string
  weighed_by?: string
  weight_images?: string[]
  shipped_at?: string
  shipped_by?: string
  shipping_notes?: string
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [shippingNotes, setShippingNotes] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/seafood/orders/${params.id}`)
      const data = await response.json()
      setOrder(data)
      setShippingNotes(data.shipping_notes || '')
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditItem = (item: OrderItem) => {
    setEditingItemId(item.id)
    setEditWeight(item.weight.toString())
    setEditPrice(item.unit_price.toString())
  }

  const handleSaveItem = async (itemId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/seafood/orders/${order?.id}/update-item?item_id=${itemId}&weight=${editWeight}&unit_price=${editPrice}`,
        { method: 'POST' }
      )

      if (response.ok) {
        await fetchOrder()
        setEditingItemId(null)
      }
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  const handleUploadImage = async (itemId: string, file: File) => {
    setUploadingImage(true)
    try {
      // TODO: Upload to cloud storage (Cloudinary, S3, etc.)
      // For now, we'll just use a placeholder
      const imageUrl = `https://via.placeholder.com/400x300?text=Weight+Image`

      const response = await fetch(
        `${API_URL}/seafood/orders/${order?.id}/update-item?item_id=${itemId}&weight_image_url=${encodeURIComponent(imageUrl)}`,
        { method: 'POST' }
      )

      if (response.ok) {
        await fetchOrder()
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleMarkWeighed = async () => {
    try {
      const response = await fetch(
        `${API_URL}/seafood/orders/${order?.id}/mark-weighed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight_images: [] })
        }
      )

      if (response.ok) {
        await fetchOrder()
      }
    } catch (error) {
      console.error('Failed to mark weighed:', error)
    }
  }

  const handleMarkShipped = async () => {
    try {
      const response = await fetch(
        `${API_URL}/seafood/orders/${order?.id}/mark-shipped`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipping_notes: shippingNotes })
        }
      )

      if (response.ok) {
        await fetchOrder()
      }
    } catch (error) {
      console.error('Failed to mark shipped:', error)
    }
  }

  const handleExportPDF = () => {
    window.open(`${API_URL}/seafood/orders/${order?.id}/export-pdf`, '_blank')
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
      weighed: { label: 'Đã cân', className: 'bg-purple-100 text-purple-800' },
      ready: { label: 'Sẵn sàng giao', className: 'bg-indigo-100 text-indigo-800' },
      shipped: { label: 'Đã gửi vận chuyển', className: 'bg-cyan-100 text-cyan-800' },
      completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    return status === 'paid' ? (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        Đã thanh toán
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
        Chờ thanh toán
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Không tìm thấy đơn hàng</h2>
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft size={20} />
          Quay lại
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Đơn hàng {order.order_code}
            </h1>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(order.status)}
              {getPaymentStatusBadge(order.payment_status)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Xuất PDF
            </button>

            {!['weighed', 'shipped', 'completed'].includes(order.status) && (
              <button
                onClick={handleMarkWeighed}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Scale size={18} />
                Đánh dấu đã cân
              </button>
            )}

            {order.status === 'weighed' && (
              <button
                onClick={handleMarkShipped}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <Truck size={18} />
                Đã gửi vận chuyển
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin đơn hàng */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chi tiết sản phẩm */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package size={20} />
                Sản phẩm
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {order.items.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.seafood.name}</h3>
                      <p className="text-sm text-slate-500">Mã: {item.seafood.code}</p>

                      {editingItemId === item.id ? (
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Trọng lượng (kg)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Đơn giá (VNĐ/kg)
                            </label>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveItem(item.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <Save size={16} />
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            >
                              <X size={16} />
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Trọng lượng:</span>
                            <span className="font-semibold">{item.weight} kg</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Đơn giá:</span>
                            <span className="font-semibold">{item.unit_price.toLocaleString('vi-VN')}đ/kg</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Thành tiền:</span>
                            <span className="font-semibold text-indigo-600">{item.subtotal.toLocaleString('vi-VN')}đ</span>
                          </div>

                          {order.status !== 'shipped' && order.status !== 'completed' && (
                            <button
                              onClick={() => handleEditItem(item)}
                              className="mt-2 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              <Edit2 size={14} />
                              Chỉnh sửa
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ảnh cân */}
                    <div className="w-full md:w-48">
                      {item.weight_image_url ? (
                        <img
                          src={item.weight_image_url}
                          alt="Ảnh cân"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-slate-100 rounded-lg flex flex-col items-center justify-center">
                          <Upload size={24} className="text-slate-400 mb-2" />
                          <label className="text-sm text-slate-500 cursor-pointer hover:text-indigo-600">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUploadImage(item.id, file)
                              }}
                              disabled={uploadingImage}
                            />
                            Tải ảnh cân
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ghi chú vận chuyển */}
          {order.status === 'weighed' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Truck size={18} />
                Ghi chú vận chuyển
              </h3>
              <textarea
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                placeholder="Nhập ghi chú vận chuyển..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thông tin khách hàng */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User size={18} />
              Khách hàng
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600">Tên</p>
                  <p className="font-medium">{order.customer_name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={18} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600">Số điện thoại</p>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
              </div>

              {order.customer_address && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600">Địa chỉ</p>
                    <p className="font-medium">{order.customer_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} />
              Thanh toán
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Tạm tính</span>
                <span className="font-medium">{order.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Giảm giá</span>
                <span className="font-medium text-red-600">-{order.discount_amount.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Tổng cộng</span>
                <span className="text-xl font-bold text-indigo-600">{order.total_amount.toLocaleString('vi-VN')}đ</span>
              </div>

              {order.payment_method && (
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Phương thức thanh toán</p>
                  <p className="font-medium capitalize">{order.payment_method}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={18} />
              Lịch sử
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Đơn hàng được tạo</p>
                  <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              {order.weighed_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Đã cân hàng</p>
                    <p className="text-xs text-slate-500">{new Date(order.weighed_at).toLocaleString('vi-VN')}</p>
                    {order.weighed_by && <p className="text-xs text-slate-500">Bởi: {order.weighed_by}</p>}
                  </div>
                </div>
              )}

              {order.shipped_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-cyan-600 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Đã gửi vận chuyển</p>
                    <p className="text-xs text-slate-500">{new Date(order.shipped_at).toLocaleString('vi-VN')}</p>
                    {order.shipped_by && <p className="text-xs text-slate-500">Bởi: {order.shipped_by}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
