#!/bin/bash

# Test script to verify all reranking methods are working

BACKEND_URL="http://localhost:5000"
QUERY="What are the benefits of RAG?"

echo "🧪 Testing RAG Reranking Methods"
echo "================================"
echo "Query: $QUERY"
echo ""

# Test each reranking method
methods=("none" "bm25" "cross_encoder" "diversity" "length_penalty" "keyword_boost")

for method in "${methods[@]}"; do
    echo "Testing method: $method"
    echo "------------------------"
    
    response=$(curl -s -X POST "$BACKEND_URL/api/search-chunks" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$QUERY\", \"top_k\": 3, \"similarity_metric\": \"cosine\", \"reranking_method\": \"$method\"}")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        echo "✅ SUCCESS"
        
        # Show rank changes
        echo "$response" | jq -r '.results[] | "Rank \(.rank // "N/A") (was \(.initial_rank // "N/A")): \(.content[0:60])... | Similarity: \((.similarity_score * 100) | round)%"'
        
        # Show reranking scores if available
        if [ "$method" != "none" ]; then
            echo "Reranking scores:"
            echo "$response" | jq -r '.results[] | select(.combined_score) | "  Combined: \((.combined_score * 100) | round)%"' 2>/dev/null || echo "  No combined scores"
            echo "$response" | jq -r '.results[] | select(.bm25_score) | "  BM25: \(.bm25_score | round)"' 2>/dev/null || true
            echo "$response" | jq -r '.results[] | select(.keyword_score) | "  Keyword: \(.keyword_score | round)"' 2>/dev/null || true
        fi
        
    else
        echo "❌ FAILED"
        echo "$response" | jq -r '.error // "Unknown error"'
    fi
    
    echo ""
done

echo "🎯 Summary"
echo "=========="
echo "All reranking methods tested. Check above for any failures."
echo ""
echo "To see the frontend in action:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Go to Phase 3: Information Retrieval"
echo "3. Try different reranking methods with the query: '$QUERY'"
echo "4. Look for rank changes and additional scores in the results"
echo ""
echo "To see the test page:"
echo "1. Open http://localhost:3000/test-reranking.html"
echo "2. Click 'Test All Methods' to see side-by-side comparison"