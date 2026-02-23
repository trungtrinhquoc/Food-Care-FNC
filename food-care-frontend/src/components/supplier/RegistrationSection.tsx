import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { SectionHeader, SectionSkeleton } from './SupplierLayout';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  MapPin,
  Upload,
  AlertTriangle,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  registrationApi,
  type SupplierRegistration,
  type SubmitRegistrationRequest,
} from '../../services/supplier/supplierApi';

export function RegistrationSection() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<SupplierRegistration | null>(null);

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
    if (!form.operatingRegion) {
      toast.error('Vui lòng chọn khu vực hoạt động');
      return;
    }

    try {
      setSubmitting(true);
      const result = await registrationApi.submit(form);
      setRegistration(result);
      toast.success('Đã gửi đăng ký kinh doanh thành công!');
    } catch (error: any) {
      console.error('Submit registration error:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof SubmitRegistrationRequest, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
        description="Đăng ký giấy phép kinh doanh và khu vực hoạt động để cung cấp hàng cho warehouse"
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
            {registration?.operatingRegion && (
              <div className="mt-4 flex items-center gap-2 text-emerald-700">
                <MapPin className="h-4 w-4" />
                <span>Khu vực hoạt động: <strong>{registration.operatingRegion}</strong></span>
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
                  Link giấy phép (ảnh/PDF)
                </label>
                <Input
                  value={form.businessLicenseUrl}
                  onChange={(e) => updateField('businessLicenseUrl', e.target.value)}
                  placeholder="https://... (link ảnh hoặc PDF giấy phép)"
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          {/* Region */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Khu vực hoạt động
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Khu vực hoạt động sẽ quyết định các warehouse bạn có thể cung cấp hàng.</p>
                  <p className="mt-1">Chỉ các warehouse trong cùng khu vực mới hiển thị khi tạo lô hàng.</p>
                </div>
              </div>
            </div>
            <Select
              value={form.operatingRegion}
              onValueChange={(value) => updateField('operatingRegion', value)}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Chọn khu vực hoạt động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North">Miền Bắc (North)</SelectItem>
                <SelectItem value="Central">Miền Trung (Central)</SelectItem>
                <SelectItem value="South">Miền Nam (South)</SelectItem>
              </SelectContent>
            </Select>
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

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Địa chỉ doanh nghiệp</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
                <Input
                  value={form.addressCity}
                  onChange={(e) => updateField('addressCity', e.target.value)}
                  placeholder="VD: Hồ Chí Minh"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
                <Input
                  value={form.addressDistrict}
                  onChange={(e) => updateField('addressDistrict', e.target.value)}
                  placeholder="VD: Quận 1"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phường/Xã</label>
                <Input
                  value={form.addressWard}
                  onChange={(e) => updateField('addressWard', e.target.value)}
                  placeholder="VD: Phường Bến Nghé"
                  disabled={!canEdit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết</label>
                <Input
                  value={form.addressStreet}
                  onChange={(e) => updateField('addressStreet', e.target.value)}
                  placeholder="Số nhà, tên đường"
                  disabled={!canEdit}
                />
              </div>
            </div>
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
