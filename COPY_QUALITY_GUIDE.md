# Copy Quality Guide for XCStrings Files

## Overview
This guide helps you improve the quality of copy in your xcstrings files using Localizify's built-in quality analysis system.

## How It Works

### 1. **Automatic Analysis**
When you import an xcstrings file, Localizify automatically analyzes your copy for:
- **Clarity**: Complex sentences, passive voice, unclear pronouns
- **Consistency**: Terminology, capitalization, style variations
- **Formatting**: Spacing, punctuation, sentence case issues
- **Context**: Ambiguous terms, missing UI context
- **Length**: Overly long text, verbose language
- **Placeholders**: Formatting issues, non-descriptive names

### 2. **Quality Scoring**
Each string receives a quality score (0-100%):
- **80-100%**: Excellent quality
- **60-79%**: Good quality with minor issues
- **40-59%**: Needs improvement
- **Below 40%**: Requires significant attention

### 3. **Improvement Suggestions**
The system provides specific suggestions categorized by:
- **Fix**: Critical issues that need immediate attention
- **Improve**: Enhancements that would benefit the copy
- **Optimize**: Performance and readability optimizations

## Common Quality Issues and Solutions

### 📝 **Clarity Issues**

**Problem**: Complex sentences that are hard to understand
```
Before: "In order to save your work, you must click the save button located in the top right corner of the interface."
After: "Click the Save button in the top right corner."
```

**Problem**: Passive voice making text unclear
```
Before: "The file will be saved by the system."
After: "The system will save the file."
```

**Problem**: Unclear pronouns
```
Before: "Click this to continue."
After: "Click this button to continue."
```

### 🔄 **Consistency Issues**

**Problem**: Inconsistent terminology
```
Before: "log in" vs "login" vs "sign in"
After: Choose one term and use it consistently: "sign in"
```

**Problem**: Inconsistent capitalization
```
Before: "save file" vs "Save File" vs "SAVE FILE"
After: Use consistent title case: "Save File"
```

### 📐 **Formatting Issues**

**Problem**: Spacing and punctuation errors
```
Before: "Hello world  .  Welcome!"
After: "Hello world. Welcome!"
```

**Problem**: Missing sentence case
```
Before: "this is a button"
After: "This is a button"
```

### 🎯 **Context Issues**

**Problem**: Ambiguous terms without context
```
Before: "Save"
After: "Save File" or "Save Changes"
```

**Problem**: UI elements without clear purpose
```
Before: "OK"
After: "OK, Apply Changes"
```

### 📏 **Length Issues**

**Problem**: Overly verbose language
```
Before: "In order to proceed with the deletion process, you must first confirm your intention."
After: "Confirm deletion to proceed."
```

**Problem**: Mobile-unfriendly long text
```
Before: "This is a very long message that will not fit well on mobile screens and should be shortened."
After: "This message is too long for mobile screens."
```

### 🏷️ **Placeholder Issues**

**Problem**: Non-descriptive placeholders
```
Before: "Welcome {0}!"
After: "Welcome {username}!"
```

**Problem**: Inconsistent placeholder formats
```
Before: "Hello %s, you have {1} messages"
After: "Hello {username}, you have {messageCount} messages"
```

## Best Practices

### ✅ **Do:**
1. **Use active voice** instead of passive voice
2. **Be specific** rather than generic ("Save File" vs "Save")
3. **Keep sentences short** (under 20 words when possible)
4. **Use consistent terminology** throughout your app
5. **Provide context** for ambiguous terms
6. **Use descriptive placeholder names**
7. **Follow your style guide** consistently

### ❌ **Don't:**
1. **Use complex sentences** with multiple clauses
2. **Mix different terms** for the same concept
3. **Leave ambiguous pronouns** without clear references
4. **Use inconsistent capitalization** 
5. **Add unnecessary words** that don't add value
6. **Use technical jargon** without explanation
7. **Ignore mobile constraints** for text length

## Using the Quality Enhancement Dialog

### 1. **Overview Tab**
- See overall quality score
- View improvement distribution
- Check high-priority items

### 2. **Suggestions Tab**
- Review specific improvement suggestions
- Select which improvements to apply
- See confidence scores for each suggestion

### 3. **Categories Tab**
- Group improvements by type (clarity, consistency, etc.)
- Focus on specific areas of improvement

### 4. **Priority Tab**
- Address high-impact issues first
- Work through medium and low priority items

## Workflow Tips

### 🚀 **For New Projects:**
1. Import your xcstrings file
2. Review the automatic quality analysis
3. Apply high-confidence improvements (80%+ confidence)
4. Manually review medium-confidence suggestions
5. Export the improved file

### 🔄 **For Existing Projects:**
1. Regularly run quality analysis on updated content
2. Focus on high-priority and high-impact improvements
3. Use the quality metrics to track improvement over time
4. Create style guides based on consistency findings

### 🎯 **For Translation:**
1. Improve source copy quality before translation
2. Use quality-enhanced strings as translation source
3. Apply similar quality standards to translated content
4. Maintain consistency across all languages

## Integration Tips

### **Pre-Translation Quality Check:**
Always improve source copy quality before sending for translation. High-quality source text results in better translations.

### **Batch Processing:**
Use the "Apply All High-Confidence Improvements" option for large files to quickly address obvious issues.

### **Manual Review:**
Always review suggestions with confidence scores below 80% before applying them.

### **Style Guide Creation:**
Use consistency findings to create or update your project's style guide.

## Example: Complete Quality Improvement

**Original String:**
```
Key: "login.error.message"
Value: "An error occurred during the login process and the system was unable to authenticate your credentials so please try again or contact support if the problem persists."
```

**Quality Issues Found:**
- Clarity: Complex sentence (39 words)
- Length: Too verbose for mobile
- Context: Generic error message
- Formatting: Run-on sentence

**Improved String:**
```
Key: "login.error.message"
Value: "Login failed. Please check your credentials and try again."
```

**Quality Improvement:**
- Score: 45% → 85%
- Length: 39 words → 9 words
- Clarity: Much clearer and actionable
- Mobile-friendly: Easy to read on small screens

This improvement maintains the essential information while making it much more user-friendly and accessible.