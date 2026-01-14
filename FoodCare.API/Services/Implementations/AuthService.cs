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

    public AuthService(
        FoodCareDbContext context,
        IMapper mapper,
        JwtHelper jwtHelper,
        ILogger<AuthService> logger,
        Supabase.Client supabaseClient)
    {
        _context = context;
        _mapper = mapper;
        _jwtHelper = jwtHelper;
        _logger = logger;
        _supabaseClient = supabaseClient;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
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
            UpdatedAt = DateTime.UtcNow
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

        // Generate JWT token (Note: Supabase also returns a token, you can use theirs or create your own)
        var token = _jwtHelper.GenerateToken(user.Id, user.Email, user.Role.ToString());
        var refreshToken = _jwtHelper.GenerateRefreshToken();

        _logger.LogInformation("User registered successfully: {Email}", user.Email);

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        // Verify credentials with Supabase Auth
        _logger.LogInformation("Attempting login with Supabase Auth for email: {Email}", request.Email);
        
        Supabase.Gotrue.Session? session;
        try
        {
            session = await _supabaseClient.Auth.SignIn(request.Email, request.Password);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Supabase Auth sign-in failed for email: {Email}", request.Email);
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
            throw new UnauthorizedAccessException("Account is inactive");
        }

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
}
