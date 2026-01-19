interface PasswordStrengthIndicatorProps {
    password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password),
    };

    const strength = Object.values(checks).filter(Boolean).length;

    const getStrengthLabel = () => {
        if (strength === 0) return '';
        if (strength < 3) return 'Yếu';
        if (strength < 5) return 'Trung bình';
        return 'Mạnh';
    };

    const getStrengthColor = () => {
        if (strength < 3) return 'bg-red-500';
        if (strength < 5) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    if (!password) return null;

    return (
        <div className="space-y-2 mt-2">
            {/* Strength Bar */}
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${level <= strength
                            ? getStrengthColor()
                            : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>

            {/* Strength Label */}
            {strength > 0 && (
                <p className={`text-xs font-medium ${strength < 3 ? 'text-red-600' : strength < 5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                    Độ mạnh mật khẩu: {getStrengthLabel()}
                </p>
            )}

            {/* Requirements Checklist */}
            <ul className="text-xs space-y-1">
                <li className={`flex items-center gap-1.5 ${checks.length ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.length ? '✓' : '○'}</span> Ít nhất 8 ký tự
                </li>
                <li className={`flex items-center gap-1.5 ${checks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.uppercase ? '✓' : '○'}</span> Một chữ HOA (A-Z)
                </li>
                <li className={`flex items-center gap-1.5 ${checks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.lowercase ? '✓' : '○'}</span> Một chữ thường (a-z)
                </li>
                <li className={`flex items-center gap-1.5 ${checks.number ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.number ? '✓' : '○'}</span> Một chữ số (0-9)
                </li>
                <li className={`flex items-center gap-1.5 ${checks.special ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.special ? '✓' : '○'}</span> Một ký tự đặc biệt (@$!%*?&)
                </li>
            </ul>
        </div>
    );
}
