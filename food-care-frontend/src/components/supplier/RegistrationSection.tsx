import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { SectionHeader, SectionSkeleton } from './SupplierLayout';
import { AddressSelector } from '../AddressSelector';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  MapPin,
  Send,
  ShieldCheck,
  Warehouse,
  Info,
  Upload,
  Loader2,
  ImageIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  registrationApi,
  type SupplierRegistration,
  type SubmitRegistrationRequest,
} from '../../services/supplier/supplierApi';
import { uploadToCloudinary } from '../../utils/cloudinary';

// Auto-derive operating region from Vietnamese city name
function deriveRegionFromCity(city: string): string {
  if (!city) return '';
  const c = city.toLowerCase();
  const north = ['hà nội', 'hải phòng', 'bắc ninh', 'hưng yên', 'hải dương', 'quảng ninh', 'nam định', 'ninh bình', 'thái bình', 'hà nam', 'vĩnh phúc', 'phú thọ', 'thái nguyên', 'bắc giang', 'lạng sơn', 'lào cai', 'yên bái', 'tuyên quang', 'hà giang', 'cao bằng', 'bắc kạn', 'sơn la', 'lai châu', 'điện biên', 'hòa bình'];
  const central = ['đà nẵng', 'thừa thiên huế', 'quảng nam', 'quảng ngãi', 'bình định', 'phú yên', 'khánh hòa', 'ninh thuận', 'bình thuận', 'thanh hóa', 'nghệ an', 'hà tĩnh', 'quảng bình', 'quảng trị', 'kon tum', 'gia lai', 'đắk lắk', 'đắk nông', 'lâm đồng'];
  const south = ['hồ chí minh', 'bình dương', 'đồng nai', 'bà rịa', 'vũng tàu', 'long an', 'tây ninh', 'bình phước', 'tiền giang', 'bến tre', 'vĩnh long', 'trà vinh', 'cần thơ', 'sóc trăng', 'bạc liêu', 'cà mau', 'an giang', 'kiên giang', 'đồng tháp', 'hậu giang'];
  if (north.some(p => c.includes(p))) return 'North';
  if (central.some(p => c.includes(p))) return 'Central';
  if (south.some(p => c.includes(p))) return 'South';
  return 'Central'; // default
}

