using AutoMapper;
using Microsoft.EntityFrameworkCore;
using FoodCare.API.Models;
using FoodCare.API.Models.DTOs.Auth;
using FoodCare.API.Helpers;
using FoodCare.API.Models.Enums;
using FoodCare.API.Services.Interfaces;

namespace FoodCare.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly FoodCareDbContext _context;
    private readonly IMapper _mapper;
    private readonly JwtHelper _jwtHelper;
    private readonly ILogger<AuthService> _logger;
    private readonly Supabase.Client _supabaseClient;
    private readonly IEmailService _emailService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        FoodCareDbContext context,
        IMapper mapper,
        JwtHelper jwtHelper,
        ILogger<AuthService> logger,
        Supabase.Client supabaseClient,
        IEmailService emailService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _mapper = mapper;
        _jwtHelper = jwtHelper;
        _logger = logger;
        _supabaseClient = supabaseClient;
        _emailService = emailService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // Validate password strength
        var (isValid, errors) = PasswordValidator.ValidatePassword(request.Password);
        if (!isValid)
        {
            throw new InvalidOperationException($"Password validation failed: {string.Join(", ", errors)}");
        }

        // Check if email already exists in our database (quick validation)
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("Email already exists in system");
        }

        var bronzeTier = await _context.MemberTiers.FirstOrDefaultAsync(mt => mt.Id == 1);
        if (bronzeTier == null)
        {
            // Auto-create Bronze tier with ID=1 if it doesn't exist
            bronzeTier = new MemberTier 
            { 
                Id = 1,
                Name = "Bronze", 
                MinPoint = 0, 
                DiscountPercent = 0,
                CreatedAt = DateTime.UtcNow
            };
            _context.MemberTiers.Add(bronzeTier);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Created default Bronze tier with ID=1");
        }

        // Call Supabase Auth to create real user and get real ID
        _logger.LogInformation("Calling Supabase Auth SignUp for email: {Email}", request.Email);
        
        var session = await _supabaseClient.Auth.SignUp(request.Email, request.Password);

        _logger.LogInformation("Supabase Auth response - Session: {Session}, User: {User}, UserId: {UserId}", 
            session != null ? "Not null" : "NULL", 
            session?.User != null ? "Not null" : "NULL",
            session?.User?.Id ?? "NULL");

        if (session?.User == null || string.IsNullOrEmpty(session.User.Id))
        {
            // If Supabase rejects (e.g., weak password, invalid email format...)
            _logger.LogError("Supabase Auth failed to create user. Session or User is null");
            throw new Exception("Failed to create user in Supabase Auth");
        }

        // Get real ID from Supabase response (String -> Guid)
        var supabaseUserId = Guid.Parse(session.User.Id);
        _logger.LogInformation("Successfully created user in Supabase Auth with ID: {UserId}", supabaseUserId);

        // Generate verification token
        var verificationToken = Guid.NewGuid().ToString();

        // Create User in public.users with matching ID
        var user = new User
        {
            Id = supabaseUserId, // CRITICAL: Use Supabase's ID
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            TierId = bronzeTier.Id,
            LoyaltyPoints = 0,
            Role = UserRole.customer,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            
            // Email Verification
            EmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationExpiry = DateTime.UtcNow.AddHours(24)
        };

        _logger.LogInformation("Adding user to database context: Id={UserId}, Email={Email}, TierId={TierId}, Role={Role}", 
            user.Id, user.Email, user.TierId, user.Role);

        _context.Users.Add(user);
        
        try 
        {
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Log detailed error information
            _logger.LogError(ex, "Failed to save user to database after Supabase creation. Inner Exception: {InnerException}", ex.InnerException?.Message);
            
            // If our DB save fails, we should delete the user from Supabase to avoid orphaned data
            // Note: This requires admin privileges, so we'll just log the error for now
            
            throw new Exception($"Database Error: {ex.InnerException?.Message ?? ex.Message}");
        }

        // Load Tier for DTO mapping
        await _context.Entry(user).Reference(u => u.Tier).LoadAsync();

        // Send verification email
        _logger.LogInformation("Sending verification email to: {Email}", user.Email);
        try
        {
            await _emailService.SendVerificationEmailAsync(
                user.Email,
                verificationToken,
                user.FullName ?? "User"
            );
            _logger.LogInformation("Verification email sent successfully to: {Email}", user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", user.Email);
            // Don't fail registration if email fails
        }

        _logger.LogInformation("User registered successfully: {Email}. Email verification required.", user.Email);

        // Don't auto-login, require email verification first
        return new AuthResponseDto
        {
            Message = "Registration successful! Please check your email to verify your account.",
            User = null,
            Token = null,
            RefreshToken = null
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        // Verify credentials with Supabase Auth
        _logger.LogInformation("Attempting login with Supabase Auth for email: {Email}", request.Email);
        
        // Get HTTP context for logging
        var httpContext = _httpContextAccessor.HttpContext;
        var ipAddress = httpContext?.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = httpContext?.Request.Headers["User-Agent"].ToString() ?? "Unknown";
        
        Supabase.Gotrue.Session? session;
        
        try
        {
            session = await _supabaseClient.Auth.SignIn(request.Email, request.Password);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Supabase Auth sign-in failed for email: {Email}", request.Email);
            
            // Try to get userId from email for failed login log
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                await CreateLoginLogAsync(existingUser.Id, ipAddress, userAgent, false, "Invalid credentials");
            }
            
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        if (session?.User == null || string.IsNullOrEmpty(session.User.Id))
        {
            _logger.LogWarning("Supabase Auth returned null session or user for email: {Email}", request.Email);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var supabaseUserId = Guid.Parse(session.User.Id);
        _logger.LogInformation("Supabase Auth successful for user ID: {UserId}", supabaseUserId);

        // Get user from our database
        var user = await _context.Users
            .Include(u => u.Tier)
            .FirstOrDefaultAsync(u => u.Id == supabaseUserId);

        if (user == null)
        {
            _logger.LogWarning("User exists in Supabase but not in database: {UserId}", supabaseUserId);
            throw new UnauthorizedAccessException("User not found in system");
        }

        if (user.IsActive == false)
        {
            await CreateLoginLogAsync(user.Id, ipAddress, userAgent, false, "Account inactive");
            throw new UnauthorizedAccessException("Account is inactive");
        }

        // Create successful login log
        await CreateLoginLogAsync(user.Id, ipAddress, userAgent, true, null);

        var token = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role.ToString());
        var refreshToken = _jwtHelper.GenerateRefreshToken();

        _logger.LogInformation("User logged in successfully: {Email}", user.Email);

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            User = _mapper.Map<UserDto>(user)
        };
    }
    
    private async Task CreateLoginLogAsync(Guid userId, string ipAddress, string userAgent, bool success, string? failureReason)
    {
        try
        {
            var loginLog = new LoginLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                LoginAt = DateTime.UtcNow,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                DeviceType = ParseDeviceType(userAgent),
                DeviceName = ParseDeviceName(userAgent),
                Success = success,
                FailureReason = failureReason,
                CreatedAt = DateTime.UtcNow
            };

            _context.LoginLogs.Add(loginLog);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create login log for user {UserId}", userId);
            // Don't throw - logging failure shouldn't prevent login
        }
    }

    private static string ParseDeviceType(string userAgent)
    {
        if (string.IsNullOrEmpty(userAgent)) return "Unknown";
        
        var ua = userAgent.ToLower();
        if (ua.Contains("mobile") || ua.Contains("android") || ua.Contains("iphone"))
            return "Mobile";
        if (ua.Contains("tablet") || ua.Contains("ipad"))
            return "Tablet";
        return "Desktop";
    }

    private static string ParseDeviceName(string userAgent)
    {
        if (string.IsNullOrEmpty(userAgent)) return "Unknown";
        
        var ua = userAgent.ToLower();
        if (ua.Contains("chrome")) return "Chrome";
        if (ua.Contains("firefox")) return "Firefox";
        if (ua.Contains("safari")) return "Safari";
        if (ua.Contains("edge")) return "Edge";
        if (ua.Contains("opera")) return "Opera";
        return "Unknown Browser";
    }

    public async Task<AuthResponseDto> GoogleAuthAsync(GoogleAuthRequestDto request)
    {
        throw new NotImplementedException("Google OAuth will be implemented later");
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Tier)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user == null ? null : _mapper.Map<UserDto>(user);
    }

    public async Task<bool> VerifyEmailAsync(string token)
    {
        // First, check if user with this token exists (regardless of verification status)
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
        
        if (user == null)
        {
            _logger.LogWarning("Email verification failed: Token not found");
            return false;
        }
        
        // Check if already verified
        if (user.EmailVerified)
        {
            _logger.LogInformation("Email already verified for user: {Email}", user.Email);
            return true; // Return success, no need to verify again
        }
        
        // Check if token expired
        if (user.EmailVerificationExpiry == null || user.EmailVerificationExpiry < DateTime.UtcNow)
        {
            _logger.LogWarning("Email verification failed: Token expired for user: {Email}", user.Email);
            return false;
        }
        
        // Verify email
        _logger.LogInformation("Verifying email for user: {Email}", user.Email);
        
        user.EmailVerified = true;
        // Keep token so user can click verification link multiple times
        // user.EmailVerificationToken = null;
        // user.EmailVerificationExpiry = null;
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Email verified successfully for user: {Email}", user.Email);
        
        // Send welcome email
        try
        {
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FullName ?? "User");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
            // Don't fail verification if welcome email fails
        }
        
        return true;
    }

    public async Task ResendVerificationEmailAsync(string email)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email && !u.EmailVerified);
        
        if (user == null)
        {
            _logger.LogWarning("Resend verification failed: User not found or already verified for email: {Email}", email);
            throw new InvalidOperationException("User not found or already verified");
        }
        
        _logger.LogInformation("Resending verification email to: {Email}", email);
        
        // Generate new token
        var newToken = Guid.NewGuid().ToString();
        user.EmailVerificationToken = newToken;
        user.EmailVerificationExpiry = DateTime.UtcNow.AddHours(24);
        
        await _context.SaveChangesAsync();
        
        await _emailService.SendVerificationEmailAsync(
            user.Email,
            newToken,
            user.FullName ?? "User"
        );
        
        _logger.LogInformation("Verification email resent successfully to: {Email}", email);
    }
}
