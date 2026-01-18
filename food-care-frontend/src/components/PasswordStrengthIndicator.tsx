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
        if (strength < 3) return 'Weak';
        if (strength < 5) return 'Medium';
        return 'Strong';
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
                    Password strength: {getStrengthLabel()}
                </p>
            )}

            {/* Requirements Checklist */}
            <ul className="text-xs space-y-1">
                <li className={`flex items-center gap-1.5 ${checks.length ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.length ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                </li>
                <li className={`flex items-center gap-1.5 ${checks.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.uppercase ? '✓' : '○'}</span>
                    <span>One uppercase letter (A-Z)</span>
                </li>
                <li className={`flex items-center gap-1.5 ${checks.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.lowercase ? '✓' : '○'}</span>
                    <span>One lowercase letter (a-z)</span>
                </li>
                <li className={`flex items-center gap-1.5 ${checks.number ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.number ? '✓' : '○'}</span>
                    <span>One number (0-9)</span>
                </li>
                <li className={`flex items-center gap-1.5 ${checks.special ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="w-4">{checks.special ? '✓' : '○'}</span>
                    <span>One special character (@$!%*?&)</span>
                </li>
            </ul>
        </div>
    );
}
