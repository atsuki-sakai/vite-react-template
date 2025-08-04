/**
 * Application-wide constants
 */

/**
 * Feature flags for controlling premium functionality
 */
export const FEATURE_FLAGS = {
  /**
   * Controls whether Dify premium features (segment editing) are enabled
   * Set to false to disable premium features and show appropriate UI messages
   */
  ENABLE_DIFY_PREMIUM_FEATURES: false,
} as const;

/**
 * UI messages for premium features
 */
export const PREMIUM_FEATURE_MESSAGES = {
  SEGMENT_EDIT_DISABLED: "この機能をご利用いただくには、有料プランが必要です",
  SEGMENT_CREATE_DISABLED: "セグメントの作成は有料プラン限定機能です",
  SEGMENT_DELETE_DISABLED: "セグメントの削除は有料プラン限定機能です",
  UPGRADE_REQUIRED: "有料プランにアップグレードしてください",
} as const;

/**
 * API error codes and messages
 */
export const API_ERROR_CODES = {
  FORBIDDEN: 403,
  PREMIUM_FEATURE_REQUIRED: "premium_feature_required",
} as const;