using FoodCare.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace FoodCare.API.Services.Implementations;

/// <summary>
/// Caches and retrieves FAQ answers to avoid AI API calls
/// </summary>
public class FaqCacheService
{
    private readonly FoodCareDbContext _context;
    
    public FaqCacheService(FoodCareDbContext context)
    {
        _context = context;
    }
    
    /// <summary>
    /// Try to find a matching FAQ answer for the user's question
    /// Returns null if no match found (will need AI)
    /// </summary>
    public async Task<string?> FindAnswerAsync(string userQuestion)
    {
        var faqs = await _context.ChatFaqs
            .Where(f => f.IsActive) // Use IsActive property
            .ToListAsync();
        
        foreach (var faq in faqs)
        {
            try
            {
                // Use regex pattern matching
                if (Regex.IsMatch(userQuestion, faq.QuestionPattern, RegexOptions.IgnoreCase))
                {
                    // Found a match! Increment hit count
                    faq.HitCount++;
                    faq.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    
                    return faq.Answer;
                }
            }
            catch (ArgumentException)
            {
                // Invalid regex pattern, skip this FAQ
                continue;
            }
        }
        
        return null; // No FAQ match found
    }
    
    /// <summary>
    /// Get popular FAQs for analytics
    /// </summary>
    public async Task<List<ChatFaq>> GetPopularFaqsAsync(int limit = 10)
    {
        return await _context.ChatFaqs
            .OrderByDescending(f => f.HitCount)
            .Take(limit)
            .ToListAsync();
    }
}
