import prisma from '../config/db.js';
import { getEmbedding } from '../utils/embeddingPipeline.js';

/**
 * Indexes a document context in the local vector database.
 * If the document matching the source + sourceId already exists, it is updated.
 * 
 * @param {Object} params
 * @param {string} params.source - "Asset", "CVE", "KEV", "MITRE", "Finding", "Policy"
 * @param {string} params.sourceId - Original unique ID of the resource
 * @param {string} params.content - Text representation of the resource context
 * @param {string} params.tenantId - UUID of the isolated tenant
 */
export const indexDocument = async ({ source, sourceId, content, tenantId }) => {
  try {
    const embedding = getEmbedding(content);
    const embeddingStr = JSON.stringify(embedding);

    // Look for existing index entry
    const existing = await prisma.vectorDocument.findFirst({
      where: { source, sourceId, tenantId }
    });

    if (existing) {
      await prisma.vectorDocument.update({
        where: { id: existing.id },
        data: {
          content,
          embedding: embeddingStr
        }
      });
      console.log(`[RAG Indexer] Updated ${source} context index for: ${sourceId}`);
    } else {
      await prisma.vectorDocument.create({
        data: {
          source,
          sourceId,
          content,
          embedding: embeddingStr,
          tenantId
        }
      });
      console.log(`[RAG Indexer] Indexed ${source} context for: ${sourceId}`);
    }
  } catch (error) {
    console.error('[RAG Indexer Error] Index execution failed:', error.message);
  }
};

/**
 * Performs similarity search against indexed vector documents for a given tenant.
 * Uses unit vector cosine similarity.
 * 
 * @param {Object} params
 * @param {string} params.query - Search query string
 * @param {string} params.tenantId - UUID of the isolated tenant
 * @param {number} [params.limit] - Limit of matched documents to return
 * @returns {Promise<Array>} List of matched documents with similarity score
 */
export const searchSimilarity = async ({ query, tenantId, limit = 5 }) => {
  try {
    const queryVec = getEmbedding(query);

    // Fetch all documents for the tenant
    const documents = await prisma.vectorDocument.findMany({
      where: { tenantId }
    });

    const cosineSimilarity = (vecA, vecB) => {
      let dotProduct = 0.0;
      let normA = 0.0;
      let normB = 0.0;
      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      if (normA === 0 || normB === 0) return 0.0;
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const scoredDocs = documents.map((doc) => {
      let score = 0.0;
      try {
        const docVec = JSON.parse(doc.embedding);
        score = cosineSimilarity(queryVec, docVec);
      } catch (err) {
        console.error('[RAG Search] Vector parsing failure:', err.message);
      }
      return {
        id: doc.id,
        source: doc.source,
        sourceId: doc.sourceId,
        content: doc.content,
        score: parseFloat(score.toFixed(4))
      };
    });

    // Sort descending by similarity score
    scoredDocs.sort((a, b) => b.score - a.score);

    return scoredDocs.slice(0, limit);
  } catch (error) {
    console.error('[RAG Search Error] Similarity matching failed:', error.message);
    return [];
  }
};
