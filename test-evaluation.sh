#!/bin/bash

# Test script to verify LLM-as-a-Judge evaluation functionality

BACKEND_URL="http://localhost:5000"

echo "🧪 Testing LLM-as-a-Judge Evaluation"
echo "===================================="
echo ""

# Test 1: Retrieval Evaluation
echo "1. Testing Retrieval Evaluation"
echo "------------------------------"

retrieval_response=$(curl -s -X POST "$BACKEND_URL/api/evaluate-retrieval" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "What are the benefits of RAG?",
        "retrieved_chunks": [
            {"content": "Benefits of RAG include improved accuracy by reducing hallucinations in AI responses"},
            {"content": "RAG provides up-to-date information without requiring model retraining"},
            {"content": "Source attribution in RAG systems provides transparency through traceable references"}
        ],
        "evaluation_model": "anthropic.claude-3-haiku-20240307-v1:0"
    }')

if echo "$retrieval_response" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Retrieval evaluation SUCCESS"
    echo "Evaluation scores:"
    echo "$retrieval_response" | jq -r '.evaluations | to_entries[] | "  \(.key | ascii_upcase): \(.value.rating)/5 - \(.value.explanation)"' 2>/dev/null || echo "  Scores parsing failed"
else
    echo "❌ Retrieval evaluation FAILED"
    echo "$retrieval_response" | jq -r '.error // "Unknown error"'
fi

echo ""

# Test 2: Full RAG Evaluation
echo "2. Testing Full RAG Evaluation"
echo "-----------------------------"

rag_response=$(curl -s -X POST "$BACKEND_URL/api/evaluate-rag" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "What are the benefits of RAG?",
        "retrieved_chunks": [
            {"content": "Benefits of RAG include improved accuracy by reducing hallucinations in AI responses"},
            {"content": "RAG provides up-to-date information without requiring model retraining"},
            {"content": "Source attribution in RAG systems provides transparency through traceable references"}
        ],
        "generated_response": "RAG (Retrieval-Augmented Generation) offers several key benefits: 1) Improved accuracy by reducing hallucinations through external knowledge, 2) Access to up-to-date information without retraining models, and 3) Transparent source attribution that allows users to trace information back to original sources.",
        "evaluation_model": "anthropic.claude-3-haiku-20240307-v1:0"
    }')

if echo "$rag_response" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ RAG evaluation SUCCESS"
    
    # Extract overall score
    overall_score=$(echo "$rag_response" | jq -r '.overall_score // "N/A"')
    echo "Overall Score: $overall_score/5"
    
    echo "Individual scores:"
    echo "$rag_response" | jq -r '.evaluations | to_entries[] | "  \(.key | ascii_upcase): \(.value.rating)/5 - \(.value.explanation)"' 2>/dev/null || echo "  Scores parsing failed"
    
    echo ""
    echo "Summary:"
    echo "$rag_response" | jq -r '.summary // "No summary available"'
    
else
    echo "❌ RAG evaluation FAILED"
    echo "$rag_response" | jq -r '.error // "Unknown error"'
fi

echo ""
echo "🎯 Evaluation Test Summary"
echo "========================="
echo "Both evaluation endpoints tested."
echo ""
echo "To test in the frontend:"
echo "1. Open http://localhost:3000"
echo "2. Complete phases 1-4 (chunking, embedding, retrieval, generation)"
echo "3. Go to Phase 5: LLM-as-a-Judge Evaluation"
echo "4. Click 'Evaluate Complete RAG Pipeline' or 'Evaluate Retrieval Quality'"
echo "5. View detailed evaluation scores and explanations"