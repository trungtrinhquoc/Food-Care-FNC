// Cấu trúc hành chính Thành phố Đà Nẵng sau sáp nhập Quảng Nam
// Nghị quyết 202/2025/QH15, hiệu lực 01/02/2025

export interface Ward { name: string; }
export interface District { name: string; wards: Ward[]; }

export const DA_NANG_PROVINCE_NAME = 'Thành phố Đà Nẵng';

export const DANANG_DISTRICTS: District[] = [
    // ===== TỪ ĐÀ NẴNG CŨ =====
    {
        name: 'Quận Hải Châu',
        wards: [
            { name: 'Phường Bình Thuận' }, { name: 'Phường Hải Châu I' }, { name: 'Phường Hải Châu II' },
            { name: 'Phường Hòa Thuận Đông' }, { name: 'Phường Hòa Thuận Tây' }, { name: 'Phường Nam Dương' },
            { name: 'Phường Phước Ninh' }, { name: 'Phường Thạch Thang' }, { name: 'Phường Thanh Bình' },
            { name: 'Phường Thuận Phước' },
        ],
    },
    {
        name: 'Quận Thanh Khê',
        wards: [
            { name: 'Phường An Khê' }, { name: 'Phường Chính Gián' }, { name: 'Phường Hòa Khê' },
            { name: 'Phường Tân Chính' }, { name: 'Phường Thanh Khê Đông' }, { name: 'Phường Thanh Khê Tây' },
            { name: 'Phường Thạc Gián' }, { name: 'Phường Vĩnh Trung' }, { name: 'Phường Xuân Hà' },
        ],
    },
    {
        name: 'Quận Sơn Trà',
        wards: [
            { name: 'Phường An Hải Bắc' }, { name: 'Phường An Hải Đông' }, { name: 'Phường An Hải Tây' },
            { name: 'Phường Mân Thái' }, { name: 'Phường Nại Hiên Đông' }, { name: 'Phường Phước Mỹ' },
            { name: 'Phường Thọ Quang' },
        ],
    },
    {
        name: 'Quận Ngũ Hành Sơn',
        wards: [
            { name: 'Phường Hòa Hải' }, { name: 'Phường Hòa Quý' },
            { name: 'Phường Khuê Mỹ' }, { name: 'Phường Mỹ An' },
        ],
    },
    {
        name: 'Quận Liên Chiểu',
        wards: [
            { name: 'Phường Hòa Hiệp Bắc' }, { name: 'Phường Hòa Hiệp Nam' },
            { name: 'Phường Hòa Khánh Bắc' }, { name: 'Phường Hòa Khánh Nam' }, { name: 'Phường Hòa Minh' },
        ],
    },
    {
        name: 'Quận Cẩm Lệ',
        wards: [
            { name: 'Phường Hòa An' }, { name: 'Phường Hòa Phát' }, { name: 'Phường Hòa Thọ Đông' },
            { name: 'Phường Hòa Thọ Tây' }, { name: 'Phường Hòa Xuân' }, { name: 'Phường Khuê Trung' },
        ],
    },
    {
        name: 'Huyện Hòa Vang',
        wards: [
            { name: 'Xã Hòa Bắc' }, { name: 'Xã Hòa Châu' }, { name: 'Xã Hòa Khương' },
            { name: 'Xã Hòa Liên' }, { name: 'Xã Hòa Nhơn' }, { name: 'Xã Hòa Ninh' },
            { name: 'Xã Hòa Phong' }, { name: 'Xã Hòa Phú' }, { name: 'Xã Hòa Sơn' }, { name: 'Xã Hòa Tiến' },
        ],
    },
    // ===== TỪ QUẢNG NAM CŨ =====
    {
        name: 'Thành phố Hội An',
        wards: [
            { name: 'Phường Cẩm An' }, { name: 'Phường Cẩm Châu' }, { name: 'Phường Cẩm Nam' },
            { name: 'Phường Cẩm Phô' }, { name: 'Phường Cửa Đại' }, { name: 'Phường Minh An' },
            { name: 'Phường Sơn Phong' }, { name: 'Phường Tân An' }, { name: 'Phường Thanh Hà' },
            { name: 'Xã Cẩm Hà' }, { name: 'Xã Cẩm Kim' }, { name: 'Xã Cẩm Thanh' }, { name: 'Xã Tân Hiệp' },
        ],
    },
    {
        name: 'Thành phố Tam Kỳ',
        wards: [
            { name: 'Phường An Mỹ' }, { name: 'Phường An Sơn' }, { name: 'Phường An Xuân' },
            { name: 'Phường Hòa Hương' }, { name: 'Phường Phước Hòa' }, { name: 'Phường Tân Thạnh' },
            { name: 'Phường Trường Xuân' }, { name: 'Xã Tam Ngọc' }, { name: 'Xã Tam Phú' }, { name: 'Xã Tam Thăng' },
        ],
    },
    {
        name: 'Thị xã Điện Bàn',
        wards: [
            { name: 'Phường Điện An' }, { name: 'Phường Điện Dương' }, { name: 'Phường Điện Nam Bắc' },
            { name: 'Phường Điện Nam Đông' }, { name: 'Phường Điện Nam Trung' }, { name: 'Phường Điện Ngọc' },
            { name: 'Phường Vĩnh Điện' }, { name: 'Xã Điện Hòa' }, { name: 'Xã Điện Hồng' },
            { name: 'Xã Điện Minh' }, { name: 'Xã Điện Phong' }, { name: 'Xã Điện Phước' },
            { name: 'Xã Điện Quang' }, { name: 'Xã Điện Thắng Bắc' }, { name: 'Xã Điện Thắng Nam' },
            { name: 'Xã Điện Thắng Trung' }, { name: 'Xã Điện Thọ' }, { name: 'Xã Điện Trung' },
        ],
    },
    {
        name: 'Huyện Đại Lộc',
        wards: [
            { name: 'Thị trấn Ái Nghĩa' }, { name: 'Xã Đại An' }, { name: 'Xã Đại Cường' },
            { name: 'Xã Đại Đồng' }, { name: 'Xã Đại Hiệp' }, { name: 'Xã Đại Hòa' },
            { name: 'Xã Đại Hồng' }, { name: 'Xã Đại Lãnh' }, { name: 'Xã Đại Minh' },
            { name: 'Xã Đại Nghĩa' }, { name: 'Xã Đại Phong' }, { name: 'Xã Đại Quang' },
            { name: 'Xã Đại Sơn' }, { name: 'Xã Đại Tân' }, { name: 'Xã Đại Thạnh' },
        ],
    },
    {
        name: 'Huyện Duy Xuyên',
        wards: [
            { name: 'Thị trấn Nam Phước' }, { name: 'Xã Duy Châu' }, { name: 'Xã Duy Hải' },
            { name: 'Xã Duy Hòa' }, { name: 'Xã Duy Nghĩa' }, { name: 'Xã Duy Phú' },
            { name: 'Xã Duy Phước' }, { name: 'Xã Duy Sơn' }, { name: 'Xã Duy Thành' },
            { name: 'Xã Duy Thu' }, { name: 'Xã Duy Tân' }, { name: 'Xã Duy Trinh' }, { name: 'Xã Duy Vinh' },
        ],
    },
    {
        name: 'Huyện Thăng Bình',
        wards: [
            { name: 'Thị trấn Hà Lam' }, { name: 'Xã Bình An' }, { name: 'Xã Bình Chánh' },
            { name: 'Xã Bình Định Bắc' }, { name: 'Xã Bình Định Nam' }, { name: 'Xã Bình Đào' },
            { name: 'Xã Bình Dương' }, { name: 'Xã Bình Giang' }, { name: 'Xã Bình Hải' },
            { name: 'Xã Bình Lãnh' }, { name: 'Xã Bình Minh' }, { name: 'Xã Bình Nam' },
            { name: 'Xã Bình Nguyên' }, { name: 'Xã Bình Phú' }, { name: 'Xã Bình Sa' },
            { name: 'Xã Bình Triều' }, { name: 'Xã Bình Trị' }, { name: 'Xã Bình Trung' },
        ],
    },
    {
        name: 'Huyện Núi Thành',
        wards: [
            { name: 'Thị trấn Núi Thành' }, { name: 'Xã Tam Anh Bắc' }, { name: 'Xã Tam Anh Nam' },
            { name: 'Xã Tam Giang' }, { name: 'Xã Tam Hải' }, { name: 'Xã Tam Hòa' },
            { name: 'Xã Tam Hiệp' }, { name: 'Xã Tam Mỹ Đông' }, { name: 'Xã Tam Mỹ Tây' },
            { name: 'Xã Tam Nghĩa' }, { name: 'Xã Tam Quang' }, { name: 'Xã Tam Sơn' },
            { name: 'Xã Tam Thạnh' }, { name: 'Xã Tam Tiến' }, { name: 'Xã Tam Xuân I' }, { name: 'Xã Tam Xuân II' },
        ],
    },
    {
        name: 'Huyện Phú Ninh',
        wards: [
            { name: 'Thị trấn Phú Thịnh' }, { name: 'Xã Tam An' }, { name: 'Xã Tam Đàn' },
            { name: 'Xã Tam Dân' }, { name: 'Xã Tam Lãnh' }, { name: 'Xã Tam Lộc' },
            { name: 'Xã Tam Phước' }, { name: 'Xã Tam Thái' }, { name: 'Xã Tam Vinh' },
        ],
    },
    {
        name: 'Huyện Quế Sơn',
        wards: [
            { name: 'Thị trấn Đông Phú' }, { name: 'Xã Hương An' }, { name: 'Xã Quế An' },
            { name: 'Xã Quế Châu' }, { name: 'Xã Quế Cường' }, { name: 'Xã Quế Hiệp' },
            { name: 'Xã Quế Long' }, { name: 'Xã Quế Minh' }, { name: 'Xã Quế Mỹ' },
            { name: 'Xã Quế Phong' }, { name: 'Xã Quế Phú' }, { name: 'Xã Quế Thuận' },
            { name: 'Xã Quế Xuân 1' }, { name: 'Xã Quế Xuân 2' },
        ],
    },
    {
        name: 'Huyện Tiên Phước',
        wards: [
            { name: 'Thị trấn Tiên Kỳ' }, { name: 'Xã Tiên An' }, { name: 'Xã Tiên Cảnh' },
            { name: 'Xã Tiên Châu' }, { name: 'Xã Tiên Hà' }, { name: 'Xã Tiên Hiệp' },
            { name: 'Xã Tiên Lập' }, { name: 'Xã Tiên Lộc' }, { name: 'Xã Tiên Long' },
            { name: 'Xã Tiên Mỹ' }, { name: 'Xã Tiên Ngọc' }, { name: 'Xã Tiên Phong' },
            { name: 'Xã Tiên Sơn' }, { name: 'Xã Tiên Thọ' },
        ],
    },
    {
        name: 'Huyện Hiệp Đức',
        wards: [
            { name: 'Thị trấn Tân Bình' }, { name: 'Xã Bình Lâm' }, { name: 'Xã Hiệp Hòa' },
            { name: 'Xã Hiệp Thuận' }, { name: 'Xã Phước Trà' }, { name: 'Xã Phước Gia' },
            { name: 'Xã Quế Bình' }, { name: 'Xã Quế Lưu' }, { name: 'Xã Quế Thọ' }, { name: 'Xã Thăng Phước' },
        ],
    },
    {
        name: 'Huyện Phước Sơn',
        wards: [
            { name: 'Thị trấn Khâm Đức' }, { name: 'Xã Phước Chánh' }, { name: 'Xã Phước Công' },
            { name: 'Xã Phước Đức' }, { name: 'Xã Phước Hiệp' }, { name: 'Xã Phước Hòa' },
            { name: 'Xã Phước Kim' }, { name: 'Xã Phước Lộc' }, { name: 'Xã Phước Mỹ' },
            { name: 'Xã Phước Năng' }, { name: 'Xã Phước Xuân' },
        ],
    },
    {
        name: 'Huyện Nam Giang',
        wards: [
            { name: 'Thị trấn Thạnh Mỹ' }, { name: 'Xã Cà Dy' }, { name: 'Xã Chơ Chun' },
            { name: 'Xã Đắc Pre' }, { name: 'Xã Đắc Tôi' }, { name: 'Xã La Dêê' },
            { name: 'Xã La Êê' }, { name: 'Xã Tà Bhing' }, { name: 'Xã Tà Pơơ' }, { name: 'Xã Zuôich' },
        ],
    },
    {
        name: 'Huyện Tây Giang',
        wards: [
            { name: 'Xã A Nông' }, { name: 'Xã A Tiêng' }, { name: 'Xã A Vương' }, { name: 'Xã A Xan' },
            { name: 'Xã Bhalêê' }, { name: "Xã Ch'ơm" }, { name: 'Xã Dang' },
            { name: 'Xã Ga Ry' }, { name: 'Xã Lăng' }, { name: "Xã Tr'hy" },
        ],
    },
    {
        name: 'Huyện Đông Giang',
        wards: [
            { name: 'Thị trấn Prao' }, { name: 'Xã A Ting' }, { name: 'Xã Ba' },
            { name: 'Xã Jơ Ngây' }, { name: 'Xã Kà Dăng' }, { name: 'Xã Ma Cooih' },
            { name: 'Xã Sông Kôn' }, { name: 'Xã Tư' }, { name: 'Xã Zà Hung' },
        ],
    },
    {
        name: 'Huyện Bắc Trà My',
        wards: [
            { name: 'Thị trấn Trà My' }, { name: 'Xã Trà Bui' }, { name: 'Xã Trà Đốc' },
            { name: 'Xã Trà Ganh' }, { name: 'Xã Trà Giác' }, { name: 'Xã Trà Giáp' },
            { name: 'Xã Trà Ka' }, { name: 'Xã Trà Kót' }, { name: 'Xã Trà Nú' },
            { name: 'Xã Trà Sơn' }, { name: 'Xã Trà Tân' },
        ],
    },
    {
        name: 'Huyện Nam Trà My',
        wards: [
            { name: 'Xã Trà Cang' }, { name: 'Xã Trà Don' }, { name: 'Xã Trà Dơn' },
            { name: 'Xã Trà Linh' }, { name: 'Xã Trà Leng' }, { name: 'Xã Trà Mai' },
            { name: 'Xã Trà Nam' }, { name: 'Xã Trà Tập' }, { name: 'Xã Trà Vinh' },
        ],
    },
];
