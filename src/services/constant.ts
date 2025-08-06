

//Dify API
export const defaultProcessRule = (removeExtraSpaces: boolean, removeUrlsEmails: boolean, separator?: string) => {
    return {
    mode: 'custom',
    rules: {
      pre_processing_rules: [
        { id: 'remove_extra_spaces', enabled: removeExtraSpaces },
        { id: 'remove_urls_emails', enabled: removeUrlsEmails }
      ],
      segmentation: {
        separator: separator || '***',
        max_tokens: 1000,
        chunk_overlap: 50
      },
      subchunk_segmentation: {
        separator: '\n',
        max_tokens: 512,
        chunk_overlap: 0
      }
    },
    embedding_model: 'text-embedding-3-small',
    embedding_model_provider: 'openai',
    retrieval_model: {
      search_method: 'semantic_search',
      reranking_enable: true,
      reranking_mode: {
        reranking_provider_name: 'cohere',
        reranking_model_name: 'rerank-multilingual-v3.0'
      },
      top_k: 5,
      score_threshold_enabled: true,
      score_threshold: 0.3
    }
  }
}