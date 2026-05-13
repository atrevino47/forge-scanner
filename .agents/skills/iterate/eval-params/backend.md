# Backend Evaluation Parameters

Score each 1-10. Total max: 140.

| # | Parameter | What to evaluate |
|---|-----------|-----------------|
| 1 | **Input Validation** | All inputs validated with Zod? Edge cases handled? Types strict? |
| 2 | **Error Handling** | Every async has try/catch? User-friendly error messages? Proper HTTP codes? |
| 3 | **Response Shape** | Matches contract types? Consistent structure? No leaking internal details? |
| 4 | **Security** | No injection vectors? Auth checked? Rate limiting? Input sanitized? |
| 5 | **Performance** | N+1 queries? Unnecessary awaits? Could anything be parallelized? |
| 6 | **Code Clarity** | Can a new developer understand this in one read? Self-documenting names? |
| 7 | **Single Responsibility** | Does each function do one thing? Are concerns separated? |
| 8 | **Error Recovery** | Graceful degradation? Fallback behavior? Partial success handling? |
| 9 | **Type Safety** | No `any`? No `@ts-ignore`? Discriminated unions where appropriate? |
| 10 | **Testability** | Pure functions where possible? Dependencies injectable? Side effects isolated? |
| 11 | **Logging** | Meaningful log messages? Structured data? Appropriate levels? |
| 12 | **Database Efficiency** | Queries optimized? Using indexes? Minimal round trips? |
| 13 | **API Design** | RESTful conventions? Predictable URLs? Proper method usage? |
| 14 | **Edge Cases** | Empty states? Null/undefined? Concurrent access? Timeout handling? |