export function RegistrationSection() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<SupplierRegistration | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<SubmitRegistrationRequest>({
    businessName: '',
    businessLicense: '',
    businessLicenseUrl: '',
    taxCode: '',
    operatingRegion: '',
    contactName: '',
    contactPhone: '',
    addressStreet: '',
    addressWard: '',
    addressDistrict: '',
    addressCity: '',
    registrationNotes: '',
  });

  useEffect(() => {
    loadRegistration();
  }, []);

  const loadRegistration = async () => {
    try {
      setLoading(true);
      const data = await registrationApi.getStatus();
      setRegistration(data);
      // Pre-fill form with existing data
      if (data) {
        setForm({
          businessName: data.businessName || '',
          businessLicense: data.businessLicense || '',
          businessLicenseUrl: data.businessLicenseUrl || '',
          taxCode: data.taxCode || '',
          operatingRegion: data.operatingRegion || '',
          contactName: data.contactName || '',
          contactPhone: data.contactPhone || '',
          addressStreet: data.addressStreet || '',
          addressWard: data.addressWard || '',
          addressDistrict: data.addressDistrict || '',
          addressCity: data.addressCity || '',
          registrationNotes: data.registrationNotes || '',
        });
      }
    } catch (error) {
      console.error('Failed to load registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate
    if (!form.businessName.trim()) {
      toast.error('Vui lòng nhập tên doanh nghiệp');
      return;
    }
    if (!form.businessLicense.trim()) {
      toast.error('Vui lòng nhập số giấy phép kinh doanh');
      return;
    }
    if (!form.taxCode.trim()) {
      toast.error('Vui lòng nhập mã số thuế');
      return;
    }
    if (!form.addressCity?.trim()) {
      toast.error('Vui lòng chọn Tỉnh/Thành phố');
      return;
    }
    if (!form.addressDistrict?.trim()) {
      toast.error('Vui lòng chọn Quận/Huyện');
      return;
    }
    if (!form.addressWard?.trim()) {
      toast.error('Vui lòng chọn Phường/Xã');
      return;
    }

    // Auto-derive operating region from city
    const derivedRegion = deriveRegionFromCity(form.addressCity || '');

    try {
      setSubmitting(true);
      const submitData = { ...form, operatingRegion: derivedRegion || form.operatingRegion };
      const result = await registrationApi.submit(submitData);
      setRegistration(result);
      toast.success('Đã gửi đăng ký kinh doanh thành công!');
    } catch (error: unknown) {
      console.error('Submit registration error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể gửi đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof SubmitRegistrationRequest, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Chỉ chấp nhận ảnh hoặc PDF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB');
      return;
    }

    try {
      setUploading(true);
      const result = await uploadToCloudinary(file);
      setForm(prev => ({ ...prev, businessLicenseUrl: result.url }));
      toast.success('Tải ảnh giấy phép thành công!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Tải ảnh thất bại';
      toast.error(message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeLicenseImage = () => {
    setForm(prev => ({ ...prev, businessLicenseUrl: '' }));
  };

  if (loading) return <SectionSkeleton />;

  const isApproved = registration?.registrationStatus === 'approved';
  const isPending = registration?.registrationStatus === 'pending' && registration?.submittedAt;
  const isRejected = registration?.registrationStatus === 'rejected';
  const canEdit = !isPending; // Can edit if not pending

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Đăng ký kinh doanh"
        description="Đăng ký thông tin doanh nghiệp và địa chỉ chính xác để nhận lời mời nhập kho từ các cơ sở FoodCare"
      />

      {/* Status Banner */}
      {isApproved && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-800">Đã được duyệt</h3>
                <p className="text-emerald-700">
                  Đăng ký kinh doanh đã được admin phê duyệt. Bạn có thể thêm sản phẩm và tạo lô hàng vận chuyển.
                </p>
                {registration?.approvedAt && (
                  <p className="text-sm text-emerald-600 mt-1">
                    Ngày duyệt: {new Date(registration.approvedAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 ml-auto">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Đã duyệt
              </Badge>
            </div>
            {(registration?.addressWard || registration?.addressDistrict || registration?.addressCity) && (
              <div className="mt-4 flex items-center gap-2 text-emerald-700">
                <MapPin className="h-4 w-4" />
                <span>Khu vực: <strong>{[registration.addressWard, registration.addressDistrict, registration.addressCity].filter(Boolean).join(' - ')}</strong></span>
              </div>
            )}
            {registration?.operatingRegion && (
              <div className="mt-1 flex items-center gap-2 text-emerald-600 text-sm">
                <Warehouse className="h-3.5 w-3.5" />
                <span>Miền: {registration.operatingRegion === 'North' ? 'Miền Bắc' : registration.operatingRegion === 'Central' ? 'Miền Trung' : registration.operatingRegion === 'South' ? 'Miền Nam' : registration.operatingRegion}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isPending && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800">Đang chờ duyệt</h3>
                <p className="text-amber-700">
                  Đăng ký của bạn đang được admin xem xét. Vui lòng chờ phản hồi.
                </p>
                {registration?.submittedAt && (
                  <p className="text-sm text-amber-600 mt-1">
                    Ngày gửi: {new Date(registration.submittedAt).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-0 ml-auto">
                <Clock className="h-3 w-3 mr-1" />
                Chờ duyệt
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Bị từ chối</h3>
                <p className="text-red-700">
                  Đăng ký của bạn đã bị từ chối. Vui lòng chỉnh sửa và gửi lại.
                </p>
                {registration?.rejectionReason && (
                  <div className="mt-2 p-3 bg-red-100 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Lý do từ chối:</p>
                    <p className="text-sm text-red-700">{registration.rejectionReason}</p>
                  </div>
                )}
              </div>
              <Badge className="bg-red-100 text-red-700 border-0 ml-auto">
                <XCircle className="h-3 w-3 mr-1" />
                Bị từ chối
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Thông tin đăng ký kinh doanh
          </CardTitle>
          <CardDescription>
            Điền đầy đủ thông tin để đăng ký buôn bán với hệ thống FoodCare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Thông tin doanh nghiệp
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên doanh nghiệp <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  placeholder="VD: Công ty TNHH Thực phẩm ABC"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mã số thuế <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.taxCode}
                  onChange={(e) => updateField('taxCode', e.target.value)}
                  placeholder="VD: 0123456789"
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Số giấy phép kinh doanh <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.businessLicense}
                  onChange={(e) => updateField('businessLicense', e.target.value)}
                  placeholder="VD: 41A8001234"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ảnh giấy phép kinh doanh
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLicenseUpload}
                  className="hidden"
                  disabled={!canEdit || uploading}
                />
                {form.businessLicenseUrl ? (
                  <div className="relative group">
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={form.businessLicenseUrl}
                        alt="Giấy phép kinh doanh"
                        className="w-full h-40 object-contain"
                      />
                    </div>
                    {canEdit && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-7 w-7 p-0 shadow"
                          onClick={removeLicenseImage}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canEdit || uploading}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm">Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-sm font-medium">Nhấn để chọn ảnh giấy phép</span>
                        <span className="text-xs text-gray-400">PNG, JPG, JPEG (tối đa 5MB)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Thông tin liên hệ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Người đại diện</label>
                <Input
                  value={form.contactName}
                  onChange={(e) => updateField('contactName', e.target.value)}
                  placeholder="Họ tên người đại diện"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="0901234567"
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          {/* Address - Critical for inbound session matching */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Địa chỉ doanh nghiệp <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Địa chỉ quyết định việc nhận lời mời nhập kho</p>
                  <p className="mt-1">
                    Khi cơ sở warehouse tạo phiên nhập kho, hệ thống sẽ tự động mời các supplier
                    trong cùng <strong>phường/xã</strong> trước, sau đó mở rộng ra <strong>quận/huyện</strong> và <strong>tỉnh/thành phố</strong>.
                    Vui lòng chọn chính xác để nhận được lời mời phù hợp.
                  </p>
                </div>
              </div>
            </div>

            {canEdit ? (
              <>
                <AddressSelector
                  value={{
                    province: form.addressCity || undefined,
                    district: form.addressDistrict || undefined,
                    ward: form.addressWard || undefined,
                  }}
                  onChange={(addr) => {
                    setForm(prev => ({
                      ...prev,
                      addressCity: addr.province ?? '',
                      addressDistrict: addr.district ?? '',
                      addressWard: addr.ward ?? '',
                      operatingRegion: deriveRegionFromCity(addr.province ?? ''),
                    }));
                  }}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết (số nhà, tên đường)</label>
                  <Input
                    value={form.addressStreet}
                    onChange={(e) => updateField('addressStreet', e.target.value)}
                    placeholder="Số nhà, tên đường"
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Tỉnh/Thành phố</label>
                  <Input value={form.addressCity} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Quận/Huyện</label>
                  <Input value={form.addressDistrict} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Phường/Xã</label>
                  <Input value={form.addressWard} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Địa chỉ chi tiết</label>
                  <Input value={form.addressStreet} disabled />
                </div>
              </div>
            )}

            {form.addressCity && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                <span>
                  Miền tự động: <strong>
                    {deriveRegionFromCity(form.addressCity) === 'North' ? 'Miền Bắc' :
                     deriveRegionFromCity(form.addressCity) === 'Central' ? 'Miền Trung' :
                     deriveRegionFromCity(form.addressCity) === 'South' ? 'Miền Nam' : '—'}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <Textarea
              value={form.registrationNotes}
              onChange={(e) => updateField('registrationNotes', e.target.value)}
              placeholder="Ghi chú thêm cho admin (không bắt buộc)"
              rows={3}
              disabled={!canEdit}
            />
          </div>

          {/* Submit Button */}
          {canEdit && (
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {isRejected ? 'Gửi lại đăng ký' : 'Gửi đăng ký kinh doanh'}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
