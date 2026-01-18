namespace FoodCare.API.Helpers
{
    public static class PasswordValidator
    {
        public static (bool IsValid, List<string> Errors) ValidatePassword(string password)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(password))
            {
                errors.Add("Password is required");
                return (false, errors);
            }

            if (password.Length < 8)
            {
                errors.Add("Password must be at least 8 characters");
            }

            if (!password.Any(char.IsUpper))
            {
                errors.Add("Password must contain at least one uppercase letter");
            }

            if (!password.Any(char.IsLower))
            {
                errors.Add("Password must contain at least one lowercase letter");
            }

            if (!password.Any(char.IsDigit))
            {
                errors.Add("Password must contain at least one number");
            }

            var specialChars = "@$!%*?&";
            if (!password.Any(ch => specialChars.Contains(ch)))
            {
                errors.Add("Password must contain at least one special character (@$!%*?&)");
            }

            return (errors.Count == 0, errors);
        }

        public static int GetPasswordStrength(string password)
        {
            if (string.IsNullOrWhiteSpace(password)) return 0;

            int strength = 0;

            if (password.Length >= 8) strength++;
            if (password.Any(char.IsUpper)) strength++;
            if (password.Any(char.IsLower)) strength++;
            if (password.Any(char.IsDigit)) strength++;
            if (password.Any(ch => "@$!%*?&".Contains(ch))) strength++;

            return strength;
        }
    }
}
