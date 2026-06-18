/**
 * Generates a deterministic, normalized 128-dimensional embedding vector for a given text.
 * Uses a token hashing algorithm with semantic category weighting to model real-world vector spaces.
 * 
 * @param {string} text - The input document content or query string
 * @returns {Array<number>} A 128-dimensional float array normalized to unit length
 */
export const getEmbedding = (text) => {
  const normalizedText = (text || '').toLowerCase().trim();
  const vector = new Array(128).fill(0.1); // baseline seed representation

  // Simple token hashing
  const tokens = normalizedText.split(/[^a-z0-9]+/);

  const getWordHash = (word) => {
    let hash = 5381;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 33) ^ word.charCodeAt(i);
    }
    return Math.abs(hash);
  };

  tokens.forEach((token) => {
    if (!token) return;
    const hash = getWordHash(token);
    
    // Distribute token footprint
    vector[hash % 128] += 2.0;

    // Apply semantic category clustering weights
    // Category 1: Database & SQL
    if (['database', 'db', 'sql', 'postgres', 'mysql', 'query', 'injection'].includes(token)) {
      vector[10] += 5.0;
      vector[11] += 5.0;
      vector[12] += 5.0;
    }
    // Category 2: Web Security, Headers & Cookies
    if (['csp', 'hsts', 'cors', 'headers', 'clickjacking', 'cookie', 'xss', 'http', 'https', 'tls', 'ssl'].includes(token)) {
      vector[20] += 5.0;
      vector[21] += 5.0;
      vector[22] += 5.0;
    }
    // Category 3: IAM, Auth & Session
    if (['auth', 'jwt', 'token', 'session', 'mfa', 'login', 'password', 'key', 'credentials'].includes(token)) {
      vector[30] += 5.0;
      vector[31] += 5.0;
      vector[32] += 5.0;
    }
    // Category 4: Network Target target, IP & Ports
    if (['port', 'ssh', 'socket', 'network', 'scan', 'tcp', 'ip', 'host', 'closed', 'open'].includes(token)) {
      vector[40] += 5.0;
      vector[41] += 5.0;
      vector[42] += 5.0;
    }
  });

  // Calculate Euclidean norm (L2 normalization) to project onto unit hypersphere
  let norm = 0.0;
  for (let i = 0; i < 128; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < 128; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
};
