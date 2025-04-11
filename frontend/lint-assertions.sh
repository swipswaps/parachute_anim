#!/bin/bash

# Script to identify potential false assertions in the codebase
# This script searches for keywords that might indicate false assertions
# and outputs the results to a report file

# Set the base directory
BASE_DIR="/home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim"
REPORT_FILE="$BASE_DIR/frontend/assertion-lint-report.md"

# Create the report file
echo "# False Assertion Lint Report" > $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "This report identifies potential false assertions in the codebase." >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Function to search for keywords and append results to the report
search_keywords() {
    local dir=$1
    local file_pattern=$2
    local keyword=$3
    local section_title=$4
    
    echo "## $section_title" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    
    # Find files matching the pattern and containing the keyword
    results=$(grep -r "$keyword" --include="$file_pattern" "$dir" 2>/dev/null)
    
    if [ -z "$results" ]; then
        echo "No potential false assertions found." >> $REPORT_FILE
    else
        echo "```" >> $REPORT_FILE
        echo "$results" >> $REPORT_FILE
        echo "```" >> $REPORT_FILE
    fi
    
    echo "" >> $REPORT_FILE
}

# Search for potential false assertions in documentation
echo "# Documentation Files" >> $REPORT_FILE
echo "" >> $REPORT_FILE

search_keywords "$BASE_DIR" "*.md" "implemented" "Files containing 'implemented'"
search_keywords "$BASE_DIR" "*.md" "fixed" "Files containing 'fixed'"
search_keywords "$BASE_DIR" "*.md" "resolved" "Files containing 'resolved'"
search_keywords "$BASE_DIR" "*.md" "completed" "Files containing 'completed'"

# Search for potential false assertions in code comments
echo "# Code Files" >> $REPORT_FILE
echo "" >> $REPORT_FILE

search_keywords "$BASE_DIR" "*.js" "implemented" "JavaScript files containing 'implemented'"
search_keywords "$BASE_DIR" "*.jsx" "implemented" "JSX files containing 'implemented'"
search_keywords "$BASE_DIR" "*.js" "fixed" "JavaScript files containing 'fixed'"
search_keywords "$BASE_DIR" "*.jsx" "fixed" "JSX files containing 'fixed'"
search_keywords "$BASE_DIR" "*.js" "resolved" "JavaScript files containing 'resolved'"
search_keywords "$BASE_DIR" "*.jsx" "resolved" "JSX files containing 'resolved'"

# Search for configuration files that might have proposed changes
echo "# Configuration Files" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "## vite.config.js" >> $REPORT_FILE
echo "" >> $REPORT_FILE
if [ -f "$BASE_DIR/frontend/vite.config.js" ]; then
    echo "```javascript" >> $REPORT_FILE
    cat "$BASE_DIR/frontend/vite.config.js" >> $REPORT_FILE
    echo "```" >> $REPORT_FILE
else
    echo "File not found." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

echo "## postcss.config.js" >> $REPORT_FILE
echo "" >> $REPORT_FILE
if [ -f "$BASE_DIR/frontend/postcss.config.js" ]; then
    echo "```javascript" >> $REPORT_FILE
    cat "$BASE_DIR/frontend/postcss.config.js" >> $REPORT_FILE
    echo "```" >> $REPORT_FILE
else
    echo "File not found." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

echo "## tailwind.config.js" >> $REPORT_FILE
echo "" >> $REPORT_FILE
if [ -f "$BASE_DIR/frontend/tailwind.config.js" ]; then
    echo "```javascript" >> $REPORT_FILE
    cat "$BASE_DIR/frontend/tailwind.config.js" >> $REPORT_FILE
    echo "```" >> $REPORT_FILE
else
    echo "File not found." >> $REPORT_FILE
fi
echo "" >> $REPORT_FILE

# Provide recommendations
echo "# Recommendations" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "1. Review all instances of 'implemented', 'fixed', 'resolved', and 'completed' in documentation to ensure they accurately reflect the state of the codebase." >> $REPORT_FILE
echo "2. Add TODO comments for features that are planned but not yet implemented." >> $REPORT_FILE
echo "3. Create a separate 'Proposed Enhancements' document for features that have been proposed but not implemented." >> $REPORT_FILE
echo "4. Update the compliance table to accurately reflect the state of the codebase." >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "Report generated at $REPORT_FILE"
chmod +x "$BASE_DIR/frontend/lint-assertions.sh"
