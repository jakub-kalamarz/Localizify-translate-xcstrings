# React State Update Fix

## Issue
**Error**: `Cannot update a component (FileUpload) while rendering a different component (TranslatorPageNew)`

This error occurs when a `setState` call is made during the render phase of a React component, which violates React's rules and can cause infinite render loops.

## Root Cause Analysis

The issue was caused by multiple factors:

1. **Immediate State Updates in Quality Analysis**: The `analyzeStrings` function in `useCopyQualityEnhancement` was calling `setState(prev => ({ ...prev, isAnalyzing: true }))` immediately when called, which could happen during render.

2. **File Loading Triggers Quality Analysis**: The `handleFileLoadWithQuality` function was calling `analyzeStrings` synchronously, which would trigger state updates during the file loading process.

3. **Circular Dependencies**: The saved file loading useEffect had dependencies that could cause circular updates.

## Solutions Implemented

### 1. **Deferred State Updates in Quality Analysis Hook**
```typescript
// Before (problematic):
const analyzeStrings = useCallback(async (...) => {
  setState(prev => ({ ...prev, isAnalyzing: true })); // Immediate state update
  // ... rest of function
}, [enhancer]);

// After (fixed):
const analyzeStrings = useCallback(async (...) => {
  // Use a microtask to ensure state updates happen after render
  await new Promise(resolve => setTimeout(resolve, 0));
  setState(prev => ({ ...prev, isAnalyzing: true }));
  // ... rest of function
}, [enhancer]);
```

### 2. **Scheduled State Updates in File Loading**
```typescript
// Before (problematic):
const handleFileLoadWithQuality = useCallback(async (data, isFromSavedFile) => {
  handleFileLoad(data, isFromSavedFile);
  if (!isFromSavedFile && data.strings && data.strings.length > 0) {
    await analyzeStrings(data.strings, data.sourceLanguage, options); // Could cause immediate state updates
  }
}, [handleFileLoad, analyzeStrings]);

// After (fixed):
const handleFileLoadWithQuality = useCallback((data, isFromSavedFile) => {
  handleFileLoad(data, isFromSavedFile);
  if (!isFromSavedFile && data.strings && data.strings.length > 0) {
    scheduleStateUpdate(async () => { // Deferred execution
      await analyzeStrings(data.strings, data.sourceLanguage, options);
    });
  }
}, [handleFileLoad, analyzeStrings]);
```

### 3. **Async Utilities for Safe State Management**
Created `src/utils/async-utils.ts` with utilities:
- `deferExecution`: Defers function execution to next tick
- `scheduleStateUpdate`: Schedules state updates after render
- `debounce`: Debounces function calls
- `safeAsync`: Safely executes async functions with error handling

### 4. **Improved Dependency Management**
- Removed circular dependencies in useEffect hooks
- Ensured saved file loading doesn't trigger quality analysis
- Made quality analysis opt-in for new files only

## Best Practices for Avoiding This Issue

### ✅ **Do:**
1. **Use useEffect for side effects**: State updates should happen in useEffect, not during render
2. **Defer async operations**: Use `setTimeout` or `queueMicrotask` to defer state updates
3. **Separate concerns**: Keep file loading and quality analysis as separate operations
4. **Use proper dependency arrays**: Ensure useEffect dependencies don't cause circular updates

### ❌ **Don't:**
1. **Call setState during render**: Never call state setters in the component body
2. **Make synchronous state updates in callbacks**: Avoid immediate state updates in event handlers
3. **Create circular dependencies**: Be careful with useEffect dependency arrays
4. **Ignore React warnings**: Always address React's development warnings

## Testing the Fix

The fix can be verified by:
1. **Build Success**: `npm run build` completes without errors
2. **No Console Warnings**: Development server runs without React warnings
3. **Functional Testing**: File loading and quality analysis work correctly
4. **State Updates**: All state updates happen at appropriate times

## Files Modified

1. `src/hooks/useCopyQualityEnhancement.ts` - Added deferred state updates
2. `src/components/translator/TranslatorPageNew.tsx` - Fixed file loading timing
3. `src/utils/async-utils.ts` - Added utility functions for safe async operations

## Prevention

To prevent similar issues in the future:
- Always use React's development mode during development
- Pay attention to React warnings in the console
- Use ESLint rules for React hooks
- Test state updates thoroughly
- Use proper async patterns for side effects