const RECENT_STUDY_PREFIX = "recent_study_";
const RECENT_GROUP_PREFIX = "recent_group_";

const saveTimestamp = (prefix: string, id?: string | null) => {
  if (!id || typeof window === "undefined") return;
  localStorage.setItem(`${prefix}${id}`, new Date().toISOString());
};

const readTimestamp = (prefix: string, id: string) => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${prefix}${id}`);
};

export const markStudyAccess = (projectId?: string) =>
  saveTimestamp(RECENT_STUDY_PREFIX, projectId);

export const markProjectGroupAccess = (groupId?: string) =>
  saveTimestamp(RECENT_GROUP_PREFIX, groupId);

export const getAccessedAt = (
  prefix: string,
  id: string,
  fallback?: string | null
) => readTimestamp(prefix, id) || fallback || null;

export const hasAccessRecord = (prefix: string, id: string) =>
  !!readTimestamp(prefix, id);

export { RECENT_STUDY_PREFIX, RECENT_GROUP_PREFIX };
