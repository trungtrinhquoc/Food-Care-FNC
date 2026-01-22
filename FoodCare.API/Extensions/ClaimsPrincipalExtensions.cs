using System.Security.Claims;

namespace FoodCare.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim =
                user.FindFirst(ClaimTypes.NameIdentifier) ??
                user.FindFirst("sub") ??
                user.FindFirst("userId");

            if (userIdClaim == null)
                throw new Exception("UserId claim not found");

            return Guid.Parse(userIdClaim.Value);
        }
    }
}
